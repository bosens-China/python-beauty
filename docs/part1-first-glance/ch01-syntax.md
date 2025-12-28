# 第一眼的温柔：代码与缩进

> **“Code is read much more often than it is written.”**  
> **“代码被阅读的次数，远多于被编写的次数。”**  
> — _吉多·范罗苏姆（Guido van Rossum），Python 之父_

---

当你第一次凝视一段优秀的 Python 代码时，你会感受到一种奇异的安静。

没有密密麻麻的分号结尾，没有层层叠叠的大括号嵌套，也没有冗长的类型声明前缀。它看起来不像是一堆机器指令的堆砌，而更像是一篇排版整洁的英文短文。

Python 的第一眼温柔，就藏在它对“形式”的极致苛求里。

## 视觉噪音的消除

在 C 语言家族（包括 Java、JavaScript、TypeScript、C++）中，我们习惯了用符号来界定逻辑的边界。

看看这段 TypeScript 代码：

```typescript
// TypeScript
function processUser(user: User) {
  if (user.isActive) {
    if (user.age > 18) {
      console.log("Access granted");
    } else {
      console.log("Too young");
    }
  }
}
```

这里有很多“视觉噪音”：大括号 `{}` 负责告诉编译器哪里是开始、哪里是结束；分号 `;` 负责告诉编译器这句话讲完了；圆括号 `()` 包裹着判断条件。

如果把这些符号去掉，代码的逻辑依然存在，只是编译器看不懂了。但在 Python 眼里，**如果人能通过排版看懂逻辑，为什么机器不能？**

于是，Python 拿掉了这些“拐杖”：

```python
# Python
def process_user(user: User):
    if user.is_active:
        if user.age > 18:
            print("Access granted")
        else:
            print("Too young")
```

注意到了吗？

- 没有 `{}`，只有**缩进**。
- 没有 `;`，**换行**即表示语句结束。
- 条件表达式不需要用 `()` 包裹（除非涉及复杂的运算优先级）。

这种设计强迫代码的**视觉结构**必须与**逻辑结构**保持一致。你看到的“形状”，就是代码运行的真实路径。

::: info 📝 给其他语言开发者的提示：关键字的自然化
Python 甚至把很多逻辑符号也换成了英语单词，以进一步降低阅读门槛：

- `&&` 变成了 **`and`**
- `||` 变成了 **`or`**
- `!` 变成了 **`not`**
- `this`（在类方法中）变成了 **`self`**
- `null` 变成了 **`None`**
- `true/false` 变成了 **`True/False`**（注意首字母大写）

因此，一段条件判断可以读作自然语言：  
`if not user.is_active and user.has_permission:`
:::

## 缩进：秩序的基石

在其他语言中，缩进只是为了提高可读性。你可以把整段 JavaScript 代码写在一行里，机器照样能运行（例如压缩后的 Minified JS）。

**但在 Python 中，缩进是语法的一部分，具有法律效力。**

缩进决定了代码块（code block）的归属。如果你少敲了一个空格，或者混用了 Tab 和空格，Python 解释器会毫不留情地抛出 `IndentationError` 并拒绝运行程序。

### 黄金规则：4 个空格

虽然 Python 允许使用任意数量的空格或 Tab 进行缩进（只要同一层级保持一致），但在工程实践中，全世界的 Python 开发者都遵循同一个规范——来自官方风格指南 [PEP 8](https://peps.python.org/pep-0008/) 的建议：

> **使用 4 个空格进行缩进。不要使用 Tab。**

::: tip 💡 现代编辑器的帮助
如果你按照本书序言的建议配置了 **VS Code** 和 **Ruff**（一个快速的 Python Linter 和 Formatter），你不需要手动数空格。  
当你按下 `Tab` 键时，VS Code 会自动将其转换为 4 个空格。Ruff 也会在保存文件时自动修复不规范的缩进。
:::

### 缩进带来的“强制优雅”

这种强制性缩进带来了一个意想不到的好处：**它限制了嵌套的深度。**

在 JavaScript 或 TypeScript 中，即使你写了 5 层甚至更深的嵌套（比如“回调地狱”），代码依然能运行，尽管难以维护。  
而在 Python 中，每深入一层，代码就会向右缩进 4 个字符。当缩进达到 4 ～ 5 层时，代码会严重右移，视觉上非常拥挤。这种“不适感”会促使你思考：“我是不是该把这段逻辑提取成一个独立的函数？”

**Python 通过视觉反馈，引导你写出结构更扁平、更易读的代码。** 这正是《Python 之禅》（The Zen of Python）中所倡导的：“_Flat is better than nested._（扁平优于嵌套）。”

## 文档即代码：Docstrings

Python 的温柔还体现在它对待文档的态度上。

在 TypeScript 中，我们通常使用 JSDoc（如 `/** ... */`）来编写注释。这些注释主要用于开发者阅读，在编译后通常会被移除（除非生成 `.d.ts` 声明文件）。

而在 Python 中，**文档字符串（docstring）是一等公民**。它不仅是给人看的说明，更是程序运行时可访问的对象属性。

```python
def calculate_area(radius: float) -> float:
    """
    根据半径计算圆的面积。

    这里可以写更详细的计算逻辑描述，
    甚至包含使用的数学公式。
    """
    return 3.14 * radius ** 2

# 在运行时，我们可以直接访问这个文档！
print(calculate_area.__doc__)
```

当你在函数、类或模块的第一行使用三重引号 `"""..."""`（或 `'''...'''`）包裹一段文字时，Python 会自动将其存储在对象的 `__doc__` 属性中。

这意味着，像 FastAPI、Sphinx 这样的工具可以直接读取你的代码文档，自动生成网页版 API 接口文档。**你写代码的同时，就在写产品说明书。**

> 💡 **补充说明**：`-> float` 是**类型注解（type annotation）**，表示该函数返回一个浮点数。这是 Python 3.5 引入的可选特性，用于提升代码可读性和工具支 持（如 IDE 提示、类型检查器）。它不影响程序运行，但强烈推荐使用。

## 变量名风格：Snake Case

最后，让我们聊聊命名约定。

在 TypeScript、Java 等语言生态中，主流是 **小驼峰命名法（camelCase）**，如 `getUserInfo`。  
而在 Python 生态中，主流是 **蛇形命名法（snake_case）**，即用下划线 `_` 连接单词，如 `get_user_info`。

这并非强制语法，而是由 [PEP 8](https://peps.python.org/pep-0008/#naming-conventions) 定义的**强烈社区规范**：

- **变量、函数、模块名**：使用 `snake_case`  
  示例：`user_name`, `calculate_total_price`, `my_script.py`
- **类名、异常名**：使用 `PascalCase`（大驼峰）  
  示例：`UserProfile`, `NetworkError`
- **常量**：使用全大写 `UPPER_SNAKE_CASE`  
  示例：`MAX_RETRY_COUNT`, `PI = 3.14159`

下划线 `_` 在视觉上增加了单词之间的间距，使得长名称更易阅读，仿佛单词之间有了“呼吸的空间”。

## 🧠 深度思考

> **如果你在 VS Code 中使用了 Ruff，并开启了保存时自动格式化，那么你还需要手动检查缩进吗？**
>
> **答案是：**
>
> ::: details 点击查看答案
> **仍然需要。** Ruff 是一个强大的 Linter 和 Formatter 工具，它能帮助你**自动修正**不符合规范的缩进（比如将 Tab 转为空格、统一缩进层级）。
>
> 但它无法判断你的**逻辑是否正确**。例如，如果你本应将某行代码缩进到 `if` 块内，却错误地放在了外面，Ruff 可能不会报错（因为它只检查格式一致性），但程 序逻辑会出错。
>
> 更重要的是，**Python 的缩进是语法级别的**。即使 Ruff 自动帮你补齐了空格，如果你的缩进层级与逻辑意图不符，Python 解释器在运行时仍会抛出 `IndentationError` 或导致逻辑错误。
>
> 因此，**理解缩进如何定义代码块，以及养成清晰、一致的缩进习惯，是 Python 编程的必修课。**
> :::

## 本章小结

Python 的“第一眼”，是干净的、安静的。

它剥离了所有非必要的符号，强迫逻辑结构与视觉排版对齐。当你开始适应这种没有大括号、使用下划线连接单词、像写文章一样写代码的风格时，你会发现：

你不再是在“编码（Coding）”，而是在“叙述（Narrating）”。

接下来，让我们深入代码的内部，去看看那些看似简单的单词——**变量**，在 Python 中究竟代表着什么。那里的世界，可能和你从其他语言中获得的经验完全不同。
