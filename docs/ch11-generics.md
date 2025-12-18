# 第 11 章：现代泛型 (Generics)

> **"Give to a gracious message an host of tongues, but let it speak the truth."** > **“赋予优雅的信息以万千种语言，但让它只诉说真理。”**
> — _威廉·莎士比亚，《终成眷属》 (William Shakespeare, All's Well That Ends Well)_

---

泛型的核心在于**“模板化”**。我们编写一段逻辑，希望它能适用于多种类型，但在使用时又能保持类型的具体化，而不是退化成 `Any`。

## 11.1 函数泛型：告别 `TypeVar`

让我们看一个最经典的需求：写一个函数，返回列表的第一个元素。

**Python 3.12 之前的旧写法（你会在很多旧源码中看到）**：

```python
from typing import TypeVar, List

T = TypeVar("T")  # 必须先定义一个变量
def first(items: List[T]) -> T: ...
```

**Python 3.12+ 的新写法**：
直接在函数名后面用 `[]` 声明泛型参数。

```python
def first[T](items: list[T]) -> T:
    return items[0]
```

这就完事了。不需要导入 `TypeVar`，不需要预定义。

### 📝 TS 开发者便签：`<T>` vs `[T]`

> - **TS**: `function first<T>(items: T[]): T { ... }`
> - **Python**: `def first[T](items: list[T]) -> T: ...`
>
> 唯一的区别就是 TS 用尖括号 `<>`，Python 用方括号 `[]`（因为 `<>` 在 Python 中是小于/大于运算符，解析器很难区分）。逻辑完全一致。

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
user_resp = APIResponse[str](200, "OK", "User123")
list_resp = APIResponse[list[int]](200, "OK", [1, 2, 3])
```

IDE 会正确推断：`user_resp.data` 是 `str` 类型，而 `list_resp.data` 是 `list[int]`。

## 11.3 泛型约束 (Constraints)

有时候 `T` 不能是任意类型，我们希望它只能是某些特定的类型。

### 11.3.1 限制范围 (Restricted)

比如，你要写一个加法函数，只支持 `int` 和 `float`（或者 `str`）。

```python
# T 只能是 int 或 float，传 str 会报错
def add[T: (int, float)](a: T, b: T) -> T:
    return a + b
```

### 11.3.2 上界约束 (Bound)

如果你要求 `T` 必须是某个类的子类（比如必须是 `Animal` 的子类）。

```python
class Animal:
    def speak(self) -> str: return "..."

class Dog(Animal): ...

# T 必须是 Animal 或其子类
def make_noise[T: Animal](entity: T) -> str:
    return entity.speak()
```

### 📝 TS 开发者便签：extends

> - **TS**: `function func<T extends Animal>(...)`
> - **Python**: `def func[T: Animal](...)`
>
> Python 的 `:` 语法对应 TS 的 `extends`。

## 11.4 协变与逆变：解答上一章的难题

现在回答上一章的思考题：**`list[Dog]` 是 `list[Animal]` 的子类型吗？**

答案是：**不是**。

### 为什么？(The Mutability Trap)

假设 Python 允许这样做：

```python
class Animal: ...
class Dog(Animal): ...
class Cat(Animal): ...

dogs: list[Dog] = [Dog()]

# 假设这里不报错（实际上静态检查会报错）
# 如果 list 是协变的：
animals: list[Animal] = dogs

# 因为 animals 是 list[Animal]，所以我可以往里放 Cat
animals.append(Cat())

# 😱 灾难发生：dogs 列表里混进了一只 Cat！
# next_dog: Dog = dogs[1]  <- 运行时崩溃，因为拿出来的是 Cat
```

这就叫 **不变性 (Invariance)**。可变容器（Mutable Container）通常是**不变**的，即 `Container[Child]` **不是** `Container[Parent]` 的子类型。

### 破局：使用不可变接口 (Covariance)

如果你只是**读取**数据，不修改它，那是安全的。
`Sequence`（序列）是只读的协议（它只有 `__getitem__`，没有 `append`）。

```python
from collections.abc import Sequence

# ✅ 这是允许的！
# 也就是：Sequence[Dog] 是 Sequence[Animal] 的子类型 (协变)
def count_animals(animals: Sequence[Animal]) -> int:
    return len(animals)

my_dogs: list[Dog] = [Dog(), Dog()]
count_animals(my_dogs) # Pass
```

### 📝 TS 开发者便签：Variance 的差异

> TS 开发者在这里最容易晕。
>
> - **TS**: TS 的类型系统在某些方面是**双变 (Bivariant)** 或 **协变 (Covariant)** 的。在 TS 中，`Dog[]` **可以** 赋值给 `Animal[]`。TS 牺牲了部分类型安全性换取了易用性（虽然这可能导致运行时错误）。
> - **Python**: Python 的类型系统更加严格。对于 `list` 这种可变类型，它是严格**不变 (Invariant)** 的。
>
> **口诀**：
>
> - 如果你只需要**读**：使用 `Sequence[T]` 或 `Iterable[T]`（它们是协变的，兼容性好）。
> - 如果你需要**写**（如 append）：必须使用 `list[T]`（它是不变的，类型必须严格匹配）。

---

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

---

**本章小结**

Python 3.12 的泛型语法 `[T]` 彻底改变了 Python 库的编写方式。

1.  **语法**：用 `class Box[T]:` 代替旧的 `TypeVar`。
2.  **约束**：用 `[T: int]` 进行限制。
3.  **方差**：记住 `list` 是不变的，`Sequence` 是协变的。这是通过静态检查的关键。

至此，我们已经讲完了所有关于“静态类型”的核心工具。但正如我们在第 6 章所说，类型注解只是“建议”。如何利用这些工具写出真正“百毒不侵”的代码？

下一章，我们将讨论 **防御性编程**。这是 TS 开发者常常询问的：“Python 里怎么做类型收窄（Type Narrowing）？” “怎么做 Exhaustiveness Checking？” 答案将在下一章揭晓。

> **思考题**：
> 在 TS 中，高阶函数（Higher-Order Function）非常常见。
> 如果我要写一个 Python 函数 `log_execution`，它可以包裹任何函数，打印它的执行时间，且**不丢失原函数的类型提示**（参数和返回值），该怎么写？这需要用到 `ParamSpec`，它是泛型的进阶应用（我们将在第 13 章详细讲解）。
