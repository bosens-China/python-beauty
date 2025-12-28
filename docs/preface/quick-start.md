# 🚀 快速启动：搭建现代环境

> **“We shape our tools and afterwards our tools shape us.”**  
> **“我们塑造了工具，而后工具塑造了我们。”**  
> — _马歇尔·麦克卢汉（Marshall McLuhan）_

---

工欲善其事，必先利其器。

在传统的 Python 教程中，你可能会看到关于 `pip`、`virtualenv`、`conda`、`requirements.txt` 等一系列复杂的工具介绍。对于初学者来说，光是理清这些工具的关系就足以让人头晕目眩；对于从其他语言转来的开发者而言，Python 的包管理生态曾长期显得混乱而碎片化。

**现在，这一切都变了。**

欢迎来到 2025 年的 Python 开发世界。我们将使用 **`uv`** —— 一个由 Rust 编写的、极速的现代 Python 包管理器。它将统一接管你的 Python 版本管理、虚拟环境创建和依赖安装，为你提供简洁、高效且一致的开发体验。

## 1. 安装 `uv`

打开你的终端（macOS/Linux 用户使用 Terminal，Windows 用户使用 PowerShell 或 Windows Terminal），执行以下命令：

::: code-group

```bash [macOS / Linux]
# 使用官方脚本安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

```powershell [Windows]
# 使用 PowerShell 安装 uv
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

:::

> 💡 **提示**：上述命令会自动下载并安装 `uv` 到你的系统。如果你对直接运行网络脚本有安全顾虑，也可以通过 [uv 官方 GitHub 页面](https://github.com/astral-sh/uv) 手动下载预编译二进制文件。

安装完成后，请**关闭并重新打开终端窗口**（以确保新安装的命令生效），然后输入以下命令验证是否安装成功：

```bash
uv --version
# 输出示例: uv 0.5.0
```

如果看到类似 `uv x.x.x` 的输出，说明安装成功！

::: info 📝 技术注解：uv 是什么？
你可以把 `uv` 想象成 Python 生态中的 **`pnpm`**（Node.js）或 **`Bun`**（JavaScript 运行时）。

- 它用 Rust 编写，速度极快（比传统工具快 10–100 倍）。
- 它自动管理虚拟环境（无需手动激活 `venv`）。
- 它使用标准的 `pyproject.toml` 文件管理项目依赖（类似于 `package.json`）。
- 它还能自动下载和切换 Python 解释器版本——你甚至不需要去 python.org 下载安装包！
  :::

## 2. 初始化你的第一个项目

选择一个你方便访问的目录（例如桌面或文档文件夹），我们将在此创建一个名为 `hello-python` 的新项目。

在终端中依次执行以下命令：

```bash
# 1. 创建项目目录并进入
mkdir hello-python
cd hello-python

# 2. 使用 uv 初始化项目
uv init
```

执行后，你会看到当前目录下生成了两个文件：

- `hello.py`：一个简单的 Python 脚本模板。
- `pyproject.toml`：项目的配置文件。

### 核心文件：`pyproject.toml`

这是现代 Python 项目的标准配置文件，自 Python 3.11 起被官方推荐为首选格式。打开它，你会看到如下内容：

```toml
[project]
name = "hello-python"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.12"
dependencies = []
```

这个文件定义了项目的基本信息：

- `name`：项目名称。
- `version`：当前版本号（遵循语义化版本规范）。
- `requires-python`：指定项目所需的最低 Python 版本（本书基于 **Python 3.12**）。
- `dependencies`：项目依赖的第三方库列表（目前为空）。

> 📘 **小知识**：过去常用 `requirements.txt` 管理依赖，但它缺乏版本约束、元数据支持和可重复构建能力。`pyproject.toml` 是 PEP 621 提出的现代标准，已成为行业共识。

## 3. 体验极速：添加依赖

现在，让我们添加一个常用的第三方库：`requests`（用于发送 HTTP 请求）。

在项目根目录下运行：

```bash
uv add requests
```

此时，`uv` 会自动完成以下操作（全程通常只需几秒）：

1. 检测到你尚未安装符合 `requires-python = ">=3.12"` 要求的 Python 解释器 → **自动下载并安装 Python 3.12**（无需你干预）。
2. 在当前目录下创建一个隔离的虚拟环境（存储在 `.venv` 文件夹中）。
3. 从 PyPI（Python Package Index）下载 `requests` 及其所有依赖项。
4. 将依赖记录到 `pyproject.toml` 和锁定文件 `uv.lock` 中，确保未来可重现完全相同的环境。

> ✅ **零基础提示**：虚拟环境是一个独立的 Python 环境，它不会影响你系统中已有的 Python 安装或其他项目。每个项目都有自己的“沙盒”，避免依赖冲突。

## 4. 运行代码

不要直接使用 `python hello.py`！因为那样可能调用的是系统全局的 Python，而不是你项目专属的环境。

请始终使用 **`uv run`** 来运行脚本，它会自动使用当前项目的虚拟环境中的 Python 解释器。

首先，编辑 `hello.py` 文件，替换成以下代码：

```python
import sys

def main():
    print("Hello from uv!")
    # 打印当前使用的 Python 解释器路径
    print(f"Running on: {sys.executable}")

if __name__ == "__main__":
    main()
```

> 🔍 **语法说明**：
>
> - `if __name__ == "__main__":` 是 Python 中常见的惯用法，表示“当此文件被直接运行时，才执行下面的代码”。这使得该文件既可以作为脚本运行，也可以被其他模块安全导入。
> - `sys.executable` 返回当前正在运行的 Python 可执行文件的完整路径。

保存后，在终端中运行：

```bash
uv run hello.py
```

你应该会看到类似如下的输出：

```
Hello from uv!
Running on: /path/to/hello-python/.venv/bin/python
```

注意路径中包含 `.venv` —— 这证明你确实在使用项目隔离的环境，而非系统 Python。恭喜！你已经拥有了一个干净、可控的开发环境。

## 5. 配置编辑器：VS Code + Ruff

优秀的开发体验离不开强大的编辑器支持。我们推荐使用 **Visual Studio Code (VS Code)**，它是目前最流行的免费开源代码编辑器之一。

### 安装必要扩展

在 VS Code 中，点击左侧活动栏的扩展图标（或按 `Ctrl+Shift+X` / `Cmd+Shift+X`），搜索并安装以下三个扩展：

1. **Python**（由 Microsoft 提供）  
   → 提供基础的 Python 语言支持，包括调试、运行、环境选择等。

2. **Pylance**（同样由 Microsoft 提供）  
   → 提供智能代码补全、类型检查、跳转定义等功能。**本书强调类型安全编程，Pylance 是关键工具。**

3. **Ruff**（由 Astral 开发，与 `uv` 同一团队）  
   → 一个超高速的 Linter（代码检查器）和 Formatter（代码格式化工具）。

### 启用自动格式化

为了让代码风格始终保持一致，请进行以下设置：

1. 打开 VS Code 设置：

   - Windows/Linux：按 `Ctrl + ,`
   - macOS：按 `Cmd + ,`

2. 在搜索框中输入 `Format On Save`，勾选 **“Editor: Format On Save”**。

3. 再次搜索 `Default Formatter`，点击 “Edit in settings.json”，确保包含以下配置：

```json
{
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  }
}
```

现在，每当你保存 `.py` 文件时，Ruff 会自动修正缩进、引号、空格等格式问题，并按 PEP 8 规范排版代码。

::: tip 💡 为什么选择 Ruff？
传统 Python 项目常需组合多个工具：

- `flake8` 检查错误，
- `black` 格式化代码，
- `isort` 排序 import 语句。

这些工具速度慢、配置复杂，且容易冲突。  
**Ruff 用 Rust 重写了全部功能**，速度提升 10–100 倍，单个工具即可替代整套旧方案，且默认配置即符合现代 Python 最佳实践。
:::

## 6. 总结

至此，你已经成功搭建了一个现代化、专业级的 Python 开发环境：

- ✅ **包与环境管理**：`uv` —— 统一处理 Python 版本、虚拟环境和依赖安装。
- ✅ **项目配置**：`pyproject.toml` —— 行业标准的项目元数据与依赖声明文件。
- ✅ **开发工具链**：VS Code + Pylance + Ruff —— 提供智能提示、类型检查与自动格式化。

这个环境不仅适合学习“Hello World”，更能支撑你未来构建 Web 应用、数据分析管道、自动化脚本乃至微服务架构。

现在，你已准备好踏上真正的 Python 之旅。  
翻开下一章，我们将从最基础的语法开始，一步步揭开 Python 的优雅与力量。
