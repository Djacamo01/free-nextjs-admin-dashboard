import { clearAuthSession, ensureFreshAccessToken, refreshSession } from "./auth";
import { getChatWebhookChatUrl, getChatWebhookFetchTimeoutMs } from "./env";
import { getAccessToken } from "./token-storage";

function abortSignalForChatWebhook(): AbortSignal | undefined {
  const ms = getChatWebhookFetchTimeoutMs();
  if (ms <= 0) return undefined;
  if (
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
  ) {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

function throwIfAbortError(e: unknown): void {
  const name =
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    typeof (e as { name: unknown }).name === "string"
      ? (e as { name: string }).name
      : e instanceof DOMException
        ? e.name
        : "";
  if (name === "AbortError") {
    throw new ChatWebhookError(
      "El asistente tardó demasiado; prueba de nuevo o aumenta NEXT_PUBLIC_CHAT_WEBHOOK_TIMEOUT_MS.",
      408
    );
  }
}

async function awaitChatWebhookResponse(
  promise: Promise<Response>
): Promise<Response> {
  try {
    return await promise;
  } catch (e) {
    throwIfAbortError(e);
    throw e;
  }
}

export type ChatWebhookSuggestion = {
  id: string;
  label: string;
  payload: string;
};

export type ChatWebhookAttachment = {
  type: string;
  title?: string;
  url?: string;
};

export type ChatWebhookAppointmentPreview = {
  id: string;
  title?: string;
  startUtc?: string;
  endUtc?: string;
  status?: string;
  patientDisplayName?: string;
  providerDisplayName?: string;
};

export type ChatWebhookReply = {
  text: string;
  format?: "markdown" | "plain" | string;
  locale?: string;
  summary?: string;
};

export type ChatWebhookResponse = {
  schemaVersion?: string;
  ok: boolean;
  requestId?: string;
  sessionId?: string;
  conversationId?: string;
  messageId?: string;
  reply?: ChatWebhookReply;
  suggestions?: ChatWebhookSuggestion[];
  attachments?: ChatWebhookAttachment[];
  data?: {
    appointmentsPreview?: ChatWebhookAppointmentPreview[];
    disclaimers?: string[];
    [key: string]: unknown;
  };
  agent?: {
    name?: string;
    toolsUsed?: string[];
    finishReason?: string;
  };
  meta?: Record<string, unknown>;
  debug?: { enabled?: boolean; notes?: string };
  error?: string;
};

export class ChatWebhookError extends Error {
  constructor(
    message: string,
    public status: number,
    public bodyText?: string
  ) {
    super(message);
    this.name = "ChatWebhookError";
  }
}

export type PostChatMessageBody = {
  sessionId: string;
  message: string;
  conversationId?: string;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function envelopeScore(o: Record<string, unknown>): number {
  let s = 0;
  if ("reply" in o) s += 4;
  const r = o.reply;
  if (isPlainObject(r) && typeof r.text === "string" && r.text.trim()) s += 3;
  if (o.ok === true) s += 1;
  if (typeof o.sessionId === "string") s += 1;
  if (typeof o.conversationId === "string") s += 1;
  const data = o.data;
  if (isPlainObject(data)) {
    const prev = data.appointmentsPreview;
    if (Array.isArray(prev) && prev.length > 0) s += 6;
    const disc = data.disclaimers;
    if (Array.isArray(disc) && disc.length > 0) s += 1;
  }
  const sug = o.suggestions;
  if (Array.isArray(sug) && sug.length > 0) s += 2;
  const att = o.attachments;
  if (Array.isArray(att) && att.length > 0) s += 2;
  if (isPlainObject(o.agent)) s += 1;
  if (typeof o.message === "string" && o.message.trim()) s += 2;
  return s;
}

function collectEnvelopeCandidates(
  raw: unknown,
  out: Record<string, unknown>[],
  depth: number
): void {
  if (depth > 14) return;
  if (raw === null || raw === undefined) return;
  if (Array.isArray(raw)) {
    for (const item of raw) collectEnvelopeCandidates(item, out, depth + 1);
    return;
  }
  if (!isPlainObject(raw)) return;
  out.push(raw);
  for (const v of Object.values(raw)) {
    collectEnvelopeCandidates(v, out, depth + 1);
  }
}

function pickBestEnvelope(raw: unknown): Record<string, unknown> {
  const candidates: Record<string, unknown>[] = [];
  collectEnvelopeCandidates(raw, candidates, 0);
  if (candidates.length === 0) {
    return isPlainObject(raw) ? raw : {};
  }
  let best = candidates[0];
  let bestScore = envelopeScore(best);
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i];
    const sc = envelopeScore(c);
    if (sc > bestScore || (sc === bestScore && Object.keys(c).length > Object.keys(best).length)) {
      bestScore = sc;
      best = c;
    }
  }
  return best;
}

function formatAppointmentsPreviewReply(
  items: ChatWebhookAppointmentPreview[]
): string {
  const lines = items.slice(0, 12).map((a) => {
    const patient = a.patientDisplayName?.trim();
    const title = a.title?.trim();
    const provider = a.providerDisplayName?.trim();
    const when = a.startUtc
      ? new Date(a.startUtc).toLocaleString("es", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "";
    const parts = [
      patient || title || "Cita",
      title && patient ? `(${title})` : null,
      provider ? `con ${provider}` : null,
      when ? `— ${when}` : null,
    ].filter(Boolean);
    return `• ${parts.join(" ")}`;
  });
  return lines.join("\n");
}

/**
 * Aplana respuestas típicas de n8n: arrays, `{ json: ... }`, payload sin `reply.text` pero con `data.appointmentsPreview`, `ok` ausente o `false` con cuerpo útil.
 */
export function normalizeChatWebhookPayload(raw: unknown): ChatWebhookResponse {
  const src = pickBestEnvelope(raw);
  const base = { ...src } as unknown as ChatWebhookResponse;
  const reply = base.reply;

  const replyTextRaw =
    typeof reply?.text === "string" ? reply.text.trim() : "";
  const summaryRaw =
    typeof reply?.summary === "string" ? reply.summary.trim() : "";
  const topMessage =
    typeof (src as { message?: unknown }).message === "string"
      ? String((src as { message: string }).message).trim()
      : "";

  const preview = base.data?.appointmentsPreview;
  const previewList = Array.isArray(preview) ? preview : [];
  const previewLen = previewList.length;

  let text =
    replyTextRaw ||
    summaryRaw ||
    topMessage ||
    (previewLen > 0 ? formatAppointmentsPreviewReply(previewList) : "");

  if (!text && Array.isArray(base.data?.disclaimers)) {
    const d = base.data!.disclaimers!.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
    if (d.length > 0) text = d.join("\n\n");
  }

  const hasUsable =
    text.length > 0 ||
    previewLen > 0 ||
    (base.suggestions?.length ?? 0) > 0 ||
    (base.attachments?.length ?? 0) > 0 ||
    base.ok === true;

  const ok = Boolean(hasUsable || base.ok === true);

  return {
    ...base,
    ok,
    reply: {
      ...reply,
      text,
      format: reply?.format ?? "markdown",
      locale: reply?.locale,
      summary: reply?.summary,
    },
  };
}

export function chatWebhookHasUsableContent(res: ChatWebhookResponse): boolean {
  const t = (res.reply?.text ?? "").trim();
  const prev = res.data?.appointmentsPreview;
  const previewLen = Array.isArray(prev) ? prev.length : 0;
  return (
    res.ok === true ||
    t.length > 0 ||
    previewLen > 0 ||
    (res.suggestions?.length ?? 0) > 0 ||
    (res.attachments?.length ?? 0) > 0
  );
}

/**
 * POST al webhook n8n con el mismo JWT de sesión que el resto de la app.
 */
export async function postChatMessage(
  body: PostChatMessageBody
): Promise<ChatWebhookResponse> {
  await ensureFreshAccessToken();
  let token = getAccessToken();
  if (!token) {
    throw new ChatWebhookError("Inicia sesión para usar el asistente", 401);
  }

  const url = getChatWebhookChatUrl();

  const doFetch = (t: string | null) =>
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      signal: abortSignalForChatWebhook(),
      body: JSON.stringify({
        sessionId: body.sessionId,
        message: body.message,
        ...(body.conversationId
          ? { conversationId: body.conversationId }
          : {}),
      }),
    });

  let res = await awaitChatWebhookResponse(doFetch(token));
  if (res.status === 401) {
    try {
      await refreshSession();
    } catch {
      clearAuthSession();
      throw new ChatWebhookError("Sesión expirada", 401);
    }
    token = getAccessToken();
    res = await awaitChatWebhookResponse(doFetch(token));
  }

  const text = await res.text();
  if (!res.ok) {
    throw new ChatWebhookError(
      text || res.statusText || "Error del asistente",
      res.status,
      text
    );
  }
  if (!text) {
    return { ok: false };
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return normalizeChatWebhookPayload(parsed);
  } catch {
    throw new ChatWebhookError("Respuesta no es JSON válido", res.status, text);
  }
}
