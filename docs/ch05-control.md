# 第 5 章：控制流与类型收窄 (Type Narrowing)

> **"When you have eliminated the impossible, whatever remains, however improbable, must be the truth."** > **“当你排除了所有不可能，剩下的无论多么难以置信，那一定就是真相。”**
> — _阿瑟·柯南·道尔，《福尔摩斯探案集》 (Arthur Conan Doyle, Sherlock Holmes)_

---

编程的核心在于决策。Python 以其强制缩进（Indentation）闻名，这迫使代码在视觉上与其逻辑结构保持一致。但在现代 Python 中，控制流不仅仅是运行时的跳转，更是**编译期类型推断的锚点**。

## 5.1 真值测试 (Truthiness)：Python 的“假”

首先，我们需要统一对“真”和“假”的认知。
在 TypeScript/JS 中，空数组 `[]` 和空对象 `{}` 是 `true`。
**在 Python 中，它们是 `False`。**

Python 的 Falsy（假值）列表：

- `None`
- `False`
- `0`, `0.0`
- **空容器**：`[]` (list), `{}` (dict), `()` (tuple), `set()`, `""` (str)

```python
def process_items(items: list[str]) -> None:
    # Pythonic 写法：利用真值测试
    # 不需要写 if len(items) > 0:
    if items:
        print(f"Processing {len(items)} items...")
    else:
        print("No items to process.")
```

> **警示**：这一点非常重要。如果你在 Python 里写 `if list_obj:`，它是在检查列表是否非空，而不是检查对象是否存在。

## 5.2 类型收窄 (Type Narrowing)

类型收窄是指类型检查器（如 pyright）根据控制流语句，推断出变量更精确类型的过程。

### 5.2.1 `isinstance` —— 天然的 Type Guard

Python 的 `isinstance` 对应 TS 的 `instanceof` 或 `typeof`，但功能更通用。

```python
def double_value(val: int | str) -> int | str:
    # 此时 val 是 int | str

    if isinstance(val, int):
        # ✅ 在这个 block 里，编辑器确信 val 是 int
        # 所以 val * 2 是数学乘法
        return val * 2
    else:
        # ✅ 在这里，编辑器确信 val 只能是 str (排除了 int)
        # 所以 val * 2 是字符串重复
        return val * 2

# 测试
print(double_value(10))   # 20
print(double_value("a"))  # "aa"
```

这种机制让我们可以放心地处理联合类型 (`Union Types`)。

### 5.2.2 `None` 的处理

处理 `Optional` 类型（即 `Type | None`）是类型收窄最常见的场景。

```python
def get_name_length(name: str | None) -> int:
    if name is None:
        return 0

    # ✅ 此时 name 被收窄为 str
    return len(name)
```

> **注意**：永远使用 `is None` 或 `is not None` 来判断空值，而不是 `== None`。因为 `is` 比较的是内存地址（身份），速度更快且更安全。

## 5.3 结构化模式匹配 (`match case`)

在 Python 3.10 之前，我们只能用一连串的 `if-elif-else`。
现在，我们有了 `match case`。它不仅仅是 C/JS 里的 Switch，它是**解构（Destructuring）**与**分支**的结合体。

### 5.3.1 基础匹配与字面量

```python
status: int = 404

match status:
    case 200:
        print("Success")
    case 404 | 500: # 支持用 | 匹配多个值
        print("Error")
    case _:
        print("Unknown") # _ 相当于 default
```

### 5.3.2 结构匹配（解构）

这是它最强大的地方。你可以匹配数据的**形状**，并同时提取变量。

假设我们从 API 收到一个数据，它可能是以下几种格式：

1. 错误：`["error", "message"]`
2. 成功：`["success", [data1, data2]]`
3. 登录：`["auth", token, user_id]`

```python
# data 类型实际上是 list[Any]
def handle_response(data: list) -> None:
    match data:
        # 匹配列表，且第一个元素是 "error"，并把第二个元素绑定到 msg 变量
        case ["error", msg]:
            print(f"Error occurred: {msg}")

        # 匹配列表，第一个是 "success"，第二个是列表（绑定到 payload）
        case ["success", [*payload]]:
            print(f"Got {len(payload)} items")

        # 匹配列表，第一个是 "auth"，忽略第二个元素（_），绑定第三个
        case ["auth", _, user_id]:
            print(f"User {user_id} logged in")

        case _:
            print("Invalid format")

# 测试
handle_response(["error", "Connection failed"])
# 输出: Error occurred: Connection failed
```

### 5.3.3 结合类型检查与守卫 (Guard)

你甚至可以在匹配中加入类型检查和额外的 `if` 条件。

```python
def process_input(val: int | str | list[str]) -> None:
    match val:
        # 匹配 int 类型，且大于 10
        case int(x) if x > 10:
            print(f"Large number: {x}")

        # 匹配 int 类型，其余情况
        case int(x):
            print(f"Small number: {x}")

        # 匹配 str
        case str(s):
            print(f"It is a string: {s}")

        case list():
            print("It is a list")
```

### 📝 TS 开发者便签：Switch vs Match

> - **TS Switch**: 主要用于匹配字面量。虽然 TS 的 Discriminated Unions (带 `kind` 字段的 interface) 配合 switch 可以实现类型收窄，但语法比较冗长，且不能解构。
> - **Python Match**: 更像 Rust/Scala 的 `match`。它可以深入对象内部进行解构（Destructuring）。
> - **Fall-through**: Python 的 `match` **没有**穿透机制（Fall-through）。匹配到一个 case 后，执行完自动结束，不需要写 `break`。

## 5.4 EAFP：Python 的异常处理哲学

在控制流中，Python 社区奉行一种独特的哲学：**EAFP** (Easier to Ask for Forgiveness than Permission)。
意思是：先试着做，出错了再捕获；而不是先检查各种条件再做。

**LBYL (Look Before You Leap) - 典型的 C/JS 思维**:

```python
# 不推荐：即使 key 存在，多线程环境下也可能在下一行消失
if "key" in my_dict:
    value = my_dict["key"]
else:
    handle_error()
```

**EAFP - Pythonic 思维**:

```python
# 推荐：原子性更强，且通常更快（如果异常很少发生）
try:
    value = my_dict["key"]
except KeyError:
    handle_error()
```

在 Python 中，抛出和捕获异常的开销比 Java 小得多，因此异常处理被视为正常的控制流的一部分。

---

**本章小结**

我们掌握了 Python 逻辑控制的三板斧：

1.  **Truthiness**: 理解空容器即 `False`。
2.  **Type Narrowing**: 利用 `isinstance` 让编辑器理解你的逻辑，消除联合类型的歧义。
3.  **Match Case**: 使用结构化模式匹配处理复杂数据，替代冗长的 `if-elif`。

掌握了这些，你已经能写出逻辑严密的 Python 代码了。但是，随着逻辑的复用，我们需要将代码封装成函数。

在下一章，我们将深入 **函数 (Functions)**。你会看到，Python 的函数参数机制（`*args`, `**kwargs`, `/`, `*`）比 TS 复杂得多，但也强大得多。那是阅读开源源码的必修课。

> **思考题**：
> `match case` 不仅能匹配列表，还能匹配对象（Class）。
> 如果我有一个 `User(name, age)` 类，我该如何写 `case User(name="Alice", age=age):` 来匹配名为 Alice 的用户并提取她的年龄？这需要类支持 `__match_args__` 吗？
