import {
  AgencyVendor,
  AgentRunTrace,
  ChecklistItem,
  CreateEventPayload,
  EventSummary,
  EventWorkspace,
  LLMConfigStatus,
  PhaseKey,
  VendorStage,
} from '../types/crm';

const API_BASE = '/api';

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const crmApi = {
  getEvents(): Promise<{ events: EventSummary[] }> {
    return requestJson('/events');
  },

  createEvent(
    payload: CreateEventPayload
  ): Promise<{ event_id: string; trace: AgentRunTrace | null; workspace: EventWorkspace }> {
    return requestJson('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getEventWorkspace(eventId: string): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}`);
  },

  getAgencyVendors(category?: string, query?: string): Promise<{ vendors: AgencyVendor[]; total: number }> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (query) params.set('q', query);
    const qs = params.toString();
    return requestJson(`/vendors${qs ? `?${qs}` : ''}`);
  },

  createTimelineNode(
    eventId: string,
    payload: {
      title: string;
      phase: PhaseKey;
      scheduled_date: string;
      start_time: string;
      duration_hours: number;
      critical_path: boolean;
      description: string;
    }
  ): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTimelineNode(
    eventId: string,
    nodeId: string,
    payload: Partial<{
      title: string;
      phase: PhaseKey;
      status: string;
      start_time: string;
      duration_hours: number;
      critical_path: boolean;
      description: string;
      checklist: ChecklistItem[];
    }>
  ): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/timeline/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  assignVendor(
    eventId: string,
    payload: {
      vendor_id: string;
      timeline_node_id?: string | null;
      phase: PhaseKey;
      stage: VendorStage;
      quoted_amount?: number;
      notes?: string;
    }
  ): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/vendors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateEventVendor(
    eventId: string,
    eventVendorId: string,
    payload: Partial<{
      stage: VendorStage;
      phase: PhaseKey;
      quoted_amount: number;
      contracted_amount: number;
      paid_amount: number;
      rfp_draft: string;
      checklist: ChecklistItem[];
      notes: string;
    }>
  ): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/vendors/${eventVendorId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  draftVendorRfp(eventId: string, eventVendorId: string): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/vendors/${eventVendorId}/draft-rfp`, {
      method: 'POST',
    });
  },

  upsertBudgetTranche(
    eventId: string,
    payload: {
      id?: string;
      title: string;
      category: string;
      phase: PhaseKey;
      tranche_type?: string;
      allocated_amount: number;
      committed_amount?: number;
      paid_amount?: number;
      due_date: string;
      status: string;
      timeline_node_id?: string | null;
      event_vendor_id?: string | null;
      notes?: string;
    }
  ): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/budget/tranches`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  rebalanceBudget(eventId: string): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/budget/rebalance`, {
      method: 'POST',
    });
  },

  createIdea(
    eventId: string,
    payload: {
      title: string;
      category: string;
      phase: PhaseKey;
      estimated_cost: number;
      description: string;
    }
  ): Promise<EventWorkspace> {
    return requestJson(`/events/${eventId}/ideas`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  promoteIdea(
    eventId: string,
    ideaId: string
  ): Promise<{
    promotion: { status: string; affected_node_id: string; idea_id: string };
    workspace: EventWorkspace;
  }> {
    return requestJson(`/events/${eventId}/ideas/${ideaId}/promote`, {
      method: 'POST',
    });
  },

  runAutonomousDirective(
    eventId: string,
    directive: string,
    focusPhase?: PhaseKey
  ): Promise<{ trace: AgentRunTrace; workspace: EventWorkspace }> {
    return requestJson(`/events/${eventId}/autonomous-directive`, {
      method: 'POST',
      body: JSON.stringify({ directive, focus_phase: focusPhase }),
    });
  },

  revertAgentRun(
    eventId: string,
    runId: string
  ): Promise<{ reverted_run_id: string; snapshot_id: string; status: string; workspace: EventWorkspace }> {
    return requestJson(`/events/${eventId}/runs/${runId}/revert`, {
      method: 'POST',
    });
  },

  exportRunOfShowBrief(eventId: string): Promise<{ event_id: string; markdown: string; workspace: EventWorkspace }> {
    return requestJson(`/events/${eventId}/export-brief`);
  },

  getLLMConfig(): Promise<LLMConfigStatus> {
    return requestJson('/config/llm');
  },

  updateLLMConfig(payload: {
    provider?: string;
    model?: string;
    gemini_api_key?: string;
    antigravity_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
    openai_base_url?: string;
  }): Promise<LLMConfigStatus> {
    return requestJson('/config/llm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
