from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List
from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # wedding | birthday | community
    client_name = Column(String, nullable=False)
    client_organization = Column(String, nullable=True)
    event_date = Column(String, nullable=False)
    venue = Column(String, nullable=False)
    city = Column(String, nullable=False)
    guest_count = Column(Integer, nullable=False, default=100)
    total_budget = Column(Float, nullable=False, default=50000.0)
    currency = Column(String, nullable=False, default="USD")
    status = Column(String, nullable=False, default="On Track")
    theme = Column(String, nullable=False, default="")
    description = Column(Text, nullable=False, default="")
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())

    timeline_nodes = relationship("TimelineNode", back_populates="event", cascade="all, delete-orphan")
    event_vendors = relationship("EventVendor", back_populates="event", cascade="all, delete-orphan")
    budget_tranches = relationship("BudgetTranche", back_populates="event", cascade="all, delete-orphan")
    ideas = relationship("Idea", back_populates="event", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRunSnapshot", back_populates="event", cascade="all, delete-orphan")


class TimelineNode(Base):
    __tablename__ = "timeline_nodes"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    phase = Column(String, nullable=False)  # 6_months_out | 3_months_out | 1_month_out | week_of | event_day
    swimlane = Column(String, nullable=False, default="milestone")  # milestone | vendor | budget
    scheduled_date = Column(String, nullable=False)
    start_time = Column(String, nullable=False, default="09:00")
    duration_hours = Column(Float, nullable=False, default=2.0)
    status = Column(String, nullable=False, default="pending")  # completed | in_progress | pending | at_risk
    critical_path = Column(Boolean, nullable=False, default=False)
    owner_agent = Column(String, nullable=False, default="Timeline Architect")
    description = Column(Text, nullable=False, default="")
    dependency_ids_json = Column(Text, nullable=False, default="[]")
    checklist_json = Column(Text, nullable=False, default="[]")
    metadata_json = Column(Text, nullable=False, default="{}")
    sort_order = Column(Integer, nullable=False, default=0)

    event = relationship("Event", back_populates="timeline_nodes")

    @property
    def dependency_ids(self) -> List[str]:
        try:
            return json.loads(self.dependency_ids_json or "[]")
        except Exception:
            return []

    @dependency_ids.setter
    def dependency_ids(self, value: List[str]) -> None:
        self.dependency_ids_json = json.dumps(value)

    @property
    def checklist(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.checklist_json or "[]")
        except Exception:
            return []

    @checklist.setter
    def checklist(self, value: List[Dict[str, Any]]) -> None:
        self.checklist_json = json.dumps(value)

    @property
    def node_metadata(self) -> Dict[str, Any]:
        try:
            return json.loads(self.metadata_json or "{}")
        except Exception:
            return {}

    @node_metadata.setter
    def node_metadata(self, value: Dict[str, Any]) -> None:
        self.metadata_json = json.dumps(value)


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    rating = Column(Float, nullable=False, default=4.9)
    price_tier = Column(String, nullable=False, default="$$$")
    base_quote_estimate = Column(Float, nullable=False, default=5000.0)
    contact_name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    location = Column(String, nullable=False)
    sustainability_score = Column(Integer, nullable=False, default=90)
    portfolio_tags_json = Column(Text, nullable=False, default="[]")

    event_assignments = relationship("EventVendor", back_populates="vendor")

    @property
    def portfolio_tags(self) -> List[str]:
        try:
            return json.loads(self.portfolio_tags_json or "[]")
        except Exception:
            return []

    @portfolio_tags.setter
    def portfolio_tags(self, value: List[str]) -> None:
        self.portfolio_tags_json = json.dumps(value)


class EventVendor(Base):
    __tablename__ = "event_vendors"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id = Column(String, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    timeline_node_id = Column(String, nullable=True, index=True)
    phase = Column(String, nullable=False, default="3_months_out")
    stage = Column(String, nullable=False, default="Shortlisted")  # Shortlisted | RFP Sent | Quoted | Contracted | Paid
    quoted_amount = Column(Float, nullable=False, default=0.0)
    contracted_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    rfp_draft = Column(Text, nullable=False, default="")
    checklist_json = Column(Text, nullable=False, default="[]")
    notes = Column(Text, nullable=False, default="")

    event = relationship("Event", back_populates="event_vendors")
    vendor = relationship("Vendor", back_populates="event_assignments")

    @property
    def checklist(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.checklist_json or "[]")
        except Exception:
            return []

    @checklist.setter
    def checklist(self, value: List[Dict[str, Any]]) -> None:
        self.checklist_json = json.dumps(value)


class BudgetTranche(Base):
    __tablename__ = "budget_tranches"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    timeline_node_id = Column(String, nullable=True, index=True)
    event_vendor_id = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    phase = Column(String, nullable=False, default="3_months_out")
    tranche_type = Column(String, nullable=False, default="Deposit (50%)")
    allocated_amount = Column(Float, nullable=False, default=0.0)
    committed_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    due_date = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Scheduled")  # Scheduled | Committed | Paid | Overdue
    notes = Column(Text, nullable=False, default="")

    event = relationship("Event", back_populates="budget_tranches")


class Idea(Base):
    __tablename__ = "ideas"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    phase = Column(String, nullable=False, default="1_month_out")
    estimated_cost = Column(Float, nullable=False, default=2500.0)
    guest_impact_score = Column(Integer, nullable=False, default=95)
    description = Column(Text, nullable=False, default="")
    execution_blueprint_json = Column(Text, nullable=False, default="{}")
    promoted = Column(Boolean, nullable=False, default=False)
    promoted_node_id = Column(String, nullable=True)

    event = relationship("Event", back_populates="ideas")

    @property
    def execution_blueprint(self) -> Dict[str, Any]:
        try:
            return json.loads(self.execution_blueprint_json or "{}")
        except Exception:
            return {}

    @execution_blueprint.setter
    def execution_blueprint(self, value: Dict[str, Any]) -> None:
        self.execution_blueprint_json = json.dumps(value)


class AgentRunSnapshot(Base):
    __tablename__ = "agent_run_snapshots"

    id = Column(String, primary_key=True, index=True)  # run_id e.g. run_94f2a
    snapshot_id = Column(String, unique=True, index=True, nullable=False)  # snap_8812
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    directive = Column(Text, nullable=False)
    orchestrator = Column(String, nullable=False, default="Chief Event Director")
    status = Column(String, nullable=False, default="completed")  # running | completed | reverted | failed
    provider_used = Column(String, nullable=False, default="autonomous_engine")
    model_used = Column(String, nullable=False, default="antigravity-swarm-deterministic-v1")
    duration_ms = Column(Integer, nullable=False, default=0)
    pre_run_state_json = Column(Text, nullable=False, default="{}")
    trace_json = Column(Text, nullable=False, default="{}")
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    reverted_at = Column(String, nullable=True)

    event = relationship("Event", back_populates="agent_runs")

    @property
    def trace(self) -> Dict[str, Any]:
        try:
            return json.loads(self.trace_json or "{}")
        except Exception:
            return {}

    @trace.setter
    def trace(self, value: Dict[str, Any]) -> None:
        self.trace_json = json.dumps(value)
