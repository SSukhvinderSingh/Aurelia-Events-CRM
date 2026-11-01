from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=False)
else:
    load_dotenv(override=False)


class LLMConfigManager:
    """LLM-agnostic configuration loader supporting .env and runtime overrides."""

    DEFAULT_MODELS = {
        "antigravity": "gemini-2.5-pro",
        "gemini": "gemini-2.5-flash",
        "openai": "gpt-4o",
        "anthropic": "claude-3-7-sonnet-latest",
        "autonomous_engine": "antigravity-swarm-deterministic-v1",
    }

    def __init__(self) -> None:
        self._runtime_overrides: Dict[str, str] = {}

    def get(self, key: str, default: str = "") -> str:
        if key in self._runtime_overrides and self._runtime_overrides[key] != "":
            return self._runtime_overrides[key]
        return os.getenv(key, default).strip()

    def update_runtime(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        antigravity_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        openai_base_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        if provider is not None:
            self._runtime_overrides["LLM_PROVIDER"] = provider.strip()
        if model is not None:
            self._runtime_overrides["LLM_MODEL"] = model.strip()
        if gemini_api_key is not None:
            self._runtime_overrides["GEMINI_API_KEY"] = gemini_api_key.strip()
        if antigravity_api_key is not None:
            self._runtime_overrides["ANTIGRAVITY_API_KEY"] = antigravity_api_key.strip()
        if openai_api_key is not None:
            self._runtime_overrides["OPENAI_API_KEY"] = openai_api_key.strip()
        if anthropic_api_key is not None:
            self._runtime_overrides["ANTHROPIC_API_KEY"] = anthropic_api_key.strip()
        if openai_base_url is not None:
            self._runtime_overrides["OPENAI_BASE_URL"] = openai_base_url.strip()
        return self.get_status()

    def resolve_active_provider(self) -> Dict[str, Any]:
        configured_provider = self.get("LLM_PROVIDER", "auto").lower()
        explicit_model = self.get("LLM_MODEL", "")
        antigravity_key = self.get("ANTIGRAVITY_API_KEY") or self.get("GEMINI_API_KEY")
        gemini_key = self.get("GEMINI_API_KEY") or self.get("ANTIGRAVITY_API_KEY")
        openai_key = self.get("OPENAI_API_KEY")
        anthropic_key = self.get("ANTHROPIC_API_KEY")
        openai_base_url = self.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

        if configured_provider == "antigravity" and antigravity_key:
            provider = "antigravity"
            api_key = antigravity_key
        elif configured_provider == "gemini" and gemini_key:
            provider = "gemini"
            api_key = gemini_key
        elif configured_provider == "openai" and openai_key:
            provider = "openai"
            api_key = openai_key
        elif configured_provider == "anthropic" and anthropic_key:
            provider = "anthropic"
            api_key = anthropic_key
        elif configured_provider == "auto":
            if antigravity_key:
                provider = "antigravity"
                api_key = antigravity_key
            elif openai_key:
                provider = "openai"
                api_key = openai_key
            elif anthropic_key:
                provider = "anthropic"
                api_key = anthropic_key
            else:
                provider = "autonomous_engine"
                api_key = ""
        else:
            provider = "autonomous_engine"
            api_key = ""

        model = explicit_model or self.DEFAULT_MODELS.get(provider, "antigravity-swarm-deterministic-v1")
        return {
            "configured_provider": configured_provider,
            "active_provider": provider,
            "active_model": model,
            "api_key": api_key,
            "openai_base_url": openai_base_url,
            "has_live_key": bool(api_key),
        }

    def get_status(self) -> Dict[str, Any]:
        resolved = self.resolve_active_provider()
        return {
            "configured_provider": resolved["configured_provider"],
            "active_provider": resolved["active_provider"],
            "active_model": resolved["active_model"],
            "has_live_key": resolved["has_live_key"],
            "openai_base_url": resolved["openai_base_url"],
            "keys_configured": {
                "gemini": bool(self.get("GEMINI_API_KEY")),
                "antigravity": bool(self.get("ANTIGRAVITY_API_KEY")),
                "openai": bool(self.get("OPENAI_API_KEY")),
                "anthropic": bool(self.get("ANTHROPIC_API_KEY")),
            },
            "sdk_mode": "Google Antigravity SDK + FastMCP Swarm",
        }


llm_config = LLMConfigManager()
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{ROOT_DIR / 'events_crm.db'}")
