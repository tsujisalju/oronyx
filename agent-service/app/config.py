from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    sui_rpc_url: str = Field(
        default="https://fullnode.testnet.sui.io:443", alias="SUI_RPC_URL"
    )
    # pysui's gRPC profiles use a bare host:port, not a URL with scheme —
    # kept as a separate setting rather than derived from sui_rpc_url.
    sui_grpc_url: str = Field(
        default="fullnode.testnet.sui.io:443", alias="SUI_GRPC_URL"
    )
    oronyx_package_id: str = Field(default="", alias="ORONYX_PACKAGE_ID")
    executor_url: str = Field(
        default="http://executor:4000", alias="ORONYX_EXECUTOR_URL"
    )

    class Config:
        env_file = ".env"
        populate_by_name = True
        extra = "ignore"


settings = Settings()
