import type {
  ChatWebhookAppointmentPreview,
  ChatWebhookAttachment,
  ChatWebhookSuggestion,
} from "@/api/chat-webhook";

const STORAGE_KEY = "ordely_chat_session_v1";

/** Datos extra de la respuesta que mostramos en panel lateral / burbujas. */
export type CachedAssistantExtras = {
  appointmentsPreview?: ChatWebhookAppointmentPreview[];
  disclaimers?: string[];
};

export type CachedChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  format?: string;
  suggestions?: ChatWebhookSuggestion[];
  attachments?: ChatWebhookAttachment[];
  extras?: CachedAssistantExtras;
};

export type ChatSessionCache = {
  sessionId: string;
  conversationId?: string;
  messages: CachedChatTurn[];
  updatedAt: number;
};

function safeParse(raw: string | null): ChatSessionCache | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as ChatSessionCache;
    if (
      !v ||
      typeof v.sessionId !== "string" ||
      !Array.isArray(v.messages)
    ) {
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function loadChatSessionCache(): ChatSessionCache | null {
  if (typeof window === "undefined") return null;
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveChatSessionCache(state: ChatSessionCache): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...state, updatedAt: Date.now() })
  );
}

export function clearChatSessionCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Genera un id de sesión estable en esta pestaña hasta que el usuario borre caché. */
export function createChatSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `dash-${crypto.randomUUID()}`;
  }
  return `dash-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
