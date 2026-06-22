export type Trade = 'menuisier' | 'plombier' | 'electricien' | 'macon' | 'peintre' | 'autre'

export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled'

export interface Artisan {
  id: string
  company_name: string | null
  trade: Trade | null
  phone: string | null
  address: string | null
  public_slug: string
  widget_color: string
  widget_bot_name: string
  widget_welcome_message: string
  google_refresh_token: string | null
  google_calendar_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  created_at: string
}

export interface TradeTemplate {
  id: string
  trade: Trade
  is_default: boolean
  artisan_id: string | null
  questions: Array<{ key: string; label: string; required?: boolean }>
  system_prompt_extra: string | null
  created_at: string
}

export interface Client {
  id: string
  artisan_id: string
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
}

export interface QuoteRequest {
  id: string
  artisan_id: string
  client_id: string | null
  raw_message: string
  trade_category: string | null
  urgency: 'faible' | 'moyen' | 'urgent' | null
  estimated_budget: number | null
  status: 'new' | 'qualified' | 'quoted' | 'rejected'
  source_ip_hash: string | null
  created_at: string
}

export interface Conversation {
  id: string
  artisan_id: string
  client_id: string | null
  status: 'active' | 'closed' | 'converted_to_quote'
  csat_score: number | null
  source_ip_hash: string | null
  first_response_seconds: number | null
  started_at: string
  last_message_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'visitor' | 'assistant' | 'artisan'
  content: string
  created_at: string
}

export interface Quote {
  id: string
  artisan_id: string
  client_id: string
  quote_request_id: string | null
  conversation_id: string | null
  amount: number
  details: Record<string, unknown> | null
  pdf_url: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  created_at: string
}

export interface Invoice {
  id: string
  artisan_id: string
  client_id: string
  quote_id: string | null
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue'
  pdf_url: string | null
  last_reminder_sent_at: string | null
  created_at: string
}

export interface Appointment {
  id: string
  artisan_id: string
  client_id: string | null
  google_event_id: string | null
  title: string
  start_time: string
  end_time: string
  status: string
  created_at: string
}

export interface ChatMessage {
  id: string
  artisan_id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  tool_call: Record<string, unknown> | null
  created_at: string
}

export interface AutomationSettings {
  artisan_id: string
  auto_qualify_enabled: boolean
  reminder_delay_days: number
  reminder_enabled: boolean
  auto_quote_draft_enabled: boolean
  updated_at: string
}
