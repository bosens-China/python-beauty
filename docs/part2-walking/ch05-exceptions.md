# 意外不是错误：异常与 EAFP

> **"It's easier to ask forgiveness than it is to get permission."**  
> **“请求原谅比获得许可更容易。”**  
> — _格蕾丝·赫柏 (Grace Hopper)，计算机科学先驱_

---

在很多编程语言中，抛出异常（Exception）往往意味着程序出现了严重问题——比如崩溃、逻辑漏洞，甚至系统故障。

但在 Python 的世界里，异常的地位截然不同。它不仅用于报告错误，更是**控制程序流程**的一等公民。

Python 程序员普遍信奉一种被称为 **EAFP**（Easier to Ask for Forgiveness than Permission）的编程哲学。理解这一点，是你写出“地道”Python 代码的关键分水岭。

## 两种世界观：LBYL vs EAFP

假设我们有一个字典，想要获取某个键对应的值。

### 1. LBYL（Look Before You Leap）：“三思而后行”

这是 C、Java 以及许多 JavaScript 开发者的默认思维模式：在执行可能失败的操作前，先检查条件是否满足。

```python
# 风格：LBYL
my_dict = {"name": "Alice"}

if "age" in my_dict:          # 1. 先检查键是否存在
    age = my_dict["age"]      # 2. 再安全地取值
    print(f"Age is {age}")
else:
    print("Age not found")
```

这种写法看似稳妥，但存在两个主要问题：

1. **非原子性（Non-atomic）**：在多线程或并发环境中，可能你在检查 `"age"` 是否存在时它还在，但紧接着就被另一个线程删除了，导致后续取值时依然抛出 `KeyError`（即“竞态条件”）。
2. **重复查找**：哈希表（字典底层结构）被查询了两次——一次用于 `in` 判断，一次用于实际取值，效率略低。

### 2. EAFP（Easier to Ask for Forgiveness than Permission）：“先行动，再处理后果”

这是 Python 推崇的风格：**直接尝试操作，若失败则捕获异常并处理**。

```python
# 风格：EAFP
my_dict = {"name": "Alice"}

try:
    age = my_dict["age"]      # 1. 直接尝试取值
    print(f"Age is {age}")
except KeyError:              # 2. 如果失败（键不存在），捕获异常
    print("Age not found")
```

在 Python 中，`try-except` 结构的性能开销非常小——**只要没有异常发生，它的速度通常比 `if` 检查更快**。这是因为 Python 虚拟机对正常路径做了高度优化。

> 💡 **提示**：`KeyError` 是 Python 内置的一种异常类型，当试图访问字典中不存在的键时自动抛出。

## 完整的异常处理结构

除了 `try` 和 `except`，Python 还提供了 `else` 和 `finally` 子句，共同构成完整的异常处理逻辑：

```python
def calculate_inverse(number: str):
    try:
        # 1. 尝试执行可能出错的代码
        val = int(number)       # 可能抛出 ValueError
        result = 1 / val        # 可能抛出 ZeroDivisionError

    except ValueError:
        # 2a. 捕获特定异常：输入无法转为整数
        print("Error: Input must be a number.")

    except ZeroDivisionError:
        # 2b. 捕获特定异常：除数为零
        print("Error: Cannot divide by zero.")

    else:
        # 3. 仅当 try 块【未发生任何异常】时执行
        # 这是放置“成功路径”后续逻辑的理想位置
        print(f"Inverse is {result}")

    finally:
        # 4. 无论是否发生异常，此块总会执行
        # 常用于资源清理：关闭文件、释放锁、断开数据库连接等
        print("Calculation finished.")
```

> 📘 **关于类型注解**：函数定义中的 `number: str` 是**类型提示（Type Hint）**，表示该参数预期是字符串类型。它不会影响运行时行为，但能帮助开发者和工具（如 IDE、mypy）理解代码意图。本书基于 Python 3.12，全面支持此类语法。

::: info 📝 给 TypeScript 开发者的对比说明

- **TypeScript/JavaScript** 使用 `try { ... } catch (e) { ... } finally { ... }`。其 `catch` 通常捕获所有 `Error` 类型，需手动判断具体错误类型（如 `if (e instanceof TypeError)`）。
- **Python** 支持多个 `except` 分支，可针对不同异常类型执行不同逻辑，类似 Rust 的模式匹配。
- **独特之处**：Python 提供 `else` 子句，而 TS/JS 没有。这使得“可能出错的代码”与“依赖其结果的代码”可以清晰分离，避免将无关逻辑放入 `try` 块中，提升可读性和安全性。
  :::

## 沉默不是金：异常捕获的原则

异常处理虽强大，但滥用会导致严重问题。最危险的做法就是**“生吞异常”（Swallowing Exceptions）**。

::: danger 🛑 绝对禁止的写法

```python
try:
    process_data()
except:
    pass  # ⚠️ 千万不要这样做！
```

:::

这段代码会捕获**所有类型的异常**——包括拼写错误导致的 `NameError`、索引越界的 `IndexError`，甚至用户按下 `Ctrl+C` 触发的 `KeyboardInterrupt`。更糟的是，它什么也不做（`pass`），让错误悄无声息地消失。

结果？程序看似正常运行，实则内部已产生错误数据，调试时如同大海捞针。

**正确原则：**

1. **只捕获你明确预期的异常**  
   例如：`except KeyError`、`except FileNotFoundError`，而不是笼统的 `except:`。
2. **避免捕获基类 `Exception`**  
   除非你在编写顶层全局错误处理器（如 Web 框架的错误中间件），否则应精确指定异常类型。

## 主动抛出异常：`raise`

当你发现输入无效或状态异常时，**不要返回特殊值（如 `-1` 或 `None`）**，而应直接抛出异常。

```python
def login(username: str):
    if not is_valid(username):
        # 抛出带有明确信息的异常
        raise ValueError(f"Invalid username: {username}")

    # ... 正常登录逻辑 ...
```

这样做的好处：

- 调用者必须显式处理该异常（或让程序终止），无法忽略错误；
- 异常信息清晰，便于调试；
- 符合 Python “显式优于隐式” 的设计哲学。

> 💡 `raise` 语句用于主动触发异常。你可以抛出内置异常（如 `ValueError`、`TypeError`），也可以自定义异常类（后续章节会介绍）。

## 🧠 深度思考：EAFP 是否万能？

> **既然 EAFP 更高效、更 Pythonic，是否所有 `if` 判断都该换成 `try-except`？**
>
> 例如，检查列表是否为空：
>
> ```python
> # 方案 A：使用 if
> if my_list:
>     print(my_list[0])
>
> # 方案 B：使用 try-except
> try:
>     print(my_list[0])
> except IndexError:
>     pass
> ```
>
> **你会选哪一个？**
>
> ::: details 点击查看答案
> **选 A。**
>
> EAFP 适用于**意外或罕见情况**，而非常规逻辑分支。
>
> - 如果列表**绝大多数时候非空**，偶尔为空（如从外部 API 获取的数据），那么 `try-except` 是合适的。
> - 但如果“列表为空”是常见、可预期的状态（如用户可能未选择任何项目），使用 `if` 更直观、更高效。
>
> 此外，方案 B 中的 `except IndexError: pass` 属于“静默忽略”，容易掩盖潜在 bug，且可读性较差。
>
> **Pythonic 的精髓在于平衡**：
>
> - 用 `if` 处理**常规业务逻辑分支**；
> - 用 `try-except` 处理**不可控的外部因素**（如文件不存在、网络中断、字典键缺失等）。
>   :::

## 本章小结

Python 不鼓励你畏手畏脚地编程。

1. **哲学**：EAFP（先行动，后处理）通常比 LBYL（先检查，再行动）更符合 Python 风格，也更高效。
2. **结构**：善用 `try-except-else-finally` 四段式结构，将“成功路径”放在 `else` 块中，保持 `try` 块尽可能精简。
3. **纪律**：永远不要写空的 `except: pass`，那是在制造“幽灵 bug”。

至此，你已经掌握了 Python 的**基础语法**（变量、缩进）、**控制流**（条件、循环）和**异常处理机制**。你的程序不仅能运行，还能优雅地应对意外。

然而，随着功能增加，将所有代码写在一起会变得难以维护。我们需要一种方式来**封装逻辑、复用代码、提升可读性**。

下一章，我们将进入 **“第三部：塑形”**，深入探讨 Python 中的**函数**。你会发现，Python 的函数参数机制之灵活，远超多数语言——它是阅读开源项目源码必须跨越的第一道门槛。
