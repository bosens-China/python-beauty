# 工具不是负担：uv 与 ruff

> **"Civilization advances by extending the number of important operations which we can perform without thinking about them."**  
> **“文明的进步，在于我们增加了那些无需思考就能完成的重要操作的数量。”**  
> — _阿尔弗雷德·诺思·怀特海（Alfred North Whitehead）_

---

写代码是一项脑力劳动，但管理代码不应该是。

在过去很长一段时间里，Python 的工程体验被认为是“破碎的”：

- 我们要用 `pip` 安装依赖包，但它不会自动锁定具体版本，导致“在我的机器上能跑，在服务器上却崩溃”。
- 我们要用 `virtualenv` 或 `venv` 创建虚拟环境，但常常忘记激活它，结果污染了全局 Python 环境。
- 我们要分别配置 `flake8` 做代码检查、`black` 做格式化、`isort` 排序导入语句——这三个工具不仅配置繁琐，还可能互相冲突。

这些琐碎的工程问题，不仅是负担，更是对创造力的消耗。

幸运的是，Python 社区正在迎来**工具链的整合时代**。受 Rust 生态高效工具理念的启发，新一代工具如 **`uv`** 和 **`ruff`** 正在重塑 Python 的开发体验。它们不仅速度极快（通常比传统工具快 10–100 倍），更重要的是，它们为 Python 项目带来了前所未有的**确定性**和**一致性**。

## 唯一的真理：`pyproject.toml`

在很长一段时间里，Python 项目的配置分散在多个文件中：

- `setup.py`：定义项目元数据和构建逻辑
- `requirements.txt`：列出依赖包（但无结构化信息）
- `setup.cfg`：替代 `setup.py` 的静态配置
- `MANIFEST.in`：控制打包时包含哪些文件

这种碎片化让新成员难以理解项目结构，也容易出错。

现在，请记住唯一的真理：**`pyproject.toml`**。

它是 Python 项目的标准化配置文件，类似于 JavaScript 中的 `package.json`。自 PEP 518 起，`pyproject.toml` 被官方采纳为现代 Python 项目的标准配置入口。

它统一管理以下内容：

1. **项目元数据**：名称、版本、作者、许可证等
2. **依赖声明**：运行时依赖和开发依赖
3. **构建后端**：指定使用哪个工具来构建项目（如 `setuptools`、`hatch`、`poetry` 等）
4. **工具配置**：为 Ruff、Pyright、Mypy 等工具提供配置项

例如：

```toml
[project]
name = "my-awesome-app"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.109.0",
    "pydantic>=2.6.0",
]

[tool.ruff]
line-length = 88
target-version = "py312"
```

> 💡 **提示**：`target-version = "py312"` 表示你的代码目标是 Python 3.12，Ruff 会据此启用相应的语法检查规则。

当你把所有配置收敛到一个文件时，项目的认知负荷显著降低——你只需看一个文件，就能了解整个项目的“契约”。

## 确定性的基石：`uv` 与锁文件

我们在前文已经安装了 `uv`（一个用 Rust 编写的超快 Python 包安装器和解析器）。现在，我们来深入理解它背后的核心价值：**可重现性（Reproducibility）**。

当你执行：

```bash
uv add fastapi
```

`uv` 不仅会将 `fastapi` 添加到 `pyproject.toml` 的依赖列表中，还会自动生成一个 **`uv.lock`** 文件。

### 为什么需要 Lock 文件？

假设你在 `pyproject.toml` 中只写：

```toml
dependencies = ["fastapi>=0.109.0"]
```

那么：

- 今天安装，可能得到 `fastapi==0.109.0`
- 明天安装，如果发布了 `0.109.1`，就会自动升级到新版本

虽然语义化版本（SemVer）承诺“补丁版本不会破坏兼容性”，但在实践中，微小的变更仍可能导致生产环境故障。

**`uv.lock` 解决了这个问题**。它精确记录了当前依赖树中**每一个包的确切版本、来源 URL、校验哈希值（hash）**，形成一个完整的快照。

当你将代码提交到 Git，同事克隆仓库后只需运行：

```bash
uv sync
```

`uv` 就会严格按照 `uv.lock` 中的记录安装依赖，确保**所有开发者、CI/CD 流水线、生产环境运行的代码完全一致**。

::: info 📝 给有其他语言经验的读者

- **Python (uv)**: `pyproject.toml` + `uv.lock`
- **Node.js**: `package.json` + `package-lock.json`（npm）或 `pnpm-lock.yaml`（pnpm）
- **Rust**: `Cargo.toml` + `Cargo.lock`

过去，Python 社区常通过 `pip freeze > requirements.txt` 手动模拟 lock 文件，但这缺乏标准化且易出错。`uv` 提供了原生、高效、可靠的解决方案。
:::

## 秩序的守护者：`Ruff`

代码风格争论（用 Tab 还是空格？单引号还是双引号？函数之间空几行？）是团队协作效率的隐形杀手。

**Ruff** 的出现终结了这些无谓的争论。它是一个用 Rust 编写的、极速的 Python Linter（代码检查器）和 Formatter（格式化工具），速度比传统工具快数十倍。

### 它是全能选手

Ruff 并非从零开始的新工具，而是对现有生态的**整合与超越**。它直接兼容并替换了以下工具的功能：

| 功能                     | 传统工具    | Ruff 支持                 |
| ------------------------ | ----------- | ------------------------- |
| 代码规范检查             | `flake8`    | ✅（含全部插件规则）      |
| 代码自动格式化           | `black`     | ✅（高度兼容 Black 风格） |
| 导入语句排序             | `isort`     | ✅                        |
| 语法升级建议             | `pyupgrade` | ✅                        |
| 错误检测（如未定义变量） | `pyflakes`  | ✅                        |

这意味着你只需配置一个工具，就能获得整套代码质量保障。

### 它是自动化的

在 `pyproject.toml` 中配置好 Ruff 后，你可以在 VS Code 中启用“保存时自动格式化”（需安装 [Ruff 扩展](https://marketplace.visualstudio.com/items?itemName=charliermarsh.ruff)）。

效果立竿见影：

- 未使用的导入被自动移除
- 混乱的 `import` 语句按规则排序
- 不符合 PEP 8 的缩进、空格、换行被修正
- 过时的语法（如 `str.format()`）被建议升级为 f-string

你不再需要手动调整格式，也不必在代码审查中争论风格问题——**工具替你做了这些机械性决策**。

> 💡 **零基础提示**：PEP 8 是 Python 官方的代码风格指南，规定了如何命名变量、缩进、空行等，目的是让代码更易读。Ruff 默认遵循 PEP 8。

## 类型检查：最后一道防线

我们在本书前面章节反复强调：**类型注解（Type Annotations）是提升代码可靠性的关键**。

但请注意：**如果你不运行类型检查工具，类型注解就只是普通注释，Python 解释器会完全忽略它们**。

因此，你需要一个**静态类型检查器（Static Type Checker）** 来在运行前发现潜在错误。

**Pyright**（由 Microsoft 开发）是目前最快的 Python 静态类型检查器，也是 VS Code 中 **Pylance** 语言服务的核心引擎。

建议将其作为开发依赖加入项目：

```bash
uv add --dev pyright
```

然后运行检查：

```bash
uv run pyright
```

Pyright 会扫描整个项目，并报告如下问题：

- 将 `str` 类型的值传给了期望 `int` 的函数参数
- 访问了对象上不存在的属性（可能导致 `AttributeError`）
- 忽略了可选类型的 `None` 情况

> 💡 **零基础提示**：`--dev` 表示这个包只在开发时使用（如测试、格式化、类型检查），不会被打包到生产环境中。

## 自动化：CI/CD 的必然

再好的工具，如果只依赖开发者的自觉（比如“记得提交前运行检查”），最终都会失效。

**必须将规范固化到自动化流程中**。

无论你使用 GitHub Actions、GitLab CI 还是其他持续集成（CI）系统，你的流水线都应包含以下三步：

```yaml
# 示例：GitHub Actions 片段
steps:
  - name: Install dependencies
    run: uv sync

  - name: Check code style
    run: uv run ruff check .

  - name: Check types
    run: uv run pyright
```

- 如果 `ruff check` 发现格式或风格问题 → 构建失败
- 如果 `pyright` 发现类型错误 → 构建失败

**只有通过所有检查的代码，才允许合并到主分支**。这就是“代码的契约”——用机器强制执行团队共识，而非依赖个人记忆。

## 🧠 深度思考：破窗效应与工程文化

> **破窗效应（Broken Windows Theory）**  
> 犯罪学家发现：如果一栋建筑有一扇窗户破了没修，很快其他窗户也会被打破。环境中的无序会诱导更多无序行为。

代码库同样如此。

如果项目中充斥着：

- 未使用的导入
- 不一致的缩进
- 随意使用的 `Any` 类型
- 混乱的命名风格

后来的开发者就会潜意识认为：“反正已经这么乱了，我随便写点也没关系。”

**工具的价值，不在于它们能帮你写代码，而在于它们守住了那扇窗户**。

哪怕是一个只有几十行的小脚本，也请：

- 用 `uv init` 初始化项目
- 用 `ruff format` 格式化代码
- 在 `.gitignore` 中排除虚拟环境

**因为卓越不是一种行为，而是一种习惯**。

## 本章小结

工具不是为了增加你的学习负担，而是为了**释放你的脑力，让你专注于真正重要的问题——业务逻辑与创造性思考**。

1. **统一配置**：`pyproject.toml` 是现代 Python 项目的唯一真相源。
2. **依赖管理**：使用 `uv` 和 `uv.lock` 实现可重现的依赖安装，彻底告别“在我机器上能跑”的玄学问题。
3. **代码质量**：让 `Ruff` 自动处理格式、风格和常见错误；用 `Pyright` 在运行前捕获类型错误。
4. **工程思维**：将规范编码为自动化流程（CI/CD），用机器代替人来执行纪律。

至此，我们的 Python 之旅，从最基础的变量与函数，一路走到了现代化的工程实践。  
你手中的 Python，已经不再是那个“简陋的脚本语言”，而是一把**精密、可靠、工业级的开发利器**。

最后，让我们在终章里，在这个理性的工程世界之外，再聊聊一点感性的东西——**平衡**。
