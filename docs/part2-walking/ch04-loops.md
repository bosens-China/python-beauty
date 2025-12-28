# 重复，但不乏味

> **“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”**  
> **“重复的行为造就了我们。因此，卓越不是一种行为，而是一种习惯。”**  
> — _亚里士多德（Aristotle）_

---

计算机最擅长的事情就是重复。但在 Python 中，重复不仅仅是机械的计数。

在 C 语言或早期的 JavaScript 中，循环往往意味着你需要充当一个“步数计算器”：你需要维护一个索引变量 `i`，检查它是否越界，然后手动去数组里取值。

Python 拒绝这种机械劳动。在 Python 中，我们不遍历“数字”，而是直接遍历“事物”本身。

## 忘掉索引：`for` 循环

如果你想打印列表里的每一个名字，请**不要**这样做：

::: code-group

```python [❌ C 风格写法]
names = ["Alice", "Bob", "Charlie"]

# 这种写法在 Python 中被称为 "Unpythonic"
# 你不得不手动管理索引 i，既啰嗦又容易出错
for i in range(len(names)):
    print(names[i])
```

```python [✅ Pythonic 写法]
names = ["Alice", "Bob", "Charlie"]

# 直接遍历元素本身
# 读起来就像英语："For name in names..."
for name in names:
    print(name)
```

:::

这就是 Python 的 **迭代器协议 (Iterator Protocol)**。任何“容器”（如列表、字符串、字典、文件等）都知道如何把自己的内容一个接一个地交出来。你不需要关心它底层是数组还是链表，也不需要关心它有多长。

> 💡 **零基础提示**：  
> 在 Python 中，像列表 `["Alice", "Bob"]`、字符串 `"hello"`、甚至打开的文件对象，都可以被 `for` 循环直接使用。这类对象统称为“可迭代对象”（iterable）。当你写 `for x in obj` 时，Python 会自动调用该对象的迭代机制，逐个取出其中的元素。

::: info 📝 TS 开发者便签：`for...of` vs `for...in`
这是一个常见的命名陷阱：

- **TypeScript/JavaScript**:
  - `for (const item of items)` 遍历**值**；
  - `for (const key in items)` 遍历**键**（属性名）。
- **Python**:
  - `for item in items` 遍历的是**值**。

也就是说，Python 的 `in` 关键字在 `for` 循环中的语义，对应的是 TypeScript 中的 `of`。请务必建立新的肌肉记忆。
:::

## 优雅的伴侣：`enumerate` 与 `zip`

### “但我有时候确实需要索引怎么办？”

比如，你想打印：

```
1. Alice
2. Bob
3. Charlie
```

新手往往会退回到 `range(len(names))` 的老路上。但在 Python 中，我们有更优雅的工具：**`enumerate()` 函数**。

### `enumerate`：同时获取索引和值

```python
names = ["Alice", "Bob", "Charlie"]

# enumerate() 返回一个可迭代对象，
# 每次生成一个 (index, value) 形式的元组
# start=1 表示索引从 1 开始（默认从 0 开始）
for i, name in enumerate(names, start=1):
    print(f"{i}. {name}")
```

> 💡 **零基础提示**：  
> `enumerate()` 是 Python 内置函数，用于在遍历时同时获得元素的索引和值。它返回的是一个“枚举对象”，只能遍历一次。通过 `for i, name in ...` 的写法，Python 会自动将每个 `(index, value)` 元组“解包”（unpack）为两个变量 `i` 和 `name`。

### `zip`：并行迭代多个序列

如果你有两个相关的列表，比如“名字”和“分数”，想把它们一一对应地处理？

在 C 或 JavaScript 中，你通常需要用同一个索引 `i` 去分别访问两个数组。  
而在 Python 中，你可以像拉拉链（Zipper）一样，把多个序列“拉”在一起。

```python
names = ["Alice", "Bob", "Charlie"]
scores = [95, 88, 72]

# zip() 将多个可迭代对象“配对”，生成元组序列：
# ("Alice", 95), ("Bob", 88), ("Charlie", 72)
# strict=True（Python 3.10+）确保所有输入长度一致，否则抛出 ValueError
for name, score in zip(names, scores, strict=True):
    print(f"{name}: {score}")
```

> 💡 **零基础提示**：  
> `zip()` 也是 Python 的内置函数。它接收任意多个可迭代对象，并将它们“按位置打包”成元组。如果各序列长度不同，默认以最短的为准（除非使用 `strict=True`）。例如：
>
> ```python
> list(zip([1, 2], ['a', 'b', 'c']))  # 结果是 [(1, 'a'), (2, 'b')]
> ```

## 不确定的重复：`while` 循环

`for` 循环适用于遍历已知的集合，而 `while` 循环用于处理“只要某个条件成立就继续”的场景。

Python 的 `while` 语法与其他主流语言类似：

```python
count = 3
while count > 0:
    print(f"Countdown: {count}")
    count -= 1  # 每次循环后将 count 减 1
```

### 配合海象运算符 `:=`

还记得上一章介绍的“海象运算符”（walrus operator）`:=` 吗？它在 `while` 循环中特别有用，尤其是在读取数据流（如文件、网络）时。

传统写法往往需要先读一次数据，再在循环体内重复读取，或者使用 `while True` 加 `break`。而使用 `:=` 可以让代码更简洁：

```python
# 假设 socket 是一个已打开的网络连接
# 每次读取最多 1024 字节的数据
while (chunk := socket.read(1024)):
    process(chunk)
# 当 chunk 为空字节串 b''（在布尔上下文中为 False）时，循环结束
```

> 💡 **零基础提示**：  
> 海象运算符 `:=` 允许你在表达式内部进行赋值。上面的 `while (chunk := ...)` 会在每次循环开始时先执行 `socket.read(1024)`，将结果赋给 `chunk`，然后判断 `chunk` 是否为真值（非空）。这避免了重复代码，也减少了出错可能。

## 奇特但实用：循环的 `else` 子句

这是 Python 循环中最独特、也最容易被误解的特性之一：**`for` 和 `while` 循环后面可以跟一个 `else` 块**。

这里的 `else` **不是**“如果循环没执行”的意思，而是表示：**“如果循环正常结束（即没有被 `break` 语句打断）”**。

这个特性常用于“搜索”或“查找”场景：

```python
def find_user(users: list[str], target: str) -> None:
    for user in users:
        if user == target:
            print("Found it!")
            break  # 找到目标，提前退出循环
    else:
        # 只有当循环完整运行完毕（未触发 break）时，才执行这里
        print("User not found.")
```

> 💡 **零基础提示**：  
> 函数定义中的 `-> None` 是**类型注解**（type hint），表示该函数不返回任何有意义的值（即返回 `None`）。这是 Python 3.5+ 引入的可选语法，用于提高代码可读性和工具支持（如 IDE 提示、类型检查器）。它不影响程序运行。

这种写法避免了引入额外的标志变量（如 `found = False`），使逻辑更清晰紧凑。

## 🧠 深度思考：一边遍历，一边修改？

> **问题**：一边遍历列表，一边修改它，会发生什么？  
> 试着运行以下代码，目的是删除列表中的所有偶数：
>
> ```python
> numbers = [1, 2, 3, 4, 5, 6]
> for n in numbers:
>     if n % 2 == 0:
>         numbers.remove(n)
> print(numbers)
> ```
>
> **结果符合预期吗？**
>
> ::: details 点击查看答案
> **结果是错的！** 实际输出可能是 `[1, 3, 5]`，但某些情况下会漏删元素（例如如果列表是 `[2, 4, 6]`，可能只删掉部分）。
>
> **原因**：`for` 循环在内部使用一个隐式的索引来跟踪当前位置。当你调用 `numbers.remove(n)` 删除一个元素后，列表中后续的元素会向前移动填补空缺。而循环的索引仍然递增，导致跳过下一个元素。
>
> **正确做法**：永远不要在迭代一个可变对象（如列表）的同时修改它。推荐以下两种方式：
>
> ```python
> # 方案 A：迭代列表的副本（使用切片 [:] 创建浅拷贝）
> for n in numbers[:]:
>     if n % 2 == 0:
>         numbers.remove(n)
>
> # 方案 B：使用列表推导式生成新列表（更 Pythonic，推荐）
> numbers = [n for n in numbers if n % 2 != 0]
> ```
>
> 列表推导式 `[n for n in numbers if ...]` 是 Python 中创建新列表的惯用方式，简洁且高效。
> :::

## 本章小结

Python 的循环设计强调**声明式编程**：你只需说明“要对每个元素做什么”，而不必操心“如何一步步访问它们”。

核心要点如下：

1. **优先直接迭代**：使用 `for item in items`，而不是通过索引访问。
2. **善用内置工具**：
   - 需要索引？用 `enumerate(items, start=1)`。
   - 需要并行处理多个序列？用 `zip(a, b, strict=True)`。
3. **理解循环的 `else`**：它在循环**未被 `break` 中断**时执行，非常适合查找类逻辑。
4. **避免边遍历边修改**：应迭代副本或使用推导式构建新列表。

掌握了这些循环技巧，你就掌握了处理批量数据的基本节奏。但现实世界充满不确定性——文件可能打不开，网络可能中断，用户可能输错数据。

那么，当意外发生时，Python 如何应对？

下一章，我们将探讨 Python 的**异常处理机制**。你会发现，在 Python 的哲学中，“请求原谅比请求许可更容易”（EAFP: Easier to Ask for Forgiveness than Permission）——这是一种与众不同的容错智慧。
