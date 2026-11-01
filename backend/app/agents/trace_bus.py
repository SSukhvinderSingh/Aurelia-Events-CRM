from __future__ import annotations

import asyncio
from typing import Any, Dict, List


class AgentTraceBus:
    """In-memory async event bus for streaming live sub-agent and MCP tool traces via SSE."""

    def __init__(self) -> None:
        self._run_events: Dict[str, List[Dict[str, Any]]] = {}
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def publish(self, run_id: str, payload: Dict[str, Any]) -> None:
        if run_id not in self._run_events:
            self._run_events[run_id] = []
        self._run_events[run_id].append(payload)
        for q in self._subscribers.get(run_id, []):
            try:
                q.put_nowait(payload)
            except Exception:
                pass

    def get_history(self, run_id: str) -> List[Dict[str, Any]]:
        return list(self._run_events.get(run_id, []))

    def subscribe(self, run_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        for item in self._run_events.get(run_id, []):
            q.put_nowait(item)
        self._subscribers.setdefault(run_id, []).append(q)
        return q

    def unsubscribe(self, run_id: str, q: asyncio.Queue) -> None:
        if run_id in self._subscribers and q in self._subscribers[run_id]:
            self._subscribers[run_id].remove(q)


trace_bus = AgentTraceBus()
