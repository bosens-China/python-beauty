# 第 11 章：现代泛型 (Generics)

> **"Give to a gracious message an host of tongues, but let it speak the truth."**
>
> **“赋予优雅的信息以万千种语言，但让它只诉说真理。”**
>
> — _威廉·莎士比亚，《终成眷属》 (William Shakespeare, All's Well That Ends Well)_

---

::: tip 💡 上一章答案揭晓
`list[Dog]` 是 `Sequence[Animal]` 的子类型吗？
**是的**。因为 `Sequence` 是只读的，它是**协变 (Covariant)** 的。
但 `list[Dog]` **不是** `list[Animal]` 的子类型。因为 `list` 是可变的，它是**不变 (Invariant)** 的。
如果你没看懂，别急，本章 11.4 节将为你揭开这个“类型陷阱”的真相。
:::

泛型的核心在于**“模板化”**。我们编写一段逻辑，希望它能适用于多种类型，但在使用时又能保持类型的具体化，而不是退化成 `Any`。

在 Python 3.12 之前，泛型写法非常啰嗦。但现在，我们迎来了 PEP 695，它让 Python 的泛型语法终于赶上了现代语言的步伐。

## 11.1 函数泛型：告别 `TypeVar`

让我们看一个最经典的需求：写一个函数，返回列表的第一个元素，且不丢失类型。

::: code-group

```python [Python 3.12+ (新标准)]
# 直接在函数名后用 [T] 声明，无需导入 TypeVar
def first[T](items: list[T]) -> T:
    return items[0]
```

```python [Python < 3.12 (旧写法)]
from typing import TypeVar, List

# 必须先定义一个全局变量，非常笨重
T = TypeVar("T")

def first(items: List[T]) -> T:
    return items[0]
```

:::

这就是 Python 3.12 的魔力。不需要导入 `TypeVar`，不需要预定义，即写即用。

::: info 📝 TS 开发者便签：`<T>` vs `[T]`

- **TS**: `function first<T>(items: T[]): T { ... }`
- **Python**: `def first[T](items: list[T]) -> T: ...`

唯一的区别就是 TS 用尖括号 `<>`，Python 用方括号 `[]`。
**原因**：在 Python 中 `<` 和 `>` 是小于/大于运算符，解析器很难区分它们是泛型还是比较运算，所以选择了不会产生歧义的 `[]`。
:::

## 11.2 类泛型：通用容器

如果你想定义一个通用的“响应包装器”：

```python
from dataclasses import dataclass

@dataclass
class APIResponse[DataT]:
    code: int
    message: str
    data: DataT

# 使用
# IDE 会正确推断：user_resp.data 是 str
user_resp = APIResponse[str](200, "OK", "User123")

# IDE 会正确推断：list_resp.data 是 list[int]
list_resp = APIResponse[list[int]](200, "OK", [1, 2, 3])
```

这种写法比旧版的 `class APIResponse(Generic[DataT])` 优雅太多了。

## 11.3 泛型约束 (Constraints)

有时候 `T` 不能是任意类型，我们希望它只能是某些特定的类型。

### 11.3.1 限制范围 (Upper Bound)

比如，你要写一个加法函数，只支持 `int` 和 `float`（因为 `str` 相加并不是数学意义的加法）。

```python
# [T: (int, float)] 表示 T 必须是 int 或 float 的子类型
def add[T: (int, float)](a: T, b: T) -> T:
    return a + b

add(1, 2)     # ✅
add(1.5, 2.5) # ✅
# add("a", "b") # ❌ 静态检查报错：str 不满足约束
```

### 11.3.2 上界约束 (Bound)

如果你要求 `T` 必须是某个类的子类（比如必须是 `Animal` 的子类）。

```python
class Animal:
    def speak(self) -> str: return "..."

class Dog(Animal): ...

# T 必须是 Animal 或其子类
# 这对应 TS 的 <T extends Animal>
def make_noise[T: Animal](entity: T) -> str:
    return entity.speak()
```

## 11.4 协变与逆变：解答上一章的难题

现在深入解释为什么 **`list[Dog]` 不是 `list[Animal]`**。

### 11.4.1 可变性陷阱 (The Mutability Trap)

假设 Python 允许这样做：

```python
class Animal: ...
class Dog(Animal): ...
class Cat(Animal): ...

dogs: list[Dog] = [Dog()]

# 假设这里不报错（实际上静态检查会报错）
# 如果 list 是协变的：
animals: list[Animal] = dogs  # 把"狗窝"当成了"动物窝"

# 因为 animals 是 list[Animal]，所以我可以往里放 Cat
animals.append(Cat())

# 😱 灾难发生：dogs 列表里混进了一只 Cat！
# next_dog: Dog = dogs[1]  <- 运行时崩溃，因为拿出来的是 Cat
```

这就叫 **不变性 (Invariance)**。
为了防止你往“苹果篮子”里放“香蕉”，可变容器（Mutable Container）在 Python 中必须是严格匹配的。

### 11.4.2 破局：使用不可变接口 (Covariance)

如果你只是**读取**数据，不修改它，那是安全的。
`Sequence`（序列）是只读的协议（它只有 `__getitem__`，没有 `append`）。

```python
from collections.abc import Sequence

# ✅ 这是允许的！
# 也就是：Sequence[Dog] 是 Sequence[Animal] 的子类型 (协变)
# 只要我不往里写数据，把"狗群"看作"动物群"是完全安全的
def count_animals(animals: Sequence[Animal]) -> int:
    return len(animals)

my_dogs: list[Dog] = [Dog(), Dog()]
count_animals(my_dogs) # Pass
```

::: warning ⚠️ TS 开发者便签：Variance 的差异
TS 开发者在这里最容易晕。

- **TS**: TS 的类型系统在某些方面是**双变 (Bivariant)** 或 **协变 (Covariant)** 的。在 TS 中，`Dog[]` 通常**可以**赋值给 `Animal[]`。TS 牺牲了部分类型安全性换取了易用性（虽然这可能导致运行时错误）。
- **Python**: Python 的类型系统更加严格。对于 `list` 这种可变类型，它是严格**不变 (Invariant)** 的。

**口诀**：

- 如果你只需要**读**：使用 `Sequence[T]` 或 `Iterable[T]`（它们兼容性好）。
- 如果你需要**写**（如 append）：必须使用 `list[T]`（它要求类型严格匹配）。
  :::

## 11.5 泛型类型别名

配合 `type` 关键字，我们可以定义复杂的泛型别名。

```python
type Result[T] = T | Exception

def safe_parse(val: str) -> Result[int]:
    try:
        return int(val)
    except ValueError as e:
        return e
```

## 本章小结

Python 3.12 的泛型语法 `[T]` 彻底改变了 Python 库的编写方式。

1.  **语法**：用 `def func[T]:` 代替旧的 `TypeVar`。
2.  **约束**：用 `[T: int]` 进行类型限制。
3.  **方差**：记住 `list` 是不变的（不能把子类列表传给父类参数），`Sequence` 是协变的（只读就可以传）。这是通过静态检查的关键。

至此，我们已经讲完了所有关于“静态类型”的核心工具。

下一章，我们将进入 Python 的“黑魔法”领域 —— **装饰器 (Decorators)**。
你是否想过，如何写一个通用的日志装饰器，既能包裹任意函数，又**不丢失原函数的参数类型提示**？这需要用到泛型的进阶应用 `ParamSpec`，它是 TS 开发者梦寐以求的功能。

::: tip 🧠 课后思考
在 TS 中，高阶函数（Higher-Order Function）非常常见。

如果我要写一个 Python 函数 `log_execution`，它可以包裹**任何函数**，打印它的执行时间，且**不丢失原函数的类型提示**（调用者依然能看到原函数的参数提示，而不是 `Any`），该怎么写？

**提示**：普通的 `Callable[..., Any]` 会丢失参数信息。你需要 Python 3.10 引入的 `ParamSpec`。
:::
