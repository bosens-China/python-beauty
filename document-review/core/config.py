from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_KEY: str = Field(..., description="OpenAI API key")

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )


try:
    settings = Settings()  # type: ignore
except Exception as e:
    print(f"❌ 配置加载失败: {e}")
    raise
