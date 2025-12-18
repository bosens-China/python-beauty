# 第 15 章：并发的抉择 —— 成本与模型

> **"Two stars keep not their motion in one sphere."** > **“两个星球不能在同一个轨道上运行。”**
> — _威廉·莎士比亚，《亨利四世》 (William Shakespeare, Henry IV)_

---

这句诗完美地隐喻了 Python 的 **GIL**：在同一个解释器进程中，同一时刻只能有一个线程在执行 Python 字节码。但在此之前，我们需要先谈谈 Python 代码运行的“价格”。

## 15.1 Python 的真实成本模型 (The Cost Model)

很多从静态语言（甚至 V8 JS）转过来的开发者，容易把 Python 当作编译型语言来写，结果导致性能惨不忍睹。

### 15.1.1 抽象不是免费的

在 Python 中，**一切皆对象**，**一切皆字典查找**。

- 当你访问 `obj.x` 时，Python 实际上是在遍历 MRO（方法解析顺序），在各种 `__dict__` 中查找 `x`。
- 当你调用一个函数时，Python 需要创建栈帧（Stack Frame），这是比较昂贵的操作。
- 当你使用装饰器时，你实际上增加了一层函数调用开销。

**残酷的对比**：

```python
# 方案 A：扁平结构（Pythonic & Fast）
total = 0
for i in range(1000):
    total += i

# 方案 B：过度抽象（Enterprise & Slow）
class NumberProcessor:
    @property
    def value(self): return self._val

    def process(self, i):
        self._val += i

# 方案 B 比 方案 A 慢 5-10 倍不止。
```

### 15.1.2 为什么推崇“扁平代码”？

Python 之禅说：“**Flat is better than nested**”。
这不仅是为了可读性，更是为了性能。

- **List Comprehension (列表推导式)** 比 `for` 循环快，因为它是 C 语言层面的循环，减少了 Python 字节码的解释开销。
- **内置函数 (sum, map)** 通常比手写循环快。

### 📝 TS 开发者便签：V8 vs CPython

> - **V8 (Chrome/Node)**: 拥有极其激进的 JIT (Just-In-Time) 编译器。它会把你的热点 JS 代码编译成机器码，并且通过 Inline Caching (内联缓存) 消除属性查找的开销。所以你在 JS 里写深层对象嵌套，性能损耗并不大。
> - **CPython (标准 Python)**: 是解释执行的（虽然有 pyc 字节码，但那是给虚拟机看的）。每一次属性访问、每一次加法，通常都需要经过解释器的动态分发。
> - **结论**：在 Python 中，**不要过度封装**。在热点代码路径（Hot Path）上，保持简单和扁平。

## 15.2 GIL：被误解的“恶魔”

有了成本概念，我们再来看并发。你可能听说过：“因为有 GIL，所以 Python 的多线程是假的。”

**这是片面的。** GIL 的存在是为了保护解释器内部内存管理（引用计数）的线程安全。

### 15.2.1 GIL 的工作机制

1.  **持有锁**：当线程执行 Python 字节码（CPU 计算、逻辑判断）时，必须持有 GIL。
2.  **释放锁**：当线程进行 **I/O 操作**（读写文件、网络请求、Sleep）或调用密集型 **C 扩展**（如 NumPy 矩阵运算）时，线程会**主动释放** GIL。

### 15.2.2 判决书

- **CPU 密集型**（视频转码、复杂的数学计算）：GIL 导致多线程退化为串行，甚至因为锁竞争比单线程更慢。-> **多线程无效**。
- **IO 密集型**（爬虫、Web 服务、数据库读写）：线程 A 在等数据库返回时释放 GIL，线程 B 可以继续执行。-> **多线程有效且推荐**。

## 15.3 选手一：多线程 (`threading`)

这是处理 **阻塞式 I/O (Blocking I/O)** 的传统方案。
如果你使用的库（如 `requests`, `pandas`）不支持 `async/await`，但你需要并发，就用它。

### 现代写法：`ThreadPoolExecutor`

不要手动 `Thread()`，请使用线程池。

```python
import time
from concurrent.futures import ThreadPoolExecutor

def fetch_url(url: str) -> str:
    # 模拟阻塞 IO：此时 GIL 会释放！其他线程可以运行。
    time.sleep(1)
    return f"Data from {url}"

def main():
    urls = ["url1", "url2", "url3"]
    # 3 个线程并行，总耗时约 1 秒，而不是 3 秒
    with ThreadPoolExecutor(max_workers=3) as executor:
        results = executor.map(fetch_url, urls)
```

## 15.4 选手二：多进程 (`multiprocessing`)

这是处理 **CPU 密集型** 任务的唯一解药。
既然 GIL 限制了一个解释器只能用一个核，那我就启动 8 个解释器！

### 代价

1.  **内存开销**：每个进程都有独立的内存空间（Copy-on-Write 机制在 Python 中效果有限，因为引用计数会频繁写入内存）。
2.  **通信成本**：进程间通信 (IPC) 需要序列化 (Pickle) 数据，这非常慢。

```python
from concurrent.futures import ProcessPoolExecutor

def heavy_computation(x: int) -> int:
    # 纯 CPU 计算：GIL 始终被持有
    return sum(i * i for i in range(10_000_000))

# 必须放在 if __name__ == "__main__": 下，否则 Windows 会无限递归报错
if __name__ == "__main__":
    with ProcessPoolExecutor() as executor:
        # 利用多核 CPU 并行计算
        results = executor.map(heavy_computation, [1, 2, 3])
```

## 15.5 选手三：AsyncIO (单线程协作式)

这是现代 Python Web 开发（FastAPI）的标准。它本质上和 Node.js 一样，是 **单线程 + 事件循环**。

- **优点**：极致轻量。一个线程可以处理数万个协程。上下文切换由程序控制（`await`），无系统调用开销。
- **缺点**：**传染性**。一旦用了 `async`，整个调用链都得是 `async`。且不能有任何阻塞代码。

## 15.6 终极决策矩阵

这是本章的核心，请将其作为架构设计的依据：

| 场景                    | 特征                 | 推荐方案    | 理由                                 | Node.js 对标                |
| :---------------------- | :------------------- | :---------- | :----------------------------------- | :-------------------------- |
| **Web API / 微服务**    | 高并发，大量网络等待 | **AsyncIO** | 吞吐量最高，资源最少                 | Event Loop (Native)         |
| **爬虫 (海量)**         | 数万 URL             | **AsyncIO** | 线程开多了会 OOM (内存溢出)          | -                           |
| **爬虫 (少量/简单)**    | 几十个 URL，逻辑简单 | **多线程**  | 编程模型简单，不具有传染性           | -                           |
| **科学计算 / 图像处理** | 吃满 CPU             | **多进程**  | 只有它能绕过 GIL                     | Worker Threads / Clustering |
| **文件处理**            | 极多小文件读写       | **多线程**  | 磁盘 IO 是瓶颈，AsyncIO 文件支持一般 | `fs.promises`               |

### 混合架构：AsyncIO + ProcessPool

在 FastAPI 项目中，如果你需要处理一个 CPU 密集型任务（比如生成 PDF 或 Resize 图片），**千万不要**直接写在 `async def` 里，那会卡死整个服务。

**正确做法**：将 CPU 任务“外包”给进程池。

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor

# CPU 任务 (同步代码)
def resize_image(image_bytes):
    pass

async def handle_upload(image):
    loop = asyncio.get_running_loop()

    # "Run in executor": 将同步任务投递到进程池，并 await 结果
    # 主线程继续响应其他 HTTP 请求，互不干扰
    with ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, resize_image, image)
```

---

**本章小结**

1.  **成本意识**：Python 的抽象是有代价的。在热点代码中，扁平优于嵌套。
2.  **GIL 真相**：它只杀 CPU 任务，不杀 IO 任务。
3.  **架构选择**：
    - IO 多？选 **AsyncIO**。
    - CPU 多？选 **多进程**。
    - 混着用？用 `run_in_executor` 桥接。

理解了这些，你就明白了为什么 FastAPI 那么快（基于 AsyncIO），也明白了为什么做 AI 训练时我们要用 PyTorch/NumPy（底层 C++ 释放了 GIL，或者是多进程数据加载）。

下一章，我们将深入 **AsyncIO** 的细节，掌握协程、任务组（TaskGroup）以及如何避免阻塞循环的实战技巧。
