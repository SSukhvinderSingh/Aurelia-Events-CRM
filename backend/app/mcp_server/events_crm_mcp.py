from __future__ import annotations

import json
import uuid
from typing import Any, Callable, Dict, List, Optional
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import BudgetTranche, Event, EventVendor, Idea, TimelineNode, Vendor

try:
    from fastmcp import FastMCP  # type: ignore
except ImportError:
    class FastMCP:  # type: ignore
        """Compatible FastMCP server shim for Python 3.9 and offline sandboxes."""

        def __init__(self, name: str) -> None:
            self.name = name
            self._tools: Dict[str, Dict[str, Any]] = {}

        def tool(self, name: Optional[str] = None, description: Optional[str] = None) -> Callable[..., Any]:
            def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
                tool_name = name or func.__name__
                self._tools[tool_name] = {
                    "name": tool_name,
                    "description": description or (func.__doc__ or "").strip(),
                    "fn": func,
                }
                return func
            return decorator

        def list_registered_tools(self) -> List[Dict[str, str]]:
            return [
                {"name": k, "description": v["description"]}
                for k, v in self._tools.items()
            ]


mcp = FastMCP("PW5-EventsCRM-FastMCP")

TOOL_OWNER_MAP: Dict[str, str] = {
    "get_timeline_graph": "timeline_architect",
    "upsert_timeline_milestone": "timeline_architect",
    "cascade_shift_timeline": "timeline_architect",
    "detect_timeline_bottlenecks": "timeline_architect",
    "search_agency_vendors": "vendor_coordinator",
    "link_vendor_to_milestone": "vendor_coordinator",
    "update_vendor_stage": "vendor_coordinator",
    "upsert_vendor_checklist": "vendor_coordinator",
    "draft_vendor_rfp": "vendor_coordinator",
    "get_budget_ledger": "budget_controller",
    "upsert_budget_tranche": "budget_controller",
    "rebalance_event_budget": "budget_controller",
    "generate_personalized_concept": "creative_director",
    "promote_concept_to_timeline": "creative_director",
}


def _with_session(db: Optional[Session]) -> tuple[Session, bool]:
    if db is not None:
        return db, False
    return SessionLocal(), True


# ============================================================================
# 1. TIMELINE ARCHITECT TOOLS (Swimlane 1: Milestones & Checklists)
# ============================================================================

@mcp.tool()
def get_timeline_graph(event_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """Retrieve the full 5-phase timeline graph and critical-path dependencies for an event."""
    session, should_close = _with_session(db)
    try:
        nodes = (
            session.query(TimelineNode)
            .filter(TimelineNode.event_id == event_id)
            .order_by(TimelineNode.sort_order.asc())
            .all()
        )
        return {
            "event_id": event_id,
            "node_count": len(nodes),
            "critical_path_count": sum(1 for n in nodes if n.critical_path),
            "affected_node_id": nodes[0].id if nodes else None,
            "nodes": [
                {
                    "id": n.id,
                    "title": n.title,
                    "phase": n.phase,
                    "scheduled_date": n.scheduled_date,
                    "start_time": n.start_time,
                    "duration_hours": n.duration_hours,
                    "status": n.status,
                    "critical_path": n.critical_path,
                    "dependency_ids": n.dependency_ids,
                }
                for n in nodes
            ],
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def upsert_timeline_milestone(
    event_id: str,
    title: str,
    phase: str = "1_month_out",
    scheduled_date: str = "2027-03-25",
    start_time: str = "16:00",
    duration_hours: float = 3.5,
    status: str = "in_progress",
    critical_path: bool = True,
    owner_agent: str = "Timeline Architect",
    description: str = "",
    dependency_ids: Optional[List[str]] = None,
    checklist: Optional[List[Dict[str, Any]]] = None,
    node_id: Optional[str] = None,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Create or update a milestone node on Swimlane 1 with checklists and dependencies."""
    session, should_close = _with_session(db)
    try:
        existing = None
        if node_id:
            existing = (
                session.query(TimelineNode)
                .filter(TimelineNode.id == node_id, TimelineNode.event_id == event_id)
                .first()
            )
        if not existing:
            existing = (
                session.query(TimelineNode)
                .filter(TimelineNode.event_id == event_id, TimelineNode.title == title)
                .first()
            )

        if existing:
            existing.title = title
            existing.phase = phase
            existing.scheduled_date = scheduled_date
            existing.start_time = start_time
            existing.duration_hours = duration_hours
            existing.status = status
            existing.critical_path = critical_path
            existing.owner_agent = owner_agent
            if description:
                existing.description = description
            if dependency_ids is not None:
                existing.dependency_ids = dependency_ids
            if checklist is not None:
                existing.checklist = checklist
            session.commit()
            return {
                "action": "updated",
                "affected_node_id": existing.id,
                "title": existing.title,
                "phase": existing.phase,
            }

        max_order = (
            session.query(TimelineNode)
            .filter(TimelineNode.event_id == event_id)
            .count()
        )
        new_id = node_id or f"node_{uuid.uuid4().hex[:6]}"
        default_checklist = checklist or [
            {"id": f"chk_{uuid.uuid4().hex[:4]}", "text": f"Lock layout & production spec for {title}", "completed": True},
            {"id": f"chk_{uuid.uuid4().hex[:4]}", "text": f"Confirm crew & safety sign-off for {title}", "completed": False},
        ]
        node = TimelineNode(
            id=new_id,
            event_id=event_id,
            title=title,
            phase=phase,
            swimlane="milestone",
            scheduled_date=scheduled_date,
            start_time=start_time,
            duration_hours=duration_hours,
            status=status,
            critical_path=critical_path,
            owner_agent=owner_agent,
            description=description or f"Autonomous milestone added by {owner_agent}.",
            dependency_ids_json=json.dumps(dependency_ids or []),
            checklist_json=json.dumps(default_checklist),
            metadata_json=json.dumps({"autonomous_created": True}),
            sort_order=max_order + 1,
        )
        session.add(node)
        session.commit()
        return {
            "action": "created",
            "affected_node_id": node.id,
            "title": node.title,
            "phase": node.phase,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def cascade_shift_timeline(
    event_id: str,
    anchor_node_id: str,
    delta_hours: float = -2.0,
    new_phase: Optional[str] = None,
    notes_suffix: str = "",
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Shift an anchor milestone and automatically cascade timing adjustments to dependent nodes."""
    session, should_close = _with_session(db)
    try:
        nodes = (
            session.query(TimelineNode)
            .filter(TimelineNode.event_id == event_id)
            .order_by(TimelineNode.sort_order.asc())
            .all()
        )
        if not nodes:
            return {"shifted_count": 0, "affected_node_id": None}

        anchor = next((n for n in nodes if n.id == anchor_node_id), nodes[-1])
        shifted_ids: List[str] = []

        def _shift_time_str(t_str: str, d_hours: float) -> str:
            try:
                parts = t_str.split(":")
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
                new_hour = max(6, min(23, int(round(hour + d_hours))))
                return f"{new_hour:02d}:{minute:02d}"
            except Exception:
                return t_str

        anchor.start_time = _shift_time_str(anchor.start_time, delta_hours)
        if new_phase:
            anchor.phase = new_phase
        if notes_suffix and notes_suffix not in anchor.description:
            anchor.description = f"{anchor.description} [{notes_suffix}]".strip()
        shifted_ids.append(anchor.id)

        for n in nodes:
            if anchor.id in n.dependency_ids and n.id not in shifted_ids:
                n.start_time = _shift_time_str(n.start_time, delta_hours)
                meta = n.node_metadata
                meta["cascaded_from"] = anchor.id
                meta["delta_hours"] = delta_hours
                n.node_metadata = meta
                shifted_ids.append(n.id)

        session.commit()
        return {
            "shifted_count": len(shifted_ids),
            "shifted_node_ids": shifted_ids,
            "affected_node_id": anchor.id,
            "new_start_time": anchor.start_time,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def detect_timeline_bottlenecks(event_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """Scan event milestones, vendor stages, and overdue tranches for critical-path risks."""
    session, should_close = _with_session(db)
    try:
        nodes = session.query(TimelineNode).filter(TimelineNode.event_id == event_id).all()
        event_vendors = session.query(EventVendor).filter(EventVendor.event_id == event_id).all()
        bottlenecks: List[Dict[str, Any]] = []

        for n in nodes:
            incomplete_items = [c for c in n.checklist if not c.get("completed")]
            if n.critical_path and incomplete_items and n.phase in ("1_month_out", "week_of", "event_day"):
                bottlenecks.append({
                    "node_id": n.id,
                    "title": n.title,
                    "phase": n.phase,
                    "open_checklist_items": len(incomplete_items),
                    "recommendation": f"Complete {len(incomplete_items)} open checklist item(s) before load-in.",
                })

        uncontracted = [ev for ev in event_vendors if ev.stage in ("Shortlisted", "RFP Sent", "Quoted")]
        target_node_id = bottlenecks[0]["node_id"] if bottlenecks else (nodes[-1].id if nodes else None)
        return {
            "event_id": event_id,
            "bottleneck_count": len(bottlenecks),
            "uncontracted_vendor_count": len(uncontracted),
            "bottlenecks": bottlenecks,
            "affected_node_id": target_node_id,
        }
    finally:
        if should_close:
            session.close()


# ============================================================================
# 2. VENDOR COORDINATOR TOOLS (Swimlane 2: Vendor CRM Pipeline)
# ============================================================================

@mcp.tool()
def search_agency_vendors(
    category: Optional[str] = None,
    query: Optional[str] = None,
    max_budget: Optional[float] = None,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Search the shared B2B Agency Vendor CRM directory by category, specialty keyword, or budget."""
    session, should_close = _with_session(db)
    try:
        q = session.query(Vendor)
        vendors = q.all()
        filtered = []
        for v in vendors:
            if category and category.lower() not in v.category.lower():
                continue
            if query:
                haystack = f"{v.name} {v.category} {v.specialty} {' '.join(v.portfolio_tags)}".lower()
                if query.lower() not in haystack:
                    continue
            if max_budget is not None and v.base_quote_estimate > max_budget:
                continue
            filtered.append({
                "id": v.id,
                "name": v.name,
                "category": v.category,
                "specialty": v.specialty,
                "rating": v.rating,
                "base_quote_estimate": v.base_quote_estimate,
                "sustainability_score": v.sustainability_score,
            })
        if not filtered and vendors:
            v0 = vendors[0]
            filtered = [{
                "id": v0.id,
                "name": v0.name,
                "category": v0.category,
                "specialty": v0.specialty,
                "rating": v0.rating,
                "base_quote_estimate": v0.base_quote_estimate,
                "sustainability_score": v0.sustainability_score,
            }]
        return {
            "match_count": len(filtered),
            "vendors": filtered,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def link_vendor_to_milestone(
    event_id: str,
    vendor_id: str,
    timeline_node_id: Optional[str] = None,
    phase: str = "1_month_out",
    stage: str = "RFP Sent",
    quoted_amount: Optional[float] = None,
    notes: str = "",
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Assign an agency vendor from the shared pool to a specific event milestone on Swimlane 2."""
    session, should_close = _with_session(db)
    try:
        vendor = session.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            vendor = session.query(Vendor).first()
            if not vendor:
                raise ValueError("No vendors available in agency pool")

        if not timeline_node_id:
            node = (
                session.query(TimelineNode)
                .filter(TimelineNode.event_id == event_id, TimelineNode.phase == phase)
                .first()
            )
            if not node:
                node = session.query(TimelineNode).filter(TimelineNode.event_id == event_id).first()
            timeline_node_id = node.id if node else None

        existing = (
            session.query(EventVendor)
            .filter(EventVendor.event_id == event_id, EventVendor.vendor_id == vendor.id)
            .first()
        )
        quote = quoted_amount if quoted_amount is not None else vendor.base_quote_estimate
        if existing:
            existing.timeline_node_id = timeline_node_id or existing.timeline_node_id
            existing.phase = phase
            existing.stage = stage
            existing.quoted_amount = quote
            if notes:
                existing.notes = notes
            session.commit()
            return {
                "action": "updated",
                "event_vendor_id": existing.id,
                "vendor_name": vendor.name,
                "stage": existing.stage,
                "affected_node_id": existing.timeline_node_id,
            }

        ev = EventVendor(
            id=f"ev_{uuid.uuid4().hex[:6]}",
            event_id=event_id,
            vendor_id=vendor.id,
            timeline_node_id=timeline_node_id,
            phase=phase,
            stage=stage,
            quoted_amount=quote,
            contracted_amount=quote if stage in ("Contracted", "Paid") else 0.0,
            paid_amount=round(quote * 0.5, 2) if stage in ("Contracted", "Paid") else 0.0,
            rfp_draft=f"Autonomous RFP dispatched to {vendor.name} ({vendor.specialty}) for phase {phase}.",
            checklist_json=json.dumps([
                {"id": f"evc_{uuid.uuid4().hex[:4]}", "text": f"Confirm {vendor.name} availability & COI", "completed": True},
                {"id": f"evc_{uuid.uuid4().hex[:4]}", "text": "Finalize load-in window & floorplan routing", "completed": False},
            ]),
            notes=notes or f"Linked by Vendor Coordinator ({vendor.category}).",
        )
        session.add(ev)
        session.commit()
        return {
            "action": "linked",
            "event_vendor_id": ev.id,
            "vendor_name": vendor.name,
            "stage": ev.stage,
            "affected_node_id": ev.timeline_node_id,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def update_vendor_stage(
    event_id: str,
    event_vendor_id: Optional[str] = None,
    stage: str = "Contracted",
    contracted_amount: Optional[float] = None,
    paid_amount: Optional[float] = None,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Advance an event vendor along the CRM pipeline (Shortlisted -> RFP Sent -> Quoted -> Contracted -> Paid)."""
    session, should_close = _with_session(db)
    try:
        ev = None
        if event_vendor_id:
            ev = (
                session.query(EventVendor)
                .filter(EventVendor.id == event_vendor_id, EventVendor.event_id == event_id)
                .first()
            )
        if not ev:
            ev = (
                session.query(EventVendor)
                .filter(EventVendor.event_id == event_id, EventVendor.stage != "Paid")
                .first()
            )
        if not ev:
            ev = session.query(EventVendor).filter(EventVendor.event_id == event_id).first()
        if not ev:
            return {"status": "no_vendor_found", "affected_node_id": None}

        ev.stage = stage
        if contracted_amount is not None:
            ev.contracted_amount = contracted_amount
        elif stage in ("Contracted", "Paid") and ev.contracted_amount == 0:
            ev.contracted_amount = ev.quoted_amount

        if paid_amount is not None:
            ev.paid_amount = paid_amount
        elif stage == "Paid":
            ev.paid_amount = ev.contracted_amount or ev.quoted_amount
        elif stage == "Contracted" and ev.paid_amount == 0:
            ev.paid_amount = round((ev.contracted_amount or ev.quoted_amount) * 0.5, 2)

        session.commit()
        return {
            "event_vendor_id": ev.id,
            "new_stage": ev.stage,
            "contracted_amount": ev.contracted_amount,
            "paid_amount": ev.paid_amount,
            "affected_node_id": ev.timeline_node_id,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def upsert_vendor_checklist(
    event_id: str,
    event_vendor_id: Optional[str] = None,
    checklist_items: Optional[List[str]] = None,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Add or update operational checklist items for an event vendor."""
    session, should_close = _with_session(db)
    try:
        ev = None
        if event_vendor_id:
            ev = (
                session.query(EventVendor)
                .filter(EventVendor.id == event_vendor_id, EventVendor.event_id == event_id)
                .first()
            )
        if not ev:
            ev = session.query(EventVendor).filter(EventVendor.event_id == event_id).first()
        if not ev:
            return {"status": "no_vendor_found", "affected_node_id": None}

        current = ev.checklist
        for text in (checklist_items or ["Confirm on-site arrival & power requirements"]):
            current.append({
                "id": f"evc_{uuid.uuid4().hex[:4]}",
                "text": text,
                "completed": False,
            })
        ev.checklist = current
        session.commit()
        return {
            "event_vendor_id": ev.id,
            "checklist_count": len(current),
            "affected_node_id": ev.timeline_node_id,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def draft_vendor_rfp(
    event_id: str,
    event_vendor_id: Optional[str] = None,
    custom_requirements: str = "",
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Generate a tailored B2B RFP brief with guest count, timeline window, and deliverables."""
    session, should_close = _with_session(db)
    try:
        event = session.query(Event).filter(Event.id == event_id).first()
        ev = None
        if event_vendor_id:
            ev = (
                session.query(EventVendor)
                .filter(EventVendor.id == event_vendor_id, EventVendor.event_id == event_id)
                .first()
            )
        if not ev:
            ev = session.query(EventVendor).filter(EventVendor.event_id == event_id).first()
        if not ev or not event:
            return {"status": "not_found", "affected_node_id": None}

        vendor = session.query(Vendor).filter(Vendor.id == ev.vendor_id).first()
        vendor_name = vendor.name if vendor else "Agency Partner"
        rfp_text = (
            f"RFP BRIEF — {event.name} ({event.event_date})\n"
            f"Vendor: {vendor_name} | Headcount: {event.guest_count} guests | Venue: {event.venue}\n"
            f"Scope & Direction: {custom_requirements or 'Deliver turnkey production aligned with master Run-of-Show.'}\n"
            f"Target Quote Ceiling: ${ev.quoted_amount:,.2f} | Sustainability Mandate: Zero single-use foam/plastic."
        )
        ev.rfp_draft = rfp_text
        if ev.stage == "Shortlisted":
            ev.stage = "RFP Sent"
        session.commit()
        return {
            "event_vendor_id": ev.id,
            "vendor_name": vendor_name,
            "stage": ev.stage,
            "affected_node_id": ev.timeline_node_id,
            "rfp_preview": rfp_text[:140] + "...",
        }
    finally:
        if should_close:
            session.close()


# ============================================================================
# 3. BUDGET CONTROLLER TOOLS (Swimlane 3: Budget & Payment Tranches)
# ============================================================================

@mcp.tool()
def get_budget_ledger(event_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """Audit the event's total budget ceiling, allocated tranches, committed contracts, and remaining headroom."""
    session, should_close = _with_session(db)
    try:
        event = session.query(Event).filter(Event.id == event_id).first()
        tranches = session.query(BudgetTranche).filter(BudgetTranche.event_id == event_id).all()
        total_budget = event.total_budget if event else 0.0
        allocated = round(sum(t.allocated_amount for t in tranches), 2)
        committed = round(sum(t.committed_amount for t in tranches), 2)
        paid = round(sum(t.paid_amount for t in tranches), 2)
        remaining = round(total_budget - allocated, 2)
        affected_node = tranches[-1].timeline_node_id if tranches else None
        return {
            "event_id": event_id,
            "total_budget": total_budget,
            "allocated_total": allocated,
            "committed_total": committed,
            "paid_total": paid,
            "remaining_ceiling": remaining,
            "tranche_count": len(tranches),
            "affected_node_id": affected_node,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def upsert_budget_tranche(
    event_id: str,
    title: str,
    category: str = "Production & Specialty",
    phase: str = "1_month_out",
    allocated_amount: float = 3500.0,
    committed_amount: Optional[float] = None,
    paid_amount: float = 0.0,
    due_date: str = "2027-03-28",
    status: str = "Committed",
    timeline_node_id: Optional[str] = None,
    event_vendor_id: Optional[str] = None,
    tranche_type: str = "Deposit (50%)",
    tranche_id: Optional[str] = None,
    notes: str = "",
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Create or update a timeline-linked payment tranche on Swimlane 3."""
    session, should_close = _with_session(db)
    try:
        if not timeline_node_id:
            node = (
                session.query(TimelineNode)
                .filter(TimelineNode.event_id == event_id, TimelineNode.phase == phase)
                .first()
            )
            if not node:
                node = session.query(TimelineNode).filter(TimelineNode.event_id == event_id).first()
            timeline_node_id = node.id if node else None

        existing = None
        if tranche_id:
            existing = (
                session.query(BudgetTranche)
                .filter(BudgetTranche.id == tranche_id, BudgetTranche.event_id == event_id)
                .first()
            )
        if not existing:
            existing = (
                session.query(BudgetTranche)
                .filter(BudgetTranche.event_id == event_id, BudgetTranche.title == title)
                .first()
            )

        comm = committed_amount if committed_amount is not None else allocated_amount
        if existing:
            existing.phase = phase
            existing.category = category
            existing.allocated_amount = allocated_amount
            existing.committed_amount = comm
            existing.paid_amount = paid_amount
            existing.status = status
            if timeline_node_id:
                existing.timeline_node_id = timeline_node_id
            if notes:
                existing.notes = notes
            session.commit()
            return {
                "action": "updated",
                "tranche_id": existing.id,
                "allocated_amount": existing.allocated_amount,
                "affected_node_id": existing.timeline_node_id,
            }

        tranche = BudgetTranche(
            id=tranche_id or f"tr_{uuid.uuid4().hex[:6]}",
            event_id=event_id,
            timeline_node_id=timeline_node_id,
            event_vendor_id=event_vendor_id,
            title=title,
            category=category,
            phase=phase,
            tranche_type=tranche_type,
            allocated_amount=allocated_amount,
            committed_amount=comm,
            paid_amount=paid_amount,
            due_date=due_date,
            status=status,
            notes=notes or "Created by Budget Controller sub-agent.",
        )
        session.add(tranche)
        session.commit()
        return {
            "action": "created",
            "tranche_id": tranche.id,
            "title": tranche.title,
            "allocated_amount": tranche.allocated_amount,
            "affected_node_id": tranche.timeline_node_id,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def rebalance_event_budget(
    event_id: str,
    target_ceiling: Optional[float] = None,
    reserve_buffer_pct: float = 0.05,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Rebalance non-paid budget tranches so total allocations stay strictly under the event ceiling."""
    session, should_close = _with_session(db)
    try:
        event = session.query(Event).filter(Event.id == event_id).first()
        if not event:
            return {"status": "event_not_found", "affected_node_id": None}

        if target_ceiling is not None and target_ceiling > 0:
            event.total_budget = target_ceiling

        tranches = session.query(BudgetTranche).filter(BudgetTranche.event_id == event_id).all()
        ceiling = event.total_budget * (1.0 - max(0.0, min(0.20, reserve_buffer_pct)))
        current_allocated = sum(t.allocated_amount for t in tranches)

        adjusted_ids: List[str] = []
        if current_allocated > event.total_budget and tranches:
            flexible = [t for t in tranches if t.status != "Paid"]
            paid_locked = sum(t.allocated_amount for t in tranches if t.status == "Paid")
            available_for_flex = max(1000.0, ceiling - paid_locked)
            flex_sum = sum(t.allocated_amount for t in flexible)
            if flex_sum > 0:
                scale = available_for_flex / flex_sum
                for t in flexible:
                    t.allocated_amount = round(t.allocated_amount * scale, 2)
                    t.committed_amount = min(t.committed_amount, t.allocated_amount)
                    t.notes = f"{t.notes} [Rebalanced under ${event.total_budget:,.0f} ceiling]".strip()
                    adjusted_ids.append(t.id)

        session.commit()
        new_allocated = round(sum(t.allocated_amount for t in tranches), 2)
        return {
            "event_id": event_id,
            "total_budget": event.total_budget,
            "new_allocated_total": new_allocated,
            "remaining_headroom": round(event.total_budget - new_allocated, 2),
            "rebalanced_tranches": adjusted_ids,
            "affected_node_id": tranches[-1].timeline_node_id if tranches else None,
        }
    finally:
        if should_close:
            session.close()


# ============================================================================
# 4. CREATIVE DIRECTOR TOOLS (Idea Studio -> All 3 Swimlanes)
# ============================================================================

@mcp.tool()
def generate_personalized_concept(
    event_id: str,
    theme_direction: str,
    phase: str = "event_day",
    estimated_cost: float = 3500.0,
    category: str = "Signature Guest Experience",
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Generate a personalized creative activation concept in the Idea Studio with an executable blueprint."""
    session, should_close = _with_session(db)
    try:
        event = session.query(Event).filter(Event.id == event_id).first()
        vendors = session.query(Vendor).all()
        chosen_vendor = vendors[-2] if len(vendors) >= 2 else (vendors[0] if vendors else None)

        clean_title = theme_direction.strip()
        if len(clean_title) > 64:
            clean_title = clean_title[:61] + "..."

        idea = Idea(
            id=f"idea_{uuid.uuid4().hex[:6]}",
            event_id=event_id,
            title=clean_title,
            category=category,
            phase=phase,
            estimated_cost=estimated_cost,
            guest_impact_score=97,
            description=(
                f"Bespoke creative activation tailored for {event.name if event else 'Event'}: "
                f"{theme_direction}. Includes turnkey spatial styling, artisan staffing, and Run-of-Show cues."
            ),
            execution_blueprint_json=json.dumps({
                "milestone_title": clean_title,
                "vendor_id": chosen_vendor.id if chosen_vendor else "vnd_03",
                "phase": phase,
                "tranche_amount": estimated_cost,
                "checklist": [
                    f"Approve creative moodboard & spatial footprint for {clean_title}",
                    "Confirm artisan/vendor load-in & dedicated power/lighting cue",
                    "Brief photography team on key guest interaction moments",
                ],
            }),
            promoted=False,
        )
        session.add(idea)
        session.commit()
        return {
            "idea_id": idea.id,
            "title": idea.title,
            "phase": idea.phase,
            "estimated_cost": idea.estimated_cost,
            "affected_node_id": None,
        }
    finally:
        if should_close:
            session.close()


@mcp.tool()
def promote_concept_to_timeline(
    event_id: str,
    idea_id: str,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """Promote an Idea Studio concept into a live Swimlane 1 milestone, Swimlane 2 vendor task, and Swimlane 3 budget tranche."""
    session, should_close = _with_session(db)
    try:
        idea = (
            session.query(Idea)
            .filter(Idea.id == idea_id, Idea.event_id == event_id)
            .first()
        )
        if not idea:
            idea = session.query(Idea).filter(Idea.event_id == event_id, Idea.promoted.is_(False)).first()
        if not idea:
            return {"status": "idea_not_found", "affected_node_id": None}

        blueprint = idea.execution_blueprint
        phase = blueprint.get("phase", idea.phase or "event_day")
        milestone_title = blueprint.get("milestone_title", idea.title)
        checklist_texts = blueprint.get("checklist", [
            f"Execute {idea.title} setup & styling",
            "Complete safety & guest flow walkthrough",
        ])

        event = session.query(Event).filter(Event.id == event_id).first()
        sched_date = event.event_date if event else "2027-04-18"

        ms_result = upsert_timeline_milestone(
            event_id=event_id,
            title=milestone_title,
            phase=phase,
            scheduled_date=sched_date,
            start_time="17:00",
            duration_hours=3.0,
            status="in_progress",
            critical_path=True,
            owner_agent="Creative Director",
            description=idea.description,
            checklist=[
                {"id": f"chk_{uuid.uuid4().hex[:4]}", "text": t, "completed": False}
                for t in checklist_texts
            ],
            db=session,
        )
        new_node_id = ms_result["affected_node_id"]

        vendor_id = blueprint.get("vendor_id", "vnd_11")
        vnd_result = link_vendor_to_milestone(
            event_id=event_id,
            vendor_id=vendor_id,
            timeline_node_id=new_node_id,
            phase=phase,
            stage="RFP Sent",
            quoted_amount=idea.estimated_cost,
            notes=f"Promoted from Idea Studio: {idea.title}",
            db=session,
        )

        tr_result = upsert_budget_tranche(
            event_id=event_id,
            title=f"{idea.title} Activation Tranche",
            category=idea.category,
            phase=phase,
            allocated_amount=idea.estimated_cost,
            committed_amount=idea.estimated_cost,
            paid_amount=0.0,
            due_date=sched_date,
            status="Scheduled",
            timeline_node_id=new_node_id,
            event_vendor_id=vnd_result.get("event_vendor_id"),
            tranche_type="Creative Activation",
            notes=f"Auto-allocated from Idea Studio promotion ({idea.id}).",
            db=session,
        )

        idea.promoted = True
        idea.promoted_node_id = new_node_id
        session.commit()

        return {
            "status": "promoted",
            "idea_id": idea.id,
            "affected_node_id": new_node_id,
            "event_vendor_id": vnd_result.get("event_vendor_id"),
            "tranche_id": tr_result.get("tranche_id"),
            "title": idea.title,
        }
    finally:
        if should_close:
            session.close()
