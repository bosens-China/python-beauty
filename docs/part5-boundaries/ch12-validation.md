# 不相信输入：运行时验证与 Pydantic

> **"Trust, but verify."**  
> **“信任，但要核实。”**  
> — _俄罗斯谚语_

---

我们在上一章通过 `dataclass` 定义了结构清晰的数据模型。但在软件工程中，有一个必须牢记的原则：**所有的外部输入都是不可信的，直到被验证为合法为止。**

- 前端传来的 JSON 中，一个字段本应是数字，实际却可能是字符串 `"123"`。
- 从数据库读出的时间戳，可能是一个字符串 `"2025-01-01"`，而不是 Python 的 `datetime` 对象。
- 大语言模型（LLM）生成的 JSON 数据，可能缺少必要字段，或者格式混乱。

虽然 Python 支持**类型注解**（Type Hints），但这些注解**仅用于开发阶段的静态检查和 IDE 提示，在程序运行时不会生效**。这意味着，如果你将不符合预期类型的数据传给函数或类，Python 解释器通常不会立即报错——错误可能在后续逻辑中才暴露出来，导致难以追踪的崩溃。

我们需要一位“守门员”，在数据进入系统边界时就进行严格检查和清洗。在现代 Python 生态中，这个角色的最佳人选就是 **Pydantic**。

## 静态的谎言 vs 动态的真相

让我们先看看标准库中的 `dataclass` 在面对脏数据时的局限性：

```python
from dataclasses import dataclass

@dataclass
class User:
    id: int      # 类型注解：期望是整数
    name: str    # 类型注解：期望是字符串

# ⚠️ 危险操作：
# 我们传入字符串 "100" 给 id 字段
user = User(id="100", name="Alice")

# Python 不会报错，直接接受！
print(type(user.id))  # 输出: <class 'str'>

# 💥 潜在炸弹：
# 如果后续代码执行 user.id + 1，会抛出 TypeError
```

这里的问题不仅是类型不符，更是**语义错误**：我们以为 `id` 是整数，但它实际上是字符串。这种错误往往在系统深处才爆发，调试成本极高。

因此，我们需要在数据**刚进入系统时**就完成验证和转换，而不是等到使用时才发现问题。

## Pydantic：数据的清洗机

**Pydantic** 是当前 Python 生态中最主流的运行时数据验证与解析库，也是 FastAPI、LangChain 等框架的核心依赖。它的核心抽象是 `BaseModel`。

> 💡 **安装提示**：请确保已安装 Pydantic。使用 `uv add pydantic`（或 `pip install pydantic`）即可。

### 1. 自动解析（Parsing）优于单纯验证

Pydantic 的设计理念不是简单地“拒绝错误数据”，而是尝试**智能地将输入数据解析为目标类型**。这种“宽容输入、严格输出”的策略极大简化了与外部系统的交互。

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    is_active: bool = True  # 默认值

# ✅ 场景 1：自动类型转换（Coercion）
# 输入 id 为字符串 "100"，Pydantic 自动转为整数 100
user = User(id="100", name="Alice")
print(user.id)        # 100
print(type(user.id))  # <class 'int'>

# ✅ 场景 2：使用默认值
# 未提供 is_active，自动使用默认值 True
print(user.is_active)  # True

# ❌ 场景 3：无法转换的数据
# "apple" 无法转为整数，立即抛出 ValidationError
try:
    User(id="apple", name="Alice")
except Exception as e:
    print(e)
    # 输出类似：
    # 1 validation error for User
    # id
    #   Input should be a valid integer, unable to parse string as an integer [type=int_parsing, ...]
```

这种能力让处理 HTTP 请求、环境变量、配置文件等外部输入变得安全而简洁。

> 📌 **术语说明**：
>
> - **验证（Validation）**：检查数据是否符合预期格式。
> - **解析（Parsing）**：尝试将原始数据（如字符串、字典）转换为目标类型。  
>   Pydantic 同时做这两件事，且优先尝试解析。

### 2. 嵌套模型与递归验证

现实中的数据往往是嵌套结构。Pydantic 能递归地验证整个对象树。

```python
from pydantic import BaseModel

class Address(BaseModel):
    city: str
    zip_code: str

class UserProfile(BaseModel):
    username: str
    address: Address         # 嵌套另一个模型
    tags: list[str]          # 列表元素也会被验证和转换

# 模拟来自 API 或数据库的原始数据
external_data = {
    "username": "bob",
    "address": {
        "city": "New York",
        "zip_code": 10001    # 注意：这里是整数
    },
    "tags": ["coder", 123]   # 包含整数
}

# 使用 model_validate（Pydantic v2 推荐方式）创建实例
profile = UserProfile.model_validate(external_data)

print(profile.address.city)     # New York
print(profile.address.zip_code) # "10001"（已转为字符串）
print(profile.tags)             # ["coder", "123"]
```

所有嵌套字段都会被递归验证和转换，确保最终得到的是**完全符合类型定义的干净对象**。

> 📘 **给 TypeScript 开发者的备注**：  
> Pydantic 在 Python 中的角色，类似于 TypeScript 生态中的 **Zod** 或 **io-ts**。
>
> - 在 TS 中，接口（interface）只在编译时存在，运行时需额外定义校验逻辑（如 `z.object({...})`）。
> - 而 Pydantic 允许你**用同一个类定义同时满足静态类型检查和运行时验证**，真正做到“一次定义，处处受益”。

## 进阶：声明式业务约束

除了基本类型转换，我们常需要更复杂的业务规则，例如：“年龄必须大于 0”、“密码长度不少于 8 位”。

Pydantic 提供了 `Field` 和 `field_validator` 来实现这些需求。

```python
from pydantic import BaseModel, Field, field_validator

class RegisterRequest(BaseModel):
    username: str
    age: int = Field(gt=0, le=150)  # gt=greater than, le=less than or equal
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError('Password must be at least 8 characters')
        return value  # 返回清洗后的值（可选）
```

- `Field(...)` 允许你在字段定义中直接添加约束（如数值范围、字符串长度等）。
- `@field_validator` 装饰器用于编写自定义验证逻辑，支持复杂规则。

这种方式将业务规则**内聚在数据模型中**，避免散落在控制器或服务层，提升代码可维护性。

> 🔍 **首次出现说明**：
>
> - `Field` 是 Pydantic 提供的一个函数，用于在类型注解中附加元数据（如默认值、约束条件）。
> - `@field_validator` 是一个类方法装饰器，用于注册字段级验证函数。它接收字段名作为参数，并在该字段被解析后自动调用。

## 序列化：轻松转回 JSON

上一章提到，`dataclass` 对象不能直接序列化为 JSON（尤其是包含 `datetime` 等非原生类型时）。Pydantic 则内置了强大的序列化支持。

```python
# 转为普通字典（适合传递给其他库）
data_dict = profile.model_dump()
print(data_dict)

# 直接转为 JSON 字符串（自动处理 datetime、Decimal 等）
json_str = profile.model_dump_json()
print(json_str)
```

这使得 Pydantic 成为构建 API 响应的理想选择——你只需返回模型实例，框架（如 FastAPI）会自动调用 `.model_dump()` 或 `.model_dump_json()`。

## 🧠 深度思考：Pydantic vs Dataclass？

> **既然 Pydantic 功能如此强大，为什么 Python 标准库还要引入 `dataclass`？我们是否应该全面弃用 `dataclass`？**

::: details 点击查看答案
这是一个关于**性能**与**职责边界**的权衡。

1. **性能差异**：

   - `dataclass` 是 Python 标准库的一部分，无额外依赖，创建对象开销极小。配合 `slots=True` 可进一步减少内存占用。
   - Pydantic 虽然 V2 版本用 Rust 重写后性能大幅提升，但仍比 `dataclass` 有额外的验证/解析开销。

2. **职责不同**：
   - **Pydantic** 适用于**系统边界**（Boundary）：处理来自 API、数据库、配置文件等**不可信来源**的数据。
   - **Dataclass** 适用于**系统内部**（Core）：在已验证的可信数据之间传递，强调轻量和效率。

✅ **最佳实践建议**：  
在 Web 层（如 FastAPI 路由）使用 Pydantic 模型接收和清洗外部输入；  
清洗完成后，若内部业务逻辑需要高频创建对象（如数据分析、算法计算），可将其转换为 `dataclass` 实例以提升性能。  
当然，如果性能不是瓶颈，全程使用 Pydantic 也是完全可行的。
:::

## 本章小结

在 Python 的动态世界中，Pydantic 是保障数据安全的关键工具。

1. **永远不要信任外部输入**：所有来自网络、文件、用户的数据都必须经过验证。
2. **解析优于拒绝**：Pydantic 会尝试将接近正确的数据自动转换为目标类型，提升鲁棒性。
3. **单一事实来源**：一个 Pydantic 模型同时提供：
   - 静态类型提示（IDE 补全、mypy 检查）
   - 运行时验证与清洗
   - JSON 序列化/反序列化能力

掌握 Pydantic，你就拥有了构建可靠、可维护的现代 Python 应用的基石。

现在，我们的代码已经足够健壮。但随着数据量增长和并发请求增多，你可能会听到这样的疑问：“Python 是不是太慢了？”那个传说中的 **GIL（全局解释器锁）** 到底是什么？它真的限制了 Python 的性能吗？

在下一章《并行：时间与成本的真相》中，我们将深入探讨 Python 的并发模型，揭开性能争议背后的本质。
