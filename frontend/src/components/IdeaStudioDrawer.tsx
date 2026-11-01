import React, { useState } from 'react';
import {
  CheckCircle2,
  Lightbulb,
  Plus,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react';
import { IdeaItem, PhaseKey, TIMELINE_PHASES } from '../types/crm';

interface IdeaStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: IdeaItem[];
  onPromoteIdea: (ideaId: string) => Promise<void>;
  onCreateIdea: (payload: {
    title: string;
    category: string;
    phase: PhaseKey;
    estimated_cost: number;
    description: string;
  }) => Promise<void>;
}

export const IdeaStudioDrawer: React.FC<IdeaStudioDrawerProps> = ({
  isOpen,
  onClose,
  ideas,
  onPromoteIdea,
  onCreateIdea,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cultural & Experiential');
  const [phase, setPhase] = useState<PhaseKey>('event_day');
  const [estimatedCost, setEstimatedCost] = useState(3200);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreateIdea({
      title: title.trim(),
      category,
      phase,
      estimated_cost: Number(estimatedCost) || 2500,
      description: title.trim(),
    });
    setTitle('');
  };

  const handlePromote = async (ideaId: string) => {
    setPromotingId(ideaId);
    try {
      await onPromoteIdea(ideaId);
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 p-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fuchsia-400">
            <Lightbulb className="h-4 w-4" />
            Creative Director • Idea-to-Execution Studio
          </div>
          <h2 className="mt-1 text-base font-bold text-slate-100">
            Personalized Concepts & 1-Click Promotion
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* New Concept Generator Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/15 p-4 space-y-3"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-300">
            <Sparkles className="h-3.5 w-3.5" />
            Draft New Experiential Activation Blueprint
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Sunset Sitar & Floating Marigold Welcome Reflexology Lounge"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
            />
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as PhaseKey)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
            >
              {TIMELINE_PHASES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.shortLabel}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(Number(e.target.value))}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-fuchsia-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-fuchsia-400 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Blueprint with Creative Director
          </button>
        </form>

        {/* Ideas List */}
        <div className="space-y-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300 border border-fuchsia-500/30">
                  {idea.category}
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  Est. ${idea.estimated_cost.toLocaleString()} • Impact {idea.guest_impact_score}/100
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{idea.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{idea.description}</p>

              {idea.execution_blueprint.checklist && (
                <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Auto-Execution Blueprint ({idea.phase.replace(/_/g, ' ')})
                  </span>
                  {idea.execution_blueprint.checklist.map((step, i) => (
                    <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                      {step}
                    </div>
                  ))}
                </div>
              )}

              {idea.promoted ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                  Promoted to All 3 Swimlanes ({idea.promoted_node_id})
                </div>
              ) : (
                <button
                  type="button"
                  disabled={promotingId === idea.id}
                  onClick={() => handlePromote(idea.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-500 px-3 py-2 text-xs font-bold text-slate-950 hover:opacity-95 transition disabled:opacity-50"
                >
                  <Rocket className="h-4 w-4" />
                  {promotingId === idea.id
                    ? 'Promoting to Timeline, Vendors & Budget...'
                    : 'Promote to Timeline Execution (All 3 Swimlanes)'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
