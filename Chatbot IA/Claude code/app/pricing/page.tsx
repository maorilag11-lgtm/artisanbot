'use client'

import { useState } from 'react'
import Link from 'next/link'

const features = [
  'Assistant IA de qualification des demandes',
  'Widget conversationnel embeddable',
  'Page publique de demande de devis',
  'Génération de devis en PDF',
  'Facturation et relances automatiques',
  'Sync Google Calendar',
  'Dashboard avec statistiques en temps réel',
  'Templates de qualification par métier',
  'Automations personnalisables',
  'Support par email',
]

export default function PricingPage() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F8FA',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>ArtisanBot</span>
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
          Un seul abonnement, tout inclus
        </h1>
        <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 480, margin: '0 auto' }}>
          Gérez vos clients, devis et planning avec l'intelligence artificielle.
        </p>
      </div>

      <div style={{
        background: '#FFFFFF',
        border: '2px solid #2563EB',
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>Abonnement mensuel</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 42, fontWeight: 600, color: '#111827' }}>49</span>
            <span style={{ fontSize: 18, color: '#6B7280' }}>€/mois</span>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>HT, sans engagement</div>
        </div>

        <div style={{ marginBottom: 32 }}>
          {features.map((feature, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 14, color: '#374151' }}>{feature}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: loading ? '#93C5FD' : '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 150ms',
          }}
        >
          {loading ? 'Redirection...' : 'Commencer mon abonnement'}
        </button>

        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
          Paiement sécurisé par Stripe. Annulable à tout moment.
        </p>
      </div>
    </div>
  )
}
