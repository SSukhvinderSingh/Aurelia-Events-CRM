# PW5 EventsCRM — Autonomous B2B Event Planning Agency CRM

A timeline-centric **B2B Event Planning Agency CRM** built for managing luxury **Weddings**, **Milestone Birthdays**, and **Community Festivals**, powered by a hierarchical **Google Antigravity SDK** multi-agent swarm, **FastMCP** domain tools, **LLM-agnostic `.env` configuration**, and a collapsible **"Visual Trace View: AI Agents & Actions"** with **1-Click Snapshot Rollback**.

---

## 1. Key Capabilities & Architecture

### 1.1 Three-Track Synchronized Timeline Canvas
- **5 Synchronized Phase Columns**: `6 Months Out`, `3 Months Out`, `1 Month Out`, `Week Of`, and `Event Day Run-of-Show`.
- **Swimlane 1 — Milestones & Checklists (`Timeline Architect`)**: Critical-path nodes, dependency links, call times, durations, and interactive execution checklists.
- **Swimlane 2 — Vendor CRM Pipeline (`Vendor Coordinator`)**: Shared 12-partner Agency Vendor Pool + per-event vendor pipeline (`Shortlisted -> RFP Sent -> Quoted -> Contracted -> Paid`) with automated RFP brief generation.
- **Swimlane 3 — Budget & Payment Tranches (`Budget Controller`)**: Milestone-linked deposits, retainers, and settlements with automatic ceiling rebalancing.
- **Idea-to-Execution Studio (`Creative Director`)**: Bespoke cultural and experiential concepts that promote in 1 click into a Swimlane 1 milestone, Swimlane 2 vendor task, and Swimlane 3 payment tranche.

### 1.2 Collapsible "Visual Trace View: AI Agents & Actions" & 1-Click Snapshot Rollback
- Docked at the bottom-right of the workspace, streaming every spawned sub-agent (`Timeline Architect`, `Vendor Coordinator`, `Creative Director`, `Budget Controller`), scoped MCP tool invocation, execution latency (`ms`), and affected timeline node ID.
- **Click-to-Highlight**: Clicking any tool call badge scrolls to and pulses the corresponding `affected_node_id` on the Timeline Canvas.
- **Pre-Run Snapshot Guardrail (`Revert Run`)**: Before every autonomous swarm run, the backend captures a complete JSON snapshot (`AgentRunSnapshot`) of the event workspace. Clicking **Revert Run** restores the exact pre-run state in one click.

### 1.3 LLM-Agnostic `.env` & Runtime Configuration
Configure any provider in `.env` (or via the in-app **Export Brief & LLM Config** modal):
- `LLM_PROVIDER`: `auto` | `antigravity` | `gemini` | `openai` | `anthropic`
- `GEMINI_API_KEY`, `ANTIGRAVITY_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_BASE_URL`, `LLM_MODEL`
- When no API key is populated yet, the built-in **Smart Autonomous Swarm Engine** executes deterministic multi-agent tool calls against SQLite so the entire application and test suite work 100% out-of-the-box.

---

## 2. Quickstart

### Backend (FastAPI + SQLite + FastMCP + Antigravity Swarm)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run automated pytest verification suite
PYTHONPATH=. pytest tests -v

# Start FastAPI server on http://127.0.0.1:8000
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

### Frontend (React + TypeScript + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run build
npm run dev
```
Open `http://localhost:5173` in your browser.
