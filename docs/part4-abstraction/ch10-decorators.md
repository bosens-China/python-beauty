# 改变行为，而非代码：装饰器

> **"The apparel oft proclaims the man."**  
> **“衣着往往显示人品。”**  
> — _威廉·莎士比亚，《哈姆雷特》_

---

如果说继承是改变了对象的“基因”，那么装饰器（Decorators）就是改变了对象的“衣着”。

在软件开发中，我们经常遇到这样的需求：

- 我想记录这个函数的执行时间。
- 我想在这个数据库操作出错时自动重试。
- 我想检查调用者是否有权限执行这个操作。

传统的做法是修改函数内部的代码，把这些逻辑塞进去。但这违背了 **“单一职责原则”** —— 一个函数应该只负责一件事。

Python 的装饰器允许你**在不修改原函数代码的前提下**，动态地给函数增加功能。它就像给函数穿上了一层钢铁侠的战衣：里面的人（核心逻辑）没变，但能力变强了。

## 从“裸奔”到“穿衣”

装饰器的本质非常简单：**它是一个函数，接受一个函数作为参数，并返回一个新的函数。**

先看一个最朴素的装饰器（没有任何语法糖）：

```python
def my_logger(func):
    def wrapper():
        print("Before calling function")
        func()
        print("After calling function")
    return wrapper

def say_hello():
    print("Hello!")

# 手动“穿衣”：把 say_hello 传给 my_logger，得到增强后的新函数
say_hello_with_log = my_logger(say_hello)

say_hello_with_log()
# 输出:
# Before calling function
# Hello!
# After calling function
```

### 语法糖：`@` 符号

Python 提供了 `@` 符号，让这个过程变得优雅。它完全等价于上面的手动赋值。

```python
@my_logger
def say_hello():
    print("Hello!")

# 现在调用 say_hello，实际上是在调用 wrapper
say_hello()
```

> 💡 **说明**：`@my_logger` 是一种**语法糖（syntactic sugar）**，意思是它只是写法上的简化，背后的行为和 `say_hello = my_logger(say_hello)` 完全一样。

::: info 📝 给其他语言开发者的提示：高阶函数
这就是标准的**高阶函数（Higher-Order Function）** —— 接受函数作为参数，或返回函数的函数。

在 JavaScript/TypeScript 中你可能这样写：

```typescript
const withLog = (fn) => () => {
  console.log("Before");
  fn();
};
```

Python 的 `@` 只是自动帮你做了 `foo = decorator(foo)` 这个动作。
:::

## 身份危机与 `@wraps`

上面的简陋装饰器有一个致命问题：**元数据丢失**。

如果你打印 `say_hello.__name__`，你会发现它变成了 `'wrapper'`。这会破坏调试信息，也会导致很多依赖函数名的库（如 FastAPI、Flask）失效。

```python
print(say_hello.__name__)  # 输出 'wrapper'，而不是 'say_hello'
```

解决方案是使用标准库 `functools.wraps`：

```python
from functools import wraps

def my_logger(func):
    @wraps(func)  # 👈 这一行是关键
    def wrapper(*args, **kwargs):
        print("Before calling function")
        result = func(*args, **kwargs)
        print("After calling function")
        return result
    return wrapper
```

`@wraps(func)` 会把原函数的名称（`__name__`）、文档字符串（`__doc__`）、模块名等元数据“拷贝”给 `wrapper` 函数，从而保留原始函数的身份。

> 💡 **说明**：`*args` 和 `**kwargs` 是 Python 中用于接收任意数量位置参数和关键字参数的写法。这样 `wrapper` 就能适配任何签名的函数。

## 现代工程的核心：类型安全的装饰器

很多 Python 教程讲到 `@wraps` 就结束了。但在现代工程中，这只是开始。

**痛点**：当你用装饰器包裹函数后，编辑器（如 VS Code）往往会失去对原函数的类型提示。它不知道 `wrapper` 接受什么参数，只能推断为 `Any`，导致自动补全失效、类型检查失效。

为了解决这个问题，Python 3.10 引入了 **`ParamSpec`（参数规范）**。配合 Python 3.12 的泛型语法 `[**P, R]`，我们可以写出**完全保留类型信息**的装饰器。

我们需要用到两个泛型变量：

1. **`P`**（`ParamSpec` 类型）：代表原函数的**参数列表**（无论有多少个参数，叫什么名字）。
2. **`R`**（`TypeVar` 类型）：代表原函数的**返回值类型**。

```python
from functools import wraps
from typing import Callable, ParamSpec, TypeVar

P = ParamSpec("P")      # 声明参数规范
R = TypeVar("R")        # 声明返回值类型变量

def strict_logger(func: Callable[P, R]) -> Callable[P, R]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Calling: {func.__name__}")
        result = func(*args, **kwargs)
        print("Done")
        return result
    return wrapper
```

> 💡 **说明**：`Callable[P, R]` 表示“一个接受参数 `P` 并返回 `R` 的可调用对象”。这是 Python 类型系统中描述函数签名的标准方式。

现在，当你使用 `@strict_logger` 时：

```python
@strict_logger
def add(a: int, b: int) -> int:
    return a + b

# ✅ 编辑器依然能准确提示：a: int, b: int，返回值: int
add(10, 20)
```

**这是现代 Python 代码质量的分水岭**：你的装饰器不再破坏类型系统，而是与之协同工作。

> 🔔 **注意**：Python 3.12 支持更简洁的泛型语法 `def strict_logger[**P, R](...)`，但为了兼容性和清晰性，本书仍采用显式声明 `P` 和 `R` 的方式。

## 装饰器工厂：带参数的装饰器

有时候我们需要给装饰器本身传参，比如 `@retry(times=3)`。  
这需要三层嵌套函数（虽然结构稍复杂，但逻辑清晰）：

1. **Factory（工厂函数）**：接收配置参数（如 `max_retries`）。
2. **Decorator（装饰器）**：接收原函数（`func`）。
3. **Wrapper（包装函数）**：在运行时接收实际调用参数（`*args`, `**kwargs`）。

```python
import time
from functools import wraps
from typing import Callable, ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

def retry(max_retries: int = 3):
    # 第一层：接收配置参数
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        # 第二层：接收被装饰的函数
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            # 第三层：运行时逻辑
            for i in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    print(f"Attempt {i+1} failed: {e}. Retrying...")
                    time.sleep(1)
            raise RuntimeError(f"Function {func.__name__} failed after {max_retries} retries")
        return wrapper
    return decorator

@retry(max_retries=5)
def connect_db():
    # 模拟可能失败的操作
    import random
    if random.random() < 0.7:
        raise ConnectionError("DB unreachable")
    return "Connected!"
```

::: warning ⚠️ 导入时 vs 运行时
**严重警示**：

- **Import Time（导入时）**：当 Python 加载模块（即执行 `import`）时，会立即执行装饰器的外层函数（第一层和第二层）。  
  例如，`@retry(max_retries=5)` 会在模块导入时就调用 `retry(5)`，并返回 `decorator` 函数。

- **Call Time（运行时）**：只有当你真正调用 `connect_db()` 时，才会执行 `wrapper`（第三层）。

**千万不要**在装饰器的外层（factory 层）编写耗时操作（如连接数据库、读取大文件）。这会导致程序启动极慢，甚至在导入阶段就因异常而崩溃。
:::

## 🧠 深度思考

> **装饰器可以叠加使用：**
>
> ```python
> @decorator1
> @decorator2
> def foo(): pass
> ```
>
> **1. 包裹顺序是怎样的？**  
> **2. 执行顺序是怎样的？**

::: details 点击查看答案
**1. 包裹顺序（洋葱模型）**：  
由内向外。等价于 `foo = decorator1(decorator2(foo))`。  
`decorator2` 先拿到原函数，`decorator1` 再拿到 `decorator2` 返回的 wrapper。

**2. 执行顺序**：  
由外向内。  
当你调用 `foo()` 时，先进入 `decorator1` 的 wrapper，它调用 `decorator2` 的 wrapper，最后才调用原始的 `foo`。

**口诀**：穿衣由内而外，脱衣（执行）由外而内。
:::

## 本章小结

装饰器是 Python 元编程的入口，也是“开放封闭原则”（对扩展开放，对修改封闭）的最佳实践。

1. **本质**：`@` 只是高阶函数的语法糖，底层仍是函数调用。
2. **规范**：务必使用 `@wraps` 保留原函数的元数据（名称、文档等）。
3. **类型**：使用 `ParamSpec`（`**P`）和 `TypeVar`（`R`）保持完整的类型提示，避免退化为 `Any`。
4. **架构**：用装饰器处理日志、鉴权、重试、缓存等**横切关注点（Cross-Cutting Concerns）**，保持核心业务逻辑纯净、专注。

现在，我们已经掌握了如何用“外挂”的方式增强函数行为。接下来，我们将目光投向另一个边界——**数据**。在动态语言中，如何定义数据的形状？如何在运行时确保数据的正确性？

下一部“边界”，我们将探讨 **Dataclasses** 和 **Pydantic**。那里是 Python 与现实世界（JSON、数据库、API）交汇的地方。
