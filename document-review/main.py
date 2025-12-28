from pathlib import Path
from langchain_core.messages import SystemMessage, HumanMessage
from core.client import model
import json
from typing import Literal
from pydantic import BaseModel

current_dir = Path(__file__).parents[1]
docs_dir = current_dir / "docs"
docs_list = current_dir / "document-review" / "docs_list.json"


class Item(BaseModel):
    path: str
    status: Literal["pending", "done"]
    title: str


# 校验docs list下的文件是否存在
def check_docs_list():
    if not docs_list.exists():
        raise FileNotFoundError(f"文件不存在：{docs_list}")
    raw_list = json.loads(docs_list.read_text(encoding="utf-8"))
    task_list: list[Item] = [Item(**task) for task in raw_list]
    for task in task_list:
        file = docs_dir / task.path
        if not file.exists():
            raise FileNotFoundError(f"文件不存在：{file}")
    print("文件校验通过")
    return task_list


# 保存任务列表
def save_task_list(task_list: list[Item]):
    docs_list.write_text(
        json.dumps(
            [task.model_dump() for task in task_list], ensure_ascii=False, indent=2
        ),
        encoding="utf-8",
    )
    print("任务列表已保存")


def llm_output(task: Item):
    file = docs_dir / task.path
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
        response = model.invoke(
            [
                SystemMessage("""
你是一名技术类电子书出版社编辑。

本书基于 Python 3.12，目标读者是【编程零基础】读者，
也兼顾刚入门和从其他语言转到 Python 的开发者。

请你严格站在“纯 0 基础读者”的角度，
对我已经写好的章节内容进行审读和编辑：

- 如果有任何对零基础读者来说背景不足、理解有跳跃的地方，请补充必要说明；
- 对于本章节中**第一次出现的语法、类型注解或写法**，请进行简要介绍；
- 如果存在用词不专业、语气不符合正式出版技术书籍要求的地方，请进行修改；
- 不改变原有技术意图和整体结构，仅在必要处补充或润色。

请使用兼容 VitePress 的 Markdown，
直接输出【修改和补充后的完整章节内容】。
                          """),
                HumanMessage(content),
            ]
        )
        with open(file, "w", encoding="utf-8") as f:
            if isinstance(response.content, str):
                f.write(response.content)

        print(f"任务完成：{task.title}")


def main():
    task_list = check_docs_list()
    try:
        for task in task_list:
            if task.status == "done":
                print(f"任务初始化状态已完成，跳过：{task.title}")
                continue
            llm_output(task)
            task.status = "done"
    finally:
        save_task_list(task_list)


if __name__ == "__main__":
    main()
