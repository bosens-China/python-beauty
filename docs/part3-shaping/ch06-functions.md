# 封装思想：函数与契约

> **"Suit the action to the word, the word to the action."**  
> **“举止要配合言语，言语要配合举止。”**  
> — _威廉·莎士比亚，《哈姆雷特》_

---

如果说控制流是代码的骨架，那么函数就是代码的器官。

在 Python 中，函数不仅仅是“把重复代码包起来”那么简单。它是一种**契约（Contract）**。当你定义一个函数时，你实际上是在对调用者承诺：_“如果你给我这些输入（参数），我就承诺还给你那个输出（返回值）。”_

现代 Python 赋予了函数极大的表达力。通过类型注解和特殊的参数符号，我们可以把这份契约写得既清晰又灵活。

## 现代函数的解剖

让我们看一个标准的现代 Python 函数定义：

```python
def calculate_price(base: float, tax: float) -> float:
    """
    计算含税价格。
    """
    return base * (1 + tax)
```

这里有三个关键要素：

1. **`def`**：这是 Python 中定义函数的关键字，表示接下来是一个函数定义。
2. **类型注解**：`: float` 和 `-> float` 是**类型提示（Type Hints）**。它们不会影响程序运行（Python 仍然是动态类型语言），但能帮助开发者、编辑器和工具（如 mypy）理解函数期望的输入和输出类型。
3. **文档字符串（Docstring）**：紧跟在函数定义下方的三引号字符串，用于说明函数的功能、参数含义和返回值。这是良好编程习惯的重要组成部分。

> 💡 **零基础提示**：类型注解是 Python 3.5 引入的特性，在 Python 3.12 中已非常成熟。虽然不是强制要求，但在专业项目中强烈推荐使用，以提高代码可读性和可维护性。

## 参数的艺术：控制权

Python 的参数传递机制比许多其他语言更丰富。它允许你精确控制调用者**如何**传递参数，从而提升代码的清晰度和安全性。

### 1. 关键字参数：显式的优雅

在 Python 中，你可以按名称传递参数，而不必死记硬背参数的顺序。

```python
# 即使顺序反了也没关系，因为名字对上了
calculate_price(tax=0.1, base=100.0)
```

这不仅提高了可读性（一眼看出 `0.1` 是税率，`100.0` 是基础价格），还让代码在重构时更健壮——比如未来调整参数顺序也不会破坏调用代码。

### 2. 强制清晰：仅限关键字参数 (`*`)

有时候，函数的参数很多，如果调用者全都用位置传递（如 `func(1, True, 10, "high")`），代码将变得难以理解。

Python 允许你在参数列表中插入一个单独的 `*` 符号。**在 `*` 之后的所有参数，必须使用关键字形式传递。**

```python
# * 就像一道墙，挡住了位置参数
def connect(host: str, *, timeout: int = 30, ssl: bool = True):
    print(f"Connecting to {host}...")

# ✅ 正确：显式指定配置项
connect("localhost", timeout=10, ssl=False)

# ❌ 错误：Python 会报错，禁止这种含糊不清的调用
# connect("localhost", 10, False)  # TypeError!
```

这在设计公开 API 时极其有用。它强迫使用者写出 `timeout=10`，而不是扔给你一个莫名其妙的数字 `10`，大大提升了代码的自解释能力。

::: info 📝 TS 开发者便签：Config Object vs Kwargs
在 TypeScript/JavaScript 中，当参数很多时，我们习惯定义一个配置对象：

```typescript
// TypeScript
function connect(host: string, options: { timeout?: number; ssl?: boolean }) { ... }
connect("localhost", { timeout: 10 });
```

在 Python 中，**不需要**这样做。Python 原生支持关键字参数，这相当于语言层面内置了“配置对象”的能力，而且语法更简洁、调用更直接。
:::

### 3. 强制底层：仅限位置参数 (`/`)

既然有强制关键字参数，自然也有强制位置参数。符号 **`/`** 之前的参数，只能按位置传入，不能使用关键字形式。这通常用于那些参数名本身不重要、或出于兼容性考虑的场景（例如内置函数 `len(obj)` 中的 `obj`）。

```python
def length(obj: str, /) -> int:
    return len(obj)

length("hello")       # ✅ 正确：按位置传参
# length(obj="hello") # ❌ 错误：TypeError！'obj' 是仅限位置参数
```

> 💡 **零基础提示**：`/` 是 Python 3.8 引入的语法。大多数情况下你可能用不到它，但在阅读标准库源码时可能会遇到。

## 无限的灵活性：`*args` 与 `**kwargs`

这是阅读 Python 开源源码（如 Django、FastAPI、LangChain）的必修课。

- **`*args`**（Arguments）：收集所有未命名的**位置**参数，打包成一个 **元组（tuple）**。
- **`**kwargs`**（Keyword Arguments）：收集所有未命名的**关键字**参数，打包成一个 **字典（dict）\*\*。

它们常用于编写**装饰器**、**中间件**或需要将参数透传给其他函数的通用工具函数。

```python
def logger(func, *args, **kwargs):
    print(f"Calling {func.__name__} with args={args} and kwargs={kwargs}")
    return func(*args, **kwargs)
```

在这个例子中，`logger` 不关心 `func` 需要什么参数，它只是把收到的所有参数原样传递过去。

::: warning ⚠️ 类型注解的陷阱
为 `*args` 添加类型注解时，我们标注的是**每个元素**的类型，而不是整个元组的类型。

```python
# ✅ 正确：表示 args 中的每一个元素都是 int
def sum_all(*args: int) -> int:
    return sum(args)

# ❌ 错误：不要写成 tuple[int]，那样不符合 PEP 484 规范
```

对于 `**kwargs`，类型注解应使用 `str` 作为键（因为关键字参数名总是字符串），值的类型则根据实际情况指定：

```python
def process(**kwargs: str) -> None:  # 所有关键字参数的值都应为 str
    for k, v in kwargs.items():
        print(f"{k}: {v}")
```

:::

## 函数即对象：一等公民

在 Python 中，函数是**一等公民（First-class Citizen）**。这意味着函数可以像整数、字符串一样：

- 被赋值给变量
- 作为参数传递给其他函数
- 作为另一个函数的返回值
- 存储在数据结构中（如列表、字典）

为了在类型注解中描述“函数类型”，我们需要使用 `Callable`。

```python
from collections.abc import Callable

# 定义一个类型别名：Operation 表示一个接收两个 int 并返回 int 的函数
type Operation = Callable[[int, int], int]

def apply(x: int, y: int, func: Operation) -> int:
    return func(x, y)

def add(a: int, b: int) -> int:
    return a + b

result = apply(1, 2, add)  # 结果为 3
```

> 💡 **零基础提示**：`Callable[[A, B], R]` 的写法中，方括号内的 `[A, B]` 表示参数类型列表，`R` 表示返回值类型。这是 Python 类型系统中描述函数签名的标准方式。

### 简化的函数：Lambda

Python 也支持匿名函数，使用 `lambda` 关键字定义。但它比 JavaScript 的箭头函数功能更有限——**`lambda` 只能包含一个表达式，不能包含语句（如 `if`、`for`、赋值等）**。

```python
# ✅ 适合简短的逻辑，常用于高阶函数（如 sort, map, filter）
users.sort(key=lambda u: u.age)

# ❌ 复杂的逻辑请务必使用 def 定义具名函数，以保证可读性和可调试性
```

## 🧠 深度思考：最大的陷阱

> **如果在函数定义时，给参数设置一个可变对象（如列表）作为默认值，会发生什么？**
>
> ```python
> def add_item(item: str, box: list = []):
>     box.append(item)
>     return box
>
> print(add_item("A"))
> print(add_item("B"))
> ```
>
> ::: details 点击查看答案
> **这是一个经典陷阱，会导致意外的副作用。**
>
> 输出结果是：
>
> ```text
> ['A']
> ['A', 'B']  <-- 😱 为什么 A 还在？
> ```
>
> **原因**：Python 的默认参数值是在**函数定义时（Definition Time）** 创建并绑定的，而不是在**每次调用时（Call Time）**。这意味着 `box=[]` 这个空列表在内存中只创建了一次。所有未显式传入 `box` 的调用，都会共享同一个列表对象！
>
> **正确的写法（哨兵模式）**：
> 使用 `None` 作为默认值，并在函数内部进行初始化。
>
> ```python
> def add_item(item: str, box: list | None = None):
>     if box is None:
>         box = []  # 每次调用时创建一个新列表
>     box.append(item)
>     return box
> ```
>
> 这样，每次调用都会获得一个全新的列表，避免了状态污染。
> :::

## 本章小结

Python 的函数机制在显式与隐式之间找到了完美的平衡。

1. **契约**：使用类型注解和文档字符串明确函数的意图，让代码“自解释”。
2. **控制**：使用 `*` 强制关键字参数，提升调用代码的可读性和健壮性。
3. **灵活**：理解 `*args` 和 `**kwargs`，这是编写通用、可复用代码的基石。
4. **避坑**：永远不要用可变对象（如 `list`、`dict`）作为函数的默认参数值。

掌握了函数，我们就有了构建逻辑单元的能力。但如果有成千上万条数据需要处理，我们该把它们放在哪里？

下一章，我们将讨论 **容器（Containers）**。你会发现，Python 不仅仅有数组，它还有一套极具表现力的**推导式（Comprehensions）** 语法，能让你用一行代码完成复杂的数据转换。
