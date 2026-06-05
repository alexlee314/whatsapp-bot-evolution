CREATE TABLE IF NOT EXISTS sessions (
  user_id              TEXT PRIMARY KEY,
  state                TEXT NOT NULL,
  funnel_version       INT NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL,
  last_message_at      TIMESTAMPTZ NOT NULL,
  expires_at           TIMESTAMPTZ,
  payment_received_at  TIMESTAMPTZ,
  session_started_at   TIMESTAMPTZ,
  session_ended_at     TIMESTAMPTZ,
  birth_date           TEXT,
  birth_time           TEXT,
  location             TEXT,
  age_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  numerology           JSONB,
  payment_data         JSONB,
  message_count        INT NOT NULL DEFAULT 0,
  messages             JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(state);
CREATE INDEX IF NOT EXISTS idx_sessions_last_message ON sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_payment ON sessions(payment_received_at DESC)
  WHERE payment_received_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)
  WHERE expires_at IS NOT NULL;
