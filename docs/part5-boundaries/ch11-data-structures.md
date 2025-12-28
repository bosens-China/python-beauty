# 数据的形状

> **"Form follows function."**  
> **“形式追随功能。”**  
> — _路易斯·沙利文 (Louis Sullivan), 现代主义建筑之父_

---

在软件开发中，我们大部分时间处理的不是算法，而是**数据**。

数据在程序中流转，像水一样。如果不给它定义明确的结构（即“形状”），它就会变成一滩随意的泥浆——可能是个字典，可能是个元组，也可能混入了奇怪的字符串或类型错误。

在 TypeScript 中，你习惯了使用 `interface` 或 `type` 来约束数据的结构。而在早期的 Python 项目中，开发者常常依赖普通的 `dict`（字典）来传递数据。这种方式虽然灵活，但缺乏类型安全和可读性。

幸运的是，现代 Python 提供了更优雅、更工程化的方式来定义数据的“容器”。本章将介绍两种核心的数据建模工具：**`TypedDict`** 和 **`dataclass`**。

> 💡 **术语说明**：
>
> - “数据形状（Data Shape）”指的是数据的结构，包括字段名、字段类型以及是否可选等信息。
> - 在本书中，“实体（Entity）”指代具有明确属性和行为的对象，常用于表示业务概念（如用户、订单等）。

## 字典的困局：当 Key 变成谜语

让我们看一段典型的“老式” Python 代码：

```python
def get_user_info(uid: int):
    # 返回一个字典，但没有任何提示告诉你字典里有什么
    return {
        "id": uid,
        "name": "Alice",
        "is_active": True
    }

user = get_user_info(1)
# ❌ 开发者的噩梦：
# 我不知道 key 是 "name" 还是 "username"？
# 我不知道 "is_active" 是 bool 还是字符串 "true"/"false"？
# 如果我拼错了 key（比如写成 "usename"），只有在运行时才会报错 (KeyError)。
print(user["usename"])  # KeyError: 'usename'
```

这种依赖字符串键（string keys）且无类型提示的方式，被称为 **“字符串类型编程（Stringly Typed Programming）”**，是维护大型项目的重大隐患。

- 编辑器无法提供自动补全；
- 静态类型检查器（如 mypy）无法发现错误；
- 重构困难，容易引入运行时错误。

我们需要一种方式，在保留灵活性的同时，为数据赋予清晰的结构。

## 轻量级约束：`TypedDict`

如果你仍希望使用字典（例如为了与 JSON 兼容），但又想获得类型安全，那么 **`TypedDict`** 是最轻量的选择。

`TypedDict` 允许你为字典定义明确的“结构”（schema），并在静态类型检查阶段进行验证。

### 基础用法

```python
from typing import TypedDict

class UserDict(TypedDict):
    id: int
    name: str
    is_active: bool
```

这段代码定义了一个名为 `UserDict` 的类型，它表示一个字典，必须包含 `id`（整数）、`name`（字符串）和 `is_active`（布尔值）三个键。

> 📌 **注意**：`TypedDict` 是 Python 3.8 引入的标准库功能。如果你使用的是 Python 3.7，需从 `typing_extensions` 导入。

### 可选字段

有时某些字段可能是可选的（例如用户可能未填写邮箱）。从 Python 3.11 起，可以使用 `NotRequired` 标记可选字段：

```python
from typing import TypedDict, NotRequired

class UserDict(TypedDict):
    id: int
    name: str
    email: NotRequired[str]  # 可选字段
```

> 🔍 **首次出现说明**：  
> `NotRequired[T]` 表示该字段在字典中可以不存在。这类似于 TypeScript 中的可选属性 `email?: string`。

### 使用示例

```python
def process(u: UserDict) -> None:
    print(u["name"])  # ✅ 编辑器能智能提示可用的键

# 创建符合 UserDict 类型的字典
data: UserDict = {"id": 1, "name": "Alice"}  # 合法，email 可省略
```

### 重要特性

::: info 📝 给 TypeScript 开发者的类比
`TypedDict` 在精神上最接近 TypeScript 的 **Interface**：

- 它仅在**静态类型检查阶段**起作用（如通过 mypy 或 IDE）；
- 在运行时，`data` 仍然是一个普通的 Python `dict`，没有任何额外开销；
- 它**不会**在运行时验证数据类型。例如，如果你传入 `{"id": "123"}`（字符串而非整数），程序不会报错，除非你使用额外的验证库（如 Pydantic）。
  :::

因此，`TypedDict` 适合用于**可信数据源**（如内部函数返回值）或**需要与 JSON 无缝互转**的场景。

## 实体建模：`dataclass`

当你不只是传递数据，而是要定义一个具有身份、状态甚至行为的**实体对象**时，`dataclass` 是 Python 3.7+ 推荐的标准方式。

`dataclass` 是一个装饰器，它会根据你声明的字段，自动生成常见的特殊方法（如 `__init__`、`__repr__`、`__eq__` 等），避免样板代码。

### 1. 基础语法

```python
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str = "unknown@example.com"  # 默认值
```

> 📌 **首次出现说明**：  
> `@dataclass` 是一个**装饰器（decorator）**，用于修改类的行为。它会分析类中的字段（带类型注解的类变量），并自动生成初始化方法等。

使用效果：

```python
u = User(id=1, name="Alice")  # 自动生成 __init__
print(u)                      # 自动生成 __repr__: User(id=1, name='Alice', email='unknown@example.com')
print(u == User(1, "Alice"))  # 自动生成 __eq__: 按字段值比较，结果为 True
```

### 2. 不可变性：`frozen=True`

在函数式编程或多线程环境中，不可变对象能避免意外修改，提升程序可靠性。

```python
@dataclass(frozen=True)
class Config:
    host: str
    port: int

conf = Config("localhost", 8080)
# conf.port = 9090  # ❌ 运行时报错：FrozenInstanceError
```

启用 `frozen=True` 后，对象变为**不可变**，同时自动变为**可哈希（hashable）**，因此可以用作字典的键或集合的元素。

### 3. 性能优化：`slots=True`（Python 3.10+）

默认情况下，Python 对象使用 `__dict__` 存储属性，这很灵活但内存占用高。

通过设置 `slots=True`，你可以告诉解释器为对象预留固定内存空间，从而：

- 减少内存占用（尤其在创建大量小对象时）；
- 加快属性访问速度。

```python
@dataclass(slots=True)
class Point:
    x: float
    y: float
```

> ⚠️ 注意：使用 `slots` 后，不能动态添加新属性（如 `p.z = 1` 会报错）。

## ⚠️ 必修课：Dataclass 的默认值陷阱

在第 4 章我们讲过函数默认参数的陷阱：**不要使用可变对象（如列表、字典）作为默认值**，因为它们会在所有调用间共享。

这个陷阱在 `dataclass` 中同样存在，而且 Python 会主动阻止你犯错。

### 错误示范

```python
@dataclass
class Team:
    name: str
    members: list[str] = []  # ❌ 错误！
```

如果你尝试运行上述代码，Python 会抛出 `ValueError`：

```
ValueError: mutable default <class 'list'> for field members is not allowed
```

这是因为如果允许，所有 `Team` 实例将共享同一个空列表，导致一个实例的修改影响其他实例。

### 正确做法：`default_factory`

解决方案是使用 `field(default_factory=...)`，告诉 `dataclass`：**每次创建新实例时，调用这个工厂函数生成新的默认值**。

```python
from dataclasses import dataclass, field

@dataclass
class Team:
    name: str
    members: list[str] = field(default_factory=list)

t1 = Team("Alpha")
t1.members.append("Alice")

t2 = Team("Beta")
print(t2.members)  # 输出: [] → 安全！每个实例都有独立的列表
```

> 📌 **首次出现说明**：  
> `field()` 是 `dataclasses` 模块提供的函数，用于对字段进行细粒度控制（如设置默认工厂、排除字段等）。

这相当于在传统类的 `__init__` 中写 `self.members = []`，确保每个实例拥有独立的可变对象。

## 🧠 深度思考：Dataclass 与 JSON 序列化

> **问题**：我想把一个 `dataclass` 对象转换成 JSON 字符串发给前端。  
> 尝试运行以下代码会发生什么？

```python
import json
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str

user = User(id=1, name="Alice")
print(json.dumps(user))
```

你会收到错误：

```
TypeError: Object of type User is not JSON serializable
```

### 为什么？

Python 标准库的 `json` 模块只认识基本类型：`dict`、`list`、`str`、`int`、`float`、`bool`、`None`。它不知道如何处理自定义的 `User` 对象。

### 解决方案

#### 方案 1：手动转换为字典

使用 `dataclasses.asdict()` 将对象递归转换为字典：

```python
from dataclasses import asdict

print(json.dumps(asdict(user)))  # 输出: {"id": 1, "name": "Alice"}
```

> 📌 **首次出现说明**：  
> `asdict(obj)` 是 `dataclasses` 模块提供的函数，它会将 `dataclass` 实例及其嵌套的 `dataclass` 字段全部转换为普通字典。

#### 方案 2：使用 Pydantic（下一章内容）

`dataclass` 本身不提供序列化能力。而 **Pydantic** 模型内置了 `.model_dump()` 和 `.model_dump_json()` 方法，能高效处理复杂类型（如 `datetime`、`Decimal` 等），并支持验证。

## 本章小结

在 Python 中定义数据的形状，我们有两个主要选择：

| 工具            | 本质             | 适用场景                           | 优点                                                        | 局限                                           |
| --------------- | ---------------- | ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| **`TypedDict`** | 带类型提示的字典 | 处理 JSON、API 响应、兼容旧代码    | 轻量、零运行时开销、与 dict 无缝互换                        | 仅静态检查，无运行时验证；不能添加方法         |
| **`dataclass`** | 自动生成方法的类 | 系统内部的实体建模（如用户、订单） | 支持方法、不可变性（`frozen`）、性能优化（`slots`）、可扩展 | 不能直接 JSON 序列化；默认值需注意可变对象陷阱 |

### 关键提醒

无论是 `TypedDict` 还是 `dataclass`，它们都**不负责在运行时验证数据的正确性**。  
例如，如果你声明 `id: int`，但外部 API 传来了 `"123"`（字符串），`dataclass` 会照单全收，埋下类型隐患。

> 🔒 **边界原则（Boundaries Principle）**：  
> 对于来自外部（如 HTTP 请求、文件、用户输入）的**不可信数据**，必须进行运行时验证。

下一章，我们将介绍 Python 生态中最强大的数据验证与序列化库 —— **Pydantic**。它结合了类型提示、运行时验证和高性能序列化，将成为你处理外部数据的“守门员”。
