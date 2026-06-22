-- Gmail Integration Schema
-- Run this after schema.sql in Supabase SQL Editor

-- Gmail connected accounts
CREATE TABLE gmail_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  refresh_token text NOT NULL,
  access_token text,
  token_expiry timestamptz,
  history_id text,
  watch_expiry timestamptz,
  watch_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Gmail messages
CREATE TABLE gmail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_account_id uuid REFERENCES gmail_accounts(id) ON DELETE CASCADE NOT NULL,
  message_id text NOT NULL,
  thread_id text,
  from_email text,
  from_name text,
  to_email text[],
  cc_email text[],
  subject text,
  snippet text,
  body_text text,
  body_html text,
  labels text[],
  is_read boolean DEFAULT false,
  is_sent boolean DEFAULT false,
  received_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(gmail_account_id, message_id)
);

-- AI processing events
CREATE TABLE ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id uuid REFERENCES gmail_messages(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- summary | tags | auto_reply | classification
  status text DEFAULT 'pending', -- pending | processing | done | error
  input_tokens int,
  output_tokens int,
  result jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sees_own_gmail_accounts" ON gmail_accounts
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE gmail_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sees_own_gmail_messages" ON gmail_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gmail_accounts ga
      WHERE ga.id = gmail_messages.gmail_account_id
      AND ga.user_id = auth.uid()
    )
  );

ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sees_own_ai_events" ON ai_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gmail_messages gm
      JOIN gmail_accounts ga ON ga.id = gm.gmail_account_id
      WHERE gm.id = ai_events.gmail_message_id
      AND ga.user_id = auth.uid()
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_gmail_accounts_user ON gmail_accounts(user_id);
CREATE INDEX idx_gmail_messages_account ON gmail_messages(gmail_account_id, received_at DESC);
CREATE INDEX idx_gmail_messages_thread ON gmail_messages(thread_id);
CREATE INDEX idx_gmail_messages_read ON gmail_messages(gmail_account_id, is_read) WHERE is_read = false;
CREATE INDEX idx_ai_events_message ON ai_events(gmail_message_id, event_type);
CREATE INDEX idx_ai_events_status ON ai_events(status) WHERE status = 'pending';

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gmail_accounts_updated_at
  BEFORE UPDATE ON gmail_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ai_events_updated_at
  BEFORE UPDATE ON ai_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
