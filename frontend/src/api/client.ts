import axios from "axios";

const API_BASE = "/";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export interface Interaction {
  id: number;
  hcp_name: string;
  interaction_type: string;
  date: string;
  time: string;
  attendees: string | null;
  topics_discussed: string | null;
  materials_shared: string | null;
  samples_distributed: string | null;
  sentiment: string | null;
  outcomes: string | null;
  follow_up_actions: string | null;
}

export interface InteractionCreate {
  hcp_name: string;
  interaction_type: string;
  date: string;
  time: string;
  attendees?: string;
  topics_discussed?: string;
  materials_shared?: string;
  samples_distributed?: string;
  sentiment?: string;
  outcomes?: string;
  follow_up_actions?: string;
}

export interface ChatFormData {
  hcp_name?: string | null;
  interaction_type?: string | null;
  date?: string | null;
  time?: string | null;
  attendees?: string | null;
  topics_discussed?: string | null;
  materials_shared?: string | null;
  samples_distributed?: string | null;
  sentiment?: string | null;
  outcomes?: string | null;
  follow_up_actions?: string | null;
}

export interface ChatResponse {
  response: string;
  tool_calls: Record<string, unknown>[] | null;
  form_data?: ChatFormData | null;
}

export const interactionsApi = {
  list: (params?: { search?: string; sentiment?: string; hcp_name?: string }) =>
    api.get<Interaction[]>("/interactions/", { params }),

  get: (id: number) => api.get<Interaction>(`/interactions/${id}`),

  create: (data: InteractionCreate) =>
    api.post<Interaction>("/interactions/", data),

  update: (id: number, data: Partial<InteractionCreate>) =>
    api.put<Interaction>(`/interactions/${id}`, data),

  delete: (id: number) => api.delete(`/interactions/${id}`),

  getByHcp: (name: string) =>
    api.get<Interaction[]>(`/interactions/hcp/${name}`),
};

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatApi = {
  // FIX: Include conversation history so backend maintains multi-turn context
  send: (message: string, history?: ChatHistoryMessage[]) =>
    api.post<ChatResponse>("/chat/", { message, history: history ?? [] }),
};
