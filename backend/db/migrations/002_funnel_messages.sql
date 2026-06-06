ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS funnel_messages JSONB NOT NULL DEFAULT '[]'::jsonb;
