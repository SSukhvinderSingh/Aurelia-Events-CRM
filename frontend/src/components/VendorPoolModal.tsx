import React, { useState } from 'react';
import {
  Building2,
  Check,
  Leaf,
  MapPin,
  Search,
  Star,
  X,
} from 'lucide-react';
import {
  AgencyVendor,
  EventVendorItem,
  PhaseKey,
  TIMELINE_PHASES,
  TimelineNode,
  VendorStage,
} from '../types/crm';

interface VendorPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyVendors: AgencyVendor[];
  eventVendors: EventVendorItem[];
  nodes: TimelineNode[];
  onAssignVendor: (payload: {
    vendor_id: string;
    timeline_node_id?: string | null;
    phase: PhaseKey;
    stage: VendorStage;
    quoted_amount?: number;
  }) => Promise<void>;
}

export const VendorPoolModal: React.FC<VendorPoolModalProps> = ({
  isOpen,
  onClose,
  agencyVendors,
  eventVendors,
  nodes,
  onAssignVendor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPhase, setSelectedPhase] = useState<PhaseKey>('1_month_out');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(agencyVendors.map((v) => v.category)))];

  const filteredVendors = agencyVendors.filter((v) => {
    const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      `${v.name} ${v.category} ${v.specialty} ${v.portfolio_tags.join(' ')}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const assignedVendorIds = new Set(eventVendors.map((ev) => ev.vendor_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Building2 className="h-4 w-4" />
              Shared B2B Agency Vendor CRM Pool ({agencyVendors.length} Vetted Partners)
            </div>
            <h2 className="mt-0.5 text-lg font-bold text-slate-100">
              Shortlist & Link Vendors to Timeline Milestones
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter & Target Milestone Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/60 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specialty, Chaat, Mandap, Solar..."
                className="rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target Phase:</span>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as PhaseKey)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-100"
            >
              {TIMELINE_PHASES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-100 max-w-[200px]"
            >
              <option value="">Auto-link to phase milestone</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((v) => {
            const isAssigned = assignedVendorIds.has(v.id);
            return (
              <div
                key={v.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/90 p-4 hover:border-sky-500/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
                      {v.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {v.rating}
                      </span>
                      <span className="flex items-center gap-0.5 text-emerald-400 text-[11px]">
                        <Leaf className="h-3 w-3" />
                        {v.sustainability_score}%
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-100">{v.name}</h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{v.specialty}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {v.portfolio_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {v.location}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      Est. ${v.base_quote_estimate.toLocaleString()} ({v.price_tier})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onAssignVendor({
                        vendor_id: v.id,
                        timeline_node_id: selectedNodeId || null,
                        phase: selectedPhase,
                        stage: 'RFP Sent',
                        quoted_amount: v.base_quote_estimate,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isAssigned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    }`}
                  >
                    {isAssigned ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Linked (Update)
                      </>
                    ) : (
                      'Assign & Send RFP'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
