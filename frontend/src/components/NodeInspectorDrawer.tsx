import React, { useState } from 'react';
import {
  Building2,
  CheckSquare,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Send,
  ShieldCheck,
  Square,
  X,
} from 'lucide-react';
import {
  BudgetTrancheItem,
  ChecklistItem,
  EventVendorItem,
  TimelineNode,
  VendorStage,
} from '../types/crm';

interface NodeInspectorDrawerProps {
  node: TimelineNode | null;
  vendors: EventVendorItem[];
  tranches: BudgetTrancheItem[];
  onClose: () => void;
  onUpdateNode: (
    nodeId: string,
    payload: Partial<{
      status: string;
      start_time: string;
      duration_hours: number;
      checklist: ChecklistItem[];
    }>
  ) => Promise<void>;
  onUpdateVendorStage: (vendor: EventVendorItem, stage: VendorStage) => Promise<void>;
  onDraftRfp: (vendorId: string) => Promise<void>;
}

const STAGES: VendorStage[] = ['Shortlisted', 'RFP Sent', 'Quoted', 'Contracted', 'Paid'];

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({
  node,
  vendors,
  tranches,
  onClose,
  onUpdateNode,
  onUpdateVendorStage,
  onDraftRfp,
}) => {
  const [newCheckText, setNewCheckText] = useState('');

  if (!node) return null;

  const linkedVendors = vendors.filter((v) => v.timeline_node_id === node.id);
  const linkedTranches = tranches.filter((t) => t.timeline_node_id === node.id);

  const toggleChecklistItem = async (itemId: string) => {
    const updated = node.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await onUpdateNode(node.id, { checklist: updated });
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckText.trim()) return;
    const updated: ChecklistItem[] = [
      ...node.checklist,
      {
        id: `chk_${Date.now().toString(36)}`,
        text: newCheckText.trim(),
        completed: false,
      },
    ];
    setNewCheckText('');
    await onUpdateNode(node.id, { checklist: updated });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-500/30">
              {node.phase.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-400">Lead: {node.owner_agent}</span>
          </div>
          <h2 className="mt-1.5 text-base font-bold text-slate-100">{node.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Status & Timing Controls */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Schedule & Status
            </span>
            <select
              value={node.status}
              onChange={(e) => onUpdateNode(node.id, { status: e.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-100 focus:border-amber-500 focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="at_risk">At Risk</option>
            </select>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{node.description}</p>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Date</span>
              <span className="font-mono font-semibold text-slate-200">{node.scheduled_date}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Call Time</span>
              <span className="font-mono font-semibold text-slate-200">{node.start_time}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Duration</span>
              <span className="font-mono font-semibold text-slate-200">{node.duration_hours} hrs</span>
            </div>
          </div>
        </div>

        {/* Swimlane 1: Milestone Checklist */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Execution Checklist ({node.checklist.filter((c) => c.completed).length}/
              {node.checklist.length})
            </h3>
          </div>

          <div className="space-y-2">
            {node.checklist.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChecklistItem(item.id)}
                className="flex w-full items-start gap-2.5 rounded-lg border border-slate-800/90 bg-slate-950/80 p-2.5 text-left text-xs hover:border-slate-700 transition"
              >
                {item.completed ? (
                  <CheckSquare className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <Square className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                )}
                <span
                  className={
                    item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                  }
                >
                  {item.text}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newCheckText}
              onChange={(e) => setNewCheckText(e.target.value)}
              placeholder="Add production verification step..."
              className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </form>
        </div>

        {/* Swimlane 2: Linked Vendor Pipeline Cards */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            Linked Vendors ({linkedVendors.length})
          </h3>

          {linkedVendors.length === 0 ? (
            <p className="text-xs text-slate-500">
              No vendor linked to this milestone yet. Use the Vendor Pool or ask the AI Director to assign one.
            </p>
          ) : (
            linkedVendors.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-sky-300">{v.category}</span>
                    <h4 className="text-xs font-bold text-slate-100">{v.vendor_name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {v.contact_name} • {v.contact_email}
                    </p>
                  </div>
                  <select
                    value={v.stage}
                    onChange={(e) => onUpdateVendorStage(v, e.target.value as VendorStage)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-sky-300"
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">
                    Quote: <strong className="text-slate-200">${v.quoted_amount.toLocaleString()}</strong>
                  </span>
                  <span className="text-emerald-300">
                    Paid: <strong>${v.paid_amount.toLocaleString()}</strong>
                  </span>
                </div>

                {v.rfp_draft && (
                  <div className="rounded-lg border border-slate-800/90 bg-slate-900/90 p-2.5 text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
                    <div className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase text-amber-300 mb-1">
                      <FileText className="h-3 w-3" />
                      Active RFP Brief
                    </div>
                    {v.rfp_draft}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onDraftRfp(v.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/25"
                >
                  <Send className="h-3 w-3" />
                  Regenerate & Dispatch RFP via Vendor Coordinator
                </button>
              </div>
            ))
          )}
        </div>

        {/* Swimlane 3: Linked Payment Tranches */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            Linked Budget Tranches ({linkedTranches.length})
          </h3>

          {linkedTranches.length === 0 ? (
            <p className="text-xs text-slate-500">
              No payment tranche linked to this node yet.
            </p>
          ) : (
            linkedTranches.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100">{t.title}</span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Allocated: ${t.allocated_amount.toLocaleString()}</span>
                  <span>Paid: ${t.paid_amount.toLocaleString()}</span>
                  <span>Due: {t.due_date}</span>
                </div>
                {t.notes && <p className="text-[11px] text-slate-400">{t.notes}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
