from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
import json
from typing import Any, AsyncGenerator, Dict, List, Optional
import uuid

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.agents.orchestrator import (
    create_and_onboard_event,
    execute_autonomous_directive,
    revert_agent_run,
)
from app.agents.trace_bus import trace_bus
from app.config import llm_config
from app.database import Base, SessionLocal, engine, get_db
from app.mcp_server import events_crm_mcp as mcp_tools
from app.models import AgentRunSnapshot, BudgetTranche, Event, EventVendor, Idea, TimelineNode, Vendor
from app.schemas import (
    AutonomousDirectiveRequest,
    BudgetTrancheUpsertRequest,
    EventCreateRequest,
    EventVendorAssignRequest,
    EventVendorUpdateRequest,
    IdeaCreateRequest,
    RuntimeLLMConfigUpdate,
    TimelineNodeCreate,
    TimelineNodeUpdate,
)
from app.seed import seed_database, serialize_event_workspace


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="PW5 EventsCRM — Autonomous B2B Event Planning Agency CRM",
    version="1.0.0",
    description=(
        "Timeline-centric B2B Event Planning CRM powered by Google Antigravity SDK, FastMCP, "
        "4 Autonomous Sub-Agents, and 1-Click Snapshot Rollback."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "PW5 EventsCRM Backend",
        "llm": llm_config.get_status(),
    }


@app.get("/api/config/llm")
def get_llm_configuration() -> Dict[str, Any]:
    return llm_config.get_status()


@app.post("/api/config/llm")
def update_llm_configuration(payload: RuntimeLLMConfigUpdate) -> Dict[str, Any]:
    return llm_config.update_runtime(
        provider=payload.provider,
        model=payload.model,
        gemini_api_key=payload.gemini_api_key,
        antigravity_api_key=payload.antigravity_api_key,
        openai_api_key=payload.openai_api_key,
        anthropic_api_key=payload.anthropic_api_key,
        openai_base_url=payload.openai_base_url,
    )


@app.get("/api/mcp/tools")
def list_mcp_tools() -> Dict[str, Any]:
    tools = [
        {"name": name, "subagent_owner": owner}
        for name, owner in mcp_tools.TOOL_OWNER_MAP.items()
    ]
    return {
        "server": "PW5-EventsCRM-FastMCP",
        "tool_count": len(tools),
        "tools": tools,
    }


@app.get("/api/vendors")
def list_agency_vendors(
    category: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    vendors = db.query(Vendor).all()
    items = []
    for v in vendors:
        if category and category.lower() not in v.category.lower():
            continue
        if q:
            haystack = f"{v.name} {v.category} {v.specialty} {' '.join(v.portfolio_tags)}".lower()
            if q.lower() not in haystack:
                continue
        items.append({
            "id": v.id,
            "name": v.name,
            "category": v.category,
            "specialty": v.specialty,
            "rating": v.rating,
            "price_tier": v.price_tier,
            "base_quote_estimate": v.base_quote_estimate,
            "contact_name": v.contact_name,
            "contact_email": v.contact_email,
            "phone": v.phone,
            "location": v.location,
            "sustainability_score": v.sustainability_score,
            "portfolio_tags": v.portfolio_tags,
        })
    return {"vendors": items, "total": len(items)}


@app.get("/api/events")
def list_events(db: Session = Depends(get_db)) -> Dict[str, Any]:
    events = db.query(Event).all()
    summaries = []
    for e in events:
        tranches = db.query(BudgetTranche).filter(BudgetTranche.event_id == e.id).all()
        nodes = db.query(TimelineNode).filter(TimelineNode.event_id == e.id).all()
        allocated = round(sum(t.allocated_amount for t in tranches), 2)
        summaries.append({
            "id": e.id,
            "slug": e.slug,
            "name": e.name,
            "event_type": e.event_type,
            "client_name": e.client_name,
            "client_organization": e.client_organization,
            "event_date": e.event_date,
            "venue": e.venue,
            "city": e.city,
            "guest_count": e.guest_count,
            "total_budget": e.total_budget,
            "allocated_budget": allocated,
            "currency": e.currency,
            "status": e.status,
            "theme": e.theme,
            "description": e.description,
            "milestone_count": len(nodes),
        })
    return {"events": summaries}


@app.post("/api/events", status_code=201)
def create_event_endpoint(
    payload: EventCreateRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    return create_and_onboard_event(db=db, payload=payload)


@app.get("/api/events/{event_id}")
def get_event_workspace(event_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        return serialize_event_workspace(db, event_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.post("/api/events/{event_id}/timeline")
def create_timeline_node(
    event_id: str,
    payload: TimelineNodeCreate,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    mcp_tools.upsert_timeline_milestone(
        event_id=event_id,
        title=payload.title,
        phase=payload.phase,
        scheduled_date=payload.scheduled_date,
        start_time=payload.start_time,
        duration_hours=payload.duration_hours,
        status=payload.status,
        critical_path=payload.critical_path,
        owner_agent=payload.owner_agent,
        description=payload.description,
        dependency_ids=payload.dependency_ids,
        checklist=[c.model_dump() for c in payload.checklist],
        db=db,
    )
    return serialize_event_workspace(db, event_id)


@app.patch("/api/events/{event_id}/timeline/{node_id}")
def update_timeline_node(
    event_id: str,
    node_id: str,
    payload: TimelineNodeUpdate,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    node = (
        db.query(TimelineNode)
        .filter(TimelineNode.id == node_id, TimelineNode.event_id == event_id)
        .first()
    )
    if not node:
        raise HTTPException(status_code=404, detail="Timeline node not found")

    if payload.title is not None:
        node.title = payload.title
    if payload.phase is not None:
        node.phase = payload.phase
    if payload.swimlane is not None:
        node.swimlane = payload.swimlane
    if payload.scheduled_date is not None:
        node.scheduled_date = payload.scheduled_date
    if payload.start_time is not None:
        node.start_time = payload.start_time
    if payload.duration_hours is not None:
        node.duration_hours = payload.duration_hours
    if payload.status is not None:
        node.status = payload.status
    if payload.critical_path is not None:
        node.critical_path = payload.critical_path
    if payload.description is not None:
        node.description = payload.description
    if payload.dependency_ids is not None:
        node.dependency_ids = payload.dependency_ids
    if payload.checklist is not None:
        node.checklist = [c.model_dump() for c in payload.checklist]
    if payload.metadata is not None:
        node.node_metadata = payload.metadata

    db.commit()
    return serialize_event_workspace(db, event_id)


@app.delete("/api/events/{event_id}/timeline/{node_id}")
def delete_timeline_node(
    event_id: str,
    node_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    node = (
        db.query(TimelineNode)
        .filter(TimelineNode.id == node_id, TimelineNode.event_id == event_id)
        .first()
    )
    if not node:
        raise HTTPException(status_code=404, detail="Timeline node not found")
    db.delete(node)
    db.commit()
    return serialize_event_workspace(db, event_id)


@app.post("/api/events/{event_id}/vendors")
def assign_vendor_to_event(
    event_id: str,
    payload: EventVendorAssignRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    mcp_tools.link_vendor_to_milestone(
        event_id=event_id,
        vendor_id=payload.vendor_id,
        timeline_node_id=payload.timeline_node_id,
        phase=payload.phase,
        stage=payload.stage,
        quoted_amount=payload.quoted_amount,
        notes=payload.notes,
        db=db,
    )
    return serialize_event_workspace(db, event_id)


@app.patch("/api/events/{event_id}/vendors/{event_vendor_id}")
def update_event_vendor(
    event_id: str,
    event_vendor_id: str,
    payload: EventVendorUpdateRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    ev = (
        db.query(EventVendor)
        .filter(EventVendor.id == event_vendor_id, EventVendor.event_id == event_id)
        .first()
    )
    if not ev:
        raise HTTPException(status_code=404, detail="Event vendor assignment not found")

    if payload.stage is not None:
        ev.stage = payload.stage
    if payload.phase is not None:
        ev.phase = payload.phase
    if payload.timeline_node_id is not None:
        ev.timeline_node_id = payload.timeline_node_id
    if payload.quoted_amount is not None:
        ev.quoted_amount = payload.quoted_amount
    if payload.contracted_amount is not None:
        ev.contracted_amount = payload.contracted_amount
    if payload.paid_amount is not None:
        ev.paid_amount = payload.paid_amount
    if payload.rfp_draft is not None:
        ev.rfp_draft = payload.rfp_draft
    if payload.checklist is not None:
        ev.checklist = [c.model_dump() for c in payload.checklist]
    if payload.notes is not None:
        ev.notes = payload.notes

    db.commit()
    return serialize_event_workspace(db, event_id)


@app.post("/api/events/{event_id}/vendors/{event_vendor_id}/draft-rfp")
def generate_event_vendor_rfp(
    event_id: str,
    event_vendor_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    mcp_tools.draft_vendor_rfp(event_id=event_id, event_vendor_id=event_vendor_id, db=db)
    return serialize_event_workspace(db, event_id)


@app.post("/api/events/{event_id}/budget/tranches")
def upsert_event_budget_tranche(
    event_id: str,
    payload: BudgetTrancheUpsertRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    mcp_tools.upsert_budget_tranche(
        event_id=event_id,
        tranche_id=payload.id,
        title=payload.title,
        category=payload.category,
        phase=payload.phase,
        tranche_type=payload.tranche_type,
        allocated_amount=payload.allocated_amount,
        committed_amount=payload.committed_amount,
        paid_amount=payload.paid_amount,
        due_date=payload.due_date,
        status=payload.status,
        timeline_node_id=payload.timeline_node_id,
        event_vendor_id=payload.event_vendor_id,
        notes=payload.notes,
        db=db,
    )
    return serialize_event_workspace(db, event_id)


@app.post("/api/events/{event_id}/budget/rebalance")
def rebalance_budget_endpoint(
    event_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    mcp_tools.rebalance_event_budget(event_id=event_id, db=db)
    return serialize_event_workspace(db, event_id)


@app.post("/api/events/{event_id}/ideas")
def create_event_idea(
    event_id: str,
    payload: IdeaCreateRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    mcp_tools.generate_personalized_concept(
        event_id=event_id,
        theme_direction=payload.title,
        phase=payload.phase,
        estimated_cost=payload.estimated_cost,
        category=payload.category,
        db=db,
    )
    return serialize_event_workspace(db, event_id)


@app.post("/api/events/{event_id}/ideas/{idea_id}/promote")
def promote_idea_endpoint(
    event_id: str,
    idea_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    res = mcp_tools.promote_concept_to_timeline(event_id=event_id, idea_id=idea_id, db=db)
    if res.get("status") == "idea_not_found":
        raise HTTPException(status_code=404, detail="Idea not found")
    return {
        "promotion": res,
        "workspace": serialize_event_workspace(db, event_id),
    }


@app.post("/api/events/{event_id}/autonomous-directive")
def run_autonomous_directive(
    event_id: str,
    payload: AutonomousDirectiveRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    try:
        return execute_autonomous_directive(
            db=db,
            event_id=event_id,
            directive=payload.directive,
            focus_phase=payload.focus_phase,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.get("/api/events/{event_id}/runs")
def list_event_agent_runs(event_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    ws = serialize_event_workspace(db, event_id)
    return {"runs": ws["agent_runs"]}


@app.get("/api/events/{event_id}/runs/{run_id}/stream")
async def stream_agent_run_trace(
    event_id: str,
    run_id: str,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    run_record = (
        db.query(AgentRunSnapshot)
        .filter(AgentRunSnapshot.id == run_id, AgentRunSnapshot.event_id == event_id)
        .first()
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        history = trace_bus.get_history(run_id)
        if history:
            for item in history:
                yield f"data: {json.dumps(item)}\n\n"
                await asyncio.sleep(0.01)
        elif run_record:
            trace = run_record.trace
            for sa in trace.get("subagents", []):
                yield f"data: {json.dumps({'type': 'subagent_completed', 'subagent': sa})}\n\n"
                await asyncio.sleep(0.01)
            yield f"data: {json.dumps({'type': 'run_completed', 'trace': trace})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/events/{event_id}/runs/{run_id}/revert")
def revert_event_agent_run(
    event_id: str,
    run_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    try:
        return revert_agent_run(db=db, event_id=event_id, run_id=run_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@app.get("/api/events/{event_id}/export-brief")
def export_run_of_show_brief(event_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        ws = serialize_event_workspace(db, event_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    ev = ws["event"]
    budget = ws["budget_summary"]
    lines = [
        f"# MASTER CLIENT RUN-OF-SHOW & BUDGET BRIEF: {ev['name']}",
        f"**Client:** {ev['client_name']} ({ev.get('client_organization') or 'Private Client'})",
        f"**Event Date:** {ev['event_date']} | **Venue:** {ev['venue']} ({ev['city']})",
        f"**Guest Headcount:** {ev['guest_count']} | **Theme:** {ev['theme']}",
        "",
        "## 1. Executive Budget Summary",
        f"- **Total Ceiling:** ${budget['total_budget']:,.2f}",
        f"- **Allocated Tranches:** ${budget['allocated_total']:,.2f} ({budget['utilization_pct']}%)",
        f"- **Committed Contracts:** ${budget['committed_total']:,.2f}",
        f"- **Paid to Date:** ${budget['paid_total']:,.2f}",
        f"- **Remaining Headroom:** ${budget['remaining_ceiling']:,.2f}",
        "",
        "## 2. Synchronized Timeline & Critical-Path Milestones (Swimlane 1)",
    ]
    for n in ws["timeline_nodes"]:
        crit = " [CRITICAL PATH]" if n["critical_path"] else ""
        lines.append(
            f"- **[{n['phase'].upper()}] {n['scheduled_date']} @ {n['start_time']} — {n['title']}**{crit} ({n['status']})"
        )
        lines.append(f"  - *Lead Agent:* {n['owner_agent']} | *Scope:* {n['description']}")

    lines.append("")
    lines.append("## 3. Contracted Vendor CRM Pipeline (Swimlane 2)")
    for v in ws["event_vendors"]:
        lines.append(
            f"- **{v['vendor_name']}** ({v['category']}) — Stage: **{v['stage']}** | "
            f"Quoted: ${v['quoted_amount']:,.2f} | Paid: ${v['paid_amount']:,.2f}"
        )

    lines.append("")
    lines.append("## 4. Payment Tranche Schedule (Swimlane 3)")
    for t in ws["budget_tranches"]:
        lines.append(
            f"- **{t['title']}** ({t['phase']}) — Allocated: ${t['allocated_amount']:,.2f} | "
            f"Due: {t['due_date']} | Status: **{t['status']}**"
        )

    return {
        "event_id": event_id,
        "markdown": "\n".join(lines),
        "workspace": ws,
    }
