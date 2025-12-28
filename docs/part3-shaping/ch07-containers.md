# 盛放数据：容器与推导式

> **"We mould clay into a pot, but it is the emptiness inside that makes the vessel useful."**  
> **“我们要把黏土塑成器皿，但只有中间的空虚，才使器皿有了用处。”**  
> — _老子，《道德经》第十一章_

---

程序不仅仅是逻辑的流动，更是数据的载体。

如果说变量是贴在物品上的标签，那么**容器（Containers）**就是货架、仓库和展示台——它们用来组织、存储和操作多个数据项。Python 提供了一套非常精简但极其强大的内置容器类型：**列表（list）**、**元组（tuple）**、**字典（dict）** 和 **集合（set）**。

更重要的是，Python 提供了一种像写数学公式一样优雅的方式来处理这些数据，我们称之为 **“推导式（Comprehensions）”**。

> 💡 **提示**：本章中首次出现的语法或概念（如类型注解 `list[str]`）会附带简要说明，帮助零基础读者理解。

## 序列的双子星：List 与 Tuple

在 Python 中，处理有序数据最常用的两种结构是**列表（list）**和**元组（tuple）**。它们的区别不仅仅在于括号的形状（`[]` vs `()`），更在于设计哲学：一个强调**可变性**，一个强调**不可变性**。

### 1. 列表 (list)：动态的数组

列表是**可变的（Mutable）**，意味着你可以在创建后修改它的内容：添加、删除或更改元素。

```python
# 定义一个字符串列表
# 类型注解 `list[str]` 表示：这是一个包含字符串的列表
users: list[str] = ["Alice", "Bob"]

users.append("Charlie")  # ✅ 在末尾追加新元素
users[0] = "Alex"        # ✅ 修改第一个元素
```

> 📘 **什么是类型注解？**  
> `users: list[str]` 中的 `: list[str]` 是**类型注解（Type Annotation）**，它告诉开发者（和工具）这个变量预期存储什么类型的数据。它不会影响程序运行，但能提升代码可读性和开发体验。这是 Python 3.5+ 引入的特性，在本书中广泛使用以增强清晰度。

### 2. 元组 (tuple)：不可变的契约

元组是**不可变的（Immutable）**。一旦创建，其内容无法被修改——不能添加、删除或替换元素。

元组有两种典型用途：

#### (1) 作为“不可变的列表”

当你有一组固定不变的数据时，使用元组更安全、更高效。

```python
# 类型注解 `tuple[int, ...]` 表示：这是一个包含任意数量整数的元组
numbers: tuple[int, ...] = (1, 2, 3, 4, 5)
# numbers[0] = 10  ❌ 报错！元组不支持赋值
```

> 📘 **`...` 在类型注解中的含义**  
> 在 `tuple[int, ...]` 中，`...` 表示“任意数量”，即该元组可以包含任意多个 `int` 类型的元素。这是 Python 类型系统中的标准写法。

#### (2) 作为“轻量级的结构体（Struct）”

元组常用于表示具有固定字段的简单记录，比如坐标点、RGB 颜色等。

```python
# 明确指定：第一个元素是 x 坐标（int），第二个是 y 坐标（int）
point: tuple[int, int] = (10, 20)

x, y = point  # ✅ 解包（unpacking）：将元组拆分为多个变量
```

::: info 📝 给 TypeScript 开发者的便签：Array vs Tuple

- **Python 的 `list`** ≈ TypeScript 的 `T[]` 或 `Array<T>`
- **Python 的 `tuple`** ≈ TypeScript 的 `[number, string]` 这类固定长度元组
- **关键区别**：在 TS 中，`const arr = []` 只是防止变量重新赋值，但你仍可调用 `arr.push()`；而在 Python 中，`tuple` 是**对象级别的不可变**——你根本无法调用 `append` 方法，因为该方法不存在。
  :::

## 映射的核心：Dict 与 Set

除了序列（按顺序存储），Python 还提供了基于“键值对”或“唯一元素”的容器。

### 1. 字典 (dict)：哈希表的魔法

字典（dictionary）是 Python 最核心的数据结构之一。它通过**键（key）**快速查找对应的**值（value）**，底层基于**哈希表（Hash Table）**实现，平均查找时间复杂度为 O(1)。

```python
# 类型注解 `dict[str, float]`：键是字符串，值是浮点数
prices: dict[str, float] = {
    "apple": 1.5,
    "banana": 0.8
}

# 通过键访问值
print(prices["apple"])  # 输出: 1.5

# ✅ 安全访问：使用 .get() 方法，避免 KeyError
price = prices.get("orange", 0.0)  # 若 "orange" 不存在，返回默认值 0.0
```

> ⚠️ **重要限制：字典的键必须是可哈希的（Hashable）**  
> “可哈希”意味着该对象在其生命周期内具有**不变的哈希值**，且能与其他对象进行相等比较。
>
> - **可哈希的对象**：`int`, `str`, `tuple`（前提是其内部元素也都是可哈希的）
> - **不可哈希的对象**：`list`, `dict`, `set`（因为它们是可变的）  
>   因此，你**不能**用列表作为字典的键：
>
> ```python
> d = {[1, 2]: "value"}  # ❌ TypeError: unhashable type: 'list'
> ```

### 2. 集合 (set)：去重的利器

集合（set）是一个**无序、不重复**的元素集合。你可以把它看作“只有键、没有值的字典”。

```python
tags = ["python", "code", "python", "code"]
unique_tags: set[str] = set(tags)  # 自动去重 → {'python', 'code'}

# 支持数学集合运算
a = {1, 2, 3}
b = {2, 3, 4}
print(a & b)  # 交集 → {2, 3}
print(a | b)  # 并集 → {1, 2, 3, 4}
print(a - b)  # 差集 → {1}
```

> 💡 **注意**：集合中的元素也必须是**可哈希的**，原因同字典的键。

## Pythonic 之道：推导式 (Comprehensions)

如果你还在用传统的 `for` 循环来构建新列表，那么请尝试**推导式**——它是 Python 最具表现力的特性之一。

### 列表推导式

假设我们要从一个数字列表中筛选出偶数，并计算它们的平方。

::: code-group

```python [传统 for 循环]
numbers = [1, 2, 3, 4, 5]
result = []

for n in numbers:
    if n % 2 == 0:
        result.append(n * n)
```

```python [列表推导式]
numbers = [1, 2, 3, 4, 5]

# 语法：[表达式 for 变量 in 容器 if 条件]
# 读作：“n 的平方，对于 numbers 中的每个 n，如果 n 是偶数”
result = [n * n for n in numbers if n % 2 == 0]
```

:::

这不仅是语法糖，推导式在 CPython 解释器中经过高度优化，通常比手写的循环**更快、更简洁**。

::: info 📝 给 TypeScript 开发者的便签：Map & Filter

- **TS/JS**: `numbers.filter(n => n % 2 === 0).map(n => n * n)`
- **Python**: `[n * n for n in numbers if n % 2 == 0]`

虽然 Python 也有 `map()` 和 `filter()` 函数，但在 Python 社区，**推导式是首选**，因为它更易读（无需 lambda 表达式），且性能更好。
:::

### 字典推导式

同样的思想可用于构建字典：

```python
users = [("Alice", 101), ("Bob", 102)]

# 构建 name → id 的映射
name_to_id = {name: uid for name, uid in users}
# 结果: {'Alice': 101, 'Bob': 102}
```

### 集合推导式

也可以用于构建集合：

```python
words = ["hello", "world", "hello"]
unique_lengths = {len(word) for word in words}  # {5} （因为两个单词长度都是 5）
```

## 内存的救星：生成器表达式

推导式虽好，但它有一个缺点：**渴望执行（Eager Evaluation）**。  
例如，`[x for x in range(10_000_000)]` 会立即在内存中创建一千万个整数，可能导致内存溢出。

如果你只是想遍历数据或进行流式处理，可以使用**生成器表达式（Generator Expression）**：只需将列表推导式的**方括号 `[]` 换成圆括号 `()`**。

```python
from collections.abc import Iterator

# 创建一个生成器对象，不立即计算任何值
large_stream: Iterator[int] = (x * x for x in range(1_000_000))

# 只有在遍历时才逐个生成数据
total = sum(large_stream)  # 内存占用极小，即使处理十亿项
```

> 📘 **什么是生成器？**  
> 生成器是一种**惰性求值（Lazy Evaluation）**的迭代器。它不会一次性生成所有数据，而是在每次请求时“按需生产”下一个值。这使得它非常适合处理大数据流（如日志文件、数据库查询结果等）。

## 🧠 深度思考

> **我们在前面提到：字典的 Key 必须是可哈希的。**
>
> 1. `list` 是可变的 → 不可哈希 → **不能**做 Key。
> 2. `tuple` 是不可变的 → 可哈希 → **可以**做 Key。
>
> **思考题**：在 JavaScript / TypeScript 中，`Map` 的 Key 可以是数组吗？
>
> ```javascript
> const m = new Map();
> m.set([1, 2], "value");
> console.log(m.get([1, 2])); // 输出什么？
> ```
>
> ::: details 点击查看答案
> **输出 `undefined`。**  
> 因为在 JS 中，`[1, 2]` 每次都创建一个**新的数组对象**，即使内容相同，它们的**引用地址也不同**。JS 的 `Map` 使用**引用相等**来比较键。
>
> **但在 Python 中：**
>
> ```python
> m = {}
> m[(1, 2)] = "value"
> print(m[(1, 2)])  # 输出 "value"
> ```
>
> Python 的元组作为字典键时，比较的是**值的内容**而非对象身份。只要两个元组内容相同，它们的哈希值就相同，因此能正确匹配。这使得用 `(x, y)` 坐标作为键在网格、棋盘等场景中非常自然。
> :::

## 本章小结

Python 的容器不仅是存储数据的工具，更是**表达数据结构语义**的方式：

1. **List vs Tuple**

   - 用 `list` 存储**同类型、可变**的序列（如用户列表）。
   - 用 `tuple` 表示**固定结构、不可变**的记录（如坐标、RGB 值）。

2. **Dict**

   - Python 的基石，用于快速查找。
   - 键必须是**可哈希的**，常用 `tuple` 作为复合键（如 `(x, y)`）。

3. **Set**

   - 自动去重，支持集合运算，适用于成员检测和去重场景。

4. **推导式**

   - 用声明式语法替代循环，更清晰、更高效。
   - 包括列表、字典、集合三种推导式。

5. **生成器表达式**
   - 用 `(...)` 替代 `[...]`，实现**惰性求值**，节省内存。
   - 是处理大规模数据流的关键技术。

至此，我们已经掌握了 Python 的**基础语法**、**控制流程**和**核心数据结构**，足以编写实用的小型脚本和程序。

然而，当项目规模扩大到数千行代码时，仅靠函数和容器已难以维持清晰的结构。我们需要更高层次的抽象机制。

下一章，我们将进入 **“第四部：抽象”**，深入探讨 **面向对象编程（OOP）**，并了解 Python 如何通过独特的“魔术方法（Magic Methods）”让对象具备丰富的行为。
