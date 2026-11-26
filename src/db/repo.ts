import { db } from "./index.js";

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
