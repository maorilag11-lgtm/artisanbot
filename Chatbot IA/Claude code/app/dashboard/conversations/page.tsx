'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const conversations = [
  { id: '1', initials: 'JD', color: '#8B5CF6', name: 'Julie D.', time: '10:24', preview: 'Bonjour, pouvez-vous me faire un devis pour une bibliothèque sur mesure ?', unread: true },
  { id: '2', initials: 'ML', color: '#10B981', name: 'Marc L.', time: '09:58', preview: 'Merci pour votre réponse, je vous recontacte demain.', unread: true },
  { id: '3', initials: 'SO', color: '#F59E0B', name: 'Sophie', time: 'Hier', preview: 'Quel est le délai pour une table en chêne massif ?', unread: true },
  { id: '4', initials: 'PB', color: '#EF4444', name: 'Pierre B.', time: 'Hier', preview: 'Parfait, je suis disponible vendredi après-midi.', unread: false },
  { id: '5', initials: 'CD', color: '#14B8A6', name: 'Claire D.', time: 'Mardi', preview: 'Pouvez-vous m\'envoyer des photos de vos réalisations ?', unread: false },
  { id: '6', initials: 'TM', color: '#2563EB', name: 'Thomas M.', time: 'Lundi', preview: 'J\'aimerais savoir si vous travaillez le bois recyclé.', unread: false },
  { id: '7', initials: 'IR', color: '#EC4899', name: 'Isabelle R.', time: 'Lundi', preview: 'Merci beaucoup pour votre aide !', unread: false },
]

const selectedMessages = [
  { role: 'visitor', content: 'Bonjour, pouvez-vous me faire un devis pour une bibliothèque sur mesure ?', time: '10:23', read: true },
  {
    role: 'assistant',
    content: `Bonjour Julie :)\n\nAvec plaisir ! Voici les informations dont j'ai besoin pour vous établir un devis précis :\n• Dimensions souhaitées (hauteur, largeur, profondeur)\n• Type de bois préféré (chêne, hêtre, noyer, etc.)\n• Finition souhaitée (brut, vernis, huilé, peinture, etc.)\n• Nombre d'étagères / compartiments\n• Délai souhaité pour la livraison\n• Lieu de livraison\n\nSouhaitez-vous également ajouter des portes, des tiroirs ou un éclairage intégré ?`,
    time: '10:24',
    read: false,
  },
  { role: 'visitor', content: 'Dimensions : 200 cm (H) x 120 cm (L) x 30 cm (P) en chêne, finition huilée, avec 5 étagères ouvertes. Pas de portes ni de tiroirs. Livraison à Lyon. Idéalement sous 4 semaines.', time: '10:26', read: true },
]

type FilterType = 'Toutes' | 'En cours' | 'Résolues' | 'Non lues'

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState('1')
  const [filter, setFilter] = useState<FilterType>('Toutes')
  const [message, setMessage] = useState('')

  const selected = conversations.find(c => c.id === selectedId)!

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
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Conversations</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Voici toutes vos conversations.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#6B7280' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#374151', fontSize: 14, fontWeight: 500 }}>Aide</button>
          <button style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            + Nouvelle conversation
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: 20, gap: 16, height: 'calc(100vh - 64px)' }}>
        {/* Column 1: list */}
        <div style={{
          width: 280,
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <div style={{ padding: 12, borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <svg style={{ position: 'absolute', left: 10, top: 9 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Rechercher une conversation..."
                style={{
                  width: '100%',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  padding: '7px 10px 7px 30px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['Toutes', 'En cours', 'Résolues', 'Non lues'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1,
                    padding: '4px 4px',
                    borderRadius: 4,
                    border: filter === f ? '1px solid #2563EB' : '1px solid #E5E7EB',
                    background: filter === f ? '#EFF6FF' : '#FFFFFF',
                    color: filter === f ? '#2563EB' : '#6B7280',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: filter === f ? 600 : 400,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderLeft: conv.id === selectedId ? '3px solid #2563EB' : '3px solid transparent',
                  background: conv.id === selectedId ? '#F0F7FF' : 'transparent',
                  borderBottom: '1px solid #F3F4F6',
                  transition: 'all 150ms',
                }}
              >
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: conv.color,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}>{conv.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{conv.name}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{conv.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.preview}</div>
                </div>
                {conv.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: chat */}
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: selected.color,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
              }}>{selected.initials}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selected.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#10B981' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  En ligne
                </div>
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 20 }}>⋮</button>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'visitor' ? 'flex-end' : 'flex-start', gap: 8 }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  background: msg.role === 'visitor' ? '#F3F4F6' : '#EFF6FF',
                  borderRadius: msg.role === 'visitor' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '10px 14px',
                }}>
                  <p style={{ fontSize: 13, color: '#111827', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{msg.content}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', textAlign: msg.role === 'visitor' ? 'right' : 'left' }}>
                    {msg.time}{msg.role === 'visitor' && msg.read ? ' ✓✓' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Écrire un message..."
              style={{
                flex: 1,
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
            <button style={{ background: '#2563EB', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#FFFFFF', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
