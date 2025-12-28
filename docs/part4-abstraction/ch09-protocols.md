# 看不见的接口：协议 (Protocol)

> **"Action is eloquence."**  
> **“行动即是雄辩。”**  
> — _威廉·莎士比亚，《科利奥兰纳斯》_

---

在面向对象的世界里，我们习惯了通过“继承”来建立关系。

> “这是一只鸟，因为它是 `Bird` 类的子类。”  
> “这是一个文件，因为它是 `File` 类的实例。”

但在现实世界中，我们往往并不关心事物的**名字**（它继承自谁），而更关心它的**能力**（它能做什么）。

只要一个东西能飞，我们就可以叫它“飞行器”，不管它是一只麻雀，还是一架波音 747。

在 Python 的早期实践中，这种思想被称为 **鸭子类型 (Duck Typing)**：“如果它走起路来像鸭子，叫起来像鸭子，那它就是鸭子。”

从 Python 3.8 开始，官方通过 `typing.Protocol` 将这一理念正式纳入类型系统，赋予它一个清晰、可静态检查的名字：**协议 (Protocol)**。

## 继承的困局：名义类型 (Nominal Typing)

假设我们在编写一个游戏，需要一个函数来处理“飞行”。

### 传统 OOP 思路的问题

```python
class Bird:
    def fly(self) -> None:
        print("Bird flying")

class Airplane:
    def fly(self) -> None:
        print("Plane flying")

def let_it_fly(entity: Bird) -> None:
    # ❌ 类型注解限制太死！
    # 即使 Airplane 也有 fly 方法，
    # 类型检查器（如 MyPy 或 Pylance）仍会报错，
    # 因为 Airplane 不是 Bird 的子类。
    entity.fly()
```

为了解决这个问题，在 Java 或早期 Python 中，通常的做法是定义一个公共基类（或抽象基类）：

```python
from abc import ABC, abstractmethod

class Flyable(ABC):
    @abstractmethod
    def fly(self) -> None: ...

class Bird(Flyable): ...
class Airplane(Flyable): ...
```

但这带来了一个严重问题：**如果你无法修改某个类的源码（例如它来自第三方库），你就无法让它“实现”这个接口**。这就是**名义类型 (Nominal Typing)** 的局限——类型关系依赖于显式的继承声明，而非实际结构。

## 协议：只看结构，不问出身

Python 的 `typing.Protocol` 引入了 **结构化子类型 (Structural Subtyping)**：只要对象的“形状”（即方法和属性的签名）匹配协议定义，它就被视为该协议的实现者，**无需显式继承或声明**。

```python
from typing import Protocol

# 1. 定义协议：任何具有 fly() -> None 方法的对象都是 Flyer
class Flyer(Protocol):
    def fly(self) -> None:
        ...  # ... 是 Python 的合法语句，表示“此处留空”，常用于协议或抽象方法中
```

> 💡 **首次出现说明**：`...`（省略号）在 Python 中是一个合法的表达式，常用于占位。在协议中，它表示“此方法不需要具体实现，仅用于声明接口”。

```python
# 2. 实现类（完全不知道 Flyer 的存在）
class Bird:
    def fly(self) -> None:
        print("Wings flapping...")

class Airplane:
    def fly(self) -> None:
        print("Engines starting...")

# 3. 使用协议作为类型注解
def launch(entity: Flyer) -> None:
    entity.fly()

# ✅ 静态类型检查通过！运行也正常！
launch(Bird())
launch(Airplane())
```

静态类型检查器（如 MyPy、Pylance）会自动验证：

- `Bird` 是否有 `fly` 方法？✅
- `fly` 方法是否接受 `self` 且无其他参数？✅
- 返回值是否为 `None`（即 `-> None`）？✅

只要满足这些条件，`Bird` 就被视为 `Flyer` 的有效实现。

::: info 📝 TypeScript 开发者提示：Interface 的完美对应
这是本书中最重要的一次概念对齐：

- **Python `Protocol` ≈ TypeScript `interface`**

在 TypeScript 中：

```typescript
interface Flyer {
  fly(): void;
}
function launch(entity: Flyer) {
  entity.fly();
}
// 只要对象有 fly 方法，就能传入，无需 implements
```

Python 的 `Protocol` 实现了完全相同的机制：**基于结构，而非声明**。你不需要像 Java 那样写 `implements Flyer`，只要“长得像”，就是它。
:::

## 复杂协议：支持属性与只读字段

协议不仅可以定义方法，还可以定义**属性**，包括只读属性。

```python
from typing import Protocol

class Named(Protocol):
    @property
    def name(self) -> str: ...
    # 表示该协议要求有一个名为 name 的只读属性，类型为 str
```

> 💡 **首次出现说明**：`@property` 是 Python 的装饰器，用于将方法转换为只读属性。在协议中使用它，表示实现者必须提供一个可通过 `obj.name` 访问的字符串属性（可以是实例属性、类属性，或真正的 `@property` 方法）。

```python
def greet(obj: Named) -> None:
    print(f"Hello, {obj.name}")

class User:
    def __init__(self, name: str):
        self.name = name  # 实例属性

class Dog:
    name = "Buddy"  # 类属性，同样满足协议

# ✅ 两者都符合 Named 协议
greet(User("Alice"))
greet(Dog())
```

## 运行时检查：`@runtime_checkable`

默认情况下，`Protocol` **仅用于静态类型检查**。如果你尝试在运行时使用 `isinstance(obj, MyProtocol)`，Python 会抛出 `TypeError`，因为普通协议在运行时不具备检查能力。

若需支持运行时类型判断，需使用 `@runtime_checkable` 装饰器：

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Closer(Protocol):
    def close(self) -> None: ...

class File:
    def close(self) -> None:
        pass

f = File()

# ✅ 现在 isinstance 可以工作了
if isinstance(f, Closer):
    f.close()
```

> ⚠️ 注意：`@runtime_checkable` 仅检查**是否存在对应名称的可调用属性**，**不会验证签名细节**（如参数数量、返回类型）。因此，它适用于简单场景，但不能替代静态检查。

## 站在巨人的肩膀上：`collections.abc`

不要重复造轮子！Python 标准库中的 `collections.abc` 模块提供了大量预定义的抽象基类（ABCs），现代类型检查器将它们视为**内置协议**。

这些协议让你写出高度通用的函数：

| 协议               | 要求                                      | 常见实现                               |
| ------------------ | ----------------------------------------- | -------------------------------------- |
| `Iterable[T]`      | 实现 `__iter__()`                         | `list`, `tuple`, `set`, `dict`, 生成器 |
| `Sequence[T]`      | 支持索引和长度 (`__getitem__`, `__len__`) | `list`, `tuple`, `str`                 |
| `Mapping[K, V]`    | 类似字典 (`__getitem__`, `keys()`, etc.)  | `dict`, `defaultdict`                  |
| `Callable[[A], R]` | 可调用对象                                | 函数、lambda、带 `__call__` 的类       |

### 最佳实践：参数类型应尽可能宽泛

::: code-group

```python [❌ 限制过严]
# 仅接受 list[str]，拒绝 tuple 或 set
def process_names(names: list[str]) -> None:
    for name in names:
        print(name)
```

```python [✅ 推荐写法]
from collections.abc import Iterable

# 接受任何可迭代的字符串序列
def process_names(names: Iterable[str]) -> None:
    for name in names:
        print(name)
```

:::

使用 `Iterable[str]` 后，你的函数不仅能处理列表，还能处理元组、集合、生成器，甚至未来用户自定义的流式数据结构。这正是**解耦**与**可扩展性**的体现。

## 🧠 深度思考：组合多个协议

> **在 TypeScript 中，我们可以用 `type Hero = Flyer & Runner` 表示交叉类型。**  
> **在 Python 中，如何表示“既能飞又能跑”的对象？**

::: details 点击查看答案
Python 没有 `&` 运算符来组合类型。但你可以通过**多重继承协议**来实现相同效果：

```python
from typing import Protocol

class Flyer(Protocol):
    def fly(self) -> None: ...

class Runner(Protocol):
    def run(self) -> None: ...

# 组合两个协议：SuperHero 必须同时满足 Flyer 和 Runner
class SuperHero(Flyer, Runner, Protocol):
    pass  # 无需额外实现

def action(hero: SuperHero) -> None:
    hero.fly()
    hero.run()
```

这里的继承不是传统 OOP 的“父子关系”，而是**能力的叠加**。任何同时具备 `fly()` 和 `run()` 方法的对象，都自动成为 `SuperHero`。
:::

## 本章小结

`Protocol` 是 Python 类型系统走向成熟的标志，它让 Python 拥有了与 TypeScript 相媲美的结构化类型能力。

- ✅ **解耦设计**：使用者定义“需要什么能力”，实现者只需“提供能力”，无需知道协议存在。
- ✅ **TS 对标**：`Protocol` ≈ TypeScript 的 `interface`，基于结构而非声明。
- ✅ **善用标准库**：优先使用 `Iterable`、`Sequence` 等 `collections.abc` 中的协议，提升代码通用性。
- ✅ **运行时支持**：通过 `@runtime_checkable` 可在必要时进行运行时检查（但需谨慎使用）。

既然我们已经能灵活定义各种“形状”的接口，那么如何在**不修改原有代码**的前提下，为这些接口动态添加功能（如日志、缓存、权限控制）？

下一章，我们将进入 Python 元编程中最优雅的工具之一 —— **装饰器 (Decorators)**。它能让函数和类在运行时“穿上新衣”，是构建高阶抽象的利器。
