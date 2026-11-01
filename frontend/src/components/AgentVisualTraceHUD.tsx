import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
} from 'lucide-react';
import { AgentRunTrace } from '../types/crm';

interface AgentVisualTraceHUDProps {
  runs: AgentRunTrace[];
  isRunning: boolean;
  onHighlightNode: (nodeId: string) => void;
  onRevertRun: (runId: string) => Promise<void>;
}

export const AgentVisualTraceHUD: React.FC<AgentVisualTraceHUDProps> = ({
  runs,
  onHighlightNode,
  onRevertRun,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [revertingRunId, setRevertingRunId] = useState<string | null>(null);

  const activeRun = runs[0] || null;

  const handleRevert = async (runId: string) => {
    setRevertingRunId(runId);
    try {
      await onRevertRun(runId);
    } finally {
      setRevertingRunId(null);
    }
  };

  if (!activeRun) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-3 text-xs text-slate-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-bold">Activity & Undo ({runs.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {activeRun.status !== 'reverted' && (
            <button
              type="button"
              disabled={revertingRunId === activeRun.run_id}
              onClick={() => handleRevert(activeRun.run_id)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-300"
            >
              <RotateCcw className="h-3 w-3" />
              ↩ Undo Last Change
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300"
          >
            {isExpanded ? 'Hide AI Steps ▴' : 'Show AI Steps ▾'}
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2 border-t border-slate-800 pt-2">
          {activeRun.subagents.map((sa) => (
            <div key={sa.id} className="rounded-lg bg-slate-900 p-2">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {sa.name}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">{sa.thought}</p>
              {sa.tool_calls.map((tc, idx) =>
                tc.affected_node_id ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onHighlightNode(tc.affected_node_id!)}
                    className="mt-1 inline-block rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300"
                  >
                    Jump to Milestone →
                  </button>
                ) : null
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
