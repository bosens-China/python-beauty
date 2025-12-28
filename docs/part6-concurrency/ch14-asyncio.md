# 协作而非抢占：AsyncIO

> **"We must take the current when it serves, Or lose our ventures."**  
> **“我们要把握好时机，否则就会失去良机。”**  
> — _威廉·莎士比亚，《尤利乌斯·凯撒》_

---

在上一章我们提到，面对 I/O 密集型任务（如高并发 Web 服务），多线程虽然有效，但成本依然太高。每个线程都需要消耗几 MB 的栈内存，且操作系统在线程间切换（抢占式）也需要开销。

为了达到极致的并发（单机抗住数万连接），我们需要一种更轻量的模型。

我们不再让操作系统决定何时切换任务，而是让任务自己决定：“我现在要等待网络响应了，我主动把 CPU 让出来，你们先跑。”

这就是 **协作式多任务 (Cooperative Multitasking)**，在 Python 中，它的名字叫 **AsyncIO**。

## 熟悉的配方，不同的味道

Python 的异步语法对于 TypeScript 开发者来说简直就是“老乡见老乡”。

```python
import asyncio

# 定义协程 (Coroutine)
async def fetch_data(uid: int) -> str:
    print(f"Start fetching {uid}...")
    # 模拟 IO 操作：主动交出控制权，等待 1 秒
    await asyncio.sleep(1)
    print(f"Finished {uid}")
    return f"Data({uid})"

# 入口函数
async def main():
    # 调用协程
    result = await fetch_data(1)
    print(result)

# 启动事件循环
if __name__ == "__main__":
    asyncio.run(main())
```

看起来一模一样？别急，陷阱就在这里。

::: info 📝 TS 开发者便签：Promise (Eager) vs Coroutine (Lazy)
这是最大的认知陷阱：

- **TS (Eager)**: 当你调用 `const p = fetchData(1)` 时，JS 引擎会**立即开始**执行异步任务。Promise 被创建的那一刻，请求就已经发出去了。
- **Python (Lazy)**: 当你调用 `c = fetch_data(1)` 时，函数体**根本不会执行**。它只是返回了一个**协程对象**（一张“待办事项单”）。只有当你 `await c` 或者把它扔进 Event Loop 时，它才会真正开始运行。

因此，在 Python 中写 `c1 = task(); c2 = task(); await c1; await c2;` 默认是**串行**的（除非你用 TaskGroup 并发调度），这与 JS 的行为直觉完全不同。
:::

> 💡 **术语说明**：
>
> - **协程（Coroutine）** 是一种可以暂停和恢复执行的函数。在 Python 中，使用 `async def` 定义的函数就是协程。
> - **事件循环（Event Loop）** 是 AsyncIO 的核心调度器，负责运行协程、处理 I/O 事件，并在协程 `await` 时切换上下文。

## 结构化并发：`TaskGroup`

要让多个协程**同时**跑起来，我们需要显式地调度它们。

在旧版 Python 教程中，你可能会看到 `asyncio.create_task()` 或 `asyncio.gather()`。但在 Python 3.11+ 中，我们有了更安全、更优雅的选择：**`TaskGroup`**。

它引入了 **结构化并发 (Structured Concurrency)** 的概念：任务的生命周期应该被代码块的范围（Scope）所约束。

```python
import asyncio
import time

async def fetch_data(uid: int) -> str:
    await asyncio.sleep(1)
    return f"Data-{uid}"

async def main():
    print(f"Started at {time.strftime('%X')}")

    # 创建一个任务组上下文
    async with asyncio.TaskGroup() as tg:
        # tg.create_task 会立即把协程调度到 Loop 中
        # 这些任务是"并行"（在等待时并发）执行的
        task1 = tg.create_task(fetch_data(1))
        task2 = tg.create_task(fetch_data(2))

    # 离开 async with 块时，会隐式等待组内所有任务完成
    # 就像 Promise.all()

    print(f"Finished at {time.strftime('%X')}")
    print(f"Result 1: {task1.result()}")
    print(f"Result 2: {task2.result()}")

if __name__ == "__main__":
    asyncio.run(main())
```

**为什么说它安全？**  
如果 `task1` 抛出异常，`TaskGroup` 会自动取消 `task2`（如果它还在运行），并抛出 `ExceptionGroup`。这避免了“幽灵任务”在后台默默运行或资源泄露。

> 💡 **类型注解说明**：  
> 上例中 `fetch_data(uid: int) -> str` 使用了 **类型注解（Type Hints）**，这是 Python 3.5+ 引入的可选语法，用于提示参数和返回值的预期类型。它不影响运行时行为，但能提升代码可读性和工具支持（如 IDE 提示、类型检查器 mypy）。

## 致命陷阱：阻塞 Event Loop

这是写 AsyncIO 代码的第一大忌，也是新手导致整个服务器卡死（例如心跳超时）的元凶。

**记住：AsyncIO 是单线程的。**

如果你在 `async def` 里调用了一个**同步阻塞**的函数（比如 `time.sleep`，或者用 `requests` 库发请求），整个 Event Loop 就会停止转动。在它阻塞的期间，其他的几千个并发连接都得等着，没人响应。

::: danger 🛑 绝对禁止

```python
import time
import requests

async def bad_handler():
    # 😱 灾难！这会卡死整个线程 5 秒！
    time.sleep(5)

    # 😱 灾难！requests 是同步库，网络慢的时候会卡死 Loop！
    requests.get("https://google.com")
```

:::

### 解决方案：`to_thread`

如果必须使用同步库（比如某个老旧的数据库驱动没有异步版），请把它扔到**线程池**里去跑。

```python
import asyncio
import requests

def sync_task() -> int:
    # 这是一个同步阻塞函数
    return requests.get("https://www.python.org").status_code

async def good_handler():
    # ✅ 将同步函数扔到另外的线程中运行
    # await 会等待那个线程结束，期间 Event Loop 可以继续处理其他任务
    status = await asyncio.to_thread(sync_task)
    print(f"Status: {status}")
```

> 💡 **注意**：`asyncio.to_thread()` 是 Python 3.9+ 引入的便捷函数，内部使用 `loop.run_in_executor()` 将函数提交到默认的线程池执行。

## 异步资源管理：`async with`

我们在前面章节介绍过上下文管理器（`with` 语句），用于确保资源（如文件、锁）被正确释放。在异步环境中，我们需要其异步版本：`async with`。

对于数据库连接、HTTP 会话等资源，我们需要在异步环境中进行 Setup 和 Teardown。这需要使用 `async with`。

```python
import aiohttp  # 需要安装: uv add aiohttp

async def fetch_url(url: str) -> str:
    # 异步上下文管理器
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()
```

底层对应的是 `__aenter__` 和 `__aexit__` 魔术方法（注意多了个 `a`），它们本身也是 `async def` 函数。

> 💡 **安装说明**：`aiohttp` 不是 Python 标准库的一部分，需通过包管理器安装。本书推荐使用 `uv` 工具：
>
> ```bash
> uv add aiohttp
> ```

## 🧠 深度思考

> **Node.js 是单线程 Event Loop，Python AsyncIO 也是单线程 Event Loop。**  
> **为什么 Node.js 可以直接写 `const fs = require('fs'); fs.readFile(...)` 而不会卡死 Loop？**

::: details 点击查看答案
**因为 Node.js 的标准库是彻头彻尾的异步设计。**

Node.js 的 `fs.readFile` 底层是 C++ 调用了操作系统的线程池（libuv），它本身就是非阻塞的。

而 Python 历史悠久，标准库里的 `open()`, `socket`, `time` 等诞生于 AsyncIO 出现之前的 20 年。它们默认都是同步阻塞的。

**结论**：在 Python 中写异步，必须时刻警惕标准库。凡是涉及 I/O 的操作，都要问自己一句：“这是异步的吗？”如果不是，要么找 `aio` 开头的替代库（如 `aiofiles`、`aiosqlite`），要么用 `asyncio.to_thread()` 封装。
:::

## 本章小结

AsyncIO 赋予了 Python 处理高并发 I/O 的能力，它是 FastAPI、Quart 等现代异步框架的基石。

1. **Lazy Execution（惰性执行）**：Python 的协程默认不执行，必须通过 `await` 或 `create_task()` 触发。
2. **TaskGroup（结构化并发）**：使用 `async with asyncio.TaskGroup()` 来安全地并发运行多个任务，避免资源泄漏和异常传播问题。
3. **Don't Block（切勿阻塞）**：严禁在 `async def` 函数中调用同步 I/O 操作。若必须使用同步代码，请通过 `asyncio.to_thread()` 将其移至线程池执行。

至此，我们已经理解了 Python 的并发模型。  
是时候把所有的知识点——**uv、类型系统、Pydantic、AsyncIO**——串联起来了。

在接下来的“第七部：工程”，我们将探讨如何组织代码、管理模块，并最终掌握现代 Python 开发的完整工作流。
