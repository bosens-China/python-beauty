# 类，但不只是类

> **"To hold, as 'twere, the mirror up to nature."**  
> **“也就是拿一面镜子去照自然。”**  
> — _威廉·莎士比亚，《哈姆雷特》_

---

面向对象编程（Object-Oriented Programming, OOP）的核心思想是**用代码模拟现实世界中的事物和关系**。在 Python 中，这一理念被贯彻得尤为彻底：**一切皆对象**（Everything is an object）。你之前使用过的 `int`、`str`、函数（`function`），甚至 `None`，实际上都是某个**类（class）** 的实例（instance）。

不过，Python 的面向对象风格与 Java 或 TypeScript 等语言有着本质区别。它没有繁琐的 getter/setter 模板代码，也没有强制性的 `private` 访问控制关键字。相反，Python 采用一种更“动态”、更“灵活”的方式，让对象与语言本身无缝融合。

本章将带你从零开始理解 Python 的类系统，并揭示其背后的设计哲学。

## 显式的自我：`self`

让我们先看一个标准的类定义：

```python {6,16}
class User:
    # 类属性 (Class Attribute)：属于类本身，所有实例共享
    # 类似于 TypeScript 中的 static 属性
    platform: str = "PythonApp"

    def __init__(self, name: str, uid: int) -> None:
        """
        构造函数（初始化方法）。
        注意：返回值注解必须是 None。
        """
        # 实例属性 (Instance Attribute)：属于每个具体的对象
        self.name: str = name
        self.uid: int = uid
        self._is_active: bool = True  # 单下划线表示“受保护”（约定俗成）

    def greet(self) -> str:
        """实例方法"""
        # 必须通过 self 访问属性，不能直接访问 name
        return f"User {self.name} (ID: {self.uid}) says hello."
```

### 核心概念：`self` —— 显式的 `this`

这是许多从其他语言（如 TypeScript、JavaScript 或 Java）转来的开发者最容易困惑的地方。

::: info 📝 给 TypeScript 开发者的提示：`this` vs `self`

- **TypeScript/JavaScript**：`this` 是**隐式**的，并且其值依赖于**调用上下文**（context-dependent）。你常常需要担心回调函数中 `this` 是否丢失，或者手动使用 `.bind(this)` 来绑定。
- **Python**：`self` 是**显式**的，作为**第一个参数**传递给每个实例方法。
  1. **定义时**：每个实例方法的第一个参数**必须**命名为 `self`（虽然技术上可以叫别的名字，但强烈不建议这么做）。
  2. **调用时**：当你写 `u.greet()`，Python 会自动将其翻译为 `User.greet(u)`，即把实例 `u` 作为第一个参数传入。

**为什么这样设计？**  
Python 遵循“**显式优于隐式**”（Explicit is better than implicit）的哲学。通过强制写出 `self`，你一眼就能看出哪些变量属于当前对象，彻底避免了 JavaScript 中因 `this` 指向不明导致的常见 bug。
:::

> 💡 **小知识**：`__init__` 不是构造函数（constructor），而是**初始化方法**（initializer）。真正的构造由 `__new__` 负责，但绝大多数情况下你不需要重写它。

## 访问控制：君子协定

Python **没有** `public`、`private`、`protected` 这样的访问修饰符。是的，你没看错——Python 在运行时**不会阻止你访问任何属性**。

但它提供了一套**命名约定**（naming convention）来表达访问意图：

| 命名形式 | 含义                | 是否可外部访问            | 说明                                                                                                                       |
| -------- | ------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `name`   | 公开（Public）      | ✅ 是                     | 正常使用，无限制                                                                                                           |
| `_name`  | 受保护（Protected） | ⚠️ 技术上可以，但**不应** | 单下划线是社区约定，表示“仅供内部使用”。Lint 工具（如 Ruff、mypy）会发出警告。                                             |
| `__name` | 私有（Private）     | 🔒 名称被改写             | 双下划线触发“名称改写”（Name Mangling），实际变为 `_ClassName__name`，主要用于防止子类意外覆盖父类属性，**并非安全机制**。 |

::: info 📝 秩序来自约定
Python 假设开发者是“**有共识的成年人**”（Consenting Adults Principle）：你知道 `_` 开头的属性不该乱动，所以不会去动它。

对比来看：

- **TypeScript** 的 `private` 是**编译时检查**，运行时依然可以绕过；
- **Python** 的 `_` 是**社区规范**，运行时完全开放。

两者在运行时其实都是“裸奔”的，只是 Python 更信任开发者。
:::

## 魔术方法：对象的灵魂

为什么说“不只是类”？因为通过实现特定的**魔术方法**（Magic Methods，也称 Dunder Methods，即双下划线方法），你的自定义类可以获得像 `int`、`str` 等内置类型一样的行为。

这些方法让你的对象支持运算符、打印、调用等操作，极大提升了表达力。

### 1. `__str__` 与 `__repr__`：如何“介绍自己”

```python
class User:
    def __init__(self, name: str):
        self.name = name

    def __str__(self) -> str:
        # 面向最终用户：用于 print()、str()
        return f"User: {self.name}"

    def __repr__(self) -> str:
        # 面向开发者：用于调试、交互式解释器
        return f"User(name='{self.name}')"
```

- `print(user)` → 调用 `__str__`
- 在 REPL 中直接输入 `user` → 调用 `__repr__`
- **最佳实践**：`__repr__` 应尽量返回可执行的 Python 表达式，便于调试。

### 2. `__eq__`：自定义“相等”逻辑

默认情况下，两个 `User` 实例即使内容相同，`==` 也会返回 `False`（因为比较的是内存地址）。通过重写 `__eq__`，你可以改变这一行为：

```python
def __eq__(self, other: object) -> bool:
    if not isinstance(other, User):
        return NotImplemented  # 告诉 Python 尝试 other.__eq__(self)
    return self.uid == other.uid
```

现在，只要 `uid` 相同，两个 `User` 实例就被认为是相等的。

### 3. `__call__`：让对象像函数一样被调用

如果一个类实现了 `__call__`，它的实例就可以像函数一样使用：

```python
class Calculator:
    def __init__(self, factor: int):
        self.factor = factor

    def __call__(self, x: int) -> int:
        return x * self.factor

double = Calculator(2)
print(double(10))  # 输出 20
```

这种模式在框架（如 LangChain、PyTorch）中非常常见，用于创建可配置的“可调用对象”。

## 属性装饰器：`@property`

在 Java 或 C# 中，你可能会写 `getName()` 和 `setName()`。但在 Python 中，**不要写 getter/setter 方法**！

请使用 `@property` 装饰器，它能让你的方法像普通属性一样被访问和赋值：

```python
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        """Getter：读取半径"""
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        """Setter：设置半径，可加入校验逻辑"""
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value

    @property
    def area(self) -> float:
        """只读计算属性"""
        return 3.14159 * (self._radius ** 2)

# 使用示例
c = Circle(5)
c.radius = 10      # 调用 setter（看起来像直接赋值）
print(c.area)      # 调用 getter（无需加括号！）
```

> 💡 **注意**：`@property` 是 Python 提供的**语法糖**，它在保持简洁 API 的同时，保留了未来添加逻辑（如验证、日志）的灵活性。

## 继承与安全：`@override`（Python 3.12+）

Python 支持继承。在 Python 3.12 中，标准库新增了 `typing.override` 装饰器，用于**静态检查**方法是否确实重写了父类方法：

```python
from typing import override

class Admin(User):
    @override
    def greet(self) -> str:
        base_msg = super().greet()  # 调用父类方法
        return f"[ADMIN] {base_msg}"
```

如果没有 `@override`，如果你不小心把 `greet` 拼错成 `grett`，Python 会默默创建一个新方法，而不会报错。加上 `@override` 后，类型检查工具（如 mypy、Pyright）会在编译时提示：“父类没有 `grett` 方法，无法重写”。

> ✅ **建议**：在重写父类方法时，始终使用 `@override`，提升代码健壮性。

## 🧠 深度思考：多重继承与方法解析顺序（MRO）

> **Python 支持多重继承**（一个类可以继承多个父类）。  
> 考虑以下代码：

```python
class A:
    def greet(self): print("A")

class B:
    def greet(self): print("B")

class C(A, B):
    pass
```

**问题**：`C().greet()` 会输出什么？

::: details 点击查看答案
**输出 "A"**。

Python 使用 **C3 线性化算法**（C3 Linearization）来确定**方法解析顺序**（Method Resolution Order, MRO）。  
简单来说，查找规则是：**从左到右，深度优先，且保证子类优先于父类**。

在 `class C(A, B)` 中，`A` 写在 `B` 前面，因此 Python 先在 `A` 中查找 `greet`。如果找不到，再查 `B`。

你可以通过以下代码查看完整的 MRO：

```python
print(C.mro())  # 输出: [<class '__main__.C'>, <class '__main__.A'>, <class '__main__.B'>, <class 'object'>]
```

> 💡 **对比**：TypeScript 和 Java **不支持类的多重继承**，通常通过接口（Interface）或组合（Composition）实现类似功能。

:::

## 本章小结

Python 的类系统远比表面看起来强大而灵活：

1. **显式 `self`**：消除上下文歧义，让代码意图清晰。
2. **命名约定代替访问控制**：用 `_` 和 `__` 表达私有意图，依靠社区规范而非强制限制。
3. **魔术方法赋予对象灵魂**：通过 `__str__`、`__call__`、`__eq__` 等，让你的类行为如同内置类型。
4. **`@property` 提供优雅的属性访问**：兼顾简洁性与扩展性。
5. **`@override` 增强继承安全性**（Python 3.12+）。

掌握了类，你就拥有了组织和封装代码的基本单元。但有时，我们并不关心对象“是什么类型”，而只关心它“能做什么”——比如“只要能飞就行”，不在乎是鸟还是飞机。

下一章，我们将介绍 **协议（Protocols）**。这是 Python 类型系统中最接近 TypeScript `interface` 的机制，也是连接**静态类型检查**与**鸭子类型**（Duck Typing）的桥梁。
