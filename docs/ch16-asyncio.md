# 第 16 章：异步编程 (AsyncIO)

> **"We must take the current when it serves, Or lose our ventures."** > **“我们要把握好时机，否则就会失去良机。”**
> — _威廉·莎士比亚，《尤利乌斯·凯撒》 (William Shakespeare, Julius Caesar)_

---

异步编程的核心在于“不等待”。当程序发起一个网络请求或数据库查询时，它不应该傻傻地阻塞（Block）在那里，而应该把 CPU 让出来去处理其他任务，直到结果返回。

Python 的 `asyncio` 库就是为此而生的。它是构建高性能 Web 服务（如 FastAPI）的基石。

## 16.1 协程 (Coroutines)：熟悉的配方，不同的味道

在 Python 中，定义异步函数使用 `async def`，调用它使用 `await`。这看起来和 TS 一模一样，但执行机制完全不同。

```python
import asyncio
import time

# 定义一个协程 (Coroutine)
async def fetch_data(uid: int) -> str:
    print(f"Start fetching {uid}...")
    # 模拟 IO 操作：异步等待 1 秒
    # ⚠️ 注意：千万不要用 time.sleep()，那会阻塞整个线程！
    await asyncio.sleep(1)
    print(f"Finished {uid}.")
    return f"UserData({uid})"

# 入口函数
async def main():
    print("Main start")

    # 调用协程
    # 在 Python 中，fetch_data(1) 仅仅是创建了一个协程对象，它【不会】立即执行！
    coro = fetch_data(1)

    # 只有当你 await 它，或者把它扔进 Loop 时，它才开始跑
    result = await coro
    print(f"Result: {result}")

# 启动事件循环 (Event Loop) 并运行 main
if __name__ == "__main__":
    # 这是 Python 3.7+ 的标准启动方式
    asyncio.run(main())
```

### 📝 TS 开发者便签：Promise (Eager) vs Coroutine (Lazy)

> 这是最大的认知陷阱：
>
> - **TS (Eager)**: 当你调用 `const p = fetchData(1)` 时，JS 引擎**立即开始**执行该异步任务，并返回一个 `Promise`。你不能“暂停”它的启动。
> - **Python (Lazy)**: 当你调用 `c = fetch_data(1)` 时，函数体**根本不会执行**。它返回一个协程对象（Coroutine Object）。它就像一个“冷”的 Promise。只有当你 `await c` 或者显式调度它 (`create_task`) 时，它才会开始运行。
>
> 此外，Python 脚本默认没有 Event Loop，你必须用 `asyncio.run()` 手动启动它（而在 Node.js 中 Loop 是与生俱来的）。

## 16.2 结构化并发：`TaskGroup` (Python 3.11+)

如果你写了两个 `await`，它们是串行的。

```python
# 耗时 2 秒
await fetch_data(1)
await fetch_data(2)
```

要让它们并行（Concurrent），我们需要同时调度它们。在 Python 3.11 之前，我们常用 `asyncio.gather`（类似 `Promise.all`）。但在现代 Python 中，我们强烈推荐使用 **`TaskGroup`**。

`TaskGroup` 引入了**结构化并发**的概念：如果 Group 中的某个任务失败抛出异常，整个 Group 会自动取消剩余的任务，并抛出 `ExceptionGroup`。这避免了“幽灵任务”（Ghost Tasks）在后台默默运行或泄漏。

```python
async def main():
    try:
        # 创建一个任务组上下文
        async with asyncio.TaskGroup() as tg:
            # tg.create_task 会立即把协程调度到 Loop 中
            # 这里的 task1, task2 是 Task 对象（类似正在运行的 Promise）
            task1 = tg.create_task(fetch_data(1))
            task2 = tg.create_task(fetch_data(2))

        # 离开 async with 块时，隐式等待所有任务完成（或某个报错）
        # 此时结果已经准备好了
        print(f"Res1: {task1.result()}")
        print(f"Res2: {task2.result()}")

    except* Exception as e:
        # Python 3.11 新语法 except*，用于捕获 ExceptionGroup
        print(f"Some tasks failed: {e}")
```

## 16.3 致命陷阱：阻塞 Event Loop

这是从 JS 转 Python 最容易犯的错，也是导致 Python 异步服务性能崩塌的元凶。

**记住：Python 的 AsyncIO 是运行在单线程上的。**

如果你在 `async def` 里写了 CPU 密集型代码（比如解压大文件、处理图片）或者调用了同步 IO（比如 `time.sleep`, `requests.get`），整个 Event Loop 就会卡死。

**错误示范**：

```python
async def bad_handler():
    # 😱 这会阻塞整个程序 5 秒！
    # 在这 5 秒内，服务器无法响应任何其他请求（心跳包丢失、数据库断连...）
    time.sleep(5)
```

**正确示范**：
使用 `asyncio.to_thread` (Python 3.9+) 或 `loop.run_in_executor` 将阻塞操作扔到**线程池**中。

```python
import requests

# 一个同步的阻塞函数
def sync_get_url(url: str):
    return requests.get(url).text

async def good_handler():
    # ✅在这个线程中执行同步函数，await 等待线程返回
    # 这不会阻塞主线程的 Event Loop
    response = await asyncio.to_thread(sync_get_url, "https://google.com")
```

### 📝 TS 开发者便签：Worker Threads

> Node.js 也是单线程 Loop，但它的标准库（`fs`, `http`）底层都是异步的。
> Python 的生态历史包袱重，很多老牌库（如 `requests`, `pandas`, `opencv`）都是**同步阻塞**的。
>
> 在 FastAPI 中，如果你要用这些老库，必须把它们扔到 `run_in_executor` / `to_thread` 里，或者寻找它们的异步替代品（如 `httpx`, `aiofiles`）。

## 16.4 异步上下文管理器：`async with`

我们在第 14 章学习了 `with`。对于异步资源（如数据库连接池、HTTP 会话），我们需要使用 `async with`。

底层对应的是 `__aenter__` 和 `__aexit__` 魔术方法。

```python
import aiofiles # 这是一个第三方异步文件库

async def read_file():
    # 异步打开文件，不阻塞 Loop
    async with aiofiles.open('data.txt', mode='r') as f:
        content = await f.read()
        print(content)
```

## 16.5 异步迭代器：`async for`

如果我们需要逐行读取一个巨大的网络流，或者从 Redis 中 scan 数据，可以使用异步迭代器。

```python
# 假设这是一个从数据库流式读取数据的生成器
async def get_users_stream():
    for i in range(3):
        await asyncio.sleep(0.1) # 模拟 DB 延迟
        yield f"User {i}"

async def main():
    # 必须用 async for
    async for user in get_users_stream():
        print(user)
```

## 16.6 限制并发数：Semaphore

在爬虫或高并发场景中，你不能无限地 `create_task`，否则会把对方服务器打挂，或者耗尽本地的文件句柄。

在 TS 中你可能需要 `p-limit` 这样的库。在 Python 中，标准库自带了 `Semaphore`。

```python
async def worker(sem: asyncio.Semaphore, i: int):
    # 只有拿到锁才能进入
    async with sem:
        print(f"Worker {i} is working...")
        await asyncio.sleep(1)

async def main():
    # 限制最大并发数为 5
    sem = asyncio.Semaphore(5)

    async with asyncio.TaskGroup() as tg:
        for i in range(20):
            # 所有任务都会被创建，但只有 5 个能同时进入临界区运行
            tg.create_task(worker(sem, i))
```

---

**本章小结**

Python 的 `asyncio` 赋予了它处理高并发网络 IO 的能力（这是 FastAPI 性能接近 Go 的原因）。

1.  **关键字**: `async def` 定义，`await` 调用。
2.  **惰性执行**: 调用函数只返回对象，不执行；必须 await 或 create_task。
3.  **结构化并发**: 使用 `TaskGroup` 管理并发任务，拒绝 `gather` 的散漫。
4.  **大忌**: 绝不要在 async 函数中调用同步阻塞 IO，除非用 `asyncio.to_thread`。

掌握了异步，你现在已经具备了开发高性能 Web 服务的能力。

下一章（也是最后一章），我们将把全书的知识——类型、数据模型、装饰器、异步——熔于一炉，通过解析 **FastAPI** 和 **Pydantic** 的实战代码，见证 Python 之美。
