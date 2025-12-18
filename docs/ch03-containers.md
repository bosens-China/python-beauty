# 第 3 章：容器与泛型基础

> **"We mould clay into a pot, but it is the emptiness inside that makes the vessel useful."**
>
> **“我们要把黏土塑成器皿，但只有中间的空虚，才使器皿有了用处。”**
>
> — _老子，《道德经》第十一章_

---

容器的本质是“秩序”与“集合”。无论是排列有序的列表，还是基于哈希映射的字典，它们都是容纳数据的器皿。

在现代 Python (3.9+) 中，所有的标准容器类型（`list`, `dict`, `set`, `tuple`）都直接支持泛型语法 `[]`。而在 Python 3.12 中，我们更是迎来了全新的 `type` 关键字，让类型定义焕然一新。

## 3.1 列表 (list) 与 元组 (tuple)

这是最常见的两种序列。它们的区别不仅仅在于括号的形状（方括号 vs 圆括号），更在于**设计哲学**。

### 3.1.1 列表：动态的数组

列表是**可变**的（Mutable）。它的底层是一个动态数组（Dynamic Array），存放着指向对象的指针。

```python
# 定义一个字符串列表
users: list[str] = ["Alice", "Bob", "Charlie"]

users.append("Dave")  # ✅ 合法：O(1) 尾部追加
users.insert(0, "Zoe") # ⚠️ 合法：O(N) 头部插入，会导致所有元素后移，性能较差
users[0] = "Alex"     # ✅ 合法：修改元素
```

### 3.1.2 元组：不可变的契约（上一章答案揭晓）

还记得上一章的思考题吗？如何定义一个不可变的列表？答案就是 **元组 (tuple)**。

元组是**不可变**的（Immutable）。一旦创建，就不能修改（不能增加、删除、重新赋值）。

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

    _注意那个省略号 `...`，它是 Python 的合法语法，表示“后面还有任意个同类型元素”。_

::: info 📝 TS 开发者便签：Array 与 Tuple

- **List**: 对应 TS 的 `Array<T>` 或 `T[]`。
- **Tuple**: 对应 TS 的 Tuple `[number, number]`。
- **ReadonlyArray**: Python 的 `tuple[T, ...]` 在逻辑上等价于 TS 的 `readonly T[]`。

**关键区别**：
在 TS 中，`const arr = [1, 2]` 防止的是变量 `arr` 被重新赋值，但你依然可以 `arr.push(3)`。
在 Python 中，`tuple` 是真正的对象级别的不可变。你无法对元组调用 `push` (append) 或赋值操作，它是完全锁死的。
:::

## 3.2 字典 (dict) 与 集合 (set)：Hash 的代价

字典是 Python 的核心。它的查找速度极快（平均 O(1)），因为它是基于**哈希表 (Hash Map)** 实现的。

### 3.2.1 字典的使用与 Key 的限制

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

# ✅ 安全访问：.get() (类似 TS Optional Chaining，如果找不到返回默认值)
price = prices.get("orange", 0.0)
```

**关键概念**：字典的 Key 必须是 **可哈希的 (Hashable)**。
简单来说，**不可变的对象**（如 `int`, `str`, `tuple`）通常是可哈希的；而**可变的对象**（如 `list`, `dict`）是不可哈希的。

_（这就是为什么你不能用 list 做字典的 Key，这回答了本章开头思考题的一半。）_

### 3.2.2 性能直觉：O(1) 的代价

TS 开发者通常习惯随意创建对象。但在 Python 中，你需要意识到 `dict` 的创建是有成本的。

- **空间换时间**：为了保证 O(1) 的查找，哈希表必须预留比实际元素多得多的内存空间（稀疏数组），以减少哈希冲突。
- **Hash 计算**：每次插入或查找 Key，Python 都要计算 Key 的哈希值。

**心智模型**：
如果你的数据结构只有固定的几个字段（如 `x`, `y`），不要用 `dict`，请用 `class` 或 `dataclass`（我们后面会讲）。`dict` 适合存储**动态**的键值对。

### 3.2.3 集合 (set)

集合就是没有 Value 的字典。它用于**去重**和数学运算（交集 `&`、并集 `|`）。

```python
raw_data = ["apple", "banana", "apple", "orange"]
unique_tags: set[str] = set(raw_data) # 自动去重：{'banana', 'orange', 'apple'}

# 甚至可以转回来，这是一个非常 Pythonic 的去重写法：
deduplicated_list = list(set(raw_data))
```

## 3.3 现代类型别名：`type` 关键字 (Python 3.12+)

在 Python 3.12 之前，定义类型别名需要 `TypeAlias = ...`。现在，我们可以像 TS 一样直接使用 `type` 关键字。**这是 PEP 695 引入的重大更新。**

::: tip ✨ Python 3.12 新特性
如果你看过旧教程，可能会看到 `UserId = Union[int, str]`。现在，请拥抱新语法。
:::

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

普通的 `dict[str, Any]` 太宽泛了。Python 3.8+ 引入了 `TypedDict`，而在 3.11/3.12 中配合 `NotRequired` 更加完善。

```python
from typing import TypedDict, NotRequired

# 定义一个字典的"形状" (Schema)
class Movie(TypedDict):
    title: str
    year: int
    # NotRequired 类似 TS 的可选属性 ?:
    rating: NotRequired[float]

# 使用
m: Movie = {"title": "Inception", "year": 2010} # ✅ 合法

# m["director"] = "Nolan" # ❌ 静态检查报错：Key "director" not found
```

::: warning ⚠️ 运行时提醒
**关键认知**：`TypedDict` **仅仅是给静态检查工具（如 Pylance/MyPy）看的**。
在运行时，`m` 就是一个普通的字典，没有任何魔法，没有任何验证。如果你从 API 收到了一个缺字段的 JSON，程序依然会崩溃。我们将在第 9 章详细讨论这个**边界验证**问题。
:::

## 3.5 ☠️ 必修课：默认可变参数陷阱

这是每一个从 JS/TS 转到 Python 的开发者必踩的坑。**请背诵以下规则**。

### 错误示范

```python
# ❌ 千万不要这样做！
# 这里的 [] 是在函数定义时创建的，所有调用共享同一个列表！
def add_item(item: str, box: list[str] = []) -> list[str]:
    box.append(item)
    return box
```

当你调用这个函数时，奇怪的事情发生了：

```python
print(add_item("A"))  # 输出 ['A'] -> 正常
print(add_item("B"))  # 输出 ['A', 'B'] -> 😱 为什么 'A' 还在？！
```

### 原因解析

Python 的函数默认参数是在**函数定义时（Compile/Definition Time）**创建的，而不是在**调用时（Call Time）**。
这意味着 `box=[]` 这个列表对象在内存里**只有一份**。所有使用默认参数的调用，都在共享同一个列表！

### 正确写法 (The Idiomatic Way)

使用 `None` 作为哨兵（Sentinel Value）。

::: code-group

```python [正确写法]
# ✅ 标准写法
def add_item(item: str, box: list[str] | None = None) -> list[str]:
    # 如果 box 是 None，说明调用者没传参数，我们创建一个新的列表
    if box is None:
        box = []
    box.append(item)
    return box
```

:::

::: danger 🛑 永远记住
**永远不要**用可变对象（List, Dict, Set, 自定义对象）做默认参数。
始终使用 `None`，并在函数内部进行 `if is None` 检查。
:::

## 本章小结

我们掌握了 `list`, `tuple`, `dict`, `set` 四大容器的类型注解方法，体验了 Python 3.12 带来的 `type` 关键字的便利。最重要的是，我们排除了 Python 编程中最著名的地雷——**可变默认参数**。

1.  **List vs Tuple**: 可变 vs 不可变。
2.  **Dict**: 强大的 Hash Map，Key 必须可哈希。
3.  **TypedDict**: 定义 JSON 结构的轻量级方式。
4.  **陷阱**: 默认参数必须是不可变对象（如 `None`, `int`, `str`）。

掌握了容器，我们就有了处理数据集合的能力。接下来，我们需要学习如何优雅地处理这些容器。你是不是还在写 C 语言风格的 `for i in range(len(list))`？

下一章，我们将介绍 **Pythonic 之道**。推导式（Comprehensions）将彻底改变你遍历数据的方式。

::: tip 🧠 课后思考
我们刚才提到了 `dict` 的 Key 必须是“可哈希的 (Hashable)”。

- `list` 是可变的，所以不可哈希，不能做 Key。
- `tuple` 是不可变的，所以可哈希，**可以**做 Key。

**思考题**：如果在 TS/JS 中，`Map` 的 Key 可以是数组吗？

```javascript
const m = new Map();
m.set([1, 2], "value");
console.log(m.get([1, 2])); // 这里会输出什么？
```

这背后反映了 Python 和 JS 在对象同一性（Identity）判断上的什么差异？
:::
