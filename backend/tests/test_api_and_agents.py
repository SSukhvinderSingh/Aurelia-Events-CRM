from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.seed import seed_database


@pytest.fixture()
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine, future=True)
    Base.metadata.create_all(bind=test_engine)

    db = TestingSessionLocal()
    seed_database(db)
    db.close()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_health_and_llm_config(client: TestClient):
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "llm" in body

    update_res = client.post(
        "/api/config/llm",
        json={"provider": "auto", "model": "gemini-2.5-pro"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["active_model"] == "gemini-2.5-pro"


def test_seeded_portfolio_and_12_vendors(client: TestClient):
    events_res = client.get("/api/events")
    assert events_res.status_code == 200
    events = events_res.json()["events"]
    assert len(events) == 3
    event_types = {e["event_type"] for e in events}
    assert event_types == {"wedding", "birthday", "community"}

    vendors_res = client.get("/api/vendors")
    assert vendors_res.status_code == 200
    assert vendors_res.json()["total"] == 12


def test_mcp_tool_registry(client: TestClient):
    res = client.get("/api/mcp/tools")
    assert res.status_code == 200
    data = res.json()
    assert data["tool_count"] >= 12
    tool_names = {t["name"] for t in data["tools"]}
    assert "upsert_timeline_milestone" in tool_names
    assert "link_vendor_to_milestone" in tool_names
    assert "upsert_budget_tranche" in tool_names
    assert "promote_concept_to_timeline" in tool_names


def test_timeline_and_vendor_crud(client: TestClient):
    event_id = "evt_wedding_udaipur"
    ws_before = client.get(f"/api/events/{event_id}").json()
    initial_nodes = len(ws_before["timeline_nodes"])

    create_res = client.post(
        f"/api/events/{event_id}/timeline",
        json={
            "title": "Sangeet Choreography & Stage Lighting Call",
            "phase": "week_of",
            "scheduled_date": "2027-04-17",
            "start_time": "18:00",
            "duration_hours": 3.0,
            "critical_path": True,
            "description": "Family dance rehearsal and moving-head fixture programming.",
        },
    )
    assert create_res.status_code == 200
    ws_after = create_res.json()
    assert len(ws_after["timeline_nodes"]) == initial_nodes + 1

    target_node = ws_after["timeline_nodes"][-1]
    patch_res = client.patch(
        f"/api/events/{event_id}/timeline/{target_node['id']}",
        json={"status": "completed"},
    )
    assert patch_res.status_code == 200
    updated_node = [n for n in patch_res.json()["timeline_nodes"] if n["id"] == target_node["id"]][0]
    assert updated_node["status"] == "completed"


def test_idea_promotion_to_all_three_swimlanes(client: TestClient):
    event_id = "evt_birthday_jazz"
    ws_before = client.get(f"/api/events/{event_id}").json()
    unpromoted = [i for i in ws_before["ideas"] if not i["promoted"]]
    assert len(unpromoted) >= 1
    idea_id = unpromoted[0]["id"]

    nodes_before = len(ws_before["timeline_nodes"])
    tranches_before = len(ws_before["budget_tranches"])

    prom_res = client.post(f"/api/events/{event_id}/ideas/{idea_id}/promote")
    assert prom_res.status_code == 200
    payload = prom_res.json()
    assert payload["promotion"]["status"] == "promoted"
    assert payload["promotion"]["affected_node_id"] is not None

    ws_after = payload["workspace"]
    assert len(ws_after["timeline_nodes"]) == nodes_before + 1
    assert len(ws_after["budget_tranches"]) == tranches_before + 1
    promoted_idea = [i for i in ws_after["ideas"] if i["id"] == idea_id][0]
    assert promoted_idea["promoted"] is True


def test_autonomous_swarm_directive_and_snapshot_revert(client: TestClient):
    event_id = "evt_wedding_udaipur"
    ws_initial = client.get(f"/api/events/{event_id}").json()
    initial_node_ids = [n["id"] for n in ws_initial["timeline_nodes"]]
    initial_tranche_ids = [t["id"] for t in ws_initial["budget_tranches"]]
    initial_vendor_ids = [v["id"] for v in ws_initial["event_vendors"]]

    directive = (
        "Shift reception outdoors for 350 guests under $85k, add pre-wedding Mehendi night, "
        "and lock cultural artisan + catering RFPs"
    )
    run_res = client.post(
        f"/api/events/{event_id}/autonomous-directive",
        json={"directive": directive},
    )
    assert run_res.status_code == 200
    run_payload = run_res.json()

    trace = run_payload["trace"]
    run_id = trace["run_id"]
    assert trace["status"] == "completed"
    assert trace["orchestrator"] == "Chief Event Director"
    assert len(trace["subagents"]) == 4

    subagent_names = [s["name"] for s in trace["subagents"]]
    assert "Timeline Architect" in subagent_names
    assert "Vendor Coordinator" in subagent_names
    assert "Creative Director" in subagent_names
    assert "Budget Controller" in subagent_names

    for sa in trace["subagents"]:
        assert sa["duration_ms"] > 0
        assert len(sa["tool_calls"]) >= 1
        for tc in sa["tool_calls"]:
            assert "tool" in tc
            assert "duration_ms" in tc

    ws_mutated = run_payload["workspace"]
    assert len(ws_mutated["timeline_nodes"]) > len(initial_node_ids)
    assert len(ws_mutated["budget_tranches"]) > len(initial_tranche_ids)

    # Verify SSE trace streaming endpoint
    stream_res = client.get(f"/api/events/{event_id}/runs/{run_id}/stream")
    assert stream_res.status_code == 200
    assert "run_completed" in stream_res.text

    # Verify 1-click Snapshot Revert restores exact pre-run state
    revert_res = client.post(f"/api/events/{event_id}/runs/{run_id}/revert")
    assert revert_res.status_code == 200
    revert_payload = revert_res.json()
    assert revert_payload["status"] == "reverted"

    ws_reverted = revert_payload["workspace"]
    assert [n["id"] for n in ws_reverted["timeline_nodes"]] == initial_node_ids
    assert [t["id"] for t in ws_reverted["budget_tranches"]] == initial_tranche_ids
    assert [v["id"] for v in ws_reverted["event_vendors"]] == initial_vendor_ids


def test_export_run_of_show_brief(client: TestClient):
    res = client.get("/api/events/evt_community_fest/export-brief")
    assert res.status_code == 200
    data = res.json()
    assert "MASTER CLIENT RUN-OF-SHOW & BUDGET BRIEF" in data["markdown"]
    assert "Downtown Cultural & Sustainability Festival" in data["markdown"]


def test_create_and_auto_plan_event(client: TestClient):
    create_res = client.post(
        "/api/events",
        json={
            "name": "Napa Valley Harvest Wedding Weekend",
            "event_type": "wedding",
            "client_name": "Maya Lin & Jordan Vance",
            "client_organization": "Lin-Vance Family Office",
            "event_date": "2027-09-18",
            "venue": "Solage Calistoga Vineyard Estate",
            "city": "Napa Valley, CA",
            "guest_count": 240,
            "total_budget": 95000.0,
            "theme": "Vineyard Botanical Candlelight & Acoustic Strings",
            "ai_prompt": "Plan an outdoor vineyard ceremony with farm-to-table tasting menu, acoustic string quartet, and clear-span marquee backup under $95k.",
            "auto_plan": True,
        },
    )
    assert create_res.status_code == 201
    payload = create_res.json()
    assert payload["event_id"].startswith("evt_wedding_")
    assert payload["trace"] is not None
    assert len(payload["trace"]["subagents"]) == 4

    ws = payload["workspace"]
    assert ws["event"]["name"] == "Napa Valley Harvest Wedding Weekend"
    assert len(ws["timeline_nodes"]) == 5
    phases = {n["phase"] for n in ws["timeline_nodes"]}
    assert phases == {"6_months_out", "3_months_out", "1_month_out", "week_of", "event_day"}
    assert len(ws["event_vendors"]) >= 4
    assert len(ws["budget_tranches"]) >= 4
    assert len(ws["ideas"]) >= 2
    assert ws["budget_summary"]["allocated_total"] <= 95000.0
