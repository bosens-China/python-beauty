# 第 17 章：实战生态 —— Pydantic 与 FastAPI

> **"Knowing is not enough; we must apply. Willing is not enough; we must do."**
>
> **“光知晓是不够的，我们必须应用；光有意愿是不够的，我们必须行动。”**
>
> — _约翰·沃尔夫冈·冯·歌德 (Johann Wolfgang von Goethe)_

---

::: tip 💡 上一章答案揭晓
如果收到一个巨大的 JSON 字符串，调用 `json.loads(huge_str)` 会发生什么？
**会卡死 Event Loop。** 因为 `json.loads` 是 CPU 密集型的同步操作。
**解决方案**：使用 `run_in_executor` 将其扔到进程池中执行。

```python
loop = asyncio.get_running_loop()
# 注意：解析 JSON 也是 CPU 密集型任务，不要在主线程做！
data = await loop.run_in_executor(None, json.loads, huge_str)
```

:::

如果你问现在的 Python 开发者：“是什么让 Python 在 Web 和 AI 领域焕发第二春？” 答案一定是：**类型提示 (Type Hints) 的工程化落地**。

我们在第 9 章讨论了 **IO 边界** 的痛点：外部数据（JSON）是“脏”的，原生类型系统无法防御。而 **Pydantic** 就是为了解决这个问题而生的。而 **FastAPI** 则更进一步，将类型系统变成了 API 的路由、文档和验证机制。

## 17.1 Pydantic：重建 IO 边界的信任

我们在第 9 章学过 `dataclass`。它很棒，但它不验证数据。如果你定义 `age: int`，然后传个字符串 `"18"` 给 `dataclass`，它会照单全收，留给你一个隐患。

但在 Web 开发中，前端传来的 JSON 永远是字符串和数字的混合体。我们需要的是 **解析 (Parsing)** 而不仅仅是 **验证 (Validation)**。

### 17.1.1 定义模型与解析

Pydantic 的核心是 `BaseModel`。它利用 Python 的 **元类 (Metaclass)** 拦截了类的创建过程，将类型注解转化为运行时的校验逻辑。

_注：以下代码基于 Pydantic V2 (由 Rust 重写，速度极快)。_

```python
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

# 定义一个 Pydantic 模型
class UserSchema(BaseModel):
    id: int
    username: str
    email: EmailStr  # Pydantic 特有的类型，会自动校验 email 格式

    # Field 用于添加元数据（如默认值、校验规则）
    # alias 允许前端传 "signup_timestamp"，后端自动映射为 "signup_ts"
    signup_ts: datetime | None = Field(default=None, alias="signup_timestamp")

    friends: list[int] = []

# 实战：数据解析与清洗
# 模拟从前端 API 接收到的"脏" JSON 数据
external_data = {
    "id": "123",            # ⚠️ 注意：这是字符串
    "username": "alicedev",
    "email": "alice@example.com",
    "signup_timestamp": "2023-01-01 12:00:00", # ⚠️ 字符串时间
    "friends": [1, "2", 3]  # ⚠️ 混合类型
}

# Pydantic 会自动进行"类型强制转换" (Coercion)
# 使用 model_validate (V2 标准 API)
user = UserSchema.model_validate(external_data)

print(user.id)        # 123 (变成了真正的 int)
print(user.signup_ts) # datetime 对象 (自动解析了字符串)
print(user.friends)   # [1, 2, 3] (全部转为 int)

# 序列化回 JSON
print(user.model_dump_json())
```

### 17.1.2 校验 vs 解析

这是 Pydantic 与其他校验库最大的不同。它不仅仅是检查 "Is this an int?"，而是尝试 **"Make this an int"**。

- 如果传 `"123"` 给 `int` 字段 -> 成功转换为 `123`。
- 如果传 `"apple"` 给 `int` 字段 -> 抛出 `ValidationError`。

这种机制极大地简化了 API 接口的处理逻辑。

::: info 📝 TS 开发者便签：Zod / io-ts
Pydantic 相当于 TS 生态中的 **Zod** 或 **class-validator**。

- **TS**: TS 的 Interface 在运行时不存在，所以你必须用 Zod 再写一遍 schema (`z.object({...})`) 才能在运行时校验。
- **Python**: Pydantic 直接利用 Python 的类定义语法 (`class User(BaseModel)`) 同时完成了“静态类型定义”和“运行时 Schema 生成”。

这就是 Python “代码即数据”哲学的极致体现：你只需要写一次定义，既是 IDE 的补全依据，也是运行时的清洗器。
:::

## 17.2 FastAPI：类型驱动的 Web 框架

FastAPI 是建立在 Pydantic 和 AsyncIO (Starlette) 之上的。它的核心理念是：**你写的类型注解，就是 API 文档和逻辑。**

### 17.2.1 极简路由与自动文档

看看下面这段代码，全是我们在前几章学过的：装饰器、类型注解、默认值、枚举。

```python
from typing import Annotated
from enum import Enum
from fastapi import FastAPI, Query, Path

app = FastAPI()

class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"

@app.get("/models/{model_name}")
async def get_model(
    # Path Parameter: 使用 Path() 提供校验元数据
    # Annotated 是 Python 3.9+ 的标准写法，用于附加元数据
    model_name: Annotated[ModelName, Path(title="The ID of the model to get")],

    # Query Parameter: 既然是 int | None，FastAPI 自动知道这是可选的查询参数 ?page=1
    page: Annotated[int | None, Query(gt=0)] = 1
):
    # 这里的 model_name 是枚举类型，IDE 会自动补全
    if model_name is ModelName.alexnet:
        return {"model_name": model_name, "message": "Deep Learning FTW!"}

    return {"model_name": model_name, "message": "Have some residuals"}
```

当你运行这段代码时，FastAPI 会做以下事情：

1.  **反射 (Reflection)**: 读取函数签名，发现 `model_name` 是 `ModelName` 枚举，`page` 是 `int`。
2.  **生成**: 自动生成符合 **OpenAPI (Swagger)** 标准的交互式文档（访问 `/docs` 即可见）。
3.  **校验**: 当请求进来时，自动校验 URL 参数。如果不匹配，直接返回 422 错误。

### 17.2.2 依赖注入 (Dependency Injection)

FastAPI 的依赖注入系统非常 Pythonic，它使用 `Depends`。这与 NestJS 或 Java Spring 的 DI 不同，它不需要复杂的容器配置，而是基于**函数组合**。

```python
from fastapi import Depends

# 这是一个普通的函数，或者类，或者 async 函数
# 它可以处理通用的逻辑，比如分页、鉴权、数据库连接
async def common_parameters(q: str | None = None, skip: int = 0, limit: int = 100):
    return {"q": q, "skip": skip, "limit": limit}

@app.get("/items/")
async def read_items(commons: Annotated[dict, Depends(common_parameters)]):
    # 当请求到达这里时，FastAPI 已经先执行了 common_parameters
    # 并把结果赋值给了 commons
    return commons

@app.get("/users/")
async def read_users(commons: Annotated[dict, Depends(common_parameters)]):
    # 复用了同样的依赖逻辑，无需重复写 query params
    return commons
```

::: info 📝 TS 开发者便签：DI 对比

- **NestJS**: 使用基于 Class 和 Decorator 的依赖注入容器（IoC Container），通常比较“重”，需要注册 Module 和 Provider。
- **FastAPI**: 依赖注入是基于 **DAG (有向无环图)** 解析的。`Depends` 只是告诉框架“在执行这个路由之前，先去执行那个函数，并把结果传给我”。它极其轻量且直观。
  :::

## 17.3 综合实战：构建一个类型安全的微服务

让我们把全书的知识点串起来，写一个模拟的用户注册服务。
我们会用到：`AsyncIO` (第 16 章), `Context Manager` (第 14 章), `Pydantic` (本章), `FastAPI` (本章), 以及 `Type Hinting` (全书)。

```python
from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr

# --- 1. 数据模型 (Domain/Schema Layer) ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

# --- 2. 模拟数据库 (Infrastructure Layer) ---
# 使用 AsyncIO 模拟异步 DB
class FakeDB:
    def __init__(self):
        self.users: dict[int, dict] = {}
        self.counter = 0

    async def create_user(self, user: UserCreate) -> UserResponse:
        # 模拟 IO 延迟 (第 16 章知识点)
        import asyncio
        await asyncio.sleep(0.1)

        self.counter += 1
        new_user = {
            "id": self.counter,
            "username": user.username,
            "email": user.email
        }
        self.users[self.counter] = new_user
        # Pydantic 模型可以直接从字典转换
        return UserResponse(**new_user)

db_instance = FakeDB()

# --- 3. 生命周期管理 (Lifespan) ---
# 替代旧版的 @app.on_event
# 这正是第 14 章 Context Manager 的应用！
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: Connecting to DB...")
    # 这里可以做真实的 DB 连接
    yield
    print("Shutdown: Closing DB...")

app = FastAPI(lifespan=lifespan)

# --- 4. 依赖注入 ---
async def get_db() -> FakeDB:
    return db_instance

# --- 5. 路由控制 (Controller Layer) ---
@app.post("/users/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Annotated[FakeDB, Depends(get_db)]
):
    # 这里 user_data 已经被 Pydantic 校验并转换成了对象
    # db 已经被依赖注入系统填充
    return await db.create_user(user_data)
```

这段代码只有短短几十行，但它具备了现代 Web 服务的所有特征：

1.  **类型安全**：输入输出都有 Pydantic 严格定义。
2.  **异步高效**：核心逻辑全是 `async/await`，不阻塞 Event Loop。
3.  **架构清晰**：数据层、依赖层、控制层分离。
4.  **自动文档**：直接访问 `/docs` 就能测试接口。

## 本章小结

FastAPI 和 Pydantic 是 Python "Type Hints" 运动的巅峰之作。它们证明了 Python 不仅仅能写脚本，更能以一种极其优雅、高效的方式构建复杂的 Web 系统。

1.  **Pydantic** 是你的守门员，它在 IO 边界处将脏数据清洗为类型安全的对象。
2.  **FastAPI** 是你的指挥官，它利用类型注解自动处理路由、验证和文档。
3.  **组合的力量**：当你把 AsyncIO、Context Manager 和 Type Hints 结合在一起时，你就在编写最现代、最 Pythonic 的代码。

至此，我们的实战演练结束。你已经掌握了 Python 语言的精髓。在全书的最后，让我们回到原点，谈谈 Python 编程的哲学与平衡。
