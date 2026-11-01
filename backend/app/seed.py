from __future__ import annotations

import json
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.models import (
    AgentRunSnapshot,
    BudgetTranche,
    Event,
    EventVendor,
    Idea,
    TimelineNode,
    Vendor,
)


AGENCY_VENDORS: List[Dict[str, Any]] = [
    {
        "id": "vnd_01",
        "name": "Grand Heritage Conservatory & Gardens",
        "category": "Venue",
        "specialty": "Indoor-Outdoor Luxury Estate & Botanical Pavilions",
        "rating": 4.95,
        "price_tier": "$$$$",
        "base_quote_estimate": 22000.0,
        "contact_name": "Kavita Mehra",
        "contact_email": "kavita@grandheritagegardens.com",
        "phone": "+1 (415) 890-2101",
        "location": "Napa & Bay Area",
        "sustainability_score": 92,
        "portfolio_tags": ["350+ Capacity", "Rain Backup Glasshouse", "Mandap & Stage Ready"],
    },
    {
        "id": "vnd_02",
        "name": "Saffron & Sage Royal Culinary Collective",
        "category": "Catering",
        "specialty": "Bespoke Multi-Regional Banquets, Live Chaat & Plant-Forward Tasting",
        "rating": 4.92,
        "price_tier": "$$$",
        "base_quote_estimate": 24500.0,
        "contact_name": "Chef Aarav Kapoor",
        "contact_email": "aarav@saffronandsage.io",
        "phone": "+1 (415) 890-2102",
        "location": "San Francisco",
        "sustainability_score": 94,
        "portfolio_tags": ["Zero-Waste Kitchen", "350+ Plated & Live Stations", "Halal/Jain/Vegan"],
    },
    {
        "id": "vnd_03",
        "name": "Atelier Verdure Floral & Spatial Design",
        "category": "Floral & Decor",
        "specialty": "Suspended Marigold & Jasmine Installations, Architectural Mandaps",
        "rating": 4.97,
        "price_tier": "$$$$",
        "base_quote_estimate": 14000.0,
        "contact_name": "Elena Rostova",
        "contact_email": "elena@atelierverdure.design",
        "phone": "+1 (415) 890-2103",
        "location": "Oakland",
        "sustainability_score": 96,
        "portfolio_tags": ["Foam-Free Mechanics", "Compostable Botanicals", "Custom Drapery"],
    },
    {
        "id": "vnd_04",
        "name": "Velvet Brass & Dhol Collective",
        "category": "Entertainment",
        "specialty": "Live Brass Jazz Ensemble, Baraat Dhol Troupe & Vinyl DJ",
        "rating": 4.91,
        "price_tier": "$$$",
        "base_quote_estimate": 6800.0,
        "contact_name": "Marcus Vance",
        "contact_email": "marcus@velvetbrasslive.com",
        "phone": "+1 (415) 890-2104",
        "location": "San Francisco",
        "sustainability_score": 89,
        "portfolio_tags": ["Midnight Jazz", "Baraat Procession", "Acoustic & Club Sets"],
    },
    {
        "id": "vnd_05",
        "name": "Lumiere Cinema & Editorial Stills",
        "category": "Photography & Film",
        "specialty": "Documentary 35mm Film, Drone Aerials & Same-Day Edit",
        "rating": 4.94,
        "price_tier": "$$$",
        "base_quote_estimate": 8200.0,
        "contact_name": "Sora Takahashi",
        "contact_email": "sora@lumierecinema.co",
        "phone": "+1 (415) 890-2105",
        "location": "San Jose",
        "sustainability_score": 91,
        "portfolio_tags": ["Multi-Day Wedding", "Same-Day Reel", "Archival Prints"],
    },
    {
        "id": "vnd_06",
        "name": "Prism Acoustic & Architectural Lighting",
        "category": "AV & Lighting",
        "specialty": "Solar-Battery Stage Arrays, Projection Mapping & Line-Array Audio",
        "rating": 4.89,
        "price_tier": "$$$",
        "base_quote_estimate": 7500.0,
        "contact_name": "Devon Brooks",
        "contact_email": "devon@prismavlighting.com",
        "phone": "+1 (415) 890-2106",
        "location": "Berkeley",
        "sustainability_score": 95,
        "portfolio_tags": ["LED Low-Draw", "Solar Microgrid", "Outdoor Weatherproof"],
    },
    {
        "id": "vnd_07",
        "name": "Canopy & Crest Luxury Sailcloth Tenting",
        "category": "Rentals & Tenting",
        "specialty": "Clear-Span Glass Marquees, Lounge Vignettes & Teak Dining",
        "rating": 4.88,
        "price_tier": "$$$",
        "base_quote_estimate": 9500.0,
        "contact_name": "Hannah Lindqvist",
        "contact_email": "hannah@canopyandcrest.com",
        "phone": "+1 (415) 890-2107",
        "location": "Marin",
        "sustainability_score": 88,
        "portfolio_tags": ["350+ Clear-Span", "Heated Flooring", "Bespoke Lounge"],
    },
    {
        "id": "vnd_08",
        "name": "Nocturne Speakeasy & Rare Vintage Bar",
        "category": "Venue",
        "specialty": "Art Deco Penthouse Vault, Craft Mixology & Velvet Supper Club",
        "rating": 4.96,
        "price_tier": "$$$",
        "base_quote_estimate": 9200.0,
        "contact_name": "Julian Sterling",
        "contact_email": "julian@nocturnespeakeasy.com",
        "phone": "+1 (415) 890-2108",
        "location": "Downtown SF",
        "sustainability_score": 90,
        "portfolio_tags": ["120 Guests", "Steinway Grand Piano", "Private Sommelier"],
    },
    {
        "id": "vnd_09",
        "name": "Maison Noir Patisserie & Tasting Kitchen",
        "category": "Catering",
        "specialty": "5-Course Modern French-Creole Supper & Smoked Bourbon Pairing",
        "rating": 4.93,
        "price_tier": "$$$",
        "base_quote_estimate": 8800.0,
        "contact_name": "Chef Celine Moreau",
        "contact_email": "celine@maisonnoir.kitchen",
        "phone": "+1 (415) 890-2109",
        "location": "San Francisco",
        "sustainability_score": 92,
        "portfolio_tags": ["Late-Night Caviar & Beignets", "Sommelier Pairing", "Custom Tier Cake"],
    },
    {
        "id": "vnd_10",
        "name": "EcoPulse Zero-Waste & Civic Permitting",
        "category": "Permits & Sustainability",
        "specialty": "City Street Closure Permits, Composting Stations & Carbon Auditing",
        "rating": 4.98,
        "price_tier": "$$",
        "base_quote_estimate": 6200.0,
        "contact_name": "Maya Lin-ales",
        "contact_email": "maya@ecopulsecivic.org",
        "phone": "+1 (415) 890-2110",
        "location": "Oakland",
        "sustainability_score": 99,
        "portfolio_tags": ["98% Landfill Diversion", "Fire/Health Permits", "ADA Crowd Routing"],
    },
    {
        "id": "vnd_11",
        "name": "Rajasthani Mehendi & Folk Artisans Guild",
        "category": "Cultural & Specialty",
        "specialty": "Organic Sojat Henna Artists, Lac Bangle Bar & Folk Puppeteers",
        "rating": 4.95,
        "price_tier": "$$",
        "base_quote_estimate": 4200.0,
        "contact_name": "Priya Rathore",
        "contact_email": "priya@rajasthaniartisans.com",
        "phone": "+1 (415) 890-2111",
        "location": "Fremont",
        "sustainability_score": 97,
        "portfolio_tags": ["Mehendi Lounge", "Organic Henna", "Live Bangle Making"],
    },
    {
        "id": "vnd_12",
        "name": "Bay Commons Street Food & Maker Market Co-op",
        "category": "Catering",
        "specialty": "12-Cart Cultural Street Food Village & Reusable Dishware Loop",
        "rating": 4.90,
        "price_tier": "$$",
        "base_quote_estimate": 14500.0,
        "contact_name": "Carlos Mendoza",
        "contact_email": "carlos@baycommonscoop.org",
        "phone": "+1 (415) 890-2112",
        "location": "San Francisco",
        "sustainability_score": 98,
        "portfolio_tags": ["1500+ Crowd Throughput", "Reusable RFID Cups", "BIPOC Chefs"],
    },
]


def serialize_event_workspace(db: Session, event_id: str) -> Dict[str, Any]:
    """Serialize complete event state for API responses and pre-run snapshots."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise ValueError(f"Event {event_id} not found")

    nodes = (
        db.query(TimelineNode)
        .filter(TimelineNode.event_id == event_id)
        .order_by(TimelineNode.sort_order.asc(), TimelineNode.scheduled_date.asc())
        .all()
    )
    event_vendors = db.query(EventVendor).filter(EventVendor.event_id == event_id).all()
    vendors_by_id = {v.id: v for v in db.query(Vendor).all()}
    tranches = db.query(BudgetTranche).filter(BudgetTranche.event_id == event_id).all()
    ideas = db.query(Idea).filter(Idea.event_id == event_id).all()
    runs = (
        db.query(AgentRunSnapshot)
        .filter(AgentRunSnapshot.event_id == event_id)
        .order_by(AgentRunSnapshot.created_at.desc())
        .all()
    )

    allocated_total = round(sum(t.allocated_amount for t in tranches), 2)
    committed_total = round(sum(t.committed_amount for t in tranches), 2)
    paid_total = round(sum(t.paid_amount for t in tranches), 2)
    remaining_ceiling = round(event.total_budget - allocated_total, 2)

    serialized_nodes = [
        {
            "id": n.id,
            "event_id": n.event_id,
            "title": n.title,
            "phase": n.phase,
            "swimlane": n.swimlane,
            "scheduled_date": n.scheduled_date,
            "start_time": n.start_time,
            "duration_hours": n.duration_hours,
            "status": n.status,
            "critical_path": n.critical_path,
            "owner_agent": n.owner_agent,
            "description": n.description,
            "dependency_ids": n.dependency_ids,
            "checklist": n.checklist,
            "metadata": n.node_metadata,
            "sort_order": n.sort_order,
        }
        for n in nodes
    ]

    serialized_vendors = []
    for ev in event_vendors:
        v = vendors_by_id.get(ev.vendor_id)
        serialized_vendors.append(
            {
                "id": ev.id,
                "event_id": ev.event_id,
                "vendor_id": ev.vendor_id,
                "vendor_name": v.name if v else "Agency Partner",
                "category": v.category if v else "Specialty",
                "specialty": v.specialty if v else "",
                "rating": v.rating if v else 4.9,
                "contact_name": v.contact_name if v else "",
                "contact_email": v.contact_email if v else "",
                "location": v.location if v else "",
                "sustainability_score": v.sustainability_score if v else 90,
                "timeline_node_id": ev.timeline_node_id,
                "phase": ev.phase,
                "stage": ev.stage,
                "quoted_amount": ev.quoted_amount,
                "contracted_amount": ev.contracted_amount,
                "paid_amount": ev.paid_amount,
                "rfp_draft": ev.rfp_draft,
                "checklist": ev.checklist,
                "notes": ev.notes,
            }
        )

    serialized_tranches = [
        {
            "id": t.id,
            "event_id": t.event_id,
            "timeline_node_id": t.timeline_node_id,
            "event_vendor_id": t.event_vendor_id,
            "title": t.title,
            "category": t.category,
            "phase": t.phase,
            "tranche_type": t.tranche_type,
            "allocated_amount": t.allocated_amount,
            "committed_amount": t.committed_amount,
            "paid_amount": t.paid_amount,
            "due_date": t.due_date,
            "status": t.status,
            "notes": t.notes,
        }
        for t in tranches
    ]

    serialized_ideas = [
        {
            "id": i.id,
            "event_id": i.event_id,
            "title": i.title,
            "category": i.category,
            "phase": i.phase,
            "estimated_cost": i.estimated_cost,
            "guest_impact_score": i.guest_impact_score,
            "description": i.description,
            "execution_blueprint": i.execution_blueprint,
            "promoted": i.promoted,
            "promoted_node_id": i.promoted_node_id,
        }
        for i in ideas
    ]

    serialized_runs = []
    for r in runs:
        trace_data = r.trace
        trace_data["run_id"] = r.id
        trace_data["snapshot_id"] = r.snapshot_id
        trace_data["status"] = r.status
        trace_data["directive"] = r.directive
        trace_data["orchestrator"] = r.orchestrator
        trace_data["provider_used"] = r.provider_used
        trace_data["model_used"] = r.model_used
        trace_data["duration_ms"] = r.duration_ms
        trace_data["created_at"] = r.created_at
        trace_data["reverted_at"] = r.reverted_at
        serialized_runs.append(trace_data)

    return {
        "event": {
            "id": event.id,
            "slug": event.slug,
            "name": event.name,
            "event_type": event.event_type,
            "client_name": event.client_name,
            "client_organization": event.client_organization,
            "event_date": event.event_date,
            "venue": event.venue,
            "city": event.city,
            "guest_count": event.guest_count,
            "total_budget": event.total_budget,
            "currency": event.currency,
            "status": event.status,
            "theme": event.theme,
            "description": event.description,
        },
        "budget_summary": {
            "total_budget": event.total_budget,
            "allocated_total": allocated_total,
            "committed_total": committed_total,
            "paid_total": paid_total,
            "remaining_ceiling": remaining_ceiling,
            "utilization_pct": round((allocated_total / event.total_budget) * 100, 1) if event.total_budget else 0.0,
        },
        "timeline_nodes": serialized_nodes,
        "event_vendors": serialized_vendors,
        "budget_tranches": serialized_tranches,
        "ideas": serialized_ideas,
        "agent_runs": serialized_runs,
    }


def capture_snapshot_payload(db: Session, event_id: str) -> Dict[str, Any]:
    """Capture mutable event tables for deterministic 1-click revert."""
    ws = serialize_event_workspace(db, event_id)
    return {
        "event": ws["event"],
        "timeline_nodes": ws["timeline_nodes"],
        "event_vendors": ws["event_vendors"],
        "budget_tranches": ws["budget_tranches"],
        "ideas": ws["ideas"],
    }


def restore_snapshot_payload(db: Session, event_id: str, snapshot_data: Dict[str, Any]) -> None:
    """Restore event state to exact pre-run snapshot."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise ValueError(f"Event {event_id} not found")

    ev_data = snapshot_data.get("event", {})
    event.venue = ev_data.get("venue", event.venue)
    event.guest_count = ev_data.get("guest_count", event.guest_count)
    event.total_budget = ev_data.get("total_budget", event.total_budget)
    event.status = ev_data.get("status", event.status)
    event.theme = ev_data.get("theme", event.theme)
    event.description = ev_data.get("description", event.description)

    db.query(TimelineNode).filter(TimelineNode.event_id == event_id).delete()
    db.query(EventVendor).filter(EventVendor.event_id == event_id).delete()
    db.query(BudgetTranche).filter(BudgetTranche.event_id == event_id).delete()
    db.query(Idea).filter(Idea.event_id == event_id).delete()
    db.flush()

    for n in snapshot_data.get("timeline_nodes", []):
        node = TimelineNode(
            id=n["id"],
            event_id=event_id,
            title=n["title"],
            phase=n["phase"],
            swimlane=n.get("swimlane", "milestone"),
            scheduled_date=n["scheduled_date"],
            start_time=n.get("start_time", "09:00"),
            duration_hours=n.get("duration_hours", 2.0),
            status=n.get("status", "pending"),
            critical_path=n.get("critical_path", False),
            owner_agent=n.get("owner_agent", "Timeline Architect"),
            description=n.get("description", ""),
            dependency_ids_json=json.dumps(n.get("dependency_ids", [])),
            checklist_json=json.dumps(n.get("checklist", [])),
            metadata_json=json.dumps(n.get("metadata", {})),
            sort_order=n.get("sort_order", 0),
        )
        db.add(node)

    for ev in snapshot_data.get("event_vendors", []):
        item = EventVendor(
            id=ev["id"],
            event_id=event_id,
            vendor_id=ev["vendor_id"],
            timeline_node_id=ev.get("timeline_node_id"),
            phase=ev.get("phase", "3_months_out"),
            stage=ev.get("stage", "Shortlisted"),
            quoted_amount=ev.get("quoted_amount", 0.0),
            contracted_amount=ev.get("contracted_amount", 0.0),
            paid_amount=ev.get("paid_amount", 0.0),
            rfp_draft=ev.get("rfp_draft", ""),
            checklist_json=json.dumps(ev.get("checklist", [])),
            notes=ev.get("notes", ""),
        )
        db.add(item)

    for t in snapshot_data.get("budget_tranches", []):
        tranche = BudgetTranche(
            id=t["id"],
            event_id=event_id,
            timeline_node_id=t.get("timeline_node_id"),
            event_vendor_id=t.get("event_vendor_id"),
            title=t["title"],
            category=t["category"],
            phase=t.get("phase", "3_months_out"),
            tranche_type=t.get("tranche_type", "Deposit (50%)"),
            allocated_amount=t.get("allocated_amount", 0.0),
            committed_amount=t.get("committed_amount", 0.0),
            paid_amount=t.get("paid_amount", 0.0),
            due_date=t.get("due_date", "2026-11-01"),
            status=t.get("status", "Scheduled"),
            notes=t.get("notes", ""),
        )
        db.add(tranche)

    for i in snapshot_data.get("ideas", []):
        idea = Idea(
            id=i["id"],
            event_id=event_id,
            title=i["title"],
            category=i["category"],
            phase=i.get("phase", "1_month_out"),
            estimated_cost=i.get("estimated_cost", 2500.0),
            guest_impact_score=i.get("guest_impact_score", 95),
            description=i.get("description", ""),
            execution_blueprint_json=json.dumps(i.get("execution_blueprint", {})),
            promoted=i.get("promoted", False),
            promoted_node_id=i.get("promoted_node_id"),
        )
        db.add(idea)

    db.commit()


def seed_database(db: Session) -> None:
    """Idempotently seed the 12 agency vendors and 3 flagship events."""
    if db.query(Event).count() > 0:
        return

    for v in AGENCY_VENDORS:
        vendor = Vendor(
            id=v["id"],
            name=v["name"],
            category=v["category"],
            specialty=v["specialty"],
            rating=v["rating"],
            price_tier=v["price_tier"],
            base_quote_estimate=v["base_quote_estimate"],
            contact_name=v["contact_name"],
            contact_email=v["contact_email"],
            phone=v["phone"],
            location=v["location"],
            sustainability_score=v["sustainability_score"],
            portfolio_tags_json=json.dumps(v["portfolio_tags"]),
        )
        db.add(vendor)

    # =========================================================================
    # EVENT 1: Royal Heritage Udaipur & Garden Wedding ($85,000, 350 Guests)
    # =========================================================================
    wedding = Event(
        id="evt_wedding_udaipur",
        slug="royal-udaipur-garden-wedding",
        name="Royal Heritage Udaipur & Garden Wedding",
        event_type="wedding",
        client_name="Aanya Sharma & Rohan Dev",
        client_organization="Sharma-Dev Family Office",
        event_date="2027-04-18",
        venue="Grand Heritage Conservatory & Botanical Lawns",
        city="Napa Valley, CA",
        guest_count=350,
        total_budget=85000.0,
        currency="USD",
        status="On Track",
        theme="Royal Udaipur Courtyard meets California Botanical Glasshouse",
        description=(
            "Multi-ceremony luxury South Asian & fusion garden wedding for 350 guests featuring "
            "a sunken marigold Mandap, Baraat procession, starlight botanical reception, and zero-waste culinary stations."
        ),
    )
    db.add(wedding)

    wedding_nodes = [
        TimelineNode(
            id="node_w_01",
            event_id=wedding.id,
            title="Estate Venue Lock & Rain-Plan Glasshouse Hold",
            phase="6_months_out",
            swimlane="milestone",
            scheduled_date="2026-10-18",
            start_time="10:00",
            duration_hours=3.0,
            status="completed",
            critical_path=True,
            owner_agent="Timeline Architect",
            description="Lock exclusive 48-hour estate buyout, noise ordinances, and glasshouse rain backup for 350 guests.",
            dependency_ids_json=json.dumps([]),
            checklist_json=json.dumps([
                {"id": "chk_w1_1", "text": "Sign Grand Heritage Estate master license", "completed": True},
                {"id": "chk_w1_2", "text": "Confirm 350-person clear-span lawn footprint", "completed": True},
                {"id": "chk_w1_3", "text": "File county valet & shuttle routing plan", "completed": True},
            ]),
            metadata_json=json.dumps({"headcount": 350, "zone": "Main Lawn & Conservatory"}),
            sort_order=1,
        ),
        TimelineNode(
            id="node_w_02",
            event_id=wedding.id,
            title="Royal Culinary Tasting & Multi-Regional Menu Lock",
            phase="3_months_out",
            swimlane="milestone",
            scheduled_date="2027-01-15",
            start_time="14:00",
            duration_hours=4.0,
            status="completed",
            critical_path=True,
            owner_agent="Vendor Coordinator",
            description="Finalize live Chaat bazaar, Mewari royal thali tasting, and allergen-safe Jain/Vegan stations.",
            dependency_ids_json=json.dumps(["node_w_01"]),
            checklist_json=json.dumps([
                {"id": "chk_w2_1", "text": "Approve 7-item live Chaat & Kulfi bar menu", "completed": True},
                {"id": "chk_w2_2", "text": "Lock 45 Jain & 60 Vegan guest meal counts", "completed": True},
                {"id": "chk_w2_3", "text": "Sign kitchen tent & three-phase power spec", "completed": False},
            ]),
            metadata_json=json.dumps({"catering_style": "Live Stations + Family Style"}),
            sort_order=2,
        ),
        TimelineNode(
            id="node_w_03",
            event_id=wedding.id,
            title="Suspended Marigold Mandap & Floral CAD Sign-Off",
            phase="1_month_out",
            swimlane="milestone",
            scheduled_date="2027-03-18",
            start_time="11:00",
            duration_hours=3.0,
            status="in_progress",
            critical_path=True,
            owner_agent="Creative Director",
            description="3D structural rigging approval for foam-free jasmine/marigold canopy and floating brass diyas.",
            dependency_ids_json=json.dumps(["node_w_01", "node_w_02"]),
            checklist_json=json.dumps([
                {"id": "chk_w3_1", "text": "Approve 24ft octagonal cedar Mandap rigging", "completed": True},
                {"id": "chk_w3_2", "text": "Confirm local marigold & tuberose farm order", "completed": False},
                {"id": "chk_w3_3", "text": "Verify sacred fire pit permit with venue marshal", "completed": False},
            ]),
            metadata_json=json.dumps({"rigging_load_lbs": 1200}),
            sort_order=3,
        ),
        TimelineNode(
            id="node_w_04",
            event_id=wedding.id,
            title="Production Load-In, Acoustic Check & Rehearsal Walk",
            phase="week_of",
            swimlane="milestone",
            scheduled_date="2027-04-16",
            start_time="09:00",
            duration_hours=6.0,
            status="pending",
            critical_path=True,
            owner_agent="Timeline Architect",
            description="Full technical dress rehearsal, Baraat route cones, wireless mic RF sweep, and family procession cueing.",
            dependency_ids_json=json.dumps(["node_w_03"]),
            checklist_json=json.dumps([
                {"id": "chk_w4_1", "text": "Line-check Pandit lapel mic & brass band monitors", "completed": False},
                {"id": "chk_w4_2", "text": "Stage cold-sparkler cues for grand couple entry", "completed": False},
            ]),
            metadata_json=json.dumps({"crew_count": 28}),
            sort_order=4,
        ),
        TimelineNode(
            id="node_w_05",
            event_id=wedding.id,
            title="Baraat Procession, Sunset Mandap Vows & Starlight Reception",
            phase="event_day",
            swimlane="milestone",
            scheduled_date="2027-04-18",
            start_time="15:30",
            duration_hours=7.5,
            status="pending",
            critical_path=True,
            owner_agent="Chief Event Director",
            description="Master Run-of-Show execution: 3:30 PM Baraat, 5:00 PM Sunset Vows, 7:00 PM Glasshouse Reception.",
            dependency_ids_json=json.dumps(["node_w_04"]),
            checklist_json=json.dumps([
                {"id": "chk_w5_1", "text": "Cue Dhol & Velvet Brass at North Gate (15:30)", "completed": False},
                {"id": "chk_w5_2", "text": "Varmala garland exchange at sunken courtyard (17:15)", "completed": False},
                {"id": "chk_w5_3", "text": "Transition 350 guests to candlelit glasshouse dinner (19:00)", "completed": False},
            ]),
            metadata_json=json.dumps({"run_of_show_locked": True}),
            sort_order=5,
        ),
    ]
    for n in wedding_nodes:
        db.add(n)

    wedding_vendors = [
        EventVendor(
            id="ev_w_01",
            event_id=wedding.id,
            vendor_id="vnd_01",
            timeline_node_id="node_w_01",
            phase="6_months_out",
            stage="Paid",
            quoted_amount=22000.0,
            contracted_amount=21500.0,
            paid_amount=21500.0,
            rfp_draft="Confirmed 48-hour exclusive buyout of Grand Heritage Conservatory & Botanical Lawns for 350 guests.",
            checklist_json=json.dumps([
                {"id": "evc_w1_1", "text": "Certificate of Insurance (COI) uploaded", "completed": True},
                {"id": "evc_w1_2", "text": "Rain-plan Glasshouse hold activated", "completed": True},
            ]),
            notes="Includes bridal suite, groom lounge, and backup glasshouse.",
        ),
        EventVendor(
            id="ev_w_02",
            event_id=wedding.id,
            vendor_id="vnd_02",
            timeline_node_id="node_w_02",
            phase="3_months_out",
            stage="Contracted",
            quoted_amount=25000.0,
            contracted_amount=24000.0,
            paid_amount=12000.0,
            rfp_draft="RFP for 350-guest Royal Udaipur banquet + live Chaat bazaar + late-night espresso/masala chai cart.",
            checklist_json=json.dumps([
                {"id": "evc_w2_1", "text": "50% retainer settled", "completed": True},
                {"id": "evc_w2_2", "text": "Final dietary matrix due 14 days prior", "completed": False},
            ]),
            notes="Chef Aarav personally overseeing live tandoor and chaat counters.",
        ),
        EventVendor(
            id="ev_w_03",
            event_id=wedding.id,
            vendor_id="vnd_03",
            timeline_node_id="node_w_03",
            phase="1_month_out",
            stage="Quoted",
            quoted_amount=14200.0,
            contracted_amount=14000.0,
            paid_amount=7000.0,
            rfp_draft="Suspended marigold/jasmine Mandap + 35 botanical centerpiece runners + repurposing ceremony florals.",
            checklist_json=json.dumps([
                {"id": "evc_w3_1", "text": "Rigging diagram approved", "completed": True},
                {"id": "evc_w3_2", "text": "Crew load-in schedule confirmed", "completed": False},
            ]),
            notes="Ceremony garlands will be repurposed to reception sweetheart stage.",
        ),
        EventVendor(
            id="ev_w_04",
            event_id=wedding.id,
            vendor_id="vnd_04",
            timeline_node_id="node_w_05",
            phase="week_of",
            stage="Contracted",
            quoted_amount=6800.0,
            contracted_amount=6500.0,
            paid_amount=3250.0,
            rfp_draft="Baraat mobile brass & dhol unit + cocktail hour jazz quartet + reception dance floor DJ.",
            checklist_json=json.dumps([
                {"id": "evc_w4_1", "text": "Processional playlist & do-not-play list locked", "completed": True},
            ]),
            notes="Wireless battery pack for Baraat procession.",
        ),
        EventVendor(
            id="ev_w_05",
            event_id=wedding.id,
            vendor_id="vnd_05",
            timeline_node_id="node_w_05",
            phase="event_day",
            stage="Contracted",
            quoted_amount=8200.0,
            contracted_amount=8000.0,
            paid_amount=4000.0,
            rfp_draft="2 lead photographers, 2 cinema operators, FAA drone pilot, and same-day reception highlight edit.",
            checklist_json=json.dumps([
                {"id": "evc_w5_1", "text": "Golden-hour couple portrait timeline locked", "completed": True},
            ]),
            notes="Includes 35mm film rolls for couple portraits.",
        ),
    ]
    for ev in wedding_vendors:
        db.add(ev)

    wedding_tranches = [
        BudgetTranche(
            id="tr_w_01",
            event_id=wedding.id,
            timeline_node_id="node_w_01",
            event_vendor_id="ev_w_01",
            title="Estate Venue Buyout & Glasshouse Hold (100%)",
            category="Venue",
            phase="6_months_out",
            tranche_type="Full Settlement",
            allocated_amount=21500.0,
            committed_amount=21500.0,
            paid_amount=21500.0,
            due_date="2026-10-20",
            status="Paid",
            notes="Paid via wire; includes refundable security bond.",
        ),
        BudgetTranche(
            id="tr_w_02",
            event_id=wedding.id,
            timeline_node_id="node_w_02",
            event_vendor_id="ev_w_02",
            title="Saffron & Sage Royal Catering Retainer & Final Tranche",
            category="Catering",
            phase="3_months_out",
            tranche_type="Split Tranche (50/50)",
            allocated_amount=24000.0,
            committed_amount=24000.0,
            paid_amount=12000.0,
            due_date="2027-01-20",
            status="Committed",
            notes="$12k paid; remaining $12k due 10 days before event.",
        ),
        BudgetTranche(
            id="tr_w_03",
            event_id=wedding.id,
            timeline_node_id="node_w_03",
            event_vendor_id="ev_w_03",
            title="Atelier Verdure Mandap & Botanical Installation",
            category="Floral & Decor",
            phase="1_month_out",
            tranche_type="Deposit (50%)",
            allocated_amount=14000.0,
            committed_amount=14000.0,
            paid_amount=7000.0,
            due_date="2027-03-20",
            status="Committed",
            notes="Includes floral repurposing crew between ceremony and reception.",
        ),
        BudgetTranche(
            id="tr_w_04",
            event_id=wedding.id,
            timeline_node_id="node_w_04",
            event_vendor_id="ev_w_04",
            title="Velvet Brass, Dhol Troupe & Reception Production",
            category="Entertainment",
            phase="week_of",
            tranche_type="Production Milestone",
            allocated_amount=6500.0,
            committed_amount=6500.0,
            paid_amount=3250.0,
            due_date="2027-04-12",
            status="Committed",
            notes="50% deposit paid.",
        ),
        BudgetTranche(
            id="tr_w_05",
            event_id=wedding.id,
            timeline_node_id="node_w_05",
            event_vendor_id="ev_w_05",
            title="Lumiere Cinema & Same-Day Edit Deliverable",
            category="Photography & Film",
            phase="event_day",
            tranche_type="Event Day Settlement",
            allocated_amount=8000.0,
            committed_amount=8000.0,
            paid_amount=4000.0,
            due_date="2027-04-18",
            status="Scheduled",
            notes="Balance released on event day load-in.",
        ),
    ]
    for t in wedding_tranches:
        db.add(t)

    wedding_ideas = [
        Idea(
            id="idea_w_01",
            event_id=wedding.id,
            title="Twilight Rajasthani Mehendi & Lac Bangle Courtyard Lounge",
            category="Cultural Experience",
            phase="week_of",
            estimated_cost=4200.0,
            guest_impact_score=98,
            description=(
                "Transform the lower olive grove into an intimate pre-wedding Mehendi & Folk Artisan bazaar "
                "with organic Sojat henna artists, custom lac bangle makers, and acoustic sitar."
            ),
            execution_blueprint_json=json.dumps({
                "milestone_title": "Twilight Mehendi & Lac Bangle Courtyard Welcome",
                "vendor_id": "vnd_11",
                "phase": "week_of",
                "tranche_amount": 4200.0,
                "checklist": [
                    "Reserve Olive Grove patio seating & charpai daybeds",
                    "Book 4 organic Sojat henna artists & live lac bangle artisan",
                    "Coordinate hibiscus agua fresca & masala chai welcome station",
                ],
            }),
            promoted=False,
        ),
        Idea(
            id="idea_w_02",
            event_id=wedding.id,
            title="Zero-Waste Post-Event Floral Donation & Guest Seed Keepsakes",
            category="Sustainability",
            phase="event_day",
            estimated_cost=1800.0,
            guest_impact_score=94,
            description=(
                "Repurpose Mandap marigolds and table arrangements into 350 hand-tied guest bouquet favors "
                "and donate remaining blooms to Bay Area senior residences the next morning."
            ),
            execution_blueprint_json=json.dumps({
                "milestone_title": "Midnight Bouquet Bar & Next-Day Floral Donation",
                "vendor_id": "vnd_03",
                "phase": "event_day",
                "tranche_amount": 1800.0,
                "checklist": [
                    "Set up kraft-paper flower wrapping cart at reception exit",
                    "Schedule 9:00 AM Sunday refrigerated van pickup for senior centers",
                ],
            }),
            promoted=False,
        ),
    ]
    for i in wedding_ideas:
        db.add(i)

    # =========================================================================
    # EVENT 2: Milestone 50th Midnight Jazz Gala ($28,000, 120 Guests)
    # =========================================================================
    birthday = Event(
        id="evt_birthday_jazz",
        slug="milestone-50th-midnight-jazz-gala",
        name="Milestone 50th Midnight Jazz Gala",
        event_type="birthday",
        client_name="Dr. Marcus & Elena Vance-Sterling",
        client_organization="Sterling Venture Partners",
        event_date="2027-02-20",
        venue="Nocturne Speakeasy & Penthouse Vault",
        city="San Francisco, CA",
        guest_count=120,
        total_budget=28000.0,
        currency="USD",
        status="On Track",
        theme="1920s Harlem-Meets-Paris Velvet Jazz Supper Club",
        description=(
            "Black-tie 50th birthday supper club for 120 guests featuring a secret brass-key check-in, "
            "5-course French-Creole tasting menu, live 7-piece brass jazz ensemble, and custom vinyl pressings."
        ),
    )
    db.add(birthday)

    birthday_nodes = [
        TimelineNode(
            id="node_b_01",
            event_id=birthday.id,
            title="Penthouse Speakeasy Buyout & Steinway Piano Tuning",
            phase="6_months_out",
            swimlane="milestone",
            scheduled_date="2026-09-10",
            start_time="11:00",
            duration_hours=2.0,
            status="completed",
            critical_path=True,
            owner_agent="Timeline Architect",
            description="Lock private vault elevator access, rooftop cigar terrace permit, and vintage Steinway B tuning.",
            dependency_ids_json=json.dumps([]),
            checklist_json=json.dumps([
                {"id": "chk_b1_1", "text": "Execute Nocturne Penthouse buyout contract", "completed": True},
                {"id": "chk_b1_2", "text": "Reserve private brass-key elevator attendant", "completed": True},
            ]),
            metadata_json=json.dumps({"headcount": 120}),
            sort_order=1,
        ),
        TimelineNode(
            id="node_b_02",
            event_id=birthday.id,
            title="5-Course French-Creole & Rare Bourbon Pairing Lock",
            phase="3_months_out",
            swimlane="milestone",
            scheduled_date="2026-11-20",
            start_time="18:00",
            duration_hours=3.0,
            status="completed",
            critical_path=True,
            owner_agent="Vendor Coordinator",
            description="Finalize smoked duck gumbo amuse, truffle short-rib, and 1977 birth-year Armagnac toast.",
            dependency_ids_json=json.dumps(["node_b_01"]),
            checklist_json=json.dumps([
                {"id": "chk_b2_1", "text": "Confirm caviar & warm beignet midnight pass", "completed": True},
                {"id": "chk_b2_2", "text": "Engrave 120 custom crystal coupe glasses", "completed": False},
            ]),
            metadata_json=json.dumps({"pairing": "1977 Vintage Armagnac"}),
            sort_order=2,
        ),
        TimelineNode(
            id="node_b_03",
            event_id=birthday.id,
            title="Velvet Stage Drapery & Candlelit Supper Club Layout",
            phase="1_month_out",
            swimlane="milestone",
            scheduled_date="2027-01-20",
            start_time="14:00",
            duration_hours=2.5,
            status="in_progress",
            critical_path=False,
            owner_agent="Creative Director",
            description="Curate crimson velvet booths, brass table lamps, and archival 50-year photo gallery tunnel.",
            dependency_ids_json=json.dumps(["node_b_01"]),
            checklist_json=json.dumps([
                {"id": "chk_b3_1", "text": "Print 25 archival black-and-white life milestone portraits", "completed": True},
                {"id": "chk_b3_2", "text": "Approve warm 2200K pin-spot table lighting", "completed": False},
            ]),
            metadata_json=json.dumps({"style": "Art Deco Supper Club"}),
            sort_order=3,
        ),
        TimelineNode(
            id="node_b_04",
            event_id=birthday.id,
            title=" Brass Septet Soundcheck & Tribute Roast Teleprompter Setup",
            phase="week_of",
            swimlane="milestone",
            scheduled_date="2027-02-18",
            start_time="16:00",
            duration_hours=3.0,
            status="pending",
            critical_path=True,
            owner_agent="Timeline Architect",
            description="Acoustic balance for 7-piece brass band and hidden confidence monitor for keynote tributes.",
            dependency_ids_json=json.dumps(["node_b_02", "node_b_03"]),
            checklist_json=json.dumps([
                {"id": "chk_b4_1", "text": "Soundcheck upright bass, horn section & vocal mic", "completed": False},
            ]),
            metadata_json=json.dumps({"decibel_cap": 92}),
            sort_order=4,
        ),
        TimelineNode(
            id="node_b_05",
            event_id=birthday.id,
            title="Midnight Jazz Supper, Keynote Roasts & Vinyl Encore",
            phase="event_day",
            swimlane="milestone",
            scheduled_date="2027-02-20",
            start_time="19:30",
            duration_hours=5.5,
            status="pending",
            critical_path=True,
            owner_agent="Chief Event Director",
            description="7:30 PM Speakeasy Entry, 8:30 PM Supper & Tributes, 10:15 PM Brass Headliner Set, 12:00 AM Beignets.",
            dependency_ids_json=json.dumps(["node_b_04"]),
            checklist_json=json.dumps([
                {"id": "chk_b5_1", "text": "Spotlight reveal for Marcus's 50th entrance (20:00)", "completed": False},
                {"id": "chk_b5_2", "text": "Sabered champagne tower & 1977 vintage pour (22:00)", "completed": False},
            ]),
            metadata_json=json.dumps({"dress_code": "Black Tie Velvet"}),
            sort_order=5,
        ),
    ]
    for n in birthday_nodes:
        db.add(n)

    birthday_vendors = [
        EventVendor(
            id="ev_b_01",
            event_id=birthday.id,
            vendor_id="vnd_08",
            timeline_node_id="node_b_01",
            phase="6_months_out",
            stage="Paid",
            quoted_amount=9200.0,
            contracted_amount=9000.0,
            paid_amount=9000.0,
            rfp_draft="Full penthouse & speakeasy vault buyout until 1:30 AM with private sommelier staff.",
            checklist_json=json.dumps([{"id": "evcb_1", "text": "Liquor license extension approved", "completed": True}]),
            notes="Includes Steinway grand piano use.",
        ),
        EventVendor(
            id="ev_b_02",
            event_id=birthday.id,
            vendor_id="vnd_09",
            timeline_node_id="node_b_02",
            phase="3_months_out",
            stage="Contracted",
            quoted_amount=8800.0,
            contracted_amount=8500.0,
            paid_amount=4250.0,
            rfp_draft="120-guest seated 5-course French-Creole tasting menu + midnight caviar & warm beignet bar.",
            checklist_json=json.dumps([{"id": "evcb_2", "text": "Menu cards calligraphed", "completed": True}]),
            notes="Chef Celine preparing bespoke gold-leaf espresso opera cake.",
        ),
        EventVendor(
            id="ev_b_03",
            event_id=birthday.id,
            vendor_id="vnd_04",
            timeline_node_id="node_b_05",
            phase="1_month_out",
            stage="Contracted",
            quoted_amount=5800.0,
            contracted_amount=5500.0,
            paid_amount=2750.0,
            rfp_draft="7-piece Velvet Brass Jazz Collective + late-night rare funk vinyl set.",
            checklist_json=json.dumps([{"id": "evcb_3", "text": "Custom arrangement of 'Take Five' rehearsed", "completed": True}]),
            notes="Guest saxophonist solo during cake presentation.",
        ),
    ]
    for ev in birthday_vendors:
        db.add(ev)

    birthday_tranches = [
        BudgetTranche(
            id="tr_b_01",
            event_id=birthday.id,
            timeline_node_id="node_b_01",
            event_vendor_id="ev_b_01",
            title="Nocturne Speakeasy Vault Buyout",
            category="Venue",
            phase="6_months_out",
            tranche_type="Full Settlement",
            allocated_amount=9000.0,
            committed_amount=9000.0,
            paid_amount=9000.0,
            due_date="2026-09-15",
            status="Paid",
            notes="Paid in full.",
        ),
        BudgetTranche(
            id="tr_b_02",
            event_id=birthday.id,
            timeline_node_id="node_b_02",
            event_vendor_id="ev_b_02",
            title="Maison Noir 5-Course Supper & Sommelier Pairing",
            category="Catering",
            phase="3_months_out",
            tranche_type="Deposit (50%)",
            allocated_amount=8500.0,
            committed_amount=8500.0,
            paid_amount=4250.0,
            due_date="2026-11-25",
            status="Committed",
            notes="50% deposit paid.",
        ),
        BudgetTranche(
            id="tr_b_03",
            event_id=birthday.id,
            timeline_node_id="node_b_05",
            event_vendor_id="ev_b_03",
            title="Velvet Brass Septet & Late-Night Vinyl Production",
            category="Entertainment",
            phase="1_month_out",
            tranche_type="Deposit (50%)",
            allocated_amount=5500.0,
            committed_amount=5500.0,
            paid_amount=2750.0,
            due_date="2027-01-25",
            status="Committed",
            notes="Includes horn section & backline.",
        ),
    ]
    for t in birthday_tranches:
        db.add(t)

    birthday_ideas = [
        Idea(
            id="idea_b_01",
            event_id=birthday.id,
            title="Bespoke 12-Inch Gatefold Vinyl Record Guestbook & Live Recording",
            category="Keepsake & Audio",
            phase="event_day",
            estimated_cost=2400.0,
            guest_impact_score=97,
            description=(
                "Record the live jazz quartet's tribute set direct-to-master and send every guest a custom "
                "numbered 12-inch vinyl LP featuring Marcus's favorite jazz standards."
            ),
            execution_blueprint_json=json.dumps({
                "milestone_title": "Live-to-Vinyl Mastering & Custom Gatefold Sleeve Station",
                "vendor_id": "vnd_06",
                "phase": "event_day",
                "tranche_amount": 2400.0,
                "checklist": [
                    "Patch isolated multitrack feed from Velvet Brass mixer",
                    "Set up metallic gold paint-pen signing station on custom LP jackets",
                ],
            }),
            promoted=False,
        ),
    ]
    for i in birthday_ideas:
        db.add(i)

    # =========================================================================
    # EVENT 3: Downtown Cultural & Sustainability Festival ($45,000, 1,500 Guests)
    # =========================================================================
    community = Event(
        id="evt_community_fest",
        slug="downtown-cultural-sustainability-festival",
        name="Downtown Cultural & Sustainability Festival",
        event_type="community",
        client_name="Civic Arts & Green Future Coalition",
        client_organization="City of Oakland Cultural Trust",
        event_date="2027-05-15",
        venue="Civic Center Plaza & Amphitheater",
        city="Oakland, CA",
        guest_count=1500,
        total_budget=45000.0,
        currency="USD",
        status="On Track",
        theme="Zero-Waste Solar Music Stage, Cultural Street Food Village & Eco-Maker Expo",
        description=(
            "Free-admission 1,500-attendee community cultural block festival powered 100% by solar battery microgrids, "
            "featuring 12 BIPOC street food collectives, reusable RFID dishware, and live world music."
        ),
    )
    db.add(community)

    community_nodes = [
        TimelineNode(
            id="node_c_01",
            event_id=community.id,
            title="Civic Street Closure, Fire Lane & Zero-Waste Permit Approval",
            phase="6_months_out",
            swimlane="milestone",
            scheduled_date="2026-11-15",
            start_time="09:00",
            duration_hours=4.0,
            status="completed",
            critical_path=True,
            owner_agent="Timeline Architect",
            description="Lock 4-block downtown street closure, ADA accessible viewing platforms, and 98% landfill diversion plan.",
            dependency_ids_json=json.dumps([]),
            checklist_json=json.dumps([
                {"id": "chk_c1_1", "text": "City DOT traffic barricade plan approved", "completed": True},
                {"id": "chk_c1_2", "text": "County Environmental Health multi-vendor food permit", "completed": True},
            ]),
            metadata_json=json.dumps({"headcount": 1500}),
            sort_order=1,
        ),
        TimelineNode(
            id="node_c_02",
            event_id=community.id,
            title="12-Cart Cultural Street Food Village & Reusable Dishware Loop",
            phase="3_months_out",
            swimlane="milestone",
            scheduled_date="2027-02-15",
            start_time="13:00",
            duration_hours=3.0,
            status="completed",
            critical_path=True,
            owner_agent="Vendor Coordinator",
            description="Onboard 12 local cultural food pop-ups with centralized sanitizing & zero single-use plastics.",
            dependency_ids_json=json.dumps(["node_c_01"]),
            checklist_json=json.dumps([
                {"id": "chk_c2_1", "text": "Assign greywater & compost stations per 3 food carts", "completed": True},
                {"id": "chk_c2_2", "text": "Deploy 3,000 RFID returnable bowls & cups", "completed": False},
            ]),
            metadata_json=json.dumps({"waste_diversion_target": "98%"}),
            sort_order=2,
        ),
        TimelineNode(
            id="node_c_03",
            event_id=community.id,
            title="Solar Microgrid Amphitheater Stage & Line-Array Audio Lock",
            phase="1_month_out",
            swimlane="milestone",
            scheduled_date="2027-04-15",
            start_time="10:00",
            duration_hours=4.0,
            status="in_progress",
            critical_path=True,
            owner_agent="Vendor Coordinator",
            description="Configure zero-diesel battery banks for main cultural stage, LED community wall, and emergency PA.",
            dependency_ids_json=json.dumps(["node_c_01"]),
            checklist_json=json.dumps([
                {"id": "chk_c3_1", "text": "Confirm 120kWh mobile solar trailer placement", "completed": True},
                {"id": "chk_c3_2", "text": "Verify ASL interpreter stage monitor sightlines", "completed": False},
            ]),
            metadata_json=json.dumps({"power_source": "100% Solar Battery"}),
            sort_order=3,
        ),
        TimelineNode(
            id="node_c_04",
            event_id=community.id,
            title="Volunteer Marshal Briefing & Perimeter Safety Walkthrough",
            phase="week_of",
            swimlane="milestone",
            scheduled_date="2027-05-12",
            start_time="17:00",
            duration_hours=2.5,
            status="pending",
            critical_path=True,
            owner_agent="Timeline Architect",
            description="Train 45 green-ambassador volunteers, hydration station leads, and first-aid medic tent crew.",
            dependency_ids_json=json.dumps(["node_c_02", "node_c_03"]),
            checklist_json=json.dumps([
                {"id": "chk_c4_1", "text": "Distribute 45 two-way radios & safety vests", "completed": False},
            ]),
            metadata_json=json.dumps({"volunteers": 45}),
            sort_order=4,
        ),
        TimelineNode(
            id="node_c_05",
            event_id=community.id,
            title="Festival Gates Open, Cultural Performances & Impact Audit",
            phase="event_day",
            swimlane="milestone",
            scheduled_date="2027-05-15",
            start_time="11:00",
            duration_hours=9.0,
            status="pending",
            critical_path=True,
            owner_agent="Chief Event Director",
            description="11:00 AM Ribbon Cutting, 1:00 PM Cultural Dance Showcase, 4:00 PM Headliner Concert, 7:30 PM Zero-Waste Weigh-In.",
            dependency_ids_json=json.dumps(["node_c_04"]),
            checklist_json=json.dumps([
                {"id": "chk_c5_1", "text": "Mayor & Indigenous land acknowledgment welcome (11:15)", "completed": False},
                {"id": "chk_c5_2", "text": "Publish live solar kWh & compost diversion scoreboard (18:00)", "completed": False},
            ]),
            metadata_json=json.dumps({"crowd_capacity": 1500}),
            sort_order=5,
        ),
    ]
    for n in community_nodes:
        db.add(n)

    community_vendors = [
        EventVendor(
            id="ev_c_01",
            event_id=community.id,
            vendor_id="vnd_10",
            timeline_node_id="node_c_01",
            phase="6_months_out",
            stage="Paid",
            quoted_amount=6200.0,
            contracted_amount=6000.0,
            paid_amount=6000.0,
            rfp_draft="Turnkey street closure permitting, compost/recycling sorting hubs, and live impact auditing.",
            checklist_json=json.dumps([{"id": "evcc_1", "text": "Street closure permit stamped", "completed": True}]),
            notes="98% diversion guarantee.",
        ),
        EventVendor(
            id="ev_c_02",
            event_id=community.id,
            vendor_id="vnd_12",
            timeline_node_id="node_c_02",
            phase="3_months_out",
            stage="Contracted",
            quoted_amount=14500.0,
            contracted_amount=14000.0,
            paid_amount=7000.0,
            rfp_draft="12 cultural food carts + community voucher subsidy + RFID reusable dishware wash hub.",
            checklist_json=json.dumps([{"id": "evcc_2", "text": "Health department temporary food facility permits", "completed": True}]),
            notes="Includes 500 subsidized youth/senior meal tokens.",
        ),
        EventVendor(
            id="ev_c_03",
            event_id=community.id,
            vendor_id="vnd_06",
            timeline_node_id="node_c_03",
            phase="1_month_out",
            stage="Contracted",
            quoted_amount=7800.0,
            contracted_amount=7500.0,
            paid_amount=3750.0,
            rfp_draft="Solar-battery main stage audio array, LED community scoreboard, and wireless PA.",
            checklist_json=json.dumps([{"id": "evcc_3", "text": "Solar trailer load-in path verified", "completed": True}]),
            notes="Zero diesel generators.",
        ),
    ]
    for ev in community_vendors:
        db.add(ev)

    community_tranches = [
        BudgetTranche(
            id="tr_c_01",
            event_id=community.id,
            timeline_node_id="node_c_01",
            event_vendor_id="ev_c_01",
            title="EcoPulse Civic Permits & Zero-Waste Infrastructure",
            category="Permits & Sustainability",
            phase="6_months_out",
            tranche_type="Full Settlement",
            allocated_amount=6000.0,
            committed_amount=6000.0,
            paid_amount=6000.0,
            due_date="2026-11-20",
            status="Paid",
            notes="City permit fees & zero-waste crew.",
        ),
        BudgetTranche(
            id="tr_c_02",
            event_id=community.id,
            timeline_node_id="node_c_02",
            event_vendor_id="ev_c_02",
            title="Bay Commons Cultural Food Village & Reusable Dishware",
            category="Catering",
            phase="3_months_out",
            tranche_type="Deposit (50%)",
            allocated_amount=14000.0,
            committed_amount=14000.0,
            paid_amount=7000.0,
            due_date="2027-02-20",
            status="Committed",
            notes="Covers reusable dishware loop & community meal vouchers.",
        ),
        BudgetTranche(
            id="tr_c_03",
            event_id=community.id,
            timeline_node_id="node_c_03",
            event_vendor_id="ev_c_03",
            title="Prism Solar Stage Audio & LED Impact Wall",
            category="AV & Lighting",
            phase="1_month_out",
            tranche_type="Deposit (50%)",
            allocated_amount=7500.0,
            committed_amount=7500.0,
            paid_amount=3750.0,
            due_date="2027-04-20",
            status="Committed",
            notes="50% deposit settled.",
        ),
    ]
    for t in community_tranches:
        db.add(t)

    community_ideas = [
        Idea(
            id="idea_c_01",
            event_id=community.id,
            title="Interactive Community Mural & Upcycled Textile Art Pavilion",
            category="Community Activation",
            phase="event_day",
            estimated_cost=3200.0,
            guest_impact_score=96,
            description=(
                "Partner with 4 local muralists to host a live paint-by-community canvas using solar-pigment paints "
                "that will be permanently installed at the Youth Recreation Center."
            ),
            execution_blueprint_json=json.dumps({
                "milestone_title": "Live Community Mural & Upcycled Textile Pavilion",
                "vendor_id": "vnd_03",
                "phase": "event_day",
                "tranche_amount": 3200.0,
                "checklist": [
                    "Construct 24ft modular birch mural panels",
                    "Stage non-toxic water-based paint stations for 300 youth participants",
                ],
            }),
            promoted=False,
        ),
    ]
    for i in community_ideas:
        db.add(i)

    db.commit()

    # Create an initial seed AgentRunSnapshot on the Wedding event so the Visual Trace HUD is immediately populated
    initial_snapshot = capture_snapshot_payload(db, wedding.id)
    seed_trace = {
        "run_id": "run_seed_01",
        "snapshot_id": "snap_seed_01",
        "status": "completed",
        "orchestrator": "Chief Event Director",
        "directive": "Verify 350-guest Royal Udaipur Garden Wedding critical path, lock glasshouse rain backup, and audit $85k budget ceiling",
        "summary": "Synchronized 5 critical-path milestones across 6 Months Out -> Event Day, verified $74,000 allocated ($11,000 buffer under $85,000 ceiling), and linked 5 core vendors.",
        "subagents": [
            {
                "id": "sa_timeline",
                "name": "Timeline Architect",
                "role": "Critical Path & Run-of-Show",
                "status": "completed",
                "duration_ms": 84,
                "thought": "Audited dependency graph from Estate Venue Lock (node_w_01) to Sunset Mandap & Starlight Reception (node_w_05); zero scheduling bottlenecks detected.",
                "tool_calls": [
                    {
                        "tool": "get_timeline_graph",
                        "args_summary": "event_id='evt_wedding_udaipur'",
                        "duration_ms": 38,
                        "affected_node_id": "node_w_01",
                        "result_summary": "5 milestones verified across 5 phases; critical path intact.",
                    },
                    {
                        "tool": "detect_timeline_bottlenecks",
                        "args_summary": "event_id='evt_wedding_udaipur'",
                        "duration_ms": 46,
                        "affected_node_id": "node_w_05",
                        "result_summary": "0 bottlenecks; glasshouse rain backup linked to node_w_01.",
                    },
                ],
            },
            {
                "id": "sa_vendor",
                "name": "Vendor Coordinator",
                "role": "Agency Vendor CRM & RFPs",
                "status": "completed",
                "duration_ms": 96,
                "thought": "Verified contracted status for Saffron & Sage Catering and Velvet Brass Baraat troupe; queued floral rigging sign-off with Atelier Verdure.",
                "tool_calls": [
                    {
                        "tool": "search_agency_vendors",
                        "args_summary": "category='Floral & Decor', min_rating=4.9",
                        "duration_ms": 49,
                        "affected_node_id": "node_w_03",
                        "result_summary": "Matched Atelier Verdure Floral & Spatial Design (4.97★).",
                    },
                    {
                        "tool": "draft_vendor_rfp",
                        "args_summary": "vendor='Atelier Verdure', node='node_w_03'",
                        "duration_ms": 47,
                        "affected_node_id": "node_w_03",
                        "result_summary": "Generated foam-free marigold Mandap rigging brief.",
                    },
                ],
            },
            {
                "id": "sa_budget",
                "name": "Budget Controller",
                "role": "Tranche Ledger & Variance Audit",
                "status": "completed",
                "duration_ms": 62,
                "thought": "Calculated total allocated tranches ($74,000.00) against $85,000.00 ceiling; $11,000.00 unallocated reserve available for Mehendi night or floral enhancements.",
                "tool_calls": [
                    {
                        "tool": "get_budget_ledger",
                        "args_summary": "event_id='evt_wedding_udaipur'",
                        "duration_ms": 62,
                        "affected_node_id": "node_w_02",
                        "result_summary": "Allocated $74,000 / $85,000 (87.1% utilization, $11,000 headroom).",
                    },
                ],
            },
        ],
    }
    run_snap = AgentRunSnapshot(
        id="run_seed_01",
        snapshot_id="snap_seed_01",
        event_id=wedding.id,
        directive=seed_trace["directive"],
        orchestrator="Chief Event Director",
        status="completed",
        provider_used="autonomous_engine",
        model_used="antigravity-swarm-deterministic-v1",
        duration_ms=242,
        pre_run_state_json=json.dumps(initial_snapshot),
        trace_json=json.dumps(seed_trace),
    )
    db.add(run_snap)
    db.commit()
