'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const initialAutomations = [
  {
    id: '1',
    title: 'Demande de devis automatique',
    description: 'Envoie automatiquement un message personnalisé quand un client demande un devis.',
    count: 128,
    enabled: true,
    iconColor: '#EFF6FF',
    iconStroke: '#2563EB',
  },
  {
    id: '2',
    title: 'Relance client sans réponse',
    description: 'Relance automatiquement les clients n\'ayant pas répondu dans les 48h.',
    count: 86,
    enabled: true,
    iconColor: '#EFF6FF',
    iconStroke: '#2563EB',
  },
  {
    id: '3',
    title: 'Réponse horaires d\'ouverture',
    description: 'Répond instantanément aux questions sur les horaires d\'ouverture de l\'atelier.',
    count: 245,
    enabled: true,
    iconColor: '#FEF9C3',
    iconStroke: '#CA8A04',
  },
  {
    id: '4',
    title: 'Confirmation de rendez-vous',
    description: 'Envoie un rappel automatique 24h avant le rendez-vous du client.',
    count: 67,
    enabled: true,
    iconColor: '#ECFDF5',
    iconStroke: '#10B981',
  },
  {
    id: '5',
    title: 'Merci après intervention',
    description: 'Envoie un message de remerciement après chaque intervention terminée.',
    count: 53,
    enabled: false,
    iconColor: '#FDF2F8',
    iconStroke: '#EC4899',
  },
  {
    id: '6',
    title: 'Avis client automatique',
    description: 'Demande un avis au client après la prestation réalisée.',
    count: 31,
    enabled: false,
    iconColor: '#FFF7ED',
    iconStroke: '#F59E0B',
  },
]

const popularTemplates = [
  { emoji: '🔨', title: 'Demande de devis', desc: 'Répondez instantanément aux demandes de devis avec un message personnalisé.' },
  { emoji: '🔧', title: 'Relance devis', desc: 'Relancez automatiquement vos devis envoyés sans réponse.' },
  { emoji: '🕐', title: 'Horaires d\'ouverture', desc: 'Informez vos clients de vos horaires d\'ouverture en un clic.' },
  { emoji: '🔩', title: 'Suivi après chantier', desc: 'Assurez un suivi automatique après chaque intervention client.' },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(initialAutomations)

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  const activeCount = automations.filter(a => a.enabled).length
  const totalMessages = automations.reduce((s, a) => s + (a.enabled ? a.count : 0), 0)

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
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Automatisations</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Gérez vos scénarios automatiques pour gagner du temps.</p>
        </div>
        <button style={{
          background: '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}>
          + Nouvelle automatisation
        </button>
      </div>

      <div style={{ padding: 28 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Automatisations actives', value: `${activeCount}`, sub: `sur ${automations.length} créées`, iconBg: '#EFF6FF', iconStroke: '#2563EB' },
            { label: 'Messages automatisés ce mois', value: totalMessages.toString(), sub: '+18% vs mois dernier', iconBg: '#ECFDF5', iconStroke: '#10B981' },
            { label: 'Temps économisé', value: '14h', sub: '+2h vs mois dernier', iconBg: '#FEF3C7', iconStroke: '#F59E0B' },
            { label: 'Taux de réussite', value: '94%', sub: '+6% vs mois dernier', iconBg: '#ECFDF5', iconStroke: '#10B981' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: stat.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.iconStroke} strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#10B981' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Main 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Automations list */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Mes automatisations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {automations.map(auto => (
                <div key={auto.id} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: auto.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={auto.iconStroke} strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{auto.title}</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: auto.enabled ? '#ECFDF5' : '#F3F4F6',
                        color: auto.enabled ? '#059669' : '#9CA3AF',
                      }}>
                        {auto.enabled ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 6px' }}>{auto.description}</p>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>Déclenchée {auto.count} fois</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {/* Toggle */}
                    <div
                      onClick={() => toggleAutomation(auto.id)}
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 11,
                        background: auto.enabled ? '#2563EB' : '#D1D5DB',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 200ms',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        top: 3,
                        left: auto.enabled ? 21 : 3,
                        transition: 'left 200ms',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18 }}>⋮</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⭐ Modèles populaires
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Configurez en un clic</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {popularTemplates.map((t, i) => (
                <div key={i} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{t.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{t.title}</div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px', lineHeight: 1.5 }}>{t.desc}</p>
                  <button style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 13, cursor: 'pointer', fontWeight: 500, padding: 0 }}>
                    Utiliser ce modèle ›
                  </button>
                </div>
              ))}
              <button style={{ background: 'none', border: '1px dashed #D1D5DB', borderRadius: 8, padding: '12px', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontWeight: 500 }}>
                ⊞ Voir tous les modèles
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
