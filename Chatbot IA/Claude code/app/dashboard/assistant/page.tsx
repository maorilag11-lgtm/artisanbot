'use client'

import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolResult?: string
}

const suggestions = [
  'Mon planning de demain ?',
  'Liste les devis en attente',
  'Relance les impayés de plus de 15 jours',
  'Crée un rendez-vous vendredi à 14h avec M. Dupont',
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant ArtisanBot. Je peux vous aider à gérer vos devis, factures, planning et bien plus encore. Que puis-je faire pour vous aujourd\'hui ?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{
        height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Assistant IA</h1>
            <p style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              En ligne
            </p>
          </div>
        </div>
        <button style={{
          background: 'none',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
          color: '#6B7280',
          fontSize: 13,
        }}>
          Effacer l'historique
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 64px)', padding: 20, gap: 16 }}>
        {/* Suggestions */}
        {messages.length === 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '4px 0',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
              )}
              <div style={{
                maxWidth: '72%',
                background: msg.role === 'user' ? '#2563EB' : '#FFFFFF',
                color: msg.role === 'user' ? '#FFFFFF' : '#111827',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '12px 16px',
                border: msg.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  AM
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px 16px 16px 4px',
                padding: '14px 18px',
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#9CA3AF',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message... (ex: 'Envoie le devis à M. Dupont pour 450€')"
            rows={1}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 14,
              color: '#111827',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? '#2563EB' : '#E5E7EB',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              color: input.trim() && !loading ? '#FFFFFF' : '#9CA3AF',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 150ms',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
          L'assistant peut créer des devis, envoyer des emails et modifier votre planning. Vérifiez toujours les actions importantes.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </DashboardLayout>
  )
}
