-- ArtisanBot Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artisans (linked to auth.users)
CREATE TABLE artisans (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  trade text, -- menuisier | plombier | electricien | macon | peintre | autre
  phone text,
  address text,
  public_slug text UNIQUE NOT NULL,
  widget_color text DEFAULT '#2563eb',
  widget_bot_name text DEFAULT 'ArtisanBot',
  widget_welcome_message text DEFAULT 'Bonjour 👋 Comment puis-je vous aider ?',
  google_refresh_token text, -- encrypted via pgsodium or app-level
  google_calendar_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'inactive', -- inactive | active | past_due | canceled
  created_at timestamptz DEFAULT now()
);

-- Trade templates
CREATE TABLE trade_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade text NOT NULL,
  is_default boolean DEFAULT true,
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE,
  questions jsonb NOT NULL,
  system_prompt_extra text,
  created_at timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE NOT NULL,
  name text,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Quote requests (form canal)
CREATE TABLE quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id),
  raw_message text NOT NULL,
  trade_category text,
  urgency text, -- faible | moyen | urgent
  estimated_budget numeric,
  status text DEFAULT 'new', -- new | qualified | quoted | rejected
  source_ip_hash text,
  created_at timestamptz DEFAULT now()
);

-- Conversations (widget canal)
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id),
  status text DEFAULT 'active', -- active | closed | converted_to_quote
  csat_score int,
  source_ip_hash text,
  first_response_seconds numeric,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

-- Messages (widget conversations)
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL, -- visitor | assistant | artisan
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Quotes
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  quote_request_id uuid REFERENCES quote_requests(id),
  conversation_id uuid REFERENCES conversations(id),
  amount numeric NOT NULL,
  details jsonb,
  pdf_url text,
  status text DEFAULT 'draft', -- draft | sent | accepted | rejected
  created_at timestamptz DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  quote_id uuid REFERENCES quotes(id),
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'pending', -- pending | paid | overdue
  pdf_url text,
  last_reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Appointments
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id),
  google_event_id text,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now()
);

-- Internal assistant chat history
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL, -- user | assistant | tool
  content text NOT NULL,
  tool_call jsonb,
  created_at timestamptz DEFAULT now()
);

-- Automation settings
CREATE TABLE automation_settings (
  artisan_id uuid PRIMARY KEY REFERENCES artisans(id) ON DELETE CASCADE,
  auto_qualify_enabled boolean DEFAULT true,
  reminder_delay_days int DEFAULT 7,
  reminder_enabled boolean DEFAULT true,
  auto_quote_draft_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Stripe webhook idempotency
CREATE TABLE processed_webhook_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_own" ON artisans FOR ALL USING (auth.uid() = id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_clients" ON clients FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_requests" ON quote_requests FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_conversations" ON conversations FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_messages" ON messages FOR ALL
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.artisan_id = auth.uid()));

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_quotes" ON quotes FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_invoices" ON invoices FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_appointments" ON appointments FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_chat" ON chat_messages FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_own_settings" ON automation_settings FOR ALL USING (auth.uid() = artisan_id);

ALTER TABLE trade_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisan_sees_templates" ON trade_templates FOR SELECT
  USING (is_default = true OR auth.uid() = artisan_id);
CREATE POLICY "artisan_manages_own_templates" ON trade_templates FOR ALL
  USING (auth.uid() = artisan_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create automation_settings on new artisan
CREATE OR REPLACE FUNCTION create_default_automation_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO automation_settings (artisan_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_artisan_created
  AFTER INSERT ON artisans
  FOR EACH ROW EXECUTE FUNCTION create_default_automation_settings();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_conversations_artisan ON conversations(artisan_id, status, last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_quotes_artisan ON quotes(artisan_id, status, created_at DESC);
CREATE INDEX idx_invoices_artisan ON invoices(artisan_id, status, due_date);
CREATE INDEX idx_clients_artisan ON clients(artisan_id, email);
CREATE INDEX idx_quote_requests_artisan ON quote_requests(artisan_id, status, created_at DESC);
