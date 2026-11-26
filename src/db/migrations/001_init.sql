CREATE TABLE channel_state (
  channel_id TEXT PRIMARY KEY,
  session_id TEXT,
  model TEXT,
  agent TEXT,
  variant TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE pending_interactions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('question', 'permission', 'upload', 'overwrite')),
  session_id TEXT NOT NULL,
  event_id TEXT,
  channel_id TEXT NOT NULL,
  message_id TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'answered', 'expired', 'cancelled')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  path TEXT NOT NULL,
  mime TEXT,
  size INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  created_at INTEGER NOT NULL
);

CREATE TABLE usage_daily (
  date TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  tokens_reasoning INTEGER NOT NULL DEFAULT 0,
  tokens_cache INTEGER NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (date, model)
);
