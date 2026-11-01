export type PhaseKey =
  | '6_months_out'
  | '3_months_out'
  | '1_month_out'
  | 'week_of'
  | 'event_day';

export interface PhaseMeta {
  key: PhaseKey;
  label: string;
  shortLabel: string;
  windowHint: string;
}

export const TIMELINE_PHASES: PhaseMeta[] = [
  {
    key: '6_months_out',
    label: '6 Months Before',
    shortLabel: '6 Months Before',
    windowHint: 'Venue & Core Permits',
  },
  {
    key: '3_months_out',
    label: '3 Months Before',
    shortLabel: '3 Months Before',
    windowHint: 'Catering, Decor & Music',
  },
  {
    key: '1_month_out',
    label: '1 Month Before',
    shortLabel: '1 Month Before',
    windowHint: 'Floorplan & Guest Confirmations',
  },
  {
    key: 'week_of',
    label: '1 Week Before',
    shortLabel: '1 Week Before',
    windowHint: 'Rehearsals & Final Walkthrough',
  },
  {
    key: 'event_day',
    label: 'Event Day',
    shortLabel: 'Event Day',
    windowHint: 'Live Celebration Schedule',
  },
];

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  event_type: 'wedding' | 'birthday' | 'community' | string;
  client_name: string;
  client_organization?: string;
  event_date: string;
  venue: string;
  city: string;
  guest_count: number;
  total_budget: number;
  allocated_budget?: number;
  currency: string;
  status: string;
  theme: string;
  description: string;
  milestone_count?: number;
}

export interface CreateEventPayload {
  name: string;
  event_type: 'wedding' | 'birthday' | 'community';
  client_name: string;
  client_organization?: string;
  event_date: string;
  venue: string;
  city: string;
  guest_count: number;
  total_budget: number;
  currency?: string;
  theme?: string;
  ai_prompt?: string;
  auto_plan?: boolean;
}

export interface BudgetSummary {
  total_budget: number;
  allocated_total: number;
  committed_total: number;
  paid_total: number;
  remaining_ceiling: number;
  utilization_pct: number;
}

export interface TimelineNode {
  id: string;
  event_id: string;
  title: string;
  phase: PhaseKey;
  swimlane: 'milestone' | 'vendor' | 'budget' | string;
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk' | string;
  critical_path: boolean;
  owner_agent: string;
  description: string;
  dependency_ids: string[];
  checklist: ChecklistItem[];
  metadata: Record<string, unknown>;
  sort_order: number;
}

export interface AgencyVendor {
  id: string;
  name: string;
  category: string;
  specialty: string;
  rating: number;
  price_tier: string;
  base_quote_estimate: number;
  contact_name: string;
  contact_email: string;
  phone: string;
  location: string;
  sustainability_score: number;
  portfolio_tags: string[];
}

export type VendorStage = 'Shortlisted' | 'RFP Sent' | 'Quoted' | 'Contracted' | 'Paid';

export interface EventVendorItem {
  id: string;
  event_id: string;
  vendor_id: string;
  vendor_name: string;
  category: string;
  specialty: string;
  rating: number;
  contact_name: string;
  contact_email: string;
  location: string;
  sustainability_score: number;
  timeline_node_id: string | null;
  phase: PhaseKey;
  stage: VendorStage;
  quoted_amount: number;
  contracted_amount: number;
  paid_amount: number;
  rfp_draft: string;
  checklist: ChecklistItem[];
  notes: string;
}

export interface BudgetTrancheItem {
  id: string;
  event_id: string;
  timeline_node_id: string | null;
  event_vendor_id: string | null;
  title: string;
  category: string;
  phase: PhaseKey;
  tranche_type: string;
  allocated_amount: number;
  committed_amount: number;
  paid_amount: number;
  due_date: string;
  status: 'Scheduled' | 'Committed' | 'Paid' | 'Overdue' | string;
  notes: string;
}

export interface IdeaItem {
  id: string;
  event_id: string;
  title: string;
  category: string;
  phase: PhaseKey;
  estimated_cost: number;
  guest_impact_score: number;
  description: string;
  execution_blueprint: {
    milestone_title?: string;
    vendor_id?: string;
    phase?: PhaseKey;
    tranche_amount?: number;
    checklist?: string[];
  };
  promoted: boolean;
  promoted_node_id: string | null;
}

export interface AgentToolCallTrace {
  tool: string;
  args_summary: string;
  duration_ms: number;
  affected_node_id?: string | null;
  result_summary?: string;
}

export interface SubAgentTrace {
  id: string;
  name: string;
  role?: string;
  status: 'running' | 'completed' | 'failed' | string;
  duration_ms: number;
  thought: string;
  tool_calls: AgentToolCallTrace[];
}

export interface AgentRunTrace {
  run_id: string;
  snapshot_id: string;
  event_id?: string;
  status: 'running' | 'completed' | 'reverted' | 'failed' | string;
  orchestrator: string;
  directive: string;
  summary?: string;
  provider_used?: string;
  model_used?: string;
  duration_ms?: number;
  created_at?: string;
  reverted_at?: string | null;
  subagents: SubAgentTrace[];
}

export interface EventWorkspace {
  event: EventSummary;
  budget_summary: BudgetSummary;
  timeline_nodes: TimelineNode[];
  event_vendors: EventVendorItem[];
  budget_tranches: BudgetTrancheItem[];
  ideas: IdeaItem[];
  agent_runs: AgentRunTrace[];
}

export interface LLMConfigStatus {
  configured_provider: string;
  active_provider: string;
  active_model: string;
  has_live_key: boolean;
  openai_base_url: string;
  keys_configured: {
    gemini: boolean;
    antigravity: boolean;
    openai: boolean;
    anthropic: boolean;
  };
  sdk_mode: string;
}
