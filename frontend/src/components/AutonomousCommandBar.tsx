import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { AgentRunTrace } from '../types/crm';

interface AutonomousCommandBarProps {
  eventType: string;
  isRunning: boolean;
  runs?: AgentRunTrace[];
  onSubmitDirective: (directive: string) => Promise<void>;
  onHighlightNode?: (nodeId: string) => void;
  onRevertRun?: (runId: string) => Promise<void>;
}

const SCENARIO_PRESETS: Record<string, string[]> = {
  wedding: [
    'Shift reception outdoors for 350 guests under $85k, add pre-wedding Mehendi night, and lock catering + floral quotes',
    'Add clear-span glass marquee rain backup at 1 Month Before and rebalance floral + tenting budget',
    'Promote unpromoted cultural activation idea to the timeline and assign a vendor',
  ],
  birthday: [
    'Add Midnight Bourbon & Live-to-Vinyl Encore Set on Event Day under $28k and lock brass band contract',
    'Promote custom 12-inch vinyl record guestbook idea to the timeline and rebalance supper club budget',
    'Shift soundcheck 2 hours earlier and send lighting request for Art Deco pin-spotting',
  ],
  community: [
    'Add Solar Microgrid & Zero-Waste Hydration Hub for 1500 guests under $45k and lock EcoPulse permit stage',
    'Promote Interactive Community Mural pavilion to Event Day schedule and allocate sponsor budget',
    'Lock 12-cart street food village catering contract and review key safety milestones',
  ],
};

export const AutonomousCommandBar: React.FC<AutonomousCommandBarProps> = ({
  eventType,
  isRunning,
  runs = [],
  onSubmitDirective,
  onHighlightNode,
  onRevertRun,
}) => {
  const [directive, setDirective] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showAiSteps, setShowAiSteps] = useState(false);
  const [selectedRunIndex, setSelectedRunIndex] = useState(0);
  const [revertingRunId, setRevertingRunId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showPresets && !showActivity) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPresets(false);
        setShowActivity(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPresets(false);
        setShowActivity(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPresets, showActivity]);

  const presets = SCENARIO_PRESETS[eventType] || SCENARIO_PRESETS.wedding;
  const activeRun = runs[selectedRunIndex] || runs[0] || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directive.trim() || isRunning) return;
    const text = directive.trim();
    setDirective('');
    await onSubmitDirective(text);
  };

  const handleRevert = async (runId: string) => {
    if (!onRevertRun) return;
    setRevertingRunId(runId);
    try {
      await onRevertRun(runId);
    } finally {
      setRevertingRunId(null);
    }
  };

  const affectedNodeIds = activeRun
    ? Array.from(
        new Set(
          activeRun.subagents
            .flatMap((sa) => sa.tool_calls)
            .map((tc) => tc.affected_node_id)
            .filter((id): id is string => Boolean(id))
        )
      )
    : [];

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-3xl"
    >
      <div className="relative rounded-full border border-slate-800/80 bg-slate-950/90 px-4 py-2 shadow-2xl backdrop-blur-2xl">
        {/* Floating Examples Popover Menu */}
        {showPresets && (
          <div
            data-testid="examples-popover"
            className="absolute bottom-full mb-3 right-24 w-80 sm:w-96 rounded-2xl border border-slate-800/90 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl z-40 space-y-1"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Scenario Examples
            </div>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isRunning}
                onClick={() => {
                  setShowPresets(false);
                  onSubmitDirective(preset);
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition leading-snug"
              >
                “{preset}”
              </button>
            ))}
          </div>
        )}

        {/* Anchored Activity & Undo Popover Drawer */}
        {showActivity && (
          <div className="absolute bottom-full mb-3 right-0 w-full sm:w-[420px] rounded-2xl border border-slate-800/90 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl z-40">
            {/* Top Header of Popover */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-white">
                  Recent Plan Changes & Undo
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {activeRun && activeRun.status !== 'reverted' && onRevertRun && (
                  <button
                    type="button"
                    disabled={revertingRunId === activeRun.run_id}
                    onClick={() => handleRevert(activeRun.run_id)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/25 transition disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {revertingRunId === activeRun.run_id
                      ? 'Undoing...'
                      : '↩ Undo Last Change'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowActivity(false)}
                  className="rounded-full border border-slate-800 bg-slate-900 p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {runs.length > 0 && activeRun ? (
              <div className="mt-3 space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {runs.length > 1 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Change history:</span>
                    <select
                      value={selectedRunIndex}
                      onChange={(e) => setSelectedRunIndex(Number(e.target.value))}
                      className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-200"
                    >
                      {runs.map((r, idx) => (
                        <option key={r.run_id} value={idx}>
                          {idx === 0 ? 'Latest: ' : ''}
                          {r.directive.slice(0, 38)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Human-Readable Summary Default View */}
                <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-300">What you asked</span>
                    {activeRun.status === 'reverted' ? (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        Undone
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        ✓ Saved with backup
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white">
                    “{activeRun.directive}”
                  </p>
                  {activeRun.summary && (
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {activeRun.summary}
                    </p>
                  )}

                  {affectedNodeIds.length > 0 && onHighlightNode && (
                    <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">
                        Jump to updated milestone:
                      </span>
                      {affectedNodeIds.map((nodeId) => (
                        <button
                          key={nodeId}
                          type="button"
                          onClick={() => {
                            onHighlightNode(nodeId);
                            setShowActivity(false);
                          }}
                          className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition"
                        >
                          View Milestone →
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional "Show AI Steps ▾" Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAiSteps(!showAiSteps)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white transition"
                  >
                    <span>
                      {showAiSteps ? 'Hide AI Steps ▴' : 'Show AI Steps ▾'}
                    </span>
                    {showAiSteps ? (
                      <ChevronUp className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </button>

                  {showAiSteps && (
                    <div className="mt-2 space-y-2">
                      {activeRun.subagents.map((sa) => (
                        <div
                          key={sa.id}
                          className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 space-y-1.5 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              {sa.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {sa.duration_ms}ms
                            </span>
                          </div>
                          <p className="text-slate-400">{sa.thought}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-xs text-slate-400">
                No recent assistant changes yet. Type a request below to update your event plan.
              </div>
            )}
          </div>
        )}

        {/* Single-Row Spotlight Pill Layout */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* 1. Sparkles Icon + Clean Borderless Input */}
          <div className="flex flex-1 items-center gap-2.5 min-w-0 pl-1">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            <input
              type="text"
              value={directive}
              onChange={(e) => setDirective(e.target.value)}
              disabled={isRunning}
              placeholder="Ask your planner to adjust dates, vendors, or budget..."
              className="bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none w-full"
            />
          </div>

          {/* 2. Subtle Examples ▾ Dropdown Trigger */}
          <button
            type="button"
            data-testid="examples-dropdown-trigger"
            onClick={() => {
              setShowPresets((prev) => !prev);
              setShowActivity(false);
            }}
            className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-amber-500/40 hover:text-white transition shrink-0"
          >
            Examples ▾
          </button>

          {/* 3. Clean Update Pill Button */}
          <button
            type="submit"
            disabled={isRunning || !directive.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#C89D54] px-4 py-1.5 text-xs font-semibold text-[#1E1A17] hover:brightness-105 transition disabled:opacity-50 shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update</span>
            )}
          </button>

          {/* 4. Integrated Activity & Undo ▾ Dropdown Trigger */}
          <button
            type="button"
            data-testid="activity-undo-toggle"
            onClick={() => {
              setShowActivity((prev) => !prev);
              setShowPresets(false);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition shrink-0 ${
              showActivity
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-amber-500/40 hover:text-white'
            }`}
          >
            Activity & Undo ({runs.length})
          </button>
        </form>
      </div>
    </div>
  );
};
