# 第 8 章：类与面向对象 (OOP)

> **"To hold, as 'twere, the mirror up to nature."**
>
> **“也就是拿一面镜子去照自然。”**
>
> — _威廉·莎士比亚，《哈姆雷特》 (William Shakespeare, Hamlet)_

---

面向对象的本质是模拟现实世界。在 Python 中，**一切皆对象**（Everything is an object）。你之前用过的 `int`, `str`, `function` 实际上都是某个类的实例。

本章我们将学习如何定义自己的类，并掌握 Python 3.12 引入的现代化 OOP 特性。

## 8.1 类的解剖学：显式的 `self`

让我们定义一个标准的类。

```python {6,16}
class User:
    # 类属性 (Class Attribute)：属于类本身，所有实例共享
    # 类似于 TS 的 static 属性
    platform: str = "PythonApp"

    def __init__(self, name: str, uid: int) -> None:
        """
        构造函数 (Initializer)。
        注意：返回值注解必须是 None。
        """
        # 实例属性 (Instance Attribute)：属于每个具体的对象
        self.name: str = name
        self.uid: int = uid
        self._is_active: bool = True  # 单下划线表示"受保护"（约定俗成）

    def greet(self) -> str:
        """实例方法"""
        # 必须通过 self 访问属性，不能直接访问 name
        return f"User {self.name} (ID: {self.uid}) says hello."
```

### 核心概念：`self` —— 显式的 `this`

这是 TS 开发者转 Python 最大的心理障碍。

::: info 📝 TS 开发者便签：this vs self

- **TS**: `this` 是隐式的，上下文依赖的（Context-Dependent）。
  ```typescript
  class User {
    greet() {
      return `User ${this.name}`;
    } // this 可能会丢
  }
  ```
- **Python**: `self` 是显式的，参数传递的。
  1.  **定义时**：每个实例方法的第一个参数**必须**是 `self`。
  2.  **调用时**：Python 会自动把实例作为第一个参数传进去。
      - 调用 `u.greet()` 等同于 `User.greet(u)`。

**为什么这样设计？**
Python 的哲学是“显式优于隐式”。`self` 让你清楚地知道这个变量属于实例作用域。这也消除了 JS 中 `this` 指向不明的千古难题。
:::

## 8.2 类属性 vs 实例属性：最大的陷阱

在 TS 中，你习惯在类顶部定义字段。但在 Python 中，如果你在 `class` 体内直接定义变量，它是一个**类属性**（共享的），而不是实例属性。

::: code-group

```python [❌ 危险示范]
class Inventory:
    # ❌ 危险！这是类属性，所有实例共享同一个列表对象！
    items: list[str] = []

    def add(self, item: str):
        self.items.append(item)

inv1 = Inventory()
inv2 = Inventory()

inv1.add("Apple")
# 😱 inv2 被 inv1 污染了！因为它们指向同一个 items 列表
print(inv2.items) # 输出 ['Apple']
```

```python [✅ 正确示范]
from typing import ClassVar

class Inventory:
    # 使用 ClassVar 标记这是类变量（纯静态数据），明确意图
    max_limit: ClassVar[int] = 100

    def __init__(self):
        # ✅ 正确：在构造函数中初始化，每个实例有自己的列表
        self.items: list[str] = []
```

:::

::: danger 🛑 切记
**可变对象**（List, Dict, Set）必须在 `__init__` 中初始化。
只有**不可变常量**（如 `DEFAULT_TIMEOUT = 30`）才适合作为类属性定义在顶部。
:::

## 8.3 访问控制：君子协定

Python **没有** `public`, `private`, `protected` 关键字。是的，你没看错。

Python 依靠**命名约定**来控制访问权限：

1.  **Public (公开)**: `self.name`
    - 谁都可以访问。
2.  **Protected (受保护)**: `self._name` (单下划线)
    - **约定**：只能在类内部或子类中使用。
    - **事实**：如果你非要在外部访问 `user._name`，解释器不会阻止你，但这是不规范的。Lint 工具会警告你。
3.  **Private (私有)**: `self.__name` (双下划线)
    - **魔法**：Python 会进行“名称改写”（Name Mangling），把它变成 `_User__name`。
    - **目的**：主要为了防止子类意外覆盖父类属性，而不是为了真正的安全。

::: info 📝 秩序来自约定
Python 假设开发者都是“成年人”（Consenting Adults），会自觉遵守 `_` 开头不要乱动的约定。
**TS** 的 `private` 只是编译时的检查；**Python** 的 `_` 只是社区的约定。本质上，两者在运行时都是裸奔的。
:::

## 8.4 属性装饰器：`@property`

不要在 Python 中写 Java 风格的 getter/setter (`get_name()`, `set_name()`)。
请使用 `@property`。它可以让方法像属性一样被访问。

```python
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def radius(self) -> float:
        """Getter"""
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        """Setter: 可以在这里加校验逻辑"""
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value

    @property
    def area(self) -> float:
        """只读属性（Computed Property）"""
        return 3.14 * (self._radius ** 2)

# 使用
c = Circle(5)
c.radius = 10  # 调用 setter，看起来像直接赋值
print(c.area)  # 调用 getter，注意不需要括号 ()
# c.area = 20  # ❌ 报错：AttributeError，因为没有定义 setter，所以是只读的
```

## 8.5 继承与 `override` (Python 3.12+)

Python 支持类的继承，甚至支持**多重继承**（Multiple Inheritance），这是 TS 不具备的。

在 Python 3.12 中，我们引入了 `typing.override` 装饰器，这让重写父类方法变得更安全（类似 TS 的 `override` 关键字）。

```python
from typing import override

class Admin(User):
    def __init__(self, name: str, uid: int, level: int) -> None:
        # 调用父类的构造函数
        # TS: super(name, uid)
        super().__init__(name, uid)
        self.level = level

    @override
    def greet(self) -> str:
        # 复用父类逻辑
        base_msg = super().greet()
        return f"[ADMIN] {base_msg} Level: {self.level}"
```

### 为什么需要 `@override`？

如果你不小心拼错了方法名（比如写成了 `def grett(self):`），在没有 `@override` 的情况下，Python 会认为你在定义一个新方法，而不是重写。加上 `@override` 后，静态检查工具（pyright）会报错：父类没有 `grett` 方法可供重写。

## 本章小结

我们学习了 Python 的 OOP 基础：

1.  **Class**: 定义蓝图，注意类属性的共享陷阱。
2.  **Self**: 显式传递实例上下文，解决 `this` 指向问题。
3.  **Convention**: 用 `_` 管理访问权限，相信约定。
4.  **Property**: 用装饰器实现 Getter/Setter。

如果你觉得写 `__init__` 赋值一遍又一遍很繁琐（`self.x = x`），你的感觉是对的。Python 开发者也讨厌这个样板代码。而且，我们如何处理从外部（API/DB）传来的脏数据？普通的 Class 似乎力不从心。

下一章，我们将进入 **数据建模** 的深水区。我们将对比 `Dataclasses`、`TypedDict` 和 `Pydantic`，并重点讨论**类型在 IO 边界失效**的问题。

::: tip 🧠 课后思考
Python 支持多重继承（一个类继承多个父类）。
如果 `class C(A, B): pass`，而 A 和 B 都有一个 `greet()` 方法，`C().greet()` 到底会调用谁的？

**提示**：关键词是 **MRO** (Method Resolution Order)。这在 TS 中是不存在的（TS 只有 Mixins 或接口实现，没有多重类继承）。
:::
