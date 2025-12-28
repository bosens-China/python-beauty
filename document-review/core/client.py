from langchain_openai import ChatOpenAI
from core.config import settings
from pydantic import SecretStr

model = ChatOpenAI(
    api_key=SecretStr(settings.API_KEY),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    model="qwen3-max",
    streaming=True,
    temperature=0.7,
)
