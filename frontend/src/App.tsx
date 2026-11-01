import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  ChevronDown,
  FileDown,
  Lightbulb,
  Plus,
  RefreshCw,
  Sparkles,
  SunMoon,
} from 'lucide-react';
import { crmApi } from './api/client';
import { AutonomousCommandBar } from './components/AutonomousCommandBar';
import { CreateEventModal } from './components/CreateEventModal';
import { IdeaStudioDrawer } from './components/IdeaStudioDrawer';
import { NodeInspectorDrawer } from './components/NodeInspectorDrawer';
import { RunOfShowExportModal } from './components/RunOfShowExportModal';
import { TimelineCanvas } from './components/TimelineCanvas';
import { VendorPoolModal } from './components/VendorPoolModal';
import {
  AgencyVendor,
  ChecklistItem,
  CreateEventPayload,
  EventSummary,
  EventVendorItem,
  EventWorkspace,
  LLMConfigStatus,
  PhaseKey,
  TIMELINE_PHASES,
  TimelineNode,
  VendorStage,
} from './types/crm';

export const App: React.FC = () => {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('evt_wedding_udaipur');
  const [workspace, setWorkspace] = useState<EventWorkspace | null>(null);
  const [agencyVendors, setAgencyVendors] = useState<AgencyVendor[]>([]);
  const [llmStatus, setLlmStatus] = useState<LLMConfigStatus | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isVendorPoolOpen, setIsVendorPoolOpen] = useState(false);
  const [isIdeaStudioOpen, setIsIdeaStudioOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMarkdown, setExportMarkdown] = useState<string>('');

  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const studioMenuRef = useRef<HTMLDivElement | null>(null);

  const [isRunningDirective, setIsRunningDirective] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [themeMode, setThemeMode] = useState<'velvet-light' | 'espresso-dark'>(() => {
    try {
      const saved = window.localStorage.getItem('pw5_theme_mode');
      return saved === 'espresso-dark' ? 'espresso-dark' : 'velvet-light';
    } catch {
      return 'velvet-light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    try {
      window.localStorage.setItem('pw5_theme_mode', themeMode);
    } catch {
      // ignore storage errors
    }
  }, [themeMode]);

  useEffect(() => {
    if (!isStudioMenuOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        studioMenuRef.current &&
        !studioMenuRef.current.contains(event.target as Node)
      ) {
        setIsStudioMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStudioMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStudioMenuOpen]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'velvet-light' ? 'espresso-dark' : 'velvet-light'));
  };

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const bootstrap = async () => {
    setConnectionError(null);
    try {
      const [evRes, vndRes, llmRes] = await Promise.all([
        crmApi.getEvents(),
        crmApi.getAgencyVendors(),
        crmApi.getLLMConfig(),
      ]);
      setEvents(evRes.events);
      setAgencyVendors(vndRes.vendors);
      setLlmStatus(llmRes);
      const initialId = evRes.events[0]?.id || 'evt_wedding_udaipur';
      setSelectedEventId(initialId);
      const ws = await crmApi.getEventWorkspace(initialId);
      setWorkspace(ws);
    } catch (err) {
      console.error('Failed to bootstrap EventsCRM workspace:', err);
      setConnectionError(
        err instanceof Error ? err.message : 'Unable to reach FastAPI backend on port 8000.'
      );
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedNodeId(null);
    const ws = await crmApi.getEventWorkspace(eventId);
    setWorkspace(ws);
  };

  const handleCreateEvent = async (payload: CreateEventPayload) => {
    setIsRunningDirective(true);
    try {
      const res = await crmApi.createEvent(payload);
      const evRes = await crmApi.getEvents();
      setEvents(evRes.events);
      setSelectedEventId(res.event_id);
      setSelectedNodeId(null);
      setWorkspace(res.workspace);
      showToast(
        `Created and planned "${res.workspace.event.name}" across all 5 phases!`
      );
    } finally {
      setIsRunningDirective(false);
    }
  };

  const handleHighlightNode = (nodeId: string) => {
    setHighlightedNodeId(nodeId);
    const el = document.getElementById(`timeline-node-${nodeId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
    setTimeout(() => {
      setHighlightedNodeId((prev) => (prev === nodeId ? null : prev));
    }, 3500);
  };

  const handleSubmitAutonomousDirective = async (directive: string) => {
    if (!workspace) return;
    setIsRunningDirective(true);
    try {
      const res = await crmApi.runAutonomousDirective(workspace.event.id, directive);
      setWorkspace(res.workspace);
      const evRes = await crmApi.getEvents();
      setEvents(evRes.events);

      const firstNodeId = res.trace.subagents
        .flatMap((s) => s.tool_calls)
        .find((tc) => tc.affected_node_id)?.affected_node_id;
      if (firstNodeId) {
        handleHighlightNode(firstNodeId);
      }
      showToast(
        'Plan updated! Saved a backup snapshot so you can undo anytime.'
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to update plan. Check backend connection.');
    } finally {
      setIsRunningDirective(false);
    }
  };

  const handleRevertRun = async (runId: string) => {
    if (!workspace) return;
    const res = await crmApi.revertAgentRun(workspace.event.id, runId);
    setWorkspace(res.workspace);
    const evRes = await crmApi.getEvents();
    setEvents(evRes.events);
    showToast('Undid last change and restored your previous plan.');
  };

  const handleQuickAddMilestone = async (phase: PhaseKey) => {
    if (!workspace) return;
    const phaseLabel =
      TIMELINE_PHASES.find((p) => p.key === phase)?.label || phase.replace(/_/g, ' ');
    const title = window.prompt(
      `New milestone title for "${phaseLabel}":`,
      'VIP Production & Floorplan Sign-Off'
    );
    if (!title || !title.trim()) return;
    const ws = await crmApi.createTimelineNode(workspace.event.id, {
      title: title.trim(),
      phase,
      scheduled_date: workspace.event.event_date,
      start_time: '14:00',
      duration_hours: 2.5,
      critical_path: true,
      description: `Added to ${phaseLabel} timeline.`,
    });
    setWorkspace(ws);
    showToast(`Added milestone "${title.trim()}" to ${phaseLabel}.`);
  };

  const handleUpdateNode = async (
    nodeId: string,
    payload: Partial<{
      status: string;
      start_time: string;
      duration_hours: number;
      checklist: ChecklistItem[];
    }>
  ) => {
    if (!workspace) return;
    const ws = await crmApi.updateTimelineNode(workspace.event.id, nodeId, payload);
    setWorkspace(ws);
  };

  const handleAssignVendor = async (payload: {
    vendor_id: string;
    timeline_node_id?: string | null;
    phase: PhaseKey;
    stage: VendorStage;
    quoted_amount?: number;
  }) => {
    if (!workspace) return;
    const ws = await crmApi.assignVendor(workspace.event.id, payload);
    setWorkspace(ws);
    showToast('Vendor linked to timeline and request prepared.');
  };

  const handleAdvanceVendorStage = async (
    vendor: EventVendorItem,
    nextStage: VendorStage
  ) => {
    if (!workspace) return;
    const ws = await crmApi.updateEventVendor(workspace.event.id, vendor.id, {
      stage: nextStage,
      contracted_amount:
        nextStage === 'Contracted' || nextStage === 'Paid'
          ? vendor.quoted_amount
          : vendor.contracted_amount,
      paid_amount:
        nextStage === 'Paid'
          ? vendor.quoted_amount
          : nextStage === 'Contracted'
          ? Math.round(vendor.quoted_amount * 0.5)
          : vendor.paid_amount,
    });
    setWorkspace(ws);
    showToast(`${vendor.vendor_name} advanced to ${nextStage}.`);
  };

  const handleDraftRfp = async (eventVendorId: string) => {
    if (!workspace) return;
    const ws = await crmApi.draftVendorRfp(workspace.event.id, eventVendorId);
    setWorkspace(ws);
    showToast('Updated vendor request brief.');
  };

  const handlePromoteIdea = async (ideaId: string) => {
    if (!workspace) return;
    const res = await crmApi.promoteIdea(workspace.event.id, ideaId);
    setWorkspace(res.workspace);
    if (res.promotion.affected_node_id) {
      handleHighlightNode(res.promotion.affected_node_id);
    }
    showToast('Added idea directly to your timeline, vendors, and budget!');
  };

  const handleCreateIdea = async (payload: {
    title: string;
    category: string;
    phase: PhaseKey;
    estimated_cost: number;
    description: string;
  }) => {
    if (!workspace) return;
    const ws = await crmApi.createIdea(workspace.event.id, payload);
    setWorkspace(ws);
    showToast(`Saved new idea "${payload.title}".`);
  };

  const handleOpenExportBrief = async () => {
    if (!workspace) return;
    const res = await crmApi.exportRunOfShowBrief(workspace.event.id);
    setExportMarkdown(res.markdown);
    setIsExportModalOpen(true);
  };

  const handleRebalanceBudget = async () => {
    if (!workspace) return;
    const ws = await crmApi.rebalanceBudget(workspace.event.id);
    setWorkspace(ws);
    showToast('Rebalanced payment tranches within your event budget.');
  };

  const handleUpdateLLMConfig = async (payload: {
    provider?: string;
    model?: string;
    gemini_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
    openai_base_url?: string;
  }) => {
    const updated = await crmApi.updateLLMConfig(payload);
    setLlmStatus(updated);
  };

  const selectedNode: TimelineNode | null =
    workspace?.timeline_nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* ZONE 1: Ultra-Minimal Apple Frosted-Glass Global Nav Bar */}
      <header className="sticky top-0 z-20 h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* 1. Minimal Brand Mark */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              Aurelia
            </span>
          </div>

          {/* Center-Right Interactive Elements: Event Selector Pill + New Event Pill + Studio Menu Popover */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* 2. Clean Event Selector Pill */}
            <div className="rounded-full border border-slate-800/90 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium min-w-0">
              <select
                aria-label="Select Event"
                data-testid="event-selector-select"
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="bg-transparent text-xs font-medium text-white focus:outline-none truncate max-w-[160px] sm:max-w-[280px] cursor-pointer"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id} className="bg-slate-900 text-white">
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Pill-Shaped + New Event Button */}
            <button
              type="button"
              data-testid="new-event-btn"
              onClick={() => setIsCreateEventOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#C89D54] px-3.5 py-1.5 text-xs font-semibold text-[#1E1A17] hover:brightness-105 transition"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>+ New Event</span>
            </button>

            {/* 4. Single Studio Menu ▾ Dropdown Button & Popover */}
            <div ref={studioMenuRef} className="relative shrink-0">
              <button
                type="button"
                data-testid="studio-menu-button"
                onClick={() => setIsStudioMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-800/90 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-500/40 hover:text-white transition"
              >
                <span>Studio Menu ▾</span>
              </button>

              {isStudioMenuOpen && (
                <div
                  data-testid="studio-menu-popover"
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-800/90 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl z-30 space-y-1"
                >
                  <button
                    type="button"
                    data-testid="menu-item-vendors"
                    onClick={() => {
                      setIsVendorPoolOpen(true);
                      setIsStudioMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-sky-400" />
                      <span>Vendors Directory</span>
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {agencyVendors.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="menu-item-ideas"
                    onClick={() => {
                      setIsIdeaStudioOpen(true);
                      setIsStudioMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-fuchsia-400" />
                      <span>Idea Studio</span>
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {workspace?.ideas.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="menu-item-share"
                    onClick={() => {
                      setIsStudioMenuOpen(false);
                      handleOpenExportBrief();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileDown className="h-3.5 w-3.5 text-amber-400" />
                      <span>Share & Settings</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Brief & AI</span>
                  </button>

                  <button
                    type="button"
                    data-testid="menu-item-rebalance"
                    onClick={() => {
                      setIsStudioMenuOpen(false);
                      handleRebalanceBudget();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Auto-Rebalance Budget</span>
                    </span>
                    {workspace && (
                      <span className="font-mono text-[10px] text-emerald-300">
                        ${workspace.budget_summary.allocated_total.toLocaleString()} / $
                        {workspace.budget_summary.total_budget.toLocaleString()}
                      </span>
                    )}
                  </button>

                  <div className="my-1 border-t border-slate-800/80" />

                  <button
                    type="button"
                    data-testid="theme-toggle-btn"
                    onClick={() => {
                      toggleThemeMode();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <SunMoon className="h-3.5 w-3.5 text-amber-400" />
                      <span>Appearance</span>
                    </span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-500/30">
                      {themeMode === 'velvet-light' ? 'Espresso Contrast' : 'Soft Velvet'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {statusBanner && (
        <div className="mx-auto max-w-5xl px-4 pt-3 sm:px-6">
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-200 backdrop-blur-xl">
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-emerald-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ZONE 2: Whisper-Quiet Centered Apple Editorial Hero + Timeline Canvas */}
      {workspace ? (
        <main className="mx-auto max-w-5xl px-4 pt-10 pb-20 sm:px-6">
          {/* Centered Apple Editorial Hero Header */}
          <div
            data-testid="apple-editorial-hero"
            className="mx-auto max-w-3xl text-center space-y-2.5 mb-10"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {workspace.event.event_type.toUpperCase()} ·{' '}
              {workspace.event.client_name.toUpperCase()}
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
              {workspace.event.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {workspace.event.event_date} · {workspace.event.venue}, {workspace.event.city} ·{' '}
              {workspace.event.guest_count.toLocaleString()} Guests · $
              {workspace.budget_summary.allocated_total.toLocaleString()} of $
              {workspace.budget_summary.total_budget.toLocaleString()} planned (
              {workspace.budget_summary.utilization_pct}%)
            </p>
          </div>

          <TimelineCanvas
            nodes={workspace.timeline_nodes}
            vendors={workspace.event_vendors}
            tranches={workspace.budget_tranches}
            selectedNodeId={selectedNodeId}
            highlightedNodeId={highlightedNodeId}
            onSelectNode={(n) => setSelectedNodeId(n.id)}
            onQuickAddMilestone={handleQuickAddMilestone}
            onAdvanceVendorStage={handleAdvanceVendorStage}
            onUpdateNode={handleUpdateNode}
          />
        </main>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
          <div className="text-sm font-semibold text-slate-300">
            {connectionError
              ? 'Backend API on port 8000 was not reachable when the page opened.'
              : 'Loading Aurelia Event Planning Workspace...'}
          </div>
          {connectionError && (
            <div className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
              <p>
                Ensure the FastAPI server is running on{' '}
                <code className="text-amber-300">http://127.0.0.1:8000</code>, then click Retry below.
              </p>
              <button
                type="button"
                onClick={bootstrap}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Connection
              </button>
            </div>
          )}
        </div>
      )}

      {/* ZONE 3: Sleek Apple Spotlight-Style Bottom Assistant Pill */}
      {workspace && (
        <AutonomousCommandBar
          eventType={workspace.event.event_type}
          isRunning={isRunningDirective}
          runs={workspace.agent_runs || []}
          onSubmitDirective={handleSubmitAutonomousDirective}
          onHighlightNode={handleHighlightNode}
          onRevertRun={handleRevertRun}
        />
      )}

      {/* Create & Auto-Plan Event 2-Step Wizard Modal */}
      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onCreateEvent={handleCreateEvent}
      />

      {/* Contextual Node Inspector Drawer */}
      <NodeInspectorDrawer
        node={selectedNode}
        vendors={workspace?.event_vendors || []}
        tranches={workspace?.budget_tranches || []}
        onClose={() => setSelectedNodeId(null)}
        onUpdateNode={handleUpdateNode}
        onUpdateVendorStage={handleAdvanceVendorStage}
        onDraftRfp={handleDraftRfp}
      />

      {/* Shared Agency Vendor Pool Modal */}
      <VendorPoolModal
        isOpen={isVendorPoolOpen}
        onClose={() => setIsVendorPoolOpen(false)}
        agencyVendors={agencyVendors}
        eventVendors={workspace?.event_vendors || []}
        nodes={workspace?.timeline_nodes || []}
        onAssignVendor={handleAssignVendor}
      />

      {/* Idea Studio Drawer */}
      <IdeaStudioDrawer
        isOpen={isIdeaStudioOpen}
        onClose={() => setIsIdeaStudioOpen(false)}
        ideas={workspace?.ideas || []}
        onPromoteIdea={handlePromoteIdea}
        onCreateIdea={handleCreateIdea}
      />

      {/* Client Run-of-Show Brief & Runtime LLM Settings Modal */}
      <RunOfShowExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        markdownBrief={exportMarkdown}
        eventName={workspace?.event.name || 'event'}
        llmStatus={llmStatus}
        onUpdateLLMConfig={handleUpdateLLMConfig}
      />
    </div>
  );
};

export default App;
