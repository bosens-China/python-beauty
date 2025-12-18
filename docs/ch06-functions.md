# 第 6 章：函数 —— 代码的契约

> **"Suit the action to the word, the word to the action."**
>
> **“举止要配合言语，言语要配合举止。”**
>
> — _威廉·莎士比亚，《哈姆雷特》 (William Shakespeare, Hamlet)_

---

在现代 Python 中，函数不仅仅是逻辑的容器，更是**契约（Contract）**。函数签名（Signature）明确告诉调用者：给我这个类型的数据，我承诺还给你那个类型的结果。

对于 TypeScript 开发者来说，Python 的函数定义看起来很简单（`def` 一把梭），但实际上 Python 的参数传递机制比 JS/TS 更加灵活，也隐藏着更多细节。特别是“仅限关键字参数”和“运行时类型失效”的特性，是阅读 Python 开源代码必须掌握的硬核知识。

## 6.1 解剖现代函数：`/` 与 `*` 的参数控制

让我们定义一个标准的现代 Python 函数。

```python {3,5}
def calculate_price(
    base: float,
    tax_rate: float = 0.1,
    *,  # 这是一个特殊的分隔符
    discount: float = 0.0
) -> float:
    """
    计算最终价格。
    :param discount: 折扣金额 (仅限关键字传参)
    """
    return (base * (1 + tax_rate)) - discount
```

你可能在开源库中看到过 `*` 甚至 `/` 这样的符号出现在参数列表中。这是 Python 3.8+ 引入的**参数种类限制符**，用于严格控制调用者如何传递参数。

### 6.1.1 仅限关键字参数 (Keyword-Only Arguments, `*`)

在 `*` 之后的参数，**必须**使用 `key=value` 的形式调用。这就像是一个“路障”，阻止了位置参数的通过。

```python
# 定义：host 随便传，但 timeout 和 ssl 必须显式指定键名
def connect(host: str, *, timeout: int = 30, ssl: bool = True) -> None:
    print(f"Connecting to {host}...")

# ✅ 正确调用
connect("localhost", timeout=10, ssl=False)

# ❌ 错误调用：Python 会报错，因为 timeout 和 ssl 被强制要求为关键字参数
# connect("localhost", 10, False)
# TypeError: connect() takes 1 positional argument but 3 were given
```

**为什么要这么做？**
这在布尔值参数多的情况下极大地提高了代码可读性。对比 `connect("db", 10, True)` 和 `connect("db", timeout=10, ssl=True)`，后者的含义一目了然，且防止了参数位置传错。

### 6.1.2 仅限位置参数 (Positional-Only Arguments, `/`)

在 `/` 之前的参数，**只能**按位置传，不能用 `key=value`。这通常用于底层 C 扩展库或参数名并不重要的场景（如 `len(obj)`）。

```python
def length(obj: str, /) -> int:
    return len(obj)

length("hello")       # ✅
# length(obj="hello") # ❌ TypeError
```

::: info 📝 TS 开发者便签：Config Object vs Kwargs

- **TypeScript 习惯**: 由于 JS 历史原因，当参数很多时，通常习惯定义一个“配置对象”：
  ```typescript
  function connect(config: { host: string; timeout?: number }) { ... }
  connect({ host: "localhost", timeout: 10 });
  ```
- **Python 习惯**: Python **原生支持**关键字传参，不需要把它包裹在字典里！
  `python
def connect(host: str, timeout: int = 10): ...
connect(host="localhost", timeout=10)
`
  这是 Python 代码整洁的关键。不要在 Python 里模仿 JS 传一个 `config` 字典，除非那个配置真的非常庞大。
  :::

## 6.2 动态参数：`*args` 与 `**kwargs`

这是阅读源码的必修课，也是类型注解容易出错的地方。

- `*args`: 收集所有未命名的**位置**参数，打包成一个 **元组 (tuple)**。
- `**kwargs`: 收集所有未命名的**关键字**参数，打包成一个 **字典 (dict)**。

### 类型注解的陷阱

**请注意**：我们在注解 `*args` 和 `**kwargs` 时，标注的是**内部元素**的类型，而不是容器本身的类型。

```python
# ❌ 错误理解：args 是 tuple，所以写 tuple[int]？不对！
# ✅ 正确理解：args 里的每一个元素都是 int
def sum_all(*args: int) -> int:
    # args 在函数内部的实际类型是 tuple[int, ...]
    return sum(args)

sum_all(1, 2, 3) # ✅
```

```python
# ✅ kwargs 里的每一个 Value 都是 str (Key 永远是 str，不用注)
def build_tags(**kwargs: str) -> None:
    # kwargs 在函数内部的实际类型是 dict[str, str]
    for key, value in kwargs.items():
        print(f"Attribute {key} = {value}")

build_tags(id="btn-1", class_name="primary") # ✅
```

::: info 📝 TS 开发者便签：Rest Parameters

- **TS**: `function (...args: number[])`。注意 TS 使用数组类型 `number[]`。
- **Python**: `def (*args: int)`。注意 Python 注解的是内部元素的类型 `int`。
- **双星号**: TS 没有 `**kwargs` 的直接对应物。Python 的 `**kwargs` 是处理动态配置的神器，在 Django/Matplotlib 等库中随处可见。
  :::

## 6.3 函数即对象：`Callable`

在 Python 中，函数是一等公民。你可以把函数赋值给变量，或者作为参数传递。这需要用到 `collections.abc.Callable`。

```python
from collections.abc import Callable

# 定义一个类型别名：接收两个 int，返回 int 的函数
# 格式：Callable[[Arg1Type, Arg2Type], ReturnType]
type BinaryOp = Callable[[int, int], int]

def apply_op(x: int, y: int, func: BinaryOp) -> int:
    return func(x, y)

def add(a: int, b: int) -> int:
    return a + b

apply_op(5, 3, add) # 结果 8
```

### Lambda 函数的局限

Python 也有匿名函数 `lambda`，但它比 TS 的箭头函数弱得多——**它只能包含一行表达式**，不能包含复杂的语句（如 `if` 块, `for` 循环等，虽然可以用三元运算符模拟）。

```python
# ✅ 简短的逻辑适合 lambda
users.sort(key=lambda u: u["age"])

# ❌ 复杂的逻辑请务必使用 def 定义具名函数
```

## 6.4 深度思考：类型是建议，不是法律

这是 Python 与 TypeScript（以及 Java/C#）最大的不同，也是导致工程事故的常见原因。

在 TS 中，虽然类型在运行时会被擦除，但编译阶段（`tsc`）会阻止你生成错误的代码。
在 Python 中，类型检查（Type Checking）和 代码运行（Runtime Execution）是**完全解耦**的两个步骤。

### 残酷的现实

看下面这段代码：

```python
def add_numbers(a: int, b: int) -> int:
    return a + b

# ❌ 即使写了 int，我依然可以传字符串！
# Python 解释器不会报错，它会照常运行！
result = add_numbers("1", "2")

print(result) # 输出 "12" (字符串拼接)
```

如果你直接运行这段代码 (`uv run main.py`)，它**不会报错**。

### 为什么会这样？

Python 的解释器（Runtime）**完全忽略**类型注解。对解释器来说，`a: int` 和 `a` 没有任何区别。类型注解只是给**静态分析工具**（如 VS Code 的 Pylance，或命令行的 `mypy`/`pyright`）看的。

::: danger ⚠️ TS 开发者如何建立正确的心智模型？

1.  **信任链条的断裂**：在 TS 中，如果代码能跑，通常意味着类型大体是对的。在 Python 中，代码能跑，可能只是因为你还没跑到报错的那一行。
2.  **必须配置静态检查**：写 Python 不配 `pyright` 或 `mypy`，就等于写 TS 不用 `tsc`，是在裸奔。
3.  **边界防御**：既然类型注解不能阻止脏数据进入函数，那么在处理**外部输入**（API 请求、文件读取）时，你不能盲目相信类型注解。

:::

这也引出了我们将在 **第 9 章（数据建模）** 和 **第 17 章（Pydantic）** 讨论的话题：**既然原生类型注解防不住运行时错误，我们需要专门的库（Pydantic）在运行时强制执行类型检查。**

## 本章小结

我们深入解剖了 Python 函数的契约。

1.  **参数控制**：用 `*` 强制关键字参数，让调用更清晰。
2.  **动态参数**：`*args` 和 `**kwargs` 的注解是针对元素的。
3.  **函数类型**：使用 `Callable` 描述回调函数。
4.  **核心认知**：**Python 的类型注解是建议（Hint），不是强制（Enforcement）。** 永远不要指望解释器在运行时帮你拦截类型错误。

掌握了函数，我们已经可以编写过程式的脚本了。但为了管理代码，我们需要将其拆分到不同的文件中。

下一章，我们将讨论 **模块与工程化**。你会看到 Python 的 `import` 机制与 TS 的 `import` 有何不同，以及如何避免那个让无数人头秃的“循环引用”问题。

::: tip 🧠 课后思考
如果 `def foo(a: int) -> int` 不能阻止我传字符串，那么 Python 标准库里的 `isinstance(a, int)` 函数还有用吗？它和类型注解的关系是什么？

**提示**：类型注解是编译期（静态）的，`isinstance` 是运行期（动态）的。还记得上一章的“类型收窄”吗？它们是最佳拍档。
:::
