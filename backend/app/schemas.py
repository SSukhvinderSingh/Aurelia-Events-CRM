from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChecklistItem(BaseModel):
    id: str
    text: str
    completed: bool = False


class TimelineNodeCreate(BaseModel):
    title: str
    phase: str = "1_month_out"
    swimlane: str = "milestone"
    scheduled_date: str = "2026-11-15"
    start_time: str = "10:00"
    duration_hours: float = 2.0
    status: str = "pending"
    critical_path: bool = False
    owner_agent: str = "Timeline Architect"
    description: str = ""
    dependency_ids: List[str] = Field(default_factory=list)
    checklist: List[ChecklistItem] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TimelineNodeUpdate(BaseModel):
    title: Optional[str] = None
    phase: Optional[str] = None
    swimlane: Optional[str] = None
    scheduled_date: Optional[str] = None
    start_time: Optional[str] = None
    duration_hours: Optional[float] = None
    status: Optional[str] = None
    critical_path: Optional[bool] = None
    description: Optional[str] = None
    dependency_ids: Optional[List[str]] = None
    checklist: Optional[List[ChecklistItem]] = None
    metadata: Optional[Dict[str, Any]] = None


class EventVendorAssignRequest(BaseModel):
    vendor_id: str
    timeline_node_id: Optional[str] = None
    phase: str = "3_months_out"
    stage: str = "Shortlisted"
    quoted_amount: Optional[float] = None
    notes: str = ""


class EventVendorUpdateRequest(BaseModel):
    stage: Optional[str] = None
    phase: Optional[str] = None
    timeline_node_id: Optional[str] = None
    quoted_amount: Optional[float] = None
    contracted_amount: Optional[float] = None
    paid_amount: Optional[float] = None
    rfp_draft: Optional[str] = None
    checklist: Optional[List[ChecklistItem]] = None
    notes: Optional[str] = None


class BudgetTrancheUpsertRequest(BaseModel):
    id: Optional[str] = None
    title: str
    category: str
    phase: str = "3_months_out"
    tranche_type: str = "Deposit (50%)"
    allocated_amount: float
    committed_amount: float = 0.0
    paid_amount: float = 0.0
    due_date: str = "2026-11-01"
    status: str = "Scheduled"
    timeline_node_id: Optional[str] = None
    event_vendor_id: Optional[str] = None
    notes: str = ""


class IdeaCreateRequest(BaseModel):
    title: str
    category: str = "Signature Experience"
    phase: str = "event_day"
    estimated_cost: float = 2500.0
    guest_impact_score: int = 94
    description: str = ""


class AutonomousDirectiveRequest(BaseModel):
    directive: str
    focus_phase: Optional[str] = None


class EventCreateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    event_type: str = "wedding"  # wedding | birthday | community
    client_name: str = Field(..., min_length=2)
    client_organization: Optional[str] = None
    event_date: str = "2026-12-12"
    venue: str = Field(..., min_length=2)
    city: str = Field(..., min_length=2)
    guest_count: int = Field(default=200, ge=10)
    total_budget: float = Field(default=75000.0, gt=0)
    currency: str = "USD"
    theme: Optional[str] = None
    ai_prompt: Optional[str] = None
    auto_plan: bool = True


class RuntimeLLMConfigUpdate(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    antigravity_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
