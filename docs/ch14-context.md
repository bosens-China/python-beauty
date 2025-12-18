# 第 14 章：上下文管理器 —— 资源管理的艺术

> **"All's well that ends well."**
>
> **“结局好，一切都好。”**
>
> — _威廉·莎士比亚，《终成眷属》 (William Shakespeare, All's Well That Ends Well)_

---

::: tip 💡 上一章答案揭晓
装饰器叠加的顺序：

```python
@dec1
@dec2
def foo(): ...
```

1.  **包裹顺序（定义时）**：由内向外。等价于 `foo = dec1(dec2(foo))`。所以 `dec2` 先接触到原函数，`dec1` 再包裹 `dec2` 返回的 wrapper。
2.  **执行顺序（运行时）**：由外向内。当你调用 `foo()` 时，先执行 `dec1` 的 wrapper，它调用 `dec2` 的 wrapper，最后才调用原始的 `foo`。
    **口诀**：穿衣由内而外，脱衣由外而内。
    :::

编程不仅仅是创建对象和调用函数，还涉及到**资源的管理**。打开的文件需要关闭，建立的网络连接需要断开，获取的线程锁需要释放。

如果程序在中间抛出了异常，资源没有被释放，就会导致内存泄漏或文件锁定。上下文管理器就是为了确保：**无论发生什么，资源都能得到妥善的清理（结局）。**

## 14.1 `with` 语句：告别 `finally`

让我们看一个经典的读取文件的例子。

::: code-group

```python [❌ 不推荐写法 (类 C/JS 风格)]
f = open("data.txt", "r")
try:
    content = f.read()
    if "error" in content:
        raise ValueError("Bad data")
finally:
    f.close() # 必须手动关闭，否则句柄泄漏
```

```python [✅ Pythonic 写法]
# 当代码离开缩进块时，f.close() 会被自动调用
with open("data.txt", "r") as f:
    content = f.read()
    # 即使这里抛出异常，文件也会安全关闭
```

:::

`with` 语句创建了一个**运行时上下文**。它保证了在进入代码块前做一些准备工作（Enter），并在离开代码块后做一些清理工作（Exit）。

## 14.2 上下文管理协议：`__enter__` 与 `__exit__`

要让一个对象支持 `with` 语句，它必须实现两个魔术方法。这就是 **Context Manager Protocol**。

让我们手写一个模拟“数据库事务”的管理器。

```python
from types import TracebackType
from typing import Self

class DatabaseTransaction:
    def __init__(self, db_name: str):
        self.db_name = db_name

    def __enter__(self) -> Self:
        """进入 with 块时调用"""
        print(f"[{self.db_name}] Transaction STARTED")
        # 返回值会赋给 with ... as var 中的 var
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None
    ) -> bool | None:
        """
        离开 with 块时调用。
        如果块内抛出异常，exc_* 参数会包含异常信息。
        """
        if exc_type:
            print(f"[{self.db_name}] Error detected: {exc_val}. Rolling back...")
            # 返回 False (默认) 会让异常继续向外抛出
            # 返回 True 则会吞掉异常（Suppress）
            return False

        print(f"[{self.db_name}] Transaction COMMITTED")
        return None

# 使用
try:
    with DatabaseTransaction("UserDB") as tx:
        print("Processing data...")
        raise ValueError("Something went wrong!")
except ValueError:
    print("Caught exception outside.")

# 输出:
# [UserDB] Transaction STARTED
# Processing data...
# [UserDB] Error detected: Something went wrong!. Rolling back...
# Caught exception outside.
```

::: info 📝 TS 开发者便签：`using` 关键字 (TS 5.2+)
这是一个极其现代的对比。

- **Classic TS**: 你必须用 `try { ... } finally { resource.dispose() }`。
- **Modern TS (5.2+)**: 引入了 **`using`** 关键字，配合 `Symbol.dispose`。
  ```typescript
  // TypeScript 5.2+
  {
    using resource = new DatabaseTransaction();
    resource.doWork();
  } // 离开作用域时自动调用 resource[Symbol.dispose]()
  ```

Python 的 `with` 语句完全等同于 TS 5.2 的 `using` 块作用域机制，但 Python 已经用了快 20 年了，生态支持极其完善。
:::

## 14.3 简化的写法：`@contextmanager`

并不是每次我们都需要写一个完整的类来实现 `__enter__` 和 `__exit__`。
`contextlib` 模块提供了一个装饰器，利用**生成器 (Generator)** 来简化这个过程。

**这是 Python 中最常用的技巧之一。**

```python
from contextlib import contextmanager
from collections.abc import Iterator

@contextmanager
def open_managed_resource(name: str) -> Iterator[str]:
    print(f"Opening {name}...")
    resource = f"Resource({name})" # 模拟资源

    try:
        # yield 之前是 __enter__
        yield resource  # yield 出来的值赋给 'as' 后的变量
    finally:
        # yield 之后是 __exit__
        # 即使 try 块抛出异常，finally 也会执行
        print(f"Closing {name}...")

# 使用
with open_managed_resource("Photo") as res:
    print(f"Using {res}")

# 输出:
# Opening Photo...
# Using Resource(Photo)
# Closing Photo...
```

注意类型注解：`-> Iterator[str]`。因为这是一个生成器，且只 yield 一次。

## 14.4 常见应用场景

### 14.4.1 临时修改全局状态

比如你想临时修改日志级别，或者临时切换目录。

```python
import os
from contextlib import chdir # Python 3.11+

# 临时切换到 /tmp 目录做操作，结束后自动切回原目录
with chdir("/tmp"):
    print(os.getcwd()) # /tmp

print(os.getcwd()) # 回到原来的目录
```

### 14.4.2 计时器

```python
import time

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, *args):
        self.end = time.perf_counter()
        self.interval = self.end - self.start
        print(f"Time taken: {self.interval:.4f}s")

with Timer():
    # 模拟耗时操作
    time.sleep(0.1)
```

### 14.4.3 忽略异常

`contextlib.suppress` 是代替 `try...except pass` 的优雅写法。

```python
from contextlib import suppress
import os

# 如果文件不存在，remove 会报错。但这里我们会自动忽略 FileNotFoundError
with suppress(FileNotFoundError):
    os.remove("non_existent_file.tmp")
```

## 14.5 类型提示：`ContextManager`

如果你在写一个函数，它接收一个可以用 `with` 调用的对象，你应该怎么标注类型？

```python
from typing import ContextManager

# 这个函数接收一个上下文管理器，它必须 yield 一个 int
def process_resource(cm: ContextManager[int]):
    with cm as num:
        print(num * 2)
```

## 14.6 多个上下文管理器

在 Python 3.10+ 中，你可以用括号把多个管理器括起来，这避免了“阶梯式”缩进。

::: tip ✨ Python 3.10 新特性
在此之前，如果要开启多个文件，你不得不使用反斜杠 `\` 换行，非常丑陋。
:::

```python
# ✅ 现代写法
with (
    open("input.txt", "r") as source,
    open("output.txt", "w") as target
):
    target.write(source.read())
```

## 本章小结

上下文管理器是 Python 代码健壮性的保障。它将“准备”和“清理”的逻辑封装在一起，让核心业务逻辑保持纯净。

1.  **关键字**: `with ... as ...`。
2.  **原理**: `__enter__` (setup) 和 `__exit__` (teardown)。
3.  **神器**: `@contextmanager` 把生成器转化为上下文管理器。
4.  **TS 对照**: 对应 TS 5.2 的 `using` 关键字 (Disposable Pattern)。

到现在为止，我们已经掌握了 Python 的**同步**编程的所有核心技能。

但在现代 Web 开发（FastAPI）和 IO 密集型任务中，我们需要**异步**。TS 开发者对 `async/await` 肯定非常熟悉。但 Python 的异步模型（AsyncIO）与 Node.js 的 Event Loop 有着本质的区别，也是最容易踩坑的地方。

更重要的是，Python 还有一个“房间里的大象”——**GIL**。为什么人们总说 Python 慢？

下一章，我们将进入 **第 15 章：并发的抉择 —— 成本与模型**，在学习 async 语法之前，先理解 Python 的性能真相。

::: tip 🧠 课后思考
我们刚才学习了 `with`。

如果我在 `with` 块中使用 `async/await` 调用异步函数，普通的上下文管理器还能工作吗？
还是说我们需要一种特殊的 **`async with`**？它背后的魔术方法又是什么？
（提示：加上 `a` 前缀）。
:::
