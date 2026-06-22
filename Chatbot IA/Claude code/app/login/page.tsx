'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleGoogleLogin() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F8FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: 48,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', marginBottom: 8 }}>ArtisanBot</h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Votre assistant IA pour artisans</p>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
          Connexion à votre espace
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 28 }}>
          Connectez-vous avec votre compte Google pour accéder à votre tableau de bord.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '12px 20px',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            background: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            color: '#111827',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 150ms',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? 'Connexion...' : 'Continuer avec Google'}
        </button>

        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
          En vous connectant, vous acceptez nos{' '}
          <span style={{ color: '#2563EB' }}>conditions d'utilisation</span>{' '}
          et notre{' '}
          <span style={{ color: '#2563EB' }}>politique de confidentialité</span>.
        </p>
      </div>
    </div>
  )
}
