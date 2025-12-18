# 第 2 章：变量与基本数据类型

> **"What's in a name? That which we call a rose By any other name would smell as sweet."**
>
> **“名字代表什么？我们所称的玫瑰，换个名字还是一样芳香。”**
>
> — _威廉·莎士比亚，《罗密欧与朱丽叶》 (William Shakespeare, Romeo and Juliet)_

---

在 Python 的世界里，变量只是对象的**标签（Label）**，而不是装对象的盒子。当我们加上类型注解时，我们实际上是在给这个标签贴上一张“使用说明书”，告诉阅读者和工具：这个标签应该贴在什么样的对象上。

本章我们将探索 Python 3.12+ 中的基础类型系统，你会发现，它比你想象的要严谨得多。

## 2.1 显式声明：名字与契约

在“旧时代”的 Python 教程中，变量定义通常是这样的：

```python
age = 18
name = "Alice"
```

这很方便，但在大型工程中，这往往是混乱的开始。

在**现代 Python** 中，我们推荐在关键位置（尤其是模块级变量或稍复杂的逻辑中）显式标注类型：

```python {2-4}
# 变量名: 类型 = 值
user_age: int = 18
user_name: str = "Alice"
is_active: bool = True
```

这看起来非常像 TypeScript，对吧？

::: tip 📏 命名规范（PEP 8）
Python 社区有着严格的命名规范，这与 JS/Java 的习惯差异很大，请务必建立新的肌肉记忆：

- **变量与函数**：使用 `snake_case`（全小写，下划线连接），如 `user_name`, `get_user_info`。
- **常量**：使用 `UPPER_CASE`（全大写，下划线连接），如 `MAX_RETRIES`。
- **类名**：使用 `PascalCase`（大驼峰），如 `UserProfile`。

_切记：在 Python 中使用 `camelCase`（小驼峰）定义变量会被视为异类。_
:::

## 2.2 四大基石：int, float, bool, str

Python 的基础类型非常精简，但功能强大。

### 2.2.1 整数 (int) —— 没有尽头的数字

不同于 JS 的 `number` (本质是双精度浮点数) 或 Java 的 `int` (32 位)，Python 的 `int` 是**任意精度**的。

```python
# 这在 JS 中会溢出或丢失精度，但在 Python 中完全正常
big_num: int = 99999999999999999999999999 + 1
```

这意味着你永远不需要担心整数溢出（只要内存够用），这对于处理金融数据或大数运算非常友好。

### 2.2.2 浮点数 (float)

Python 的 `float` 对应 C 语言的 `double`，即双精度浮点数。

```python
pi: float = 3.14159
```

### 2.2.3 布尔值 (bool)

注意大小写！Python 的布尔值是 **`True`** 和 **`False`**。

```python
is_valid: bool = True  # ✅ 正确
# is_valid: bool = true  # ❌ 错误！Python 不认识小写的 true
```

::: details 🔍 冷知识：布尔值其实是整数
在 Python 中，`bool` 实际上是 `int` 的子类。
这意味着 `True == 1` 和 `False == 0` 是成立的。虽然解释器允许你这么做，但在工程代码中，**请不要**把布尔值当数字参与运算，这会严重破坏代码的可读性。
:::

### 2.2.4 字符串 (str)

Python 的字符串是 Unicode 的，支持各种表情符号和多语言。

```python
welcome: str = "你好，Python 🐍"
```

## 2.3 核心直觉：变量是指针，不是盒子

这是 Python 最重要的心智模型。

- 在 C 语言中，`int a = 1` 意味着在内存中开辟了一个叫 `a` 的盒子，里面放了 `1`。
- 在 Python 中，`a = 1` 意味着：
  1.  在内存中创建一个对象 `1`。
  2.  拿一个叫 `a` 的**便利贴（标签）**，贴在对象 `1` 上。

我们来看一个例子：

```python {5}
a = [1, 2, 3]
b = a  # 并不是复制列表，而是把标签 b 也贴在同一个对象上

b.append(4)

print(a) # 输出 [1, 2, 3, 4] -> a 也变了！
```

::: info 📝 TS 开发者便签：Reference
这与 JS/TS 中的对象引用（Reference）逻辑是一模一样的。
区别在于：在 Python 中，**一切皆对象**。哪怕是 `int` 也是对象。

只是因为 `int`, `str`, `bool` 是**不可变对象 (Immutable)**，所以你无法修改它们内部的值，看起来像是在“传值”。但本质上，它们依然是引用传递。
:::

## 2.4 联合类型 (Union Types) —— “或”的艺术

在 Python 3.10 之前，我们需要 `from typing import Union`。
但在 Python 3.12+ 中，我们拥有了与 TS 一样优雅的管道符 `|`。

```python
def parse_id(uid: int | str) -> int:
    """uid 可以是整数，也可以是字符串"""
    if isinstance(uid, str):
        # 在这个 if 块里，pyright/mypy 知道 uid 肯定是 str
        return int(uid)
    return uid
```

这种 `TypeA | TypeB` 的语法是现代 Python 的标志之一，极大提升了代码的简洁度。

## 2.5 字面量类型 (Literal) —— 值的约束

有时候，我们需要的不仅仅是 `str`，而是“特定的几个字符串之一”。这对应 TS 的 String Literal Types。

```python
from typing import Literal

# 定义一个类型别名（Type Alias）
Mode = Literal['read', 'write', 'append']

def open_file(filename: str, mode: Mode) -> None:
    pass

open_file("data.txt", "read")   # ✅ 类型检查通过
open_file("data.txt", "delete") # ❌ 类型检查报错：Expected "read" | "write" | "append"
```

这在配置项、状态机定义中极其有用，能有效防止“魔术字符串”带来的拼写错误。

## 2.6 📝 TS 开发者便签：那些“似是而非”的陷阱

作为 TS 开发者，转到 Python 时最容易在以下三个地方栽跟头：

### 1. `None` vs `null` / `undefined`

这是最大的痛点。

- **TypeScript**: 有 `null`（空值）和 `undefined`（未定义）。
- **Python**: 只有 **`None`**。

Python 没有 `undefined` 这个概念。

- 如果你访问一个没定义的变量 -> 抛出 `NameError`（运行时错误）。
- 如果你访问字典里不存在的 key -> 抛出 `KeyError`。
- 如果你定义函数没写返回值 -> 默认返回 `None`。

::: warning ⚠️ 警示
不要试图在 Python 中寻找 `undefined` 的对应物。如果一个变量可能没有值，请使用 `Type | None`。
:::

### 2. 上一章思考题揭秘：类型推断 (Type Inference)

回答上一章的思考题：**Python 的推断更宽泛**。

- **TS**: `const x = "hello"` 会将类型推断为字面量 `"hello"`。
- **Python**: `x = "hello"` 会将类型推断为 `str`。

Python 的类型推断通常比较“保守”和“宽泛”。它通常**不会**自动推断为 Literal 类型，除非你显式标注。

::: details 💡 如何实现 const 的效果？
如果你想达到 TS `const` 的效果（即锁定值为字面量类型），需要引入 `Final`：

```python
from typing import Final

y: Final = "hello"
# 现在 y 被视为字面量 "hello"，且静态检查器禁止重新赋值
```

:::

### 3. 真值检查 (Truthiness) —— 最大的坑

在 TS 中，`if (variable)` 很常见。Python 也可以这样：

```python
name = ""
if name:
    print("Has name")
else:
    print("Empty") # 会执行这里
```

**但是，请注意空容器的行为！**

| 类型        | 值                | Python 中的真值 (bool) | JS/TS 中的真值 |
| :---------- | :---------------- | :--------------------- | :------------- |
| String      | `""` (空字符串)   | `False`                | `false`        |
| Number      | `0`               | `False`                | `false`        |
| List/Array  | **`[]` (空列表)** | **`False`** 🔴         | **`true`** 🟢  |
| Dict/Object | **`{}` (空字典)** | **`False`** 🔴         | **`true`** 🟢  |
| None/null   | `None`            | `False`                | `false`        |

::: danger 🛑 严重警告
在 JS 中，`if ([])` 是 `true`。
在 Python 中，`if []` 是 **`False`**。
这是一个巨大的思维陷阱，判断列表是否为空时，Python 程序员习惯直接写 `if my_list:`，请务必适应这一点。
:::

## 本章小结

我们学习了 Python 的四大基石类型，掌握了如何用 `name: type` 显式定义变量，并理解了“变量是便利贴”这一核心内存模型。

你可能已经注意到了，我们提到了 `list` 和 `dict`。在 Python 中，这些容器的可变性（Mutability）是一个巨大的坑，尤其是当它们作为函数默认参数时。

下一章，我们将深入 **容器与泛型**，并揭示那个让无数新手（甚至老手）深夜痛哭的“默认参数陷阱”。

::: tip 🧠 课后思考
在 TS 中，`const list = [1, 2]`，你依然可以 `list.push(3)`，因为 const 只保护引用。
在 Python 中，我们要如何定义一个**真正不可变**的列表（即不能修改元素，也不能增加删除，连引用内容都锁死）？

**提示**：它不是 `list`，而是另一种基础数据结构。
:::
