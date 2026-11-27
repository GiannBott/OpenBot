import { db } from "./index.js";
import { randomBytes } from "node:crypto";

export interface ChannelState {
  channelId: string;
  sessionId: string | null;
  model: string | null;
  agent: string | null;
  variant: string | null;
  updatedAt: number;
}

const cache = new Map<string, ChannelState>();
const listStates = db.prepare("SELECT channel_id, session_id, model, agent, variant, updated_at FROM channel_state");
const upsertState = db.prepare(`INSERT INTO channel_state (channel_id, session_id, model, agent, variant, updated_at)
  VALUES (@channelId, @sessionId, @model, @agent, @variant, @updatedAt)
  ON CONFLICT(channel_id) DO UPDATE SET session_id = excluded.session_id, model = excluded.model, agent = excluded.agent, variant = excluded.variant, updated_at = excluded.updated_at`);
const insertFile = db.prepare("INSERT INTO files (id, session_id, path, mime, size, direction, created_at) VALUES (@id, @sessionId, @path, @mime, @size, @direction, @createdAt)");
const getFile = db.prepare("SELECT id, session_id, path, mime, size, direction, created_at FROM files WHERE id = ?");
const insertPending = db.prepare(`INSERT INTO pending_interactions (id, kind, session_id, event_id, channel_id, message_id, payload, status, created_at, expires_at)
  VALUES (@id, @kind, @sessionId, @eventId, @channelId, @messageId, @payload, @status, @createdAt, @expiresAt)`);
const getOpenUpload = db.prepare(`SELECT id, kind, session_id, event_id, channel_id, message_id, payload, status, created_at, expires_at
  FROM pending_interactions
  WHERE kind = 'upload' AND status = 'open' AND channel_id = ? AND expires_at >= ?
  ORDER BY created_at DESC`);
const closePending = db.prepare("UPDATE pending_interactions SET status = ? WHERE id = ?");

for (const row of listStates.all() as Array<{ channel_id: string; session_id: string | null; model: string | null; agent: string | null; variant: string | null; updated_at: number }>) {
  cache.set(row.channel_id, { channelId: row.channel_id, sessionId: row.session_id, model: row.model, agent: row.agent, variant: row.variant, updatedAt: row.updated_at });
}

export function getChannelState(channelId: string): ChannelState | undefined {
  return cache.get(channelId);
}

export function saveChannelState(state: Omit<ChannelState, "updatedAt">): ChannelState {
  const next = { ...state, updatedAt: Date.now() };
  upsertState.run(next);
  cache.set(next.channelId, next);
  return next;
}

export interface StoredFile {
  id: string;
  sessionId: string | null;
  path: string;
  mime: string | null;
  size: number;
  direction: "in" | "out";
  createdAt: number;
}

export function registerFile(file: Omit<StoredFile, "id" | "createdAt">): StoredFile {
  const next: StoredFile = { ...file, id: randomBytes(8).toString("base64url"), createdAt: Date.now() };
  insertFile.run(next);
  return next;
}

export function getStoredFile(id: string): StoredFile | undefined {
  const row = getFile.get(id) as { id: string; session_id: string | null; path: string; mime: string | null; size: number; direction: "in" | "out"; created_at: number } | undefined;
  return row ? { id: row.id, sessionId: row.session_id, path: row.path, mime: row.mime, size: row.size, direction: row.direction, createdAt: row.created_at } : undefined;
}

export interface PendingInteraction {
  id: string;
  kind: "question" | "permission" | "upload" | "overwrite";
  sessionId: string;
  eventId: string | null;
  channelId: string;
  messageId: string | null;
  payload: string;
  status: "open" | "answered" | "expired" | "cancelled";
  createdAt: number;
  expiresAt: number;
}

export function createPendingInteraction(input: Omit<PendingInteraction, "id" | "createdAt" | "status">): PendingInteraction {
  const next: PendingInteraction = { ...input, id: randomBytes(8).toString("base64url"), status: "open", createdAt: Date.now() };
  insertPending.run(next);
  return next;
}

export function findOpenUpload(channelId: string, userId: string, now = Date.now()): PendingInteraction | undefined {
  const rows = getOpenUpload.all(channelId, now) as Array<{
    id: string; kind: PendingInteraction["kind"]; session_id: string; event_id: string | null; channel_id: string;
    message_id: string | null; payload: string; status: PendingInteraction["status"]; created_at: number; expires_at: number;
  }>;
  for (const row of rows) {
    const payload = JSON.parse(row.payload) as { userId?: string };
    if (payload.userId !== userId) continue;
    return {
      id: row.id, kind: row.kind, sessionId: row.session_id, eventId: row.event_id, channelId: row.channel_id,
      messageId: row.message_id, payload: row.payload, status: row.status, createdAt: row.created_at, expiresAt: row.expires_at
    };
  }
  return undefined;
}

export function setPendingStatus(id: string, status: PendingInteraction["status"]): void {
  closePending.run(status, id);
}
