# 第 1 章：Python 3.12 新纪元与环境搭建

> **"All things are ready, if our mind be so."**
>
> **“万事俱备，只欠用心。”**
>
> — _威廉·莎士比亚，《亨利五世》 (William Shakespeare, Henry V)_

---

欢迎来到现代 Python 的世界。

如果你对 Python 的印象还停留在“脚本语言”、“速度慢”、“随意定义变量”的阶段，那么请先清空这些刻板印象。自 Python 3.5 引入类型提示（Type Hints），并在 3.12 进一步完善泛型语法以来，Python 已经完成了一次无声的蜕变。它不再仅仅是胶水语言，而是具备了构建大型、健壮、可维护系统的工程能力的现代化语言。

## 1.1 Python 的进化：为什么是 3.12+？

在编程语言的历史长河中，Python 3.12 是一个重要的里程碑。选择 3.12+ 不是为了赶时髦，而是为了**清晰**与**效率**：

1.  **更优雅的类型语法**：在 3.12 之前，定义泛型往往显得笨重（需要导入 `TypeVar`, `Generic` 等）。3.12 引入了 PEP 695，允许使用 `class Box[T]:` 这样直观的写法，让代码可读性大幅提升。
2.  **性能提升**：每个版本的 Python 都在变快，3.11 和 3.12 对解释器进行了大量优化。
3.  **错误提示**：3.12 的报错信息变得极其“人性化”。它不再只是抛出一堆调用栈，而是会精准地指出你可能拼错的变量名，甚至提示你少写了括号。

## 1.2 解释器与“渐进式类型”

Python 是一门解释型语言，也是一门**强类型**但**动态**的语言。

当你写下 `x: int = 10` 时，你可能认为 Python 会像 Java 或 Go 一样，严防死守不让你把字符串赋值给 `x`。

但事实是：**Python 解释器（Runtime）完全忽略类型注解。**

类型注解是写给“人”和“静态分析工具”看的，而不是给 CPU 看的。这就是**渐进式类型（Gradual Typing）**。你可以从没有类型开始写，逐渐添加类型约束。

::: info 📝 写给 TS/Java 开发者
这里的概念对你们来说应该非常亲切，特别是 TypeScript 开发者：

- **TypeScript**: 你写的是 TS，通过 `tsc` 编译后，所有类型信息被擦除，生成纯净的 JS 在 Node.js 或浏览器中运行。
- **Python**: 你写的是带类型的 Python，运行时解释器会直接忽略这些注解（就像它们不存在一样）。

区别在于：TS **必须**经过编译（Transpile）才能运行；而 Python 可以**直接运行源码**，类型检查是**可选的**、**独立**的步骤（通过 `mypy` 或 `pyright` 等工具完成）。

你可以把 Python 的 `pyright` 想象成你的 `tsc`，但它只负责检查，不负责生成代码。
:::

## 1.3 现代工具链：告别 pip，拥抱 uv

传统的 Python 教程会教你用 `pip` 安装包，用 `venv` 管理环境。这就像在前端界直接用 script 标签引入 jQuery 一样古老。

在现代 Python 开发中，我们推荐使用 **`uv`**。
`uv` 是一个用 Rust 编写的极速 Python 包管理器，它的速度比 pip 快 10-100 倍，且能自动管理 Python 版本和虚拟环境。

### 1.3.1 安装与初始化

首先，我们需要安装 `uv`。根据你的操作系统选择对应的命令：

::: code-group

```bash [MacOS / Linux]
curl -LsSf https://astral.sh/uv/install.sh | sh
```

```powershell [Windows]
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

:::

### 1.3.2 创建项目与管理依赖

安装完成后，打开你的终端（Terminal）。

::: tip 💡 给零基础的新手
如果你安装了 **VS Code**，可以通过快捷键 `` Ctrl + ` `` (反引号，Esc 键下方) 快速打开内置终端。
:::

接下来，我们创建一个新项目：

```bash
# 1. 创建文件夹
mkdir python-beauty
cd python-beauty

# 2. 初始化 uv 项目
uv init
```

执行完毕后，你会发现目录下多了一个 `pyproject.toml` 文件。这就是 Python 界的 `package.json`，它记录了你的项目名称、版本以及依赖列表。

现在，让我们添加著名的网络请求库 `requests`：

```bash
uv add requests
```

`uv` 会自动为你完成以下三件事，无需人工干预：

1.  创建一个隔离的虚拟环境（`.venv` 目录）。
2.  下载并安装 `requests` 包。
3.  在 `pyproject.toml` 中锁定版本。

::: details 🔍 为什么这比传统方式好？
在传统 Python 开发中，新手经常遇到“我安装了包，但运行代码时提示找不到模块”的问题。这通常是因为包安装到了全局，而代码在虚拟环境中运行（或者反之）。`uv` 统一了这一切，确保**安装的位置**和**运行的环境**永远一致。
:::

### 📝 工具对照表

刚转过来的同学容易对工具链感到混乱，请参考这张对照表：

| TypeScript / Node 生态  | Python 现代生态  | 说明                                   |
| :---------------------- | :--------------- | :------------------------------------- |
| `package.json`          | `pyproject.toml` | 项目配置与依赖清单                     |
| `npm` / `pnpm` / `yarn` | `uv` (推荐)      | 包管理与脚本运行                       |
| `node_modules/`         | `.venv/`         | 存放依赖包的目录（通常由工具自动创建） |
| `tsc` (Type Checker)    | `pyright` (推荐) | 静态类型检查工具                       |
| `node index.js`         | `uv run main.py` | 运行入口文件 (自动处理环境)            |

## 1.4 第一个类型化的程序

让我们创建 `main.py`，写下第一段不仅能跑，而且**“类型正确”**的代码。

你需要配置好你的编辑器（强烈推荐 **VS Code** + **Python** 插件 + **Pylance** 插件）。当你输入代码时，Pylance 会充当实时的类型检查器。

```python {13,18}
# main.py

def greet(name: str, times: int = 1) -> str:
    """
    生成问候语。

    :param name: 被问候者的名字 (字符串)
    :param times: 问候重复的次数 (整数，默认为1)
    :return: 拼接后的问候语 (字符串)
    """
    # 这里的 f"" 称为 f-string，是 Python 最常用的字符串格式化方式
    # 类似于 JS 的模板字符串 `Hello ${name}`
    message: str = f"Hello, {name}! " * times
    return message.strip()

# 入口判断：只有当文件被直接运行时才执行，被导入时不执行
if __name__ == "__main__":
    result: str = greet("Pythonista", times=3)
    print(result)
```

### 运行程序

在终端中输入以下命令来运行代码：

```bash
uv run main.py
```

_注意：我们使用 `uv run` 是为了确保代码使用 `uv` 创建的虚拟环境中的 Python 解释器。_

### 深度解析

1.  **函数签名**：`def greet(name: str, times: int = 1) -> str:`
    - 我们在定义函数时，明确约定了入参和返回值的类型。这不仅是文档，更是约束。
2.  **变量注解**：`message: str = ...`
    - 虽然 Python 可以自动推断 `message` 是字符串，但显式写出类型有助于阅读复杂的逻辑。
3.  **F-String**：`f"Hello, {name}!"`
    - 这是 Python 中最美妙的语法糖之一，直接在字符串中嵌入表达式。

### 尝试破坏规则

如果你在 VS Code 中，尝试把最后一行改成：

```python
# times 应该是 int，但我们故意传了 str
result = greet("Pythonista", times="many")
```

虽然代码可能（仅仅是可能）会报错或产生奇怪的结果，但你会发现 **编辑器下方出现了红色的波浪线**。

这就是我们要追求的境界：**在代码运行之前，通过类型系统发现错误。**

## 本章小结

我们搭建了基于 `uv` 的现代化环境，配置了 `pyproject.toml`，并写出了第一个带有显式类型注解的函数。你已经明白，Python 的类型检查是独立于运行时的静态分析过程。

下一章，我们将深入 Python 的**基础数据类型**。你会发现，虽然 Python 的 `int` 和 `str` 看起来平平无奇，但配合联合类型（Union）和字面量（Literal），它们能构建出极其强大的表达能力。

::: warning 🧠 课后思考
在 TS 中，`const x = "hello"` 自动推断 x 为字面量类型 `"hello"`（不可变），而 `let y = "hello"` 推断为 `string`（可变）。

你觉得 Python 的类型推断机制倾向于哪一种？我们将在下一章揭晓。
:::
