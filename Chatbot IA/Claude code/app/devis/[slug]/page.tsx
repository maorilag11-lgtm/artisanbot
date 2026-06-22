'use client'

import { useState } from 'react'
import { use } from 'react'

export default function DevisPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.description) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...form }),
      })

      const data = await res.json()

      if (res.ok) {
        setStep('success')
      } else {
        setError(data.error || 'Une erreur est survenue.')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Demande envoyée !</h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
            Votre demande a bien été reçue. L'artisan l'analysera et vous recontactera rapidement par email ou téléphone.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 40, maxWidth: 520, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Demande de devis</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Remplissez ce formulaire et l'artisan vous répondra rapidement.</p>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#DC2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { id: 'name', label: 'Nom et prénom *', type: 'text', placeholder: 'Jean Dupont', key: 'name' as const },
            { id: 'email', label: 'Adresse email *', type: 'email', placeholder: 'jean@exemple.fr', key: 'email' as const },
            { id: 'phone', label: 'Téléphone', type: 'tel', placeholder: '06 12 34 56 78', key: 'phone' as const },
          ].map(field => (
            <div key={field.id} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms',
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Description des travaux *
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez vos travaux en détail : type de travaux, surface, délai souhaité, contraintes particulières..."
              rows={5}
              style={{
                width: '100%',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 24px',
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
            {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
          </button>

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 14 }}>
            Vos données sont protégées conformément au RGPD. Elles ne seront utilisées que pour traiter votre demande.
          </p>
        </form>
      </div>
    </div>
  )
}
