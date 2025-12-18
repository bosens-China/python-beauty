# 第 10 章：协议 (Protocols) —— 鸭子类型的静态化

> **"Action is eloquence."**
>
> **“行动即是雄辩。”**
>
> — _威廉·莎士比亚，《科利奥兰纳斯》 (William Shakespeare, Coriolanus)_

---

::: tip 💡 上一章答案揭晓
为什么 `json.dumps(my_dataclass)` 会报错？
因为 Python 标准库的 `json` 模块默认只认识基础类型（dict, list, str, int 等），不认识你自定义的类。
**解决方案**：使用 `dataclasses.asdict` 将对象转回字典。

```python
import json
from dataclasses import asdict

data = json.dumps(asdict(user_obj)) # ✅ 成功序列化
```

:::

这句话完美地诠释了本章的主题：我们不关心对象的**名字**（它继承自谁），我们只关心它的**行动**（它能做什么）。

在 Python 的古老传说中，这被称为 **鸭子类型 (Duck Typing)**：“如果它走起路来像鸭子，叫起来像鸭子，那它就是鸭子。”

## 10.1 继承的困局：名义类型 (Nominal Typing)

假设我们在编写一个游戏，需要一个函数来处理“飞行”。

**传统的 OOP 思路 (名义类型)**：

```python
class Bird:
    def fly(self): print("Bird flying")

class Airplane:
    def fly(self): print("Plane flying")

def let_it_fly(entity: Bird):
    # ❌ 这样写太死板了！Airplane 飞不了，因为 Airplane 不是 Bird 的子类。
    # 尽管 Airplane 也有 fly 方法，但在类型检查器看来，它们毫无关系。
    entity.fly()
```

为了解决这个问题，在 Java 或旧式 Python 中，你需要创建一个公共基类 `Flyable`，然后让 `Bird` 和 `Airplane` 都去继承它。

**痛点**：如果你无法修改 `Airplane` 的源码（比如它是第三方库提供的）怎么办？你没法给它加上父类。这就是继承带来的**强耦合**。

## 10.2 协议：只看结构，不问出身

Python 3.8 引入的 `typing.Protocol` 完美解决了这个问题。

```python
from typing import Protocol

# 1. 定义一个协议：任何实现了 fly 方法的东西，都是 Flyer
class Flyer(Protocol):
    def fly(self) -> None:
        ...  # 这里的 ... 是 Python 的合法语法 (Ellipsis)，表示占位符

# 2. 具体的类（根本不需要知道 Flyer 的存在）
class Bird:
    def fly(self) -> None:
        print("Wings flapping...")

class Airplane:
    def fly(self) -> None:
        print("Engines starting...")

# 3. 使用协议作为类型注解
def launch(entity: Flyer) -> None:
    entity.fly()

# ✅ 它可以工作！
launch(Bird())
launch(Airplane())
```

静态检查器（pyright）会检查：`Bird` 有 `fly` 方法吗？有。`Airplane` 有吗？有。那就通过。

::: info 📝 TS 开发者便签：Interface 的完美对应
这是本书中最重要的一次概念对齐。

- **Python Protocol** = **TS Interface**

在 TS 中：

```typescript
interface Flyer { fly(): void; }
function launch(entity: Flyer) { ... }
// 只要对象有 fly 方法，就能传进去，不需要 implements Flyer
```

Python 的 Protocol 实现了完全相同的 **Structural Subtyping（结构化子类型）** 机制。你不需要像 Java 那样显式 `implements` 或像 Python 旧式 OOP 那样继承基类。只要**形状 (Shape)** 对了，类型就对了。
:::

## 10.3 复杂协议与属性

协议不仅可以定义方法，还可以定义属性。

```python
class Named(Protocol):
    # 定义一个只读属性 name
    # 注意：这只是为了类型检查，具体的类可以用普通变量，也可以用 @property
    @property
    def name(self) -> str: ...

def greet(obj: Named) -> None:
    print(f"Hello, {obj.name}")

class User:
    def __init__(self, name: str):
        self.name = name

class Dog:
    name = "Buddy" # 类属性也算

# ✅ User 和 Dog 都满足 Named 协议
greet(User("Alice"))
greet(Dog())
```

## 10.4 运行时检查：`@runtime_checkable`

默认情况下，`Protocol` 只能被静态检查工具识别。如果你试图在运行时使用 `isinstance(obj, Flyer)`，Python 默认会报错。因为普通的 Protocol 类在运行时会被擦除大部分逻辑，不具备检查能力。

如果你需要这种能力，需要加上装饰器：

```python
from typing import runtime_checkable

@runtime_checkable
class Closer(Protocol):
    def close(self) -> None: ...

class File:
    def close(self): pass

f = File()

# ✅ 现在可以用于 isinstance 判断了
# 它的原理是检查 f 是否有 close 属性，且是可调用的
if isinstance(f, Closer):
    f.close()
```

这在编写框架代码时非常有用，可以动态判断传入的对象是否具备某些能力。

## 10.5 组合协议 (Intersection Types)

在 TS 中，如果你需要一个对象既能飞又能跑，你会写 `type SuperHero = Flyer & Runner`。

在 Python 中，你需要定义一个新的 Protocol 继承它们：

```python
class Runner(Protocol):
    def run(self) -> None: ...

# 定义一个新协议，组合了两个协议的功能
# 相当于 SuperHero = Flyer & Runner
class SuperHero(Flyer, Runner, Protocol):
    pass

def action(hero: SuperHero):
    hero.fly()
    hero.run()
```

虽然比 `&` 稍微繁琐一点，但逻辑是一样的。

## 10.6 内置协议：`collections.abc`

不要重复造轮子。Python 的标准库 `collections.abc` (Abstract Base Classes) 中其实已经内置了大量的“协议”（虽然技术上它们是抽象基类，但现代 Python 把它们当作协议处理）。

- **`Iterable[T]`**: 只要实现了 `__iter__` 的对象（如 list, tuple, set, dict）。
- **`Sequence[T]`**: 只要实现了 `__getitem__` 和 `__len__` 的对象（如 list, tuple, str）。
- **`Mapping[K, V]`**: 类似 dict 的对象。
- **`Callable[...]`**: 函数或实现了 `__call__` 的对象。

**最佳实践**：函数的参数类型应该**越宽泛越好**。

::: code-group

```python [❌ 限制太死]
# 只能传 list，传 tuple 或 set 会报错
def process_names(names: list[str]):
    for name in names:
        print(name)
```

```python [✅ 更加通用]
from collections.abc import Iterable

# 可以传 list, tuple, set, 甚至生成器
# 只要能被 for 循环遍历即可
def process_names(names: Iterable[str]):
    for name in names:
        print(name)
```

:::

## 本章小结

Protocol 填补了 Python 类型系统的最后一块短板，让 Python 拥有了和 TypeScript 一样灵活且安全的结构化类型系统。

1.  **解耦**：使用者定义协议，实现者无需感知协议。
2.  **TS 映射**：Protocol 就是 Python 版的 Interface。
3.  **标准库**：优先使用 `Iterable`, `Sequence` 等内置抽象，让你的函数通用性更强。

既然我们已经能定义各种“形状”的数据和接口，那么如何让这些接口处理**任意类型**的数据呢？比如定义一个“盒子”，既能装 `int` 又能装 `str`，且拿出来时类型不丢失？

下一章，我们将讨论 **泛型 (Generics)**。在 Python 3.12 中，泛型语法迎来了一次史诗级的更新，终于不再像以前那么丑陋了。

::: tip 🧠 课后思考
`list` 类型是 `Sequence` 协议的子类型（Subtype）。

那么 `list[Dog]` 是 `Sequence[Animal]` 的子类型吗？（假设 Dog 继承自 Animal）。
换句话说，如果一个函数接收 `Sequence[Animal]`，我能传一个 `list[Dog]` 给它吗？

这涉及到了 **协变 (Covariance)** 的概念，TS 开发者对此应该很敏锐。我们下一章揭晓。
:::
