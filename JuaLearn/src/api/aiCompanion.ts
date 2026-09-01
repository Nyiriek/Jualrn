import api from "./axios";

export type CompanionMessage = { id: number; role: "user" | "assistant"; content: string; created_at: string };
export type CompanionConversation = {
  id: number;
  title: string;
  subject?: number | null;
  subject_name?: string;
  lesson?: number | null;
  lesson_title?: string;
  context_type?: string;
  context_id?: number | null;
  updated_at: string;
  messages?: CompanionMessage[];
};

export type CompanionChatRequest = {
  message: string;
  conversation_id?: number;
  subject_id?: number;
  lesson_id?: number;
  context_type?: "subject" | "lesson" | "quiz" | "assignment";
  context_id?: number;
  client_message_id: string;
};

export const getConversations = () => api.get<CompanionConversation[]>("/ai-companion/conversations/");
export const getConversation = (id: number) => api.get<CompanionConversation>(`/ai-companion/conversations/${id}/`);
export const deleteConversation = (id: number) => api.delete(`/ai-companion/conversations/${id}/`);
export const chatWithCompanion = (payload: CompanionChatRequest) =>
  api.post<{ conversation: CompanionConversation; message: CompanionMessage }>("/ai-companion/chat/", payload);
