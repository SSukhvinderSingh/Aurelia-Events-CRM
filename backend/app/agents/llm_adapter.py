from __future__ import annotations

import json
from typing import Any, Dict, Optional
import httpx

from app.config import llm_config

try:
    from google.antigravity import Agent, AgentConfig, AgentBehavior, SubAgentConfig, MCPServerConfig  # type: ignore
    HAS_ANTIGRAVITY_SDK = True
except ImportError:
    HAS_ANTIGRAVITY_SDK = False

    class AgentBehavior:  # type: ignore
        AUTONOMOUS = "AUTONOMOUS"

    class MCPServerConfig:  # type: ignore
        def __init__(self, name: str, command: str, args: list, tools: Optional[list] = None) -> None:
            self.name = name
            self.command = command
            self.args = args
            self.tools = tools or []

    class SubAgentConfig:  # type: ignore
        def __init__(self, name: str, description: str, system_instruction: str, mcp_servers: list) -> None:
            self.name = name
            self.description = description
            self.system_instruction = system_instruction
            self.mcp_servers = mcp_servers

    class AgentConfig:  # type: ignore
        def __init__(
            self,
            name: str,
            model: str,
            behavior: str,
            system_instruction: str,
            sub_agents: list,
        ) -> None:
            self.name = name
            self.model = model
            self.behavior = behavior
            self.system_instruction = system_instruction
            self.sub_agents = sub_agents

    class Agent:  # type: ignore
        def __init__(self, config: AgentConfig) -> None:
            self.config = config


class UnifiedLLMAdapter:
    """
    LLM-agnostic adapter supporting:
    - Google Antigravity SDK / Gemini API
    - OpenAI / OpenAI-compatible API (OPENAI_BASE_URL)
    - Anthropic Messages API
    - Built-in Smart Autonomous Engine fallback when no live API key is populated
    """

    def synthesize_executive_brief(
        self,
        directive: str,
        event_name: str,
        default_summary: str,
    ) -> Dict[str, Any]:
        resolved = llm_config.resolve_active_provider()
        provider = resolved["active_provider"]
        model = resolved["active_model"]
        api_key = resolved["api_key"]

        if not api_key or provider == "autonomous_engine":
            return {
                "provider_used": "autonomous_engine",
                "model_used": model,
                "summary": default_summary,
            }

        prompt = (
            f"You are the Chief Event Director for {event_name}. "
            f"User Directive: '{directive}'. "
            f"Execution Summary: {default_summary}. "
            "Respond in 2 concise executive sentences confirming the autonomous multi-agent actions taken across Timeline, Vendors, and Budget."
        )

        try:
            if provider in ("gemini", "antigravity"):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                with httpx.Client(timeout=6.0) as client:
                    resp = client.post(
                        url,
                        json={"contents": [{"parts": [{"text": prompt}]}]},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = (
                            data.get("candidates", [{}])[0]
                            .get("content", {})
                            .get("parts", [{}])[0]
                            .get("text", "")
                            .strip()
                        )
                        if text:
                            return {"provider_used": provider, "model_used": model, "summary": text}

            elif provider == "openai":
                base_url = resolved["openai_base_url"].rstrip("/")
                with httpx.Client(timeout=6.0) as client:
                    resp = client.post(
                        f"{base_url}/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}"},
                        json={
                            "model": model,
                            "messages": [{"role": "user", "content": prompt}],
                            "max_tokens": 180,
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                        if text:
                            return {"provider_used": "openai", "model_used": model, "summary": text}

            elif provider == "anthropic":
                with httpx.Client(timeout=6.0) as client:
                    resp = client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": api_key,
                            "anthropic-version": "2023-06-01",
                        },
                        json={
                            "model": model,
                            "max_tokens": 180,
                            "messages": [{"role": "user", "content": prompt}],
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data.get("content", [{}])
                        text = content[0].get("text", "").strip() if content else ""
                        if text:
                            return {"provider_used": "anthropic", "model_used": model, "summary": text}
        except Exception:
            pass

        return {
            "provider_used": provider,
            "model_used": model,
            "summary": default_summary,
        }


llm_adapter = UnifiedLLMAdapter()
