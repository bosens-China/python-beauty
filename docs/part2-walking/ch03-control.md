# 如果世界可以分岔

> **“I leave to the various futures (not to all) my garden of forking paths.”**  
> **“我把我的小径分岔的花园留给数种（而非全部）未来。”**  
> — _豪尔赫·路易斯·博尔赫斯（Jorge Luis Borges），《小径分岔的花园》_

---

代码如果只是从第一行执行到最后一行，那它只是一个计算器。真正的智慧产生于“选择”。

当程序面对不同的数据、不同的输入时，它需要决定走向哪一条路径。在 Python 中，这种分岔的艺术不仅仅是 `if` 和 `else` 的堆砌，更包含了对“真与假”的独特理解，以及现代 Python 带来的结构化匹配之美。

## 直觉的流动：`if` 语句

Python 的 `if` 语句设计得像英语口语一样自然。没有包裹条件的圆括号，只有冒号和缩进。

```python
def check_temperature(temp: int) -> str:
    if temp < 0:
        return "Freezing"
    elif temp < 20:  # else if 简写为 elif
        return "Cold"
    else:
        return "Comfortable"
```

> 💡 **术语说明**：
>
> - `-> str` 是**类型注解**（Type Annotation），表示这个函数返回一个字符串。它不会影响程序运行，但能帮助开发者和工具（如编辑器、类型检查器）理解代码意图。
> - `elif` 是 “else if” 的缩写，用于链式判断多个条件。

这种设计让你在阅读代码时，视线可以顺畅地从上到下流动，不会被无意义的符号打断。

## 这里的“空”即是“假”

这是从 JavaScript/TypeScript 转到 Python 的开发者最容易摔跤的地方。

在 TypeScript 中，我们习惯了空数组 `[]` 和空对象 `{}` 是“真值”（Truthy）。如果不加检查地写 `if (array)`，可能会导致逻辑错误。

**但在 Python 中，容器的“空”状态，天然等同于“假”。**

Python 的真值测试（Truthiness）规则非常直观且统一：

- **False**: `None`, `False`, `0`, `0.0`
- **Empty**: `""`（空字符串）, `[]`（空列表）, `()`（空元组）, `{}`（空字典）, `set()`（空集合）
- **True**: 其他所有非空、非零的值

### Pythonic 的写法：隐式真值检查

利用这个特性，我们可以写出极其简洁的代码。

::: code-group

```python [✅ Pythonic 写法]
def process_users(users: list[str]):
    # 不需要写 if len(users) > 0:
    # 只要列表不为空，它就是 True
    if users:
        print(f"Processing {len(users)} users...")
    else:
        print("No users found.")
```

```python [❌ 冗余写法]
def process_users(users: list[str]):
    # 这种写法虽然没错，但在 Python 社区被认为是不够优雅的
    if len(users) > 0:
        print(f"Processing {len(users)} users...")
```

:::

::: warning ⚠ TS 开发者警示
在 JS/TS 中：`Boolean([]) === true`。  
在 Python 中：`bool([]) is False`。  
**切记：** 不要用 `if list_obj is not None` 来判断列表是否有内容，那只能判断对象是否存在，不能判断列表是否为空。直接用 `if list_obj:` 即可。
:::

## 现代分支：`match case`

在 Python 3.10 之前，我们处理复杂分支只能靠一连串的 `if-elif`。开发者们呼唤了多年的 `switch` 语句，终于在 3.10 版本以一种更强大的形态降临了：**结构化模式匹配（Structural Pattern Matching）**。

它不仅仅是 C 或 JavaScript 里的 `switch`（跳转），它是 **解构（Destructuring）** 与 **匹配（Matching）** 的结合体。你可以把它想象成 Rust 的 `match`。

> 💡 **注意**：`match-case` 仅在 Python 3.10 及以上版本可用。本书基于 Python 3.12，因此可以安全使用。

### 基础匹配：字面量

最简单的用法看起来像传统 `switch`：

```python
status = 404

match status:
    case 200:
        print("Success")
    case 400 | 404:  # 使用 | 匹配多个值
        print("Client Error")
    case 500:
        print("Server Error")
    case _:          # _ 是通配符，相当于 default
        print("Unknown")
```

> 💡 **语法说明**：
>
> - `case _` 是**通配模式**（wildcard pattern），匹配任何未被前面 case 捕获的值，类似于其他语言中的 `default`。
> - 多个值可以用 `|`（竖线）连接，表示“或”关系。

### 进阶匹配：解构数据的形状

`match` 的真正威力在于它可以深入数据内部，检查数据的**结构**，并顺手把里面的值提取出来赋给变量。

假设我们从 API 收到一个 JSON 数据，格式不确定：

```python
# data 可能是列表，包含不同的指令
data = ["move", 10, 20]

match data:
    # 匹配：长度为 3，第一个元素是 "move" 的列表
    # 同时将后两个元素绑定到 x 和 y 变量
    case ["move", x, y]:
        print(f"Moving to ({x}, {y})")

    # 匹配：长度为 2，第一个元素是 "shout"
    case ["shout", message]:
        print(f"Shouting: {message}")

    # 匹配：结构不对的其他情况
    case _:
        print("Invalid command")
```

这种写法比写一堆 `if isinstance(data, list) and len(data) == 3 and data[0] == "move"` 要优雅一万倍。

### 高阶匹配：类型与守卫

你甚至可以在匹配中加入类型检查和额外的逻辑判断（称为“守卫”，guard）。

```python
def handle_event(event: object):
    match event:
        # 匹配字典，且必须包含 "type": "click"
        # 同时提取 "x" 和 "y"，并要求它们是 int 类型
        case {"type": "click", "x": int(x), "y": int(y)} if x > 0 and y > 0:
            print(f"Clicked at positive coordinates: {x}, {y}")

        case {"type": "quit"}:
            print("Quitting app...")

        case _:
            print("Ignored event")
```

> 💡 **模式解释**：
>
> - `{"type": "click", "x": int(x), "y": int(y)}` 是一个**字典模式**，不仅要求键存在，还要求 `"x"` 和 `"y"` 的值是 `int` 类型，并自动将它们转换为变量 `x` 和 `y`。
> - `if x > 0 and y > 0` 是**守卫子句**，只有在模式匹配成功后，才会评估该条件。

::: info 📝 TS 开发者便签：Switch vs Match
JavaScript 的 `switch` 使用的是严格相等 `===` 比较，且有穿透（Fall-through）机制，必须写 `break`。

Python 的 `match`：

1. **没有穿透**：匹配到一个 case 后，执行完自动结束，不需要 `break`。
2. **模式匹配**：它比较的是数据的“形状”和“值”，而不是简单的相等。
   :::

## 赋值表达式：海象运算符 `:=`

在 Python 3.8 中，引入了一个长得像海象眼睛和长牙的运算符 `:=`，正式名称为**赋值表达式**（Assignment Expression）。它允许你在表达式内部进行赋值。

这在处理分支逻辑时非常有用，特别是当你需要“先计算一个值，然后用这个值做判断”时。

**传统写法（两行）：**

```python
import re

pattern = re.compile(r"(\d+)")
text = "The price is 100 dollars"

match = pattern.search(text)  # 先计算
if match:                     # 再判断
    print(f"Found: {match.group(1)}")
```

**海象写法（一行）：**

```python
# 在 if 条件里直接计算并赋值给 match
if match := pattern.search(text):
    print(f"Found: {match.group(1)}")
```

> 💡 **作用域说明**：  
> 使用 `:=` 赋值的变量（如 `match`）其作用域是**外层作用域**（这里是函数或模块级别），但仅在条件为真时才被创建。这种方式避免了在外部提前声明临时变量，使代码更紧凑。

这种写法让逻辑更加紧凑，减少了临时变量在外部作用域的泄露。

## 🧠 深度思考

> **既然 `match case` 这么强大，我们是否应该放弃 `if-elif`？**
>
> 比如下面这段代码，用哪种更好？
>
> ```python
> # 场景：判断分数等级
> score = 85
> ```
>
> ::: details 点击查看答案
> **对于简单的范围判断，`if` 依然是王者。**
>
> 如果你用 `match` 写范围判断，会显得很笨重：
>
> ```python
> match score:
>     case s if s >= 90: ...
>     case s if s >= 80: ...
> ```
>
> 这并不比 `if score >= 90:` 简洁。
>
> **黄金法则：**
>
> - 当你关心数据的**值范围**（大于、小于）时，用 `if`。
> - 当你关心数据的**结构**（列表还是字典？包含什么字段？）或**具体枚举值**时，用 `match`。
>   :::

## 本章小结

Python 的控制流工具箱虽然精简，但每一件工具都经过深思熟虑。

1. **真值测试**：记住 `if users:` 就能判断列表非空，这是 Python 的习惯法。
2. **`match case`**：这不是简单的 switch，这是用来解剖复杂数据结构的精密手术刀。
3. **`:=`（海象运算符）**：在判断的同时记住结果，保持代码的流动性。

掌握了如何做选择，接下来我们需要面对另一个常见的编程任务：**重复**。在 Python 中，循环不仅仅是 `for (i=0; i<n; i++)` 那么简单，它是一场关于“迭代器”的优雅舞蹈。
