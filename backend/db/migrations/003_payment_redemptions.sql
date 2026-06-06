CREATE TABLE IF NOT EXISTS payment_redemptions (
  fingerprint        TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  operation_number   TEXT,
  payment_datetime   TEXT,
  amount             NUMERIC(10, 2),
  redeemed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_redemptions_user
  ON payment_redemptions(user_id);
