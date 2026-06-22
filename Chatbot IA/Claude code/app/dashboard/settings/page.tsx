'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type Tab = 'Profil' | 'Entreprise' | 'Chatbot IA' | 'Notifications' | 'Facturation' | 'Intégrations'

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const defaultHours = [
  { open: true, start: '08:00', end: '18:00' },
  { open: true, start: '08:00', end: '18:00' },
  { open: true, start: '08:00', end: '18:00' },
  { open: true, start: '08:00', end: '18:00' },
  { open: true, start: '08:00', end: '17:00' },
  { open: false, start: '09:00', end: '12:00' },
  { open: false, start: '09:00', end: '12:00' },
]

const chatColors = ['#2563EB', '#10B981', '#14B8A6', '#8B5CF6', '#EC4899', '#F59E0B']

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Profil')
  const [hours, setHours] = useState(defaultHours)
  const [botName, setBotName] = useState('ArtisanBot')
  const [selectedColor, setSelectedColor] = useState('#2563EB')
  const [toneValue, setToneValue] = useState(75)
  const [autoReply, setAutoReply] = useState(true)
  const [companyName, setCompanyName] = useState('Atelier Martin')
  const [trade, setTrade] = useState('menuisier')
  const [phone, setPhone] = useState('04 78 123 456')
  const [address, setAddress] = useState('12 rue des Artisans')
  const [city, setCity] = useState('Lyon')
  const [postalCode, setPostalCode] = useState('69003')

  const tabs: Tab[] = ['Profil', 'Entreprise', 'Chatbot IA', 'Notifications', 'Facturation', 'Intégrations']

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
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Paramètres</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Gérez votre compte et personnalisez votre assistant.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 28px',
        display: 'flex',
        gap: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#2563EB' : '#6B7280',
              borderBottom: activeTab === tab ? '2px solid #2563EB' : '2px solid transparent',
              transition: 'all 150ms',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: 28, flex: 1 }}>
        {activeTab !== 'Profil' ? (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            color: '#6B7280',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Page en construction</div>
            <div style={{ fontSize: 13 }}>Cette section sera disponible prochainement.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {/* Column 1 — Entreprise */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Informations de l'entreprise</h3>

              {[
                { label: 'Nom de l\'entreprise', value: companyName, setter: setCompanyName },
                { label: 'Adresse', value: address, setter: setAddress },
                { label: 'Téléphone', value: phone, setter: setPhone },
              ].map(field => (
                <div key={field.label} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>{field.label}</label>
                  <input
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Métier</label>
                <select
                  value={trade}
                  onChange={e => setTrade(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1px solid #E5E7EB',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 13,
                    outline: 'none',
                    background: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="menuisier">Menuisier - Ébéniste</option>
                  <option value="plombier">Plombier</option>
                  <option value="electricien">Électricien</option>
                  <option value="macon">Maçon</option>
                  <option value="peintre">Peintre</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Ville</label>
                  <input value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Code postal</label>
                  <input value={postalCode} onChange={e => setPostalCode(e.target.value)} style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Logo upload */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Logo de l'entreprise</label>
                <div style={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: 8,
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div style={{ fontSize: 12 }}>Cliquez pour télécharger ou glissez votre fichier ici</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>PNG, JPG ou WEBP (max. 2MB)</div>
                </div>
              </div>
            </div>

            {/* Column 2 — Chatbot */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Personnalisation du chatbot</h3>

              {/* Avatar */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>Avatar du bot</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: selectedColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}>
                    🤖
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer', color: '#374151' }}>
                      Changer l'avatar
                    </button>
                    <button style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #FEE2E2', borderRadius: 6, background: '#FFFFFF', cursor: 'pointer', color: '#EF4444' }}>
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              </div>

              {/* Bot name */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Nom du bot</label>
                <input
                  value={botName}
                  onChange={e => setBotName(e.target.value)}
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Tone slider */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>Ton de réponse</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                  <span>Formel</span>
                  <span>Chaleureux</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toneValue}
                  onChange={e => setToneValue(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563EB' }}
                />
              </div>

              {/* Colors */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>Couleur principale du chat</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {chatColors.map(color => (
                    <div
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: selectedColor === color ? '2px solid #111827' : '2px solid transparent',
                        outline: selectedColor === color ? '2px solid white' : 'none',
                        outlineOffset: '-4px',
                      }}
                    >
                      {selectedColor === color && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto reply toggle */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Réponses automatiques en dehors des horaires</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Le bot répond même en dehors des horaires d'ouverture définis.</div>
                </div>
                <div
                  onClick={() => setAutoReply(!autoReply)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: autoReply ? '#2563EB' : '#D1D5DB',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 200ms',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    top: 3,
                    left: autoReply ? 23 : 3,
                    transition: 'left 200ms',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            </div>

            {/* Column 3 — Hours */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Horaires d'ouverture</h3>

              {days.map((day, i) => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  {/* Toggle */}
                  <div
                    onClick={() => {
                      const next = [...hours]
                      next[i] = { ...next[i], open: !next[i].open }
                      setHours(next)
                    }}
                    style={{
                      width: 32,
                      height: 18,
                      borderRadius: 9,
                      background: hours[i].open ? '#2563EB' : '#D1D5DB',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 200ms',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      top: 3,
                      left: hours[i].open ? 17 : 3,
                      transition: 'left 200ms',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', width: 68, flexShrink: 0 }}>{day}</span>
                  {hours[i].open ? (
                    <>
                      <select
                        value={hours[i].start}
                        onChange={e => { const n = [...hours]; n[i] = { ...n[i], start: e.target.value }; setHours(n) }}
                        style={{ border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 6px', fontSize: 12, flex: 1 }}
                      >
                        {['07:00','08:00','09:00','10:00','11:00'].map(h => <option key={h}>{h}</option>)}
                      </select>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                      <select
                        value={hours[i].end}
                        onChange={e => { const n = [...hours]; n[i] = { ...n[i], end: e.target.value }; setHours(n) }}
                        style={{ border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 6px', fontSize: 12, flex: 1 }}
                      >
                        {['12:00','17:00','18:00','19:00','20:00'].map(h => <option key={h}>{h}</option>)}
                      </select>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>Fermé</span>
                  )}
                </div>
              ))}

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  🌐 Fuseau horaire
                </label>
                <select style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', fontSize: 13, background: '#FFFFFF', boxSizing: 'border-box' }}>
                  <option>Europe/Paris (UTC+01:00)</option>
                  <option>Europe/London (UTC+00:00)</option>
                </select>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Les horaires s'appliquent à votre fuseau horaire local.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer save button */}
      <div style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button style={{
          background: '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          Enregistrer les modifications
        </button>
      </div>
    </DashboardLayout>
  )
}
