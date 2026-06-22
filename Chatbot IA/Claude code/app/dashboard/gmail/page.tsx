'use client'

import { useEffect, useRef, useState } from 'react'

interface AIEvent {
  event_type: string
  status: string
  result: {
    summary?: string
    tags?: string[]
    priority?: 'low' | 'medium' | 'high'
    needs_reply?: boolean
  } | null
}

interface GmailMessage {
  id: string
  message_id: string
  from_email: string
  from_name: string
  subject: string
  snippet: string
  labels: string[]
  is_read: boolean
  received_at: string
  ai_events: AIEvent[]
}

// ── Helpers ──────────────────────────────────────────────────

function initials(name: string, email: string) {
  const src = name || email || '?'
  const parts = src.trim().split(/\s+/)
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : src.slice(0, 2).toUpperCase()
}

const AVATAR_PALETTE = [
  ['#6366F1', '#EEF2FF'],
  ['#8B5CF6', '#F5F3FF'],
  ['#EC4899', '#FDF2F8'],
  ['#14B8A6', '#F0FDFA'],
  ['#F97316', '#FFF7ED'],
  ['#3B82F6', '#EFF6FF'],
  ['#10B981', '#ECFDF5'],
  ['#EF4444', '#FEF2F2'],
]

function avatarColors(name: string, email: string): [string, string] {
  const s = (name || email || '?').charCodeAt(0)
  return AVATAR_PALETTE[s % AVATAR_PALETTE.length]
}

function relativeDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'À l\'instant'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 6 * 86_400_000)
    return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
}

// ── Sub-components ───────────────────────────────────────────

function Avatar({ name, email, size = 38 }: { name: string; email: string; size?: number }) {
  const [fg, bg] = avatarColors(name, email)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, userSelect: 'none',
      letterSpacing: '-0.5px',
    }}>
      {initials(name, email)}
    </div>
  )
}

function PriorityDot({ level }: { level: 'low' | 'medium' | 'high' }) {
  const map = { high: '#EF4444', medium: '#F97316', low: '#10B981' }
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      background: map[level], display: 'inline-block', flexShrink: 0,
    }} />
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, color: '#6B7280',
      background: '#F3F4F6', borderRadius: 6,
      padding: '2px 8px', fontWeight: 500,
    }}>
      {label}
    </span>
  )
}

function SkeletonItem() {
  return (
    <div style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sk)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, width: '55%', background: 'var(--sk)', borderRadius: 6, marginBottom: 9 }} />
        <div style={{ height: 11, width: '85%', background: 'var(--sk2)', borderRadius: 6, marginBottom: 7 }} />
        <div style={{ height: 10, width: '70%', background: 'var(--sk2)', borderRadius: 6 }} />
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function GmailPage() {
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [selected, setSelected] = useState<GmailMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai'>('all')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState({ to: '', subject: '', body: '' })
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/gmail/emails')
      .then((r) => r.json())
      .then(({ messages }) => { setMessages(messages ?? []); setLoading(false) })
  }, [])

  function selectMsg(msg: GmailMessage) {
    setSelected(msg); setComposing(false)
    if (!msg.is_read) {
      fetch('/api/gmail/mark-read', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msg.message_id }),
      })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m))
    }
  }

  async function handleSend() {
    if (!draft.to || !draft.subject || !draft.body || sending || sent) return
    setSending(true)
    await fetch('/api/gmail/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    setSending(false); setSent(true)
    setTimeout(() => { setSent(false); setComposing(false); setDraft({ to: '', subject: '', body: '' }) }, 1800)
  }

  const filtered = messages.filter(m => {
    if (filter === 'unread' && m.is_read) return false
    if (filter === 'ai' && !m.ai_events?.some(e => e.status === 'done')) return false
    if (search) {
      const q = search.toLowerCase()
      return [m.from_name, m.from_email, m.subject, m.snippet].some(s => s?.toLowerCase().includes(q))
    }
    return true
  })

  const unread = messages.filter(m => !m.is_read).length
  const aiDone = messages.filter(m => m.ai_events?.some(e => e.status === 'done')).length
  const aiEvt = selected?.ai_events?.find(e => e.event_type === 'summary' && e.status === 'done')

  return (
    <>
      <style>{`
        :root {
          --sk: #F3F4F6;
          --sk2: #F9FAFB;
          --blue: #2563EB;
          --blue-lt: #EFF6FF;
          --surface: #FFFFFF;
          --bg: #F7F8FA;
          --border: #E5E7EB;
          --text: #111827;
          --sub: #6B7280;
          --muted: #9CA3AF;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

        .row { transition: background .12s, border-color .12s; }
        .row:hover { background: #F9FAFB !important; }
        .row.active { background: #EFF6FF !important; border-left-color: var(--blue) !important; }
        .row.unread { background: #FAFBFF !important; }
        .row.active.unread { background: #EFF6FF !important; }

        .pill { transition: background .1s, color .1s; cursor: pointer; }
        .pill:hover { opacity: .85; }
        .pill.on { background: var(--blue-lt); color: var(--blue); }

        .btn-primary { transition: transform .1s, box-shadow .1s, background .2s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,.25); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }

        .btn-ghost { transition: background .1s; }
        .btn-ghost:hover { background: #F3F4F6 !important; }

        .scroll { scrollbar-width: thin; scrollbar-color: #E5E7EB transparent; }
        .scroll::-webkit-scrollbar { width: 5px; }
        .scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

        input:focus, textarea:focus { outline: none; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn .2s ease; }

        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .sk { animation: pulse 1.4s ease infinite; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>

          {/* Top bar */}
          <div style={{ padding: '18px 20px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {/* Envelope icon */}
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--blue-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
                    <path d="M2 7l8 5 8-5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>Inbox</span>
                {unread > 0 && (
                  <span style={{ background: 'var(--blue)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 7px', lineHeight: '16px' }}>
                    {unread}
                  </span>
                )}
              </div>
              <button
                className="btn-primary"
                onClick={() => { setComposing(true); setSelected(null) }}
                style={{
                  background: 'var(--blue)', color: '#fff', border: 'none',
                  borderRadius: 9, padding: '8px 14px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 1px 4px rgba(37,99,235,.3)',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Écrire
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: .45 }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="#374151" strokeWidth="1.5"/>
                <path d="M11 11l3.5 3.5" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                placeholder="Rechercher…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', border: '1.5px solid var(--border)', borderRadius: 9,
                  padding: '9px 12px 9px 34px', fontSize: 13, color: 'var(--text)',
                  background: '#FAFAFA', transition: 'border-color .15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 5 }}>
              {([['all', 'Tous'], ['unread', `Non lus${unread ? ` · ${unread}` : ''}`], ['ai', `IA${aiDone ? ` · ${aiDone}` : ''}`]] as const).map(([v, l]) => (
                <button
                  key={v}
                  className={`pill${filter === v ? ' on' : ''}`}
                  onClick={() => setFilter(v)}
                  style={{
                    border: 'none', borderRadius: 20, padding: '5px 12px',
                    fontSize: 12, fontWeight: 500,
                    background: filter === v ? 'var(--blue-lt)' : '#F3F4F6',
                    color: filter === v ? 'var(--blue)' : 'var(--sub)',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />

          {/* List */}
          <div ref={listRef} className="scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {loading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div className="sk" key={i} style={{ animationDelay: `${i * .07}s` }}><SkeletonItem /></div>
                ))
              : filtered.length === 0
                ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', color: 'var(--muted)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: .3, marginBottom: 12 }}>
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M17 17l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: 13 }}>Aucun résultat</span>
                  </div>
                )
                : filtered.map(msg => {
                    const ai = msg.ai_events?.find(e => e.status === 'done')
                    const isActive = selected?.id === msg.id
                    return (
                      <div
                        key={msg.id}
                        className={`row${isActive ? ' active' : ''}${!msg.is_read ? ' unread' : ''}`}
                        onClick={() => selectMsg(msg)}
                        style={{
                          padding: '13px 20px', cursor: 'pointer',
                          borderBottom: '1px solid #F3F4F6',
                          borderLeft: `3px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                          display: 'flex', gap: 11, alignItems: 'flex-start',
                        }}
                      >
                        <Avatar name={msg.from_name} email={msg.from_email} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <span style={{
                              fontWeight: msg.is_read ? 500 : 700, fontSize: 13,
                              color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', maxWidth: 155,
                            }}>
                              {msg.from_name || msg.from_email}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginLeft: 6 }}>
                              {relativeDate(msg.received_at)}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 12.5, color: msg.is_read ? 'var(--sub)' : 'var(--text)',
                            fontWeight: msg.is_read ? 400 : 600, marginBottom: 3,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {msg.subject || '(sans objet)'}
                          </div>
                          <div style={{
                            fontSize: 11.5, color: 'var(--muted)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            marginBottom: ai ? 7 : 0,
                          }}>
                            {msg.snippet}
                          </div>
                          {ai && (
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                              {ai.result?.priority && <PriorityDot level={ai.result.priority} />}
                              {(ai.result?.tags ?? []).slice(0, 2).map(t => <Tag key={t} label={t} />)}
                            </div>
                          )}
                        </div>
                        {!msg.is_read && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 5 }} />
                        )}
                      </div>
                    )
                  })}
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {composing ? (
            /* ── COMPOSE ── */
            <div className="scroll fade" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div style={{ width: '100%', maxWidth: 660, background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,.07)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Nouveau message</span>
                  <button
                    onClick={() => setComposing(false)}
                    className="btn-ghost"
                    style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 18 }}
                  >
                    ×
                  </button>
                </div>

                {/* Fields */}
                {(['to', 'subject'] as const).map((field, i) => (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
                    <span style={{ width: 52, fontSize: 12, color: 'var(--muted)', fontWeight: 600, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                      {field === 'to' ? 'À' : 'Objet'}
                    </span>
                    <input
                      autoFocus={i === 0}
                      value={draft[field]}
                      onChange={e => setDraft({ ...draft, [field]: e.target.value })}
                      placeholder={field === 'to' ? 'destinataire@exemple.com' : 'Objet du message'}
                      style={{ flex: 1, border: 'none', fontSize: 14, color: 'var(--text)', padding: '14px 0', background: 'transparent', outline: 'none' }}
                    />
                  </div>
                ))}

                <textarea
                  ref={bodyRef}
                  placeholder="Votre message…"
                  value={draft.body}
                  onChange={e => setDraft({ ...draft, body: e.target.value })}
                  rows={14}
                  style={{
                    width: '100%', border: 'none', fontSize: 14, color: 'var(--text)',
                    lineHeight: 1.75, padding: '18px 24px', resize: 'none',
                    background: 'transparent', outline: 'none', display: 'block',
                  }}
                />

                {/* Footer */}
                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', background: '#FAFAFA' }}>
                  <button
                    className="btn-primary"
                    onClick={handleSend}
                    disabled={sending || sent || !draft.to || !draft.subject || !draft.body}
                    style={{
                      background: sent ? '#10B981' : 'var(--blue)',
                      color: '#fff', border: 'none', borderRadius: 9,
                      padding: '10px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 7,
                      opacity: (!draft.to || !draft.subject || !draft.body) && !sending && !sent ? .45 : 1,
                      transition: 'background .2s, opacity .2s, transform .1s, box-shadow .1s',
                      boxShadow: sent ? '0 2px 8px rgba(16,185,129,.3)' : '0 2px 8px rgba(37,99,235,.25)',
                    }}
                  >
                    {sent ? (
                      <><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Envoyé !</>
                    ) : sending ? (
                      'Envoi…'
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 1.5l13 6.5-13 6.5V9.5l9-1-9-1V1.5z" fill="currentColor"/></svg>Envoyer</>
                    )}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setComposing(false)}
                    style={{ background: 'transparent', color: 'var(--sub)', border: '1.5px solid var(--border)', borderRadius: 9, padding: '9px 18px', cursor: 'pointer', fontSize: 13 }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>

          ) : selected ? (
            /* ── EMAIL VIEW ── */
            <div key={selected.id} className="scroll fade" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              <div style={{ maxWidth: 700, margin: '0 auto' }}>

                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--muted)', fontSize: 12 }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6l7 4.5L15 6" stroke="currentColor" strokeWidth="1.5"/></svg>
                  <span>Inbox</span>
                  <span>›</span>
                  <span style={{ color: 'var(--sub)', fontWeight: 500 }}>{selected.from_name || selected.from_email}</span>
                </div>

                {/* Subject row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.4px', marginBottom: 10 }}>
                      {selected.subject || '(sans objet)'}
                    </h1>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {aiEvt?.result?.priority && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 10px',
                          background: aiEvt.result.priority === 'high' ? '#FEF2F2' : aiEvt.result.priority === 'medium' ? '#FFF7ED' : '#ECFDF5',
                          color: aiEvt.result.priority === 'high' ? '#EF4444' : aiEvt.result.priority === 'medium' ? '#F97316' : '#10B981',
                          textTransform: 'uppercase', letterSpacing: '.6px',
                        }}>
                          <PriorityDot level={aiEvt.result.priority} />
                          {aiEvt.result.priority === 'high' ? 'Urgent' : aiEvt.result.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </span>
                      )}
                      {aiEvt?.result?.needs_reply && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FFFBEB', borderRadius: 20, padding: '4px 10px', border: '1px solid #FDE68A' }}>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 9L4 6 1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          Réponse attendue
                        </span>
                      )}
                      {(aiEvt?.result?.tags ?? []).map(t => <Tag key={t} label={t} />)}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    <button
                      className="btn-ghost"
                      onClick={() => { setDraft({ to: selected.from_email, subject: `Re: ${selected.subject}`, body: '' }); setComposing(true); setTimeout(() => bodyRef.current?.focus(), 60) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--border)', background: '#fff', color: 'var(--sub)', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 12V8a6 6 0 0 1 6-6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Répondre
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--border)', background: '#fff', color: 'var(--sub)', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 5L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Lu
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border)', background: '#fff', color: 'var(--sub)', borderRadius: 9, width: 36, height: 36, cursor: 'pointer' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="13" cy="8" r="1.5" fill="currentColor"/></svg>
                    </button>
                  </div>
                </div>

                {/* Sender card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', marginBottom: 16 }}>
                  <Avatar name={selected.from_name} email={selected.from_email} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                      {selected.from_name || selected.from_email}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {selected.from_email} · {fullDate(selected.received_at)}
                    </div>
                  </div>
                </div>

                {/* AI insight card */}
                {aiEvt && (
                  <div style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
                    border: '1px solid #DBEAFE', borderRadius: 14,
                    padding: '16px 20px', marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(37,99,235,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1l1.5 3.5L12 5.5l-2.5 2.5.5 3.5L7 9.5 4 11.5l.5-3.5L2 5.5l3.5-1L7 1z" stroke="#2563EB" strokeWidth="1.2" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '.7px' }}>Analyse IA</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#1E3A8A', lineHeight: 1.65, marginBottom: aiEvt.result?.tags?.length ? 12 : 0 }}>
                      {aiEvt.result?.summary}
                    </p>
                    {(aiEvt.result?.tags ?? []).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {aiEvt.result!.tags!.map(t => (
                          <span key={t} style={{ fontSize: 11, background: 'rgba(255,255,255,.7)', color: '#3B4A6B', border: '1px solid rgba(147,197,253,.5)', borderRadius: 20, padding: '3px 10px', backdropFilter: 'blur(4px)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Body */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '26px 28px' }}>
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: '#374151', whiteSpace: 'pre-wrap' }}>
                    {selected.snippet}
                  </p>
                </div>

                {/* Quick reply */}
                <div
                  onClick={() => { setDraft({ to: selected.from_email, subject: `Re: ${selected.subject}`, body: '' }); setComposing(true); setTimeout(() => bodyRef.current?.focus(), 60) }}
                  style={{
                    marginTop: 16, border: '1.5px dashed var(--border)', borderRadius: 12,
                    padding: '14px 18px', cursor: 'text', color: 'var(--muted)',
                    fontSize: 14, display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'border-color .15s, background .15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#94A3B8'; (e.currentTarget as HTMLElement).style.background = '#FAFAFA' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Avatar name={selected.from_name} email={selected.from_email} size={28} />
                  Répondre à {selected.from_name || selected.from_email}…
                </div>
              </div>
            </div>

          ) : (
            /* ── EMPTY STATE ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', userSelect: 'none' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: .4 }}>
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#9CA3AF', marginBottom: 5 }}>Aucun email sélectionné</p>
              <p style={{ fontSize: 13, color: '#D1D5DB' }}>{messages.length} email{messages.length !== 1 ? 's' : ''} dans votre boîte</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
