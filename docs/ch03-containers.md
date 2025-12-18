# 第 3 章：容器与泛型基础

> **"We mould clay into a pot, but it is the emptiness inside that makes the vessel useful."** > **“我们要把黏土塑成器皿，但只有中间的空虚，才使器皿有了用处。”**
> — _老子，《道德经》第十一章_

---

容器的本质是“秩序”与“集合”。无论是排列有序的列表，还是基于哈希映射的字典，它们都是容纳数据的器皿。

在现代 Python (3.9+) 中，所有的标准容器类型（`list`, `dict`, `set`, `tuple`）都直接支持泛型语法 `[]`。而在 Python 3.12 中，我们更是迎来了全新的 `type` 关键字。

## 3.1 列表 (list) 与 元组 (tuple)

这是最常见的两种序列。它们的区别不仅仅在于括号的形状（方括号 vs 圆括号），更在于**设计哲学**。

### 3.1.1 列表：动态的数组

列表是**可变**的（Mutable）。它的底层是一个动态数组（Dynamic Array），存放着指向对象的指针。

```python
# 定义一个字符串列表
users: list[str] = ["Alice", "Bob", "Charlie"]

users.append("Dave")  # 合法：O(1)
users.insert(0, "Zoe") # 合法：O(N) - ⚠️ 注意性能，头部插入会导致所有元素后移
users[0] = "Alex"     # 合法
```

### 3.1.2 元组：不可变的契约

元组是**不可变**的（Immutable）。一旦创建，就不能修改。这回答了上一章的思考题：如果你需要一个不可变的列表，就用元组。

元组的类型注解有两种常见的形态：

1.  **固定结构（Struct-like）**：
    如果你把元组当作一个轻量级的数据结构（比如坐标点、数据库的一行），你知道确切的长度和每个位置的类型：

    ```python
    # 第一个元素是 x (int)，第二个是 y (int)
    point: tuple[int, int] = (10, 20)
    ```

2.  **同质序列（Array-like）**：
    如果你只是想要一个不可变的列表，且长度不固定，类型都一样：
    ```python
    # 一个包含任意多个整数的元组
    numbers: tuple[int, ...] = (1, 2, 3, 4, 5)
    ```
    注意那个省略号 `...`，它是 Python 的合法语法，表示“后面还有任意个同类型元素”。

### 📝 TS 开发者便签：Array 与 Tuple

> - **List**: 对应 TS 的 `Array<T>` 或 `T[]`。
> - **Tuple**: 对应 TS 的 Tuple `[number, number]`。
> - **ReadonlyArray**: Python 的 `tuple[T, ...]` 在逻辑上等价于 TS 的 `readonly T[]`。
>
> **关键区别**：
> 在 TS 中，`const arr = [1, 2]` 防止的是变量 `arr` 被重新赋值，但你依然可以 `arr.push(3)`。
> 在 Python 中，`tuple` 是真正的对象级别的不可变。你无法对元组调用 `push` (append) 或赋值操作。

## 3.2 字典 (dict) 与 集合 (set)：Hash 的代价

字典是 Python 的核心。它的查找速度极快（平均 O(1)），因为它是基于**哈希表 (Hash Map)** 实现的。

### 3.2.1 字典的使用

```python
# Key 是字符串，Value 是浮点数
prices: dict[str, float] = {
    "apple": 1.5,
    "banana": 0.8
}

# 访问
print(prices["apple"])

# ⚠️ 访问不存在的 Key 会崩溃
# print(prices["orange"]) -> KeyError

# ✅ 安全访问：.get() (类似 TS Optional Chaining)
price = prices.get("orange", 0.0)
```

### 3.2.2 性能直觉：O(1) 的代价

TS 开发者通常习惯随意创建对象。但在 Python 中，你需要意识到 `dict` 的创建是有成本的。

- **空间换时间**：为了保证 O(1) 的查找，哈希表必须预留比实际元素多得多的内存空间（稀疏数组），以减少哈希冲突。
- **Hash 计算**：每次插入或查找 Key，Python 都要计算 Key 的哈希值。

**心智模型**：

- 如果你的数据结构只有固定的几个字段（如 `x`, `y`），不要用 `dict`，请用 `class` 或 `dataclass`（我们后面会讲）。`dict` 适合存储**动态**的键值对。

### 3.2.3 集合 (set)

集合就是没有 Value 的字典。它用于去重和数学运算（交集 `&`、并集 `|`）。

```python
tags: set[str] = {"python", "coding"}
tags.add("python") # 自动去重
```

## 3.3 现代类型别名：`type` 关键字 (Python 3.12+)

在 Python 3.12 之前，定义类型别名需要 `TypeAlias = ...`。现在，我们可以像 TS 一样直接使用 `type` 关键字。**这是 PEP 695 引入的重大更新。**

```python
# Python 3.12+ 写法
type UserID = int | str
type UserInfo = dict[str, str | int]

def get_user(uid: UserID) -> UserInfo:
    ...
```

这不仅更简洁，而且它是**惰性求值**的（Lazy Evaluation），这意味着你可以在类型定义中引用还没定义的类（解决了以前循环引用的痛点），这与 TS 的处理方式终于对齐了。

## 3.4 `TypedDict`：处理 JSON 的原生方式

这是 TS 开发者最关心的问题：**“我怎么定义一个像 Interface 那样的 JSON 对象结构？”**

普通的 `dict[str, Any]` 太宽泛了。Python 3.8+ 引入了 `TypedDict`。

```python
from typing import TypedDict, NotRequired

# 定义一个字典的"形状"
class Movie(TypedDict):
    title: str
    year: int
    # NotRequired 类似 TS 的可选属性 ?: (Python 3.11+)
    rating: NotRequired[float]

# 使用
m: Movie = {"title": "Inception", "year": 2010} # ✅

# m["director"] = "Nolan" # ❌ 静态检查报错：Key "director" not found
```

**关键认知**：
`TypedDict` **仅仅是给静态检查工具看的**。在运行时，`m` 就是一个普通的字典，没有任何魔法，没有任何验证。如果你从 API 收到了一个缺字段的 JSON，程序依然会崩溃。我们将在第 9 章详细讨论这个**边界问题**。

## 3.5 ⚠️ 必修课：默认可变参数陷阱

这是每一个从 JS/TS 转到 Python 的开发者必踩的坑。**请背诵以下规则**。

**错误示范**：

```python
# ❌ 千万不要这样做！
def add_item(item: str, box: list[str] = []) -> list[str]:
    box.append(item)
    return box
```

当你调用这个函数时，奇怪的事情发生了：

```python
print(add_item("A"))  # 输出 ['A'] -> 正常
print(add_item("B"))  # 输出 ['A', 'B'] -> 😱 为什么 'A' 还在？！
```

**原因**：
Python 的函数默认参数是在**函数定义时（Compile/Definition Time）**创建的，而不是在**调用时（Call Time）**。
这意味着 `box=[]` 这个列表对象在内存里只有一份。所有使用默认参数的调用，都在共享同一个列表！

**📝 TS 对照**：
在 JS/TS 中，`function(box = [])` 每次调用都会创建一个新的空数组。但 Python 不是。

**正确写法 (The Idiomatic Way)**：
使用 `None` 作为哨兵。

```python
# ✅ 标准写法
def add_item(item: str, box: list[str] | None = None) -> list[str]:
    if box is None:
        box = []  # 每次调用时创建一个新列表
    box.append(item)
    return box
```

---

**本章小结**

我们掌握了 `list`, `tuple`, `dict`, `set` 四大容器的类型注解方法，体验了 Python 3.12 带来的 `type` 关键字的便利。最重要的是，我们排除了 Python 编程中最著名的地雷——**可变默认参数**。

1.  **List vs Tuple**: 可变 vs 不可变。
2.  **Dict**: 强大的 Hash Map，但注意内存成本。
3.  **TypedDict**: 定义 JSON 结构的轻量级方式。
4.  **陷阱**: 永远不要用可变对象（List/Dict）做默认参数。

掌握了容器，我们就有了处理数据集合的能力。接下来，我们需要学习如何优雅地处理这些容器。你是不是还在写 C 语言风格的 `for i in range(len(list))`？

下一章，我们将介绍 **Pythonic 之道**。推导式（Comprehensions）将彻底改变你遍历数据的方式。

> **思考题**：
> 我们刚才提到了 `dict` 的 Key 必须是“可哈希的 (Hashable)”。
> 尝试思考一下，为什么 `list` 不能作为字典的 Key，而 `tuple` 可以？如果在 TS 中，Map 的 Key 可以是数组吗？这背后反映了什么内存设计差异？
