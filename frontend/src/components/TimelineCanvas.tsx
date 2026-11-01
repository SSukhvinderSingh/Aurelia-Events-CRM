import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  SlidersHorizontal,
  Square,
} from 'lucide-react';
import {
  BudgetTrancheItem,
  ChecklistItem,
  EventVendorItem,
  PhaseKey,
  TIMELINE_PHASES,
  TimelineNode,
  VendorStage,
} from '../types/crm';

interface TimelineCanvasProps {
  nodes: TimelineNode[];
  vendors: EventVendorItem[];
  tranches: BudgetTrancheItem[];
  selectedNodeId: string | null;
  highlightedNodeId: string | null;
  onSelectNode: (node: TimelineNode) => void;
  onQuickAddMilestone: (phase: PhaseKey) => void;
  onAdvanceVendorStage: (vendor: EventVendorItem, nextStage: VendorStage) => void;
  onUpdateNode?: (
    nodeId: string,
    payload: Partial<{
      status: string;
      start_time: string;
      duration_hours: number;
      checklist: ChecklistItem[];
    }>
  ) => Promise<void> | void;
}

const VENDOR_STAGES: VendorStage[] = [
  'Shortlisted',
  'RFP Sent',
  'Quoted',
  'Contracted',
  'Paid',
];

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  nodes,
  vendors,
  tranches,
  selectedNodeId,
  highlightedNodeId,
  onSelectNode,
  onQuickAddMilestone,
  onAdvanceVendorStage,
  onUpdateNode,
}) => {
  const [viewMode, setViewMode] = useState<'connected' | 'vendors' | 'budget'>('connected');
  const [activePhaseFilter, setActivePhaseFilter] = useState<PhaseKey | 'all'>('all');
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});
  const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
  const viewOptionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isViewOptionsOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        viewOptionsRef.current &&
        !viewOptionsRef.current.contains(event.target as Node)
      ) {
        setIsViewOptionsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewOptionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewOptionsOpen]);

  const visiblePhases =
    activePhaseFilter === 'all'
      ? TIMELINE_PHASES
      : TIMELINE_PHASES.filter((p) => p.key === activePhaseFilter);

  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const getHumanStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Done';
      case 'in_progress':
        return 'Active';
      case 'at_risk':
        return 'Needs Attention';
      default:
        return 'Upcoming';
    }
  };

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case 'completed':
      case 'Paid':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
      case 'in_progress':
      case 'Contracted':
      case 'Committed':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
      case 'at_risk':
      case 'Overdue':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/35';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/35';
    }
  };

  const getSpineNodeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          classes:
            'border-emerald-300 bg-emerald-500 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.8)]',
          symbol: '✓',
        };
      case 'in_progress':
        return {
          classes:
            'border-amber-200 bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.85)]',
          symbol: '●',
        };
      case 'at_risk':
        return {
          classes:
            'border-rose-300 bg-rose-500 text-white shadow-[0_0_14px_rgba(244,63,94,0.8)]',
          symbol: '!',
        };
      default:
        return {
          classes: 'border-slate-500 bg-slate-900 text-slate-300',
          symbol: '○',
        };
    }
  };

  const getNextVendorStage = (current: VendorStage): VendorStage => {
    const idx = VENDOR_STAGES.indexOf(current);
    if (idx < 0 || idx >= VENDOR_STAGES.length - 1) return 'Paid';
    return VENDOR_STAGES[idx + 1];
  };

  const handleToggleChecklistItem = async (node: TimelineNode, itemId: string) => {
    if (!onUpdateNode) return;
    const updated = node.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await onUpdateNode(node.id, { checklist: updated });
  };

  const activePhaseLabel =
    activePhaseFilter === 'all'
      ? 'All Phases'
      : TIMELINE_PHASES.find((p) => p.key === activePhaseFilter)?.label || activePhaseFilter;

  const activeViewLabel =
    viewMode === 'connected'
      ? 'Timeline View'
      : viewMode === 'vendors'
      ? 'Vendors by Phase'
      : 'Budget by Phase';

  let globalMilestoneIndex = 0;

  return (
    <section className="flex flex-col gap-6">
      {/* Minimal Top-of-Canvas Control Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-800/80 bg-slate-900/70 px-3.5 py-1.5 text-xs font-medium text-slate-300">
            Showing: {activePhaseLabel} · {activeViewLabel}
          </span>

          {(viewMode !== 'connected' || activePhaseFilter !== 'all') && (
            <button
              type="button"
              data-testid="view-options-reset"
              onClick={() => {
                setViewMode('connected');
                setActivePhaseFilter('all');
              }}
              className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/25 transition"
            >
              Reset
            </button>
          )}
        </div>

        <div ref={viewOptionsRef} className="relative">
          <button
            type="button"
            data-testid="view-options-dropdown"
            onClick={() => setIsViewOptionsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-800/90 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-500/40 hover:text-white transition"
          >
            <span>View Options ▾</span>
          </button>

          {isViewOptionsOpen && (
            <div
              data-testid="view-options-popover"
              className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800/90 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl z-30 space-y-2"
            >
              {/* Section 1: Layout View */}
              <div className="space-y-1">
                <div className="px-2.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Layout View
                </div>
                <button
                  type="button"
                  data-testid="view-mode-connected"
                  onClick={() => {
                    setViewMode('connected');
                    setIsViewOptionsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    viewMode === 'connected'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>Timeline Spine ({nodes.length})</span>
                  {viewMode === 'connected' && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  data-testid="view-mode-vendors"
                  onClick={() => {
                    setViewMode('vendors');
                    setIsViewOptionsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    viewMode === 'vendors'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>Vendors by Phase ({vendors.length})</span>
                  {viewMode === 'vendors' && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  data-testid="view-mode-budget"
                  onClick={() => {
                    setViewMode('budget');
                    setIsViewOptionsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    viewMode === 'budget'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>Budget by Phase ({tranches.length})</span>
                  {viewMode === 'budget' && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="border-t border-slate-800/80" />

              {/* Section 2: Filter by Phase */}
              <div className="space-y-1">
                <div className="px-2.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Filter by Phase
                </div>
                <button
                  type="button"
                  data-testid="phase-filter-all"
                  onClick={() => {
                    setActivePhaseFilter('all');
                    setIsViewOptionsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    activePhaseFilter === 'all'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>All Phases</span>
                  {activePhaseFilter === 'all' && <Check className="h-3.5 w-3.5" />}
                </button>

                {TIMELINE_PHASES.map((phase) => (
                  <button
                    key={phase.key}
                    type="button"
                    data-testid={`phase-filter-${phase.key}`}
                    onClick={() => {
                      setActivePhaseFilter(phase.key);
                      setIsViewOptionsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                      activePhaseFilter === phase.key
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span>{phase.label}</span>
                    {activePhaseFilter === phase.key && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: VERTICAL CENTRAL GLOWING TIMELINE SPINE */}
      {viewMode === 'connected' && (
        <div className="max-w-5xl mx-auto w-full relative py-10 px-2 sm:px-4">
          {/* Continuous Central Vertical Glowing Spine */}
          <div
            className="aurelia-timeline-spine pointer-events-none absolute top-4 bottom-4 left-6 md:left-1/2 md:-translate-x-1/2 w-1 shadow-[0_0_16px_rgba(200,157,84,0.38)] rounded-full"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-10">
            {visiblePhases.map((phase) => {
              const phaseNodes = nodes.filter((n) => n.phase === phase.key);

              return (
                <div key={phase.key} className="relative flex flex-col gap-6">
                  {/* Whisper-Clean Phase Pill on the Spine */}
                  <div className="relative z-10 flex items-center md:justify-center pl-12 md:pl-0">
                    <div className="inline-flex items-center gap-3 rounded-full border border-slate-800/90 bg-slate-950/95 px-4 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-xl">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-white tracking-tight">{phase.label}</span>
                      <button
                        type="button"
                        onClick={() => onQuickAddMilestone(phase.key)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 hover:border-amber-400/50 hover:text-white transition"
                      >
                        <Plus className="h-3 w-3" />
                        <span>+ Milestone</span>
                      </button>
                    </div>
                  </div>

                  {/* Phase Milestones along the Vertical Spine */}
                  {phaseNodes.length === 0 ? (
                    <div className="relative z-10 pl-12 md:pl-0 flex md:justify-center">
                      <button
                        type="button"
                        onClick={() => onQuickAddMilestone(phase.key)}
                        className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/80 px-5 py-3 text-xs text-slate-400 hover:border-amber-500/40 hover:text-amber-300 transition"
                      >
                        + Add first milestone for {phase.label}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {phaseNodes.map((node) => {
                        const currentGlobalIdx = globalMilestoneIndex++;
                        const isLeft = currentGlobalIdx % 2 === 0;
                        const isExpanded = !!expandedNodeIds[node.id];
                        const isSelected = selectedNodeId === node.id;
                        const isHighlighted = highlightedNodeId === node.id;

                        const completedChecks = node.checklist.filter((c) => c.completed).length;
                        const totalChecks = node.checklist.length;
                        const spineNode = getSpineNodeStyle(node.status);

                        const nodeVendors = vendors.filter(
                          (v) =>
                            v.timeline_node_id === node.id ||
                            (!v.timeline_node_id &&
                              v.phase === phase.key &&
                              phaseNodes[0]?.id === node.id)
                        );
                        const nodeTranches = tranches.filter(
                          (t) =>
                            t.timeline_node_id === node.id ||
                            (!t.timeline_node_id &&
                              t.phase === phase.key &&
                              phaseNodes[0]?.id === node.id)
                        );

                        const nodeBudgetTotal = nodeTranches.reduce(
                          (sum, t) => sum + t.allocated_amount,
                          0
                        );

                        const vendorSummaryText =
                          nodeVendors.length === 0
                            ? 'No vendor linked'
                            : nodeVendors.length === 1
                            ? `1 Vendor (${nodeVendors[0].stage})`
                            : `${nodeVendors.length} Vendors (${nodeVendors[0].stage})`;

                        return (
                          <div
                            key={node.id}
                            id={`timeline-node-${node.id}`}
                            className={`relative flex items-start ${
                              isLeft ? 'md:justify-start' : 'md:justify-end'
                            }`}
                          >
                            {/* Central Glowing Node Circle on Spine */}
                            <button
                              type="button"
                              onClick={() => toggleNodeExpanded(node.id)}
                              title={`${node.title} (${getHumanStatusLabel(node.status)})`}
                              className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-black transition-transform hover:scale-110 ${spineNode.classes}`}
                            >
                              {spineNode.symbol}
                            </button>

                            {/* Horizontal Connector Stem on Desktop */}
                            <div
                              className={`hidden md:block absolute top-9 h-0.5 w-8 bg-gradient-to-r ${
                                isLeft
                                  ? 'right-1/2 mr-3.5 from-amber-400/30 to-amber-400/80'
                                  : 'left-1/2 ml-3.5 from-amber-400/80 to-amber-400/30'
                              }`}
                              aria-hidden="true"
                            />

                            {/* Apple Bento Card Container */}
                            <div className="w-full pl-12 md:pl-0 md:w-[calc(50%-2.25rem)]">
                              <div
                                className={`apple-bento-card rounded-3xl border p-5 sm:p-6 shadow-[0_4px_24px_rgba(30,26,23,0.05)] transition-all ${
                                  isHighlighted
                                    ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400'
                                    : isSelected
                                    ? 'border-amber-400 bg-slate-900/95'
                                    : 'border-slate-800/90 bg-slate-950/95 hover:border-amber-500/40'
                                }`}
                              >
                                {/* Collapsed Default: ONLY 3 Clean Elements */}
                                <div
                                  onClick={() => toggleNodeExpanded(node.id)}
                                  className="cursor-pointer select-none space-y-2.5"
                                >
                                  {/* Element 1: Subtle Date & Timeframe Eyebrow */}
                                  <div className="text-[11px] font-medium tracking-wide text-slate-400">
                                    {phase.label} · {node.scheduled_date}
                                  </div>

                                  {/* Element 2: Clean SF-Style Milestone Title + Minimal Status Pill */}
                                  <div className="flex items-start justify-between gap-3">
                                    <h4 className="text-base sm:text-lg font-semibold tracking-tight text-white leading-snug">
                                      {node.title}
                                    </h4>
                                    <span
                                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${getStatusBadgeClasses(
                                        node.status
                                      )}`}
                                    >
                                      {getHumanStatusLabel(node.status)}
                                    </span>
                                  </div>

                                  {/* Element 3: Single Clean Drill-Down Button (Details ▾) */}
                                  <div className="pt-1 flex items-center justify-end">
                                    <button
                                      type="button"
                                      data-testid={`toggle-node-details-${node.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNodeExpanded(node.id);
                                      }}
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-300 hover:border-amber-500/40 hover:text-white transition"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <span>Hide Details</span>
                                          <ChevronUp className="h-3 w-3" />
                                        </>
                                      ) : (
                                        <>
                                          <span>Details ▾</span>
                                          <ChevronDown className="h-3 w-3" />
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Detail Tray (Bento Progressive Drill-Down) */}
                                {isExpanded && (
                                  <div
                                    data-testid={`bento-detail-tray-${node.id}`}
                                    className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 text-xs"
                                  >
                                    {/* 1. Compact Summary Metrics Strip */}
                                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-2 text-[11px] font-medium text-slate-300">
                                      {vendorSummaryText} · ${nodeBudgetTotal.toLocaleString()}{' '}
                                      allocated · {completedChecks}/{totalChecks} tasks
                                    </div>

                                    {/* 2. Description */}
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                      {node.description}
                                    </p>

                                    {/* 3. Interactive Checklist Tasks */}
                                    {node.checklist.length > 0 && (
                                      <div className="space-y-1.5">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                          Checklist Tasks ({completedChecks}/{totalChecks})
                                        </div>
                                        <div className="space-y-1">
                                          {node.checklist.map((item) => (
                                            <button
                                              key={item.id}
                                              type="button"
                                              onClick={() =>
                                                handleToggleChecklistItem(node, item.id)
                                              }
                                              className="flex w-full items-start gap-2 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2 text-left text-xs hover:border-slate-700 transition"
                                            >
                                              {item.completed ? (
                                                <CheckSquare className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                                              ) : (
                                                <Square className="h-3.5 w-3.5 shrink-0 text-slate-500 mt-0.5" />
                                              )}
                                              <span
                                                className={
                                                  item.completed
                                                    ? 'line-through text-slate-500'
                                                    : 'text-slate-200'
                                                }
                                              >
                                                {item.text}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* 4. Linked Vendors & Stage Advance */}
                                    {nodeVendors.length > 0 && (
                                      <div className="space-y-1.5">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                                          Linked Vendors ({nodeVendors.length})
                                        </div>
                                        <div className="space-y-1.5">
                                          {nodeVendors.map((nv) => {
                                            const nextStage = getNextVendorStage(nv.stage);
                                            return (
                                              <div
                                                key={nv.id}
                                                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-500/25 bg-sky-500/10 px-3.5 py-2.5"
                                              >
                                                <div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-white">
                                                      {nv.vendor_name}
                                                    </span>
                                                    <span className="rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-medium text-sky-300 border border-sky-500/30">
                                                      {nv.stage}
                                                    </span>
                                                  </div>
                                                  <div className="text-[11px] text-slate-300">
                                                    {nv.category} · Quote $
                                                    {nv.quoted_amount.toLocaleString()}
                                                  </div>
                                                </div>

                                                {nv.stage !== 'Paid' && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      onAdvanceVendorStage(nv, nextStage)
                                                    }
                                                    className="rounded-full bg-sky-500/20 px-3 py-1 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/30 border border-sky-500/40 transition"
                                                  >
                                                    Advance to {nextStage}
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* 5. Linked Budget Tranches */}
                                    {nodeTranches.length > 0 && (
                                      <div className="space-y-1.5">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                                          Budget Tranches ({nodeTranches.length})
                                        </div>
                                        <div className="space-y-1">
                                          {nodeTranches.map((nt) => (
                                            <div
                                              key={nt.id}
                                              className="flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs"
                                            >
                                              <span className="font-medium text-slate-200">
                                                {nt.title}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold text-emerald-300">
                                                  ${nt.allocated_amount.toLocaleString()}
                                                </span>
                                                <span
                                                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${getStatusBadgeClasses(
                                                    nt.status
                                                  )}`}
                                                >
                                                  {nt.status}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* 6. Bento Tray Footer */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                                      <div className="flex items-center gap-1">
                                        {(
                                          [
                                            { key: 'completed', label: 'Done' },
                                            { key: 'in_progress', label: 'Active' },
                                            { key: 'pending', label: 'Upcoming' },
                                          ] as const
                                        ).map((st) => (
                                          <button
                                            key={st.key}
                                            type="button"
                                            onClick={() =>
                                              onUpdateNode &&
                                              onUpdateNode(node.id, { status: st.key })
                                            }
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                                              node.status === st.key
                                                ? 'bg-amber-500 text-slate-950'
                                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                            }`}
                                          >
                                            {node.status === st.key ? (
                                              <Check className="inline h-2.5 w-2.5 mr-0.5" />
                                            ) : null}
                                            {st.label}
                                          </button>
                                        ))}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => onSelectNode(node)}
                                        className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/25 transition"
                                      >
                                        <SlidersHorizontal className="h-3 w-3" />
                                        <span>Open Full Inspector →</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: VENDORS BY PHASE */}
      {viewMode === 'vendors' && (
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {visiblePhases.map((phase) => {
            const phaseVendors = vendors.filter((v) => v.phase === phase.key);
            return (
              <div
                key={phase.key}
                className="flex flex-col gap-2.5 rounded-3xl border border-slate-800/80 bg-slate-900/45 p-5"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-white">{phase.label}</span>
                  <span className="text-[11px] text-slate-400">{phase.windowHint}</span>
                </div>
                {phaseVendors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-center text-xs text-slate-500">
                    No vendors in {phase.label}
                  </div>
                ) : (
                  phaseVendors.map((v) => {
                    const linkedNode = nodes.find((n) => n.id === v.timeline_node_id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          if (linkedNode) onSelectNode(linkedNode);
                        }}
                        className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5 hover:border-sky-500/50 transition"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            {v.category}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClasses(
                              v.stage
                            )}`}
                          >
                            {v.stage}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-semibold text-white">
                          {v.vendor_name}
                        </h4>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                          <span>Quote: ${v.quoted_amount.toLocaleString()}</span>
                          <span className="text-emerald-300 font-semibold">
                            Paid: ${v.paid_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 truncate">
                            {linkedNode ? `↳ ${linkedNode.title}` : 'Unlinked'}
                          </span>
                          {v.stage !== 'Paid' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdvanceVendorStage(v, getNextVendorStage(v.stage));
                              }}
                              className="shrink-0 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/30 border border-sky-500/30"
                            >
                              Advance to {getNextVendorStage(v.stage)}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: BUDGET BY PHASE */}
      {viewMode === 'budget' && (
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {visiblePhases.map((phase) => {
            const phaseTranches = tranches.filter((t) => t.phase === phase.key);
            const phaseTotal = phaseTranches.reduce((acc, t) => acc + t.allocated_amount, 0);
            return (
              <div
                key={phase.key}
                className="flex flex-col justify-between gap-2.5 rounded-3xl border border-slate-800/80 bg-slate-900/45 p-5"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-white">{phase.label}</span>
                    <span className="font-mono text-xs font-semibold text-emerald-300">
                      ${phaseTotal.toLocaleString()}
                    </span>
                  </div>
                  {phaseTranches.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-center text-xs text-slate-500">
                      $0 scheduled in {phase.label}
                    </div>
                  ) : (
                    phaseTranches.map((t) => {
                      const linkedNode = nodes.find((n) => n.id === t.timeline_node_id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (linkedNode) onSelectNode(linkedNode);
                          }}
                          className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5 hover:border-emerald-500/50 transition"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-medium text-slate-400">
                              {t.tranche_type}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClasses(
                                t.status
                              )}`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <h4 className="mt-1 text-sm font-semibold text-white">{t.title}</h4>
                          <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span className="font-semibold text-emerald-300">
                              ${t.allocated_amount.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400">Due {t.due_date}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
