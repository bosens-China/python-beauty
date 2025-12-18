# 第 13 章：装饰器 (Decorators)

> **"The apparel oft proclaims the man."**
>
> **“衣着往往显示人品。”**
>
> — _威廉·莎士比亚，《哈姆雷特》 (William Shakespeare, Hamlet)_

---

::: tip 💡 上一章答案揭晓
Python 的 `TypeGuard` 能像 TS 的 `asserts` 那样直接改变后续作用域的变量类型吗？
**不能。**
Python 的 `TypeGuard` 必须配合 `if` 语句使用（`if is_str_list(x): ...`）。
目前 Python 还没有类似 TS `asserts val is String` 的机制，这意味着你不能写一个裸露的断言函数来“原地”收窄类型。这是 Python 类型系统与控制流结合的一个限制。
:::

装饰器的本质很简单：**它是一个函数，接受一个函数作为参数，并返回一个新的函数。** 它就像给原来的函数穿上了一层“外套”，在不修改原函数代码的情况下，增加额外的功能（如日志、计时、鉴权）。

## 13.1 从“裸奔”到“穿衣”

先看一个最朴素的装饰器（没有任何类型注解，Python 2 时代的写法）。

```python
def my_logger(func):
    def wrapper():
        print("Before calling function")
        func()
        print("After calling function")
    return wrapper

@my_logger
def say_hello():
    print("Hello!")

# 调用
say_hello()
# 输出:
# Before calling function
# Hello!
# After calling function
```

这里 `@my_logger` 只是语法糖。它完全等价于：
`say_hello = my_logger(say_hello)`

::: info 📝 TS 开发者便签：High-Order Functions
这就是标准的**高阶函数（Higher-Order Function）**。
在 JS/TS 中你经常这样做：

```typescript
const withLog = (fn) => () => {
  console.log("Before");
  fn();
};
```

Python 的装饰器语法 `@` 只是自动帮你做了这个 wrapping 的动作。
:::

## 13.2 痛点：类型丢失与元数据丢失

上面的代码有两个致命问题：

1.  **元数据丢失**：`say_hello.__name__` 变成了 `'wrapper'`。这会破坏调试信息和某些依赖函数名的库。
2.  **类型丢失**：如果原函数有参数，`wrapper` 没有接收参数，调用会报错。即使 `wrapper` 使用 `*args` 接收，IDE 也无法推断出原来的参数类型，**这对库的使用者是灾难性的**。

## 13.3 完美的类型安全装饰器：`ParamSpec`

为了解决类型丢失问题，Python 3.10 引入了 `ParamSpec`（参数规范），配合 Python 3.12 的泛型语法，我们可以写出完美的装饰器。

我们需要用到两个泛型变量：

1.  `**P` (ParamSpec): 代表原函数的**参数列表**（无论它有多少个参数，叫什么名字）。
2.  `R` (TypeVar): 代表原函数的**返回值类型**。

::: code-group

```python [✅ 现代写法 (Python 3.12+)]
from functools import wraps
from typing import Callable

# [**P, R] 声明了两个泛型：P 是参数包，R 是返回值
def standard_logger[**P, R](func: Callable[P, R]) -> Callable[P, R]:

    # @wraps 负责保留原函数的元数据 (__name__, docstring 等)
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Calling: {func.__name__}")

        # P.args 和 P.kwargs 就像传送带，把参数原封不动地传给原函数
        result = func(*args, **kwargs)

        print(f"Finished: {func.__name__}")
        return result

    return wrapper
```

```python [❌ 旧式/错误写法]
# 这种写法会让 add 变成 (Any) -> Any，彻底丢失类型提示
def bad_logger(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

:::

### 验证效果

现在我们应用这个装饰器：

```python
@standard_logger
def add(a: int, b: int) -> int:
    return a + b

# ✅ IDE (VS Code / PyCharm) 此时能完美提示：
# "a: int, b: int", 并且知道返回值是 int
val = add(10, 20)

# ❌ 如果写错了，静态检查会报错
# add("10", 20) -> Argument of type "Literal['10']" cannot be assigned to "int"
```

如果没有 `ParamSpec`，IDE 可能会提示 `add` 是 `Callable[..., Any]`，你会失去所有的自动补全和类型检查。

## 13.4 装饰器工厂：带参数的装饰器

有时候我们需要给装饰器本身传参，比如 `@retry(times=3)`。
这需要三层嵌套函数：

1.  **Factory**: 接收配置参数 (`times`)。
2.  **Decorator**: 接收原函数 (`func`)。
3.  **Wrapper**: 接收运行时参数 (`*args`)。

```python
import time

def retry(max_retries: int = 3, delay: float = 1.0):
    # 第一层：接收装饰器配置

    def decorator[**P, R](func: Callable[P, R]) -> Callable[P, R]:
        # 第二层：接收原函数

        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            # 第三层：运行时逻辑
            last_exception = None
            for i in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    print(f"Attempt {i+1} failed: {e}")
                    last_exception = e
                    time.sleep(delay)

            if last_exception:
                raise last_exception
            raise RuntimeError("Unreachable") # 仅为了让类型检查器知道这里肯定会抛异常

        return wrapper

    return decorator

# 使用
@retry(max_retries=5, delay=0.5)
def fetch_data(url: str) -> dict:
    # 假设这里可能会抛出网络异常
    ...
```

::: warning ⚠️ Import Time vs Call Time
**严重警示**：

- **Import Time (导入时)**：Python 加载模块时，会执行装饰器函数（第一层和第二层）。
- **Call Time (运行时)**：只有当你真正调用 `fetch_data()` 时，才会执行 `wrapper`（第三层）。

**千万不要**在装饰器的外层（Factory/Decorator 层）编写耗时的操作（如连接数据库、请求网络）。这会导致你的程序启动极慢，甚至在 import 阶段就崩溃。所有的业务逻辑都应该放在 `wrapper` 内部。
:::

::: info 📝 TS 开发者便签：Decorators in TS

- **TS**: 装饰器目前主要用于 **Class** 及其成员（Method, Property）。在 TS 中装饰独立的 Function 并不直接支持（通常用高阶函数手动 wrap）。
- **Python**: 装饰器主要用于 **Function**（虽然也可以装饰 Class）。
  :::

## 13.5 类装饰器

除了装饰函数，我们还可以装饰类。这通常用于给类动态添加方法或属性，或者注册类。

例如，`@dataclass` 本质上就是一个类装饰器。

让我们写一个简单的类注册器：

```python
# 一个全局注册表
component_registry: dict[str, type] = {}

def register_component[T](cls: type[T]) -> type[T]:
    """将类注册到全局字典中"""
    component_registry[cls.__name__] = cls
    return cls

@register_component
class LoginService:
    pass

@register_component
class EmailService:
    pass

print(component_registry)
# 输出: {'LoginService': <class 'LoginService'>, ...}
```

这在实现“依赖注入”或“插件系统”时非常有用。

## 本章小结

装饰器是 Python 元编程（Metaprogramming）的入口。

1.  **语法**：`@decorator` 是高阶函数的语法糖。
2.  **类型安全**：必须使用 `ParamSpec` (`**P`) 和 `TypeVar` (`R`) 来保持原函数的签名，否则使用者的 IDE 会变瞎。
3.  **应用**：日志、重试、缓存、鉴权、路由注册。

现在，我们已经能控制函数的**外层**逻辑了。但是，如果我们想要控制代码块**内部**的资源管理（比如打开文件一定要关闭，连接数据库一定要断开），这时候 `try...finally` 显得有点啰嗦。

下一章，我们将介绍 Python 独有的优雅语法 —— **上下文管理器 (Context Managers)**。对于 TS 开发者来说，这是 JS 语言标准中长期缺失（虽然 `using` 关键字正在路上）的一块拼图。

::: tip 🧠 课后思考
装饰器可以叠加使用：

```python
@decorator1
@decorator2
def foo(): pass
```

**思考题**：

1.  **包裹顺序**：它等价于 `decorator1(decorator2(foo))` 还是反过来？
2.  **执行顺序**：如果 `decorator1` 打印 "A"，`decorator2` 打印 "B"，在**函数定义时**（Import Time）屏幕上打印的顺序是什么？在**函数调用时**（Call Time）Wrapper 的执行顺序又是怎样的？
    :::
