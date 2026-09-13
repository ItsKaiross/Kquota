from models.usage import ProviderUsage


class UsageProvider:
    provider_id: str

    async def get_usage(self) -> ProviderUsage:
        raise NotImplementedError
