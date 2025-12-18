# 第 9 章：数据建模与 IO 边界 (Data Modeling)

> **"Truth is beauty, beauty truth."**
>
> **“真即是美，美即是真。”**
>
> — _约翰·济慈 (John Keats)_

---

::: tip 💡 上一章答案揭晓
关于多重继承 `class C(A, B)`，如果 A 和 B 都有 `greet()`，C 会调用谁的？
**答案：调用 A 的。**
Python 使用 **C3 线性化算法** 来确定方法解析顺序 (MRO)。简单来说，原则是 **“从左到右，深度优先”**。
你可以通过 `print(C.mro())` 来查看具体的查找顺序：`[C, A, B, object]`。
:::

软件开发中最大的挑战往往不在于核心逻辑，而在于**边界 (Boundaries)**。当数据从外部世界（HTTP 请求、数据库、文件）流入你的程序时，它们是“脏”的、无类型的。

在 TypeScript 中，你可能习惯直接把 JSON `as` 成一个 Interface。但在 Python 中，处理这些数据需要更明确的策略。本章我们将探讨 Python 原生的数据建模工具，并指出它们的局限性。

## 9.1 IO 边界的真相：类型谎言

让我们看一个最常见的场景：从 API 获取用户数据。

```python
import requests

class User:
    id: int
    name: str

def get_user(uid: int) -> User:
    resp = requests.get(f"/users/{uid}")
    data = resp.json() # 返回的是 dict (字典)

    # ❌ 危险的操作：类型强转 (Type Casting)
    # 在 TS 中，你可能会写：return data as User
    # 在 Python 中，这行代码虽然静态检查可能通过（因为我们撒谎了），
    # 但运行时 data 依然是 dict，根本不是 User 类的实例！
    return data # type: ignore
```

如果你尝试访问 `user.name`：

- 如果 `user` 是字典，你必须用 `user["name"]`。
- 如果 `user` 是对象，你必须用 `user.name`。

**核心痛点**：Python 的 `dict` 和 `object` 是两种完全不同的内存结构，不像 JS 中 Object 既是字典又是对象。

## 9.2 `TypedDict`：为字典穿上外衣

如果你不想把 JSON 转换成类实例，只是想让 IDE 知道字典里有哪些 Key，可以使用 `TypedDict`。这最接近 TS 的 Interface。

```python
from typing import TypedDict, NotRequired

# 定义一个字典的"形状"
class UserDict(TypedDict):
    id: int
    name: str
    # Python 3.11+ 支持 NotRequired，类似 TS 的可选属性 ?:
    email: NotRequired[str]

def process_user(u: UserDict) -> None:
    # ✅ IDE 现在知道 u 有 "id" 和 "name" 键
    print(u["name"])

    # ❌ 访问不存在的键，静态检查会报错
    # print(u["age"])

# 运行时
data = {"id": 1, "name": "Alice"}
process_user(data) # ✅
```

**局限性**：`TypedDict` 仅仅是给静态检查工具看的。在运行时，它就是一个普通的 `dict`，没有任何验证逻辑。如果传入的数据缺了 `id`，运行时照样报错。

::: info 📝 TS 开发者便签：Interface vs TypedDict

- **TS Interface**: `interface User { id: number }`。
- **Python TypedDict**: `class User(TypedDict): id: int`。

它们非常相似：都只存在于编译/检查阶段，运行时都只是普通的 JSON 对象/字典。它是处理纯 JSON 数据最轻量的方式。
:::

## 9.3 `Dataclasses`：名义化对象

当你需要给数据绑定行为（方法），或者需要更严格的结构时，你应该使用 **Dataclasses**。它是 Python 3.7+ 的标准库，用于替代手写繁琐的 `class`。

### 9.3.1 基础语法与陷阱

Dataclass 会自动为你生成 `__init__`, `__repr__`, `__eq__` 等方法。但这里有一个巨大的陷阱。

::: code-group

```python [❌ 错误示范]
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    # ❌ ValueError: mutable default <class 'list'>...
    # Python 禁止直接使用可变对象作为默认值
    tags: list[str] = []
```

```python [✅ 正确示范]
from dataclasses import dataclass, field

@dataclass
class User:
    id: int
    name: str
    # 默认值 (不可变对象直接写)
    is_active: bool = True
    # ✅ 可变默认值必须用 field(default_factory=...)
    # 这类似 JS 中每次调用构造函数都 new Array()
    tags: list[str] = field(default_factory=list)

u = User(id=1, name="Alice")
print(u) # User(id=1, name='Alice', is_active=True, tags=[])
```

:::

### 9.3.2 不可变性：`frozen=True`

```python
@dataclass(frozen=True)
class Config:
    host: str
    port: int

c = Config("localhost", 8080)
# c.port = 9090 # ❌ 运行时报错：FrozenInstanceError
```

这不仅提供了类似 TS `readonly` 的安全性，还让对象变成了**可哈希的 (Hashable)**，这意味着它可以作为字典的 Key。

### 9.3.3 性能优化：`slots=True` (Python 3.10+)

```python
@dataclass(slots=True)
class Point:
    x: int
    y: int
```

默认的 Python 对象使用 `__dict__` 字典来存储属性，这很灵活（你可以随时 `obj.new_attr = 1`）但费内存。
`slots=True` 就像是把“宽敞的背包”换成了“紧凑的卡槽”，它告诉解释器预留固定的内存空间，**大幅降低内存占用并提升访问速度**。对于创建数百万个小对象的场景，这是必选项。

## 9.4 脏数据防御：为什么 Dataclass 还是不够？

这是 **Type Boundary（类型边界）** 最危险的地方。

假设前端传来的 JSON 是这样的：

```json
{
  "id": "123",
  "name": "Alice"
}
```

_注意：`id` 是字符串 "123"，但我们的 Dataclass 定义要求是 `int`。_

如果我们尝试用它初始化 Dataclass：

```python
@dataclass
class User:
    id: int  # 我们声明它是 int
    name: str

raw_data = {"id": "123", "name": "Alice"}

# 解包字典进行初始化
user = User(**raw_data)

# 😱 灾难发生：类型系统被击穿了！
print(user.id)        # 输出 "123" (字符串)
print(type(user.id))  # <class 'str'>
```

::: danger ☠️ 发生了什么？
Dataclass 生成的 `__init__` 方法**只是简单的赋值**，它**不会**检查你传进来的值是否符合类型注解，也**不会**帮你自动转换（比如把 `"123"` 转成 `123`）。

这就导致了“脏数据”污染了你的内部对象。后续的代码如果假设 `user.id` 是 `int` 并进行数学运算，就会在远离数据源的地方突然崩溃。
:::

::: info 📝 TS 开发者便签：运行时校验的缺失
在 TS 中，`const u = json as User` 也是一种谎言。但通常我们在 TS 中使用 Zod / io-ts 来在边界处清洗数据。

在 Python 中：

- **TypedDict**: 纯静态，不管运行时。
- **Dataclass**: 运行时只赋值，不校验，不转换。适合**内部**数据传递（你信任数据的来源）。
- **Pydantic** (第 17 章): **运行时** 校验 + 转换。适合**外部**数据输入（API, DB）。
  :::

## 9.5 转换层：如何安全地从 Dict 变为 Object

既然 Dataclass 防不住脏数据，我们在不引入第三方库（Pydantic）的情况下，应该怎么做？

你需要编写明确的**工厂方法**或**转换函数**。

```python
from typing import Any

@dataclass
class User:
    id: int
    name: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "User":
        # 在这里进行手动的类型校验和转换
        if not isinstance(data.get("id"), (str, int)):
             raise ValueError("Invalid id")

        # 手动强转，确保进入模型的数据是干净的
        return cls(
            id=int(data["id"]),
            name=str(data["name"])
        )

# 安全使用
user = User.from_dict({"id": "123", "name": "Alice"})
# 现在 user.id 是真正的 int(123)
```

虽然写起来繁琐，但这才是负责任的工程代码。它划清了“脏数据”和“净数据”的界限。

## 本章小结

数据建模是 Python 工程化的深水区。

1.  **IO 边界**: 外部输入的 JSON 永远是 `dict`，类型注解在这里是失效的。
2.  **TypedDict**: 适用于不需要方法的轻量级字典结构，类似 TS Interface。
3.  **Dataclass**: 适用于系统内部流转的实体对象，支持不可变 (`frozen`) 和性能优化 (`slots`)。
4.  **防御思维**: Dataclass 不会自动校验类型。对于不可信的外部输入，必须手动编写转换逻辑，或者等待我们第 17 章介绍的神器 —— **Pydantic**。

既然我们已经定义好了数据结构，那么如何确保我们在使用这些数据时，类型判断是完备的？比如，我怎么确保我处理了 `Status` 枚举的所有可能情况？

下一章，我们将深入 **协议 (Protocols)**，这是 Python 类型系统中处理“多态”的关键，也是连接静态类型与动态特性的桥梁。

::: tip 🧠 课后思考
**序列化陷阱**：
`Dataclass` 和 `TypedDict` 在 JSON 序列化时有什么区别？

如果我直接运行 `json.dumps(my_dataclass_instance)`，Python 会抛出 `TypeError: Object of type User is not JSON serializable`。
为什么？（提示：标准库的 `json` 不知道如何处理自定义对象，你需要 `dataclasses.asdict` 帮忙转换回字典）。
:::
