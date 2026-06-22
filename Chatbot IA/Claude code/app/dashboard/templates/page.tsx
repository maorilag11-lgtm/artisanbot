'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type Category = 'Tous' | 'Devis' | 'Délais' | 'SAV' | 'Horaires' | 'Relances'

const categoryColors: Record<string, { bg: string; color: string }> = {
  Devis: { bg: '#EFF6FF', color: '#2563EB' },
  Délais: { bg: '#ECFDF5', color: '#059669' },
  SAV: { bg: '#F5F3FF', color: '#7C3AED' },
  Horaires: { bg: '#FFF7ED', color: '#D97706' },
  Relances: { bg: '#F0FDFA', color: '#0D9488' },
}

const templates = [
  {
    id: '1',
    title: 'Demande de devis sur mesure',
    category: 'Devis',
    preview: 'Bonjour, j\'aimerais un devis pour une étagère sur mesure. Pouvez-vous me...',
    uses: 128,
    rank: 1,
  },
  {
    id: '2',
    title: 'Délai de fabrication',
    category: 'Délais',
    preview: 'Bonjour, quel est le délai pour la fabrication de ma commande ?...',
    uses: 96,
    rank: 2,
  },
  {
    id: '3',
    title: 'Question sur les matériaux',
    category: 'SAV',
    preview: 'Bonjour, pouvez-vous me conseiller sur le choix du bois pour...',
    uses: 74,
    rank: 3,
  },
  {
    id: '4',
    title: 'Prise de rendez-vous',
    category: 'Horaires',
    preview: 'Bonjour, je souhaiterais prendre rendez-vous pour discuter de mon projet. Êtes-vous disponible...',
    uses: 61,
    rank: 0,
  },
  {
    id: '5',
    title: 'Message d\'absence',
    category: 'Horaires',
    preview: 'Bonjour, nous sommes actuellement absents. Nous vous répondrons dès notre retour. Merci pour votre...',
    uses: 45,
    rank: 0,
  },
  {
    id: '6',
    title: 'Suivi de commande',
    category: 'Relances',
    preview: 'Bonjour, où en est ma commande ? Pouvez-vous me donner des nouvelles s\'il vous plaît ?...',
    uses: 38,
    rank: 0,
  },
]

const rankEmojis = ['', '🥇', '🥈', '🥉']

export default function TemplatesPage() {
  const [activeFilter, setActiveFilter] = useState<Category>('Tous')
  const [search, setSearch] = useState('')

  const filtered = templates.filter(t => {
    const matchCat = activeFilter === 'Tous' || t.category === activeFilter
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.preview.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const topTemplates = templates.filter(t => t.rank > 0).sort((a, b) => a.rank - b.rank)

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
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Templates</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Des modèles de réponses prêts à l'emploi pour votre métier.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#6B7280' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            + Créer un template
          </button>
        </div>
      </div>

      <div style={{ padding: 28 }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <svg style={{ position: 'absolute', left: 14, top: 12 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un template..."
            style={{
              width: '100%',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              padding: '10px 16px 10px 40px',
              fontSize: 14,
              outline: 'none',
              background: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {(['Tous', 'Devis', 'Délais', 'SAV', 'Horaires', 'Relances'] as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: 'none',
                background: activeFilter === cat ? '#2563EB' : '#FFFFFF',
                color: activeFilter === cat ? '#FFFFFF' : '#6B7280',
                fontSize: 13,
                fontWeight: activeFilter === cat ? 600 : 400,
                cursor: 'pointer',
                boxShadow: activeFilter === cat ? 'none' : '0 0 0 1px #E5E7EB',
                transition: 'all 150ms',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Top 3 */}
        {activeFilter === 'Tous' && search === '' && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 14 }}>
              Templates les plus utilisés
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
              {topTemplates.map(t => {
                const colors = categoryColors[t.category]
                return (
                  <div key={t.id} style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 22 }}>{rankEmojis[t.rank]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{t.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: colors.bg, color: colors.color, fontWeight: 600 }}>
                          {t.category}
                        </span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Utilisé {t.uses} fois</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Templates grid */}
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 14 }}>
          {activeFilter === 'Tous' ? 'Tous les templates' : `Templates — ${activeFilter}`}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {filtered.map(t => {
            const colors = categoryColors[t.category]
            return (
              <div key={t.id} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.color} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: colors.bg, color: colors.color, fontWeight: 600 }}>
                    {t.category}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{t.title}</div>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, flex: 1, marginBottom: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {t.preview}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                  <button style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 13, cursor: 'pointer', fontWeight: 500, padding: 0 }}>
                    Utiliser
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
