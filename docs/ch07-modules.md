# 第 7 章：模块与工程化 —— 组织你的代码

> **"Order, gave each thing view."** > **“秩序，让万物各得其所。”**
> — _威廉·莎士比亚，《亨利八世》 (William Shakespeare, Henry VIII)_

---

一个好的工程结构是可维护性的基石。在 Python 中，**文件即模块 (Module)，文件夹即包 (Package)**。本章我们将深入 Python 的导入机制，解决诸如“为什么相对导入会报错”、“如何处理循环引用”等经典工程问题。

## 7.1 模块 (Module) 与 导入 (Import)

在 Python 中，任何以 `.py` 结尾的文件都是一个模块。

假设我们要创建一个计算库：

```python
# 文件: math_utils.py

# 这是一个模块级变量
PI: float = 3.14159

def add(a: int, b: int) -> int:
    return a + b

# 私有函数（约定俗成）：不应该被其他模块使用
def _internal_helper():
    pass
```

在另一个文件中导入它：

```python
# 文件: main.py

# 方式 1: 直接导入模块
import math_utils
print(math_utils.add(1, 2))

# 方式 2: 导入特定成员 (推荐)
from math_utils import add, PI
print(add(1, 2))

# 方式 3: 别名
import math_utils as mu
```

### 📝 TS 开发者便签：没有 "export" 关键字

> - **TS**: 你必须显式在变量或函数前加 `export`，否则它是文件私有的。
> - **Python**: **默认情况下，模块里定义的所有全局变量都是公开的**（都是 exported）。
>
> 只有以单下划线 `_` 开头的变量（如 `_internal_helper`），在 `from module import *` 时会被忽略（但这是一种不推荐的导入方式）。
>
> 此外，Python 没有 TS 的 `export default`。所有导入都是具名的（Named Import）。

## 7.2 包 (Package) 与 `__init__.py`

如果你的代码变多了，你需要用文件夹来组织。**一个包含 `__init__.py` 文件的目录，被视为一个包 (Package)。**

虽然 Python 3.3+ 允许没有 `__init__.py` 的“命名空间包”，但在工程实践中，为了明确性，我们依然强烈建议保留它。

目录结构：

```text
my_project/
├── main.py
└── utils/           <-- 这是一个包
    ├── __init__.py  <-- 标识文件
    ├── string.py
    └── math.py
```

### `__init__.py` 的作用：Barrelling

TS 开发者习惯在文件夹下写一个 `index.ts` 来统一导出。`__init__.py` 扮演完全相同的角色。

```python
# 文件: utils/__init__.py

# 从子模块导入，并暴露给包的使用者
from .math import add
from .string import to_upper

# 定义对外公开的 API 列表
__all__ = ["add", "to_upper"]
```

现在，使用者可以优雅地导入了：

```python
# 文件: main.py

# ✅ 我们可以直接从 utils 包导入，而不需要深入到 utils.math
from utils import add, to_upper
```

### 📝 TS 开发者便签：index.ts

> - **TS**: `index.ts` 用于 Re-export (`export * from './math'`)。
> - **Python**: `__init__.py` 用于控制包级别的暴露。如果 `__init__.py` 是空的，你就必须 `from utils.math import add`，这会让导入路径变得很长。

## 7.3 绝对导入 vs 相对导入

这是最容易踩坑的地方。

### 7.3.1 绝对导入 (Absolute Imports)

**强烈推荐**。始终从项目的**根包**开始写路径。

```python
from my_project.utils.math import add
```

它的优点是清晰，且无论你在项目的哪个文件里，这行代码都不用变。

### 7.3.2 相对导入 (Relative Imports)

使用 `.` 表示当前包，`..` 表示上一级包。这通常只在**包的内部文件之间**引用时使用。

```python
# 文件: utils/string.py
from .math import add  # 引用同级目录的 math.py
```

### ⚠️ 致命陷阱：脚本直接运行

如果你在 `utils/string.py` 里写了相对导入 `from .math import add`，然后试图直接运行它：
`python utils/string.py`

**你会得到报错**：`ImportError: attempted relative import with no known parent package`。

**原因**：
当 Python 运行一个文件时，它不知道这个文件属于哪个“包”。相对导入依赖于模块的 `__package__` 属性，而直接运行脚本时，这个属性通常是 `None`。

**解决方案**：

1.  **工程化解法**：永远不要直接运行库里的子文件。总是通过入口文件（如 `main.py`）来调用。
2.  **临时解法**：以模块方式运行 `python -m utils.string`（要在项目根目录下）。

## 7.4 循环引用 (Circular Imports) —— 噩梦的开始

A 导入 B，B 导入 A。
在 TS 中，由于 Interface 在运行时会消失，循环引用通常没问题。
但在 Python 中，**import 是可执行语句**。

`a.py`:

```python
from b import func_b  # Python 暂停执行 a，去加载 b
def func_a(): ...
```

`b.py`:

```python
from a import func_a  # Python 发现 a 正在初始化中，还没定义 func_a -> 报错！
def func_b(): ...
```

### 解决方案：推迟导入与类型检查块

1.  **在函数内部导入** (运行时解决逻辑依赖)：

    ```python
    # a.py
    def func_a():
        from b import func_b  # 只有调用时才导入，此时 b 早就加载完了
        func_b()
    ```

2.  **使用 `TYPE_CHECKING`** (解决类型依赖)：
    这是 Python 3.12+ 编写类型注解时的标准解法。这解决了“我只是想要 B 的类型来做注解，不想真的运行它”的问题。

    ```python
    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        # 这个块里的代码只有静态检查器会看，运行时解释器会跳过
        # 从而避免了运行时的循环导入
        from b import B_Class

    # 注意：B_Class 在运行时是不存在的，所以必须用引号包裹（字符串前向引用）
    # 或者在文件头加上 from __future__ import annotations
    def process_b(obj: "B_Class") -> None:
        pass
    ```

## 7.5 双重身份：`if __name__ == "__main__":`

你应该在很多 Python 代码的末尾看到过这句话。

任何 Python 文件都有双重身份：

1.  **作为库被导入**：此时 `__name__` 等于模块名（如 `utils.math`）。
2.  **作为脚本被执行**：此时 `__name__` 被强制设置为 `"__main__"`。

```python
def main():
    print("Doing work...")

if __name__ == "__main__":
    # 只有当这个文件被直接运行时 (python file.py) 才会执行
    # 如果被 import，则不执行
    main()
```

**工程建议**：除了项目的入口文件（Entry Point），其他所有业务逻辑文件都应该避免在全局作用域直接执行代码（除了定义函数/类/常量）。

## 7.6 推荐的项目结构 (Src Layout)

为了避免 `import` 路径混乱，现代 Python 项目（尤其是配合 `uv`, `poetry` 使用时）推荐使用 `src` 布局。

```text
project_root/
├── pyproject.toml
├── src/                <-- 所有源码放这里
│   └── mypackage/      <-- 顶层包
│       ├── __init__.py
│       ├── main.py
│       └── core/
└── tests/              <-- 测试代码放在源码之外
```

这样做的好处是，你可以强制测试代码必须像外部用户一样，通过安装后的包名来导入代码 (`from mypackage import ...`)，而不是通过相对路径 hack。

---

**本章小结**

1.  **模块**：就是 `.py` 文件。
2.  **包**：就是带 `__init__.py` 的文件夹。
3.  **导入**：优先使用**绝对导入**。
4.  **循环引用**：用 `if TYPE_CHECKING:` 解决类型依赖，这是 TS 开发者必须掌握的 Python 特有技巧。
5.  **入口**：用 `if __name__ == "__main__":` 保护执行逻辑。

掌握了如何组织代码，我们已经完成了“过程式编程”的所有准备工作。但为了构建大型系统，我们需要更高层级的抽象。

下一章，我们将进入 **面向对象 (OOP)** 的领域。虽然 TS 也有 Class，但 Python 的 Class 有着独特的“魔术方法”（Magic Methods），且 Python 的访问控制（Private/Public）完全依赖于“君子协定”，这又是另一种文化冲击。

> **思考题**：
> 在 TS 中，当你 `import` 一个模块时，模块里的代码会执行一次。
> 在 Python 中，如果你在两个不同的地方 `import math_utils`，`math_utils.py` 里的代码会执行几次？Python 是如何管理这些已加载模块的？（提示：搜索 `sys.modules`）。
