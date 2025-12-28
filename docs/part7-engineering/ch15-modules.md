# 组织与边界

> **"Order, gave each thing view."**  
> **“秩序，让万物各得其所。”**  
> — _威廉·莎士比亚，《亨利八世》_

---

熵增定律告诉我们，事物总是向着无序发展的。代码库也不例外。

当我们从写几十行的脚本，过渡到构建成千上万行的系统时，挑战不再是“如何实现功能”，而是“如何找到刚才实现的功能”。

在 Python 中，**文件即模块（Module），文件夹即包（Package）**。这套系统看似简单，背后却隐藏着独特的加载机制和常见陷阱。

本章我们将探讨如何建立清晰的物理边界，让代码库在大规模演进中依然保持秩序。

## 模块与包：物理世界的映射

在 Python 中，任何以 `.py` 结尾的文件都是一个**模块（module）**。而包含 `__init__.py` 文件的目录，则被视为一个**包（package）**。

### `__init__.py`：不仅仅是标志

很多初学者认为 `__init__.py` 只是告诉 Python “这是一个包”。但在工程实践中，它扮演着更重要的角色：**控制导出（Export Control）**。

假设你的目录结构如下：

```text
my_project/
└── utils/
    ├── __init__.py
    ├── string_tools.py
    └── math_tools.py
```

如果没有在 `__init__.py` 里做任何处理，使用者想调用 `add` 函数，必须写得很长：

```python
from my_project.utils.math_tools import add
```

作为库的维护者，我们可以在 `__init__.py` 中进行“重导出（Re-export）”：

```python
# utils/__init__.py

# 从子模块导入，并暴露给包的使用者（. 表示当前包）
from .math_tools import add
from .string_tools import to_upper

# 定义公开 API 列表（可选但推荐）
__all__ = ["add", "to_upper"]
```

现在，使用者可以优雅地导入了：

```python
from my_project.utils import add
```

> 💡 **说明**：`__all__` 是一个特殊变量，用于明确指定当使用 `from package import *` 时，哪些名称会被导入。虽然不强制使用，但它能提高模块的可预测性和安全性。

::: info 📝 TS 开发者便签：index.ts
这完全等同于 TypeScript 中的 **`index.ts`**（Barrelling）。

- **TS**: `export * from './math';`
- **Python**: `from .math import *`（写在 `__init__.py` 中）

这是封装模块内部结构的通用手段。用户只需要知道 `utils` 包里有什么，而不需要关心它具体在哪个文件里。
:::

## 导入的艺术：绝对 vs 相对

这是最容易踩坑的地方。

### 1. 绝对导入（Absolute Imports）—— 推荐

始终从项目的**根包**开始写完整路径。

```python
from my_project.core.models import User
```

**优点**：清晰、无歧义。无论你在项目的哪个文件里复制粘贴这行代码，它都能正常工作。

> ⚠️ **注意**：这里的“根包”指的是已安装到 Python 路径中的顶层包名（例如通过 `pip install -e .` 安装后的包名），而不是项目根目录。

### 2. 相对导入（Relative Imports）—— 慎用

使用 `.` 表示当前包，`..` 表示上一级包。

```python
from ..core import config
```

**优点**：在重命名顶层包名时不需要修改内部代码。  
**缺点**：**极其容易报错**。如果你试图直接运行包含相对导入的脚本（如 `python script.py`），Python 会抛出 `ImportError`，因为它不知道“上一级”是谁——此时该文件被视为顶层脚本，而非包的一部分。

::: tip 💡 最佳实践

- **在库（Library）内部**的模块之间引用，可以使用相对导入。
- **在应用程序（Application）代码中**，尽量全部使用绝对导入。
- **永远不要**在可直接执行的脚本中使用相对导入。
  :::

## 衔尾蛇之痛：循环引用（Circular Imports）

A 导入 B，B 又导入 A。  
这是所有编程语言都会遇到的问题，但在 Python 中尤为棘手。

**原因**：在 Python 中，**`import` 是可执行语句**。  
当 `a.py` 执行 `import b` 时，Python 会暂停 `a` 的执行，转而去加载并执行 `b.py` 的所有顶层代码。如果此时 `b.py` 又反过来导入 `a`，而 `a` 尚未完成初始化（仍在暂停中），就会导致 `AttributeError` 或 `ImportError`。

### 解决方案：`TYPE_CHECKING`

在现代 Python（3.7+）中，我们有了优雅的解法。

大多数循环引用其实只是为了**类型注解**（例如在类 A 中标注某个方法参数的类型为类 B）。

我们可以利用 `typing.TYPE_CHECKING` 常量。这个常量在**运行时为 `False`**，但在**类型检查器**（如 MyPy、Pylance）眼中为 `True`。

```python
from __future__ import annotations  # 启用延迟求值（PEP 563）
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # 此代码块仅被类型检查器读取，运行时跳过
    from .b import B_Class

class A:
    def process(self, item: B_Class) -> None:  # 类型注解有效
        pass
```

> 💡 **说明**：
>
> - `from __future__ import annotations` 让所有类型注解以字符串形式存储，避免在定义时立即求值，从而进一步减少运行时依赖。
> - 这是解决“鸡生蛋，蛋生鸡”问题的**工程化标准答案**。

## 双重身份：`__main__`

Python 文件既可以被导入使用，也可以被直接执行。为了区分这两种行为，我们需要检查内置变量 `__name__`。

```python
def main():
    print("Doing production work...")

if __name__ == "__main__":
    # 仅当文件被直接运行时（如 python file.py）才执行
    # 若被 import，则此块不会运行
    main()
```

**工程建议**：  
除了项目的入口文件（Entry Point），其他所有业务逻辑文件都应避免在全局作用域执行副作用代码（如打印、网络请求、文件写入等）。只应定义函数、类、常量等。这能防止 `import` 时产生意外行为。

## 物理布局：Src Layout

随着 `uv` 和 `pyproject.toml` 的普及，Python 社区正广泛采用 **Src Layout**（源码布局）。

```text
project_root/
├── pyproject.toml      # 项目配置（构建、依赖、工具等）
├── src/                # 源码目录
│   └── mypackage/      # 顶层包（实际发布的包名）
│       ├── __init__.py
│       └── main.py
└── tests/              # 测试代码（放在源码之外）
```

**为什么要多一层 `src`？**

如果不使用 `src`，直接将 `mypackage` 放在项目根目录，当你在根目录运行测试（如 `pytest`）时，Python 会优先从当前目录导入 `mypackage`，而不是你通过 `pip install -e .` 安装到环境中的版本。

这会导致：

- 测试的是“开发中的本地代码”，而非“打包后的真实包”；
- 隐藏了因缺少 `__init__.py` 或错误依赖导致的打包问题。

`src` 目录强制测试环境必须像最终用户一样，通过已安装的包来导入代码，从而提前暴露潜在的打包或路径问题。

## 🧠 深度思考

> **在 Node.js 中，当你多次 `require` 或 `import` 同一个模块时，模块代码只会执行一次。**  
> **在 Python 中，如果你在 `main.py` 导入了 `utils`，然后在 `helper.py` 里也导入了 `utils`，`utils.py` 里的全局代码（比如 `print("Loading...")`）会执行几次？**

::: details 点击查看答案
**只执行一次。**

Python 维护了一个全局字典 `sys.modules`，用于缓存已加载的模块。

1. 第一次导入 `utils` 时，Python 执行其代码，并将生成的模块对象存入 `sys.modules['utils']`。
2. 第二次导入时，Python 检查 `sys.modules`，发现已有缓存，直接返回该对象，**不再重新执行**模块代码。

这意味着 Python 模块天然是**单例（Singleton）** 的。你可以利用这一特性来实现全局配置对象、数据库连接池或日志器的共享。
:::

## 本章小结

组织与边界，是区分“脚本编写者”与“软件工程师”的分水岭。

1. **物理边界**：使用 `src/` 目录隔离源码与项目配置，确保可重现的构建与测试。
2. **逻辑边界**：通过 `__init__.py` 控制公开 API，隐藏内部实现细节，提升封装性。
3. **类型边界**：借助 `if TYPE_CHECKING:` 和 `from __future__ import annotations` 打破循环引用，保持架构整洁。
4. **执行边界**：用 `if __name__ == "__main__":` 防止导入时产生副作用，确保模块的纯净性。

代码库的混乱往往始于微末。一开始就建立良好的秩序，会让你的系统在面对复杂性时，依然能保持优雅的姿态。

现在，代码写好了，结构也清晰了。但我们还需要最后一样东西来保证它的长期健康——**自动化工具链**。

下一章（也是正文的最后一章），我们将回到序言中提到的 `uv` 和 `ruff`，深入探讨如何将规范自动化，把“个人自律”变成“团队契约”。
