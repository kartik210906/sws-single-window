from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SWS AI Pre-Validation Microservice"
    DEBUG: bool = True
    # In production, specify specific domains for security (e.g. ["https://my-sws.gov.in"])
    ALLOWED_HOSTS: list[str] = ["*"] 
    OCR_LANGUAGES: list[str] = ["en"] # EasyOCR languages array. Defaults to English.
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
