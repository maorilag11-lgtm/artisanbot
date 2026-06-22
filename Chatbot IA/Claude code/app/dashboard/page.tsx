import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { KPICard } from '@/components/dashboard/KPICard'
import Link from 'next/link'

const avatarColors: Record<string, string> = {
  JD: '#8B5CF6',
  ML: '#10B981',
  SO: '#F59E0B',
  PB: '#EF4444',
  CD: '#14B8A6',
}

const recentConversations = [
  { initials: 'JD', name: 'Julie D.', time: '11:42', preview: 'Bonjour, j\'aimerais un devis pour une étagère sur mesure.', unread: true },
  { initials: 'ML', name: 'Marc L.', time: '10:15', preview: 'Quels types de bois utilisez-vous ?', unread: false },
  { initials: 'SO', name: 'Sophie', time: 'Hier', preview: 'Pouvez-vous intervenir à domicile ?', unread: false },
  { initials: 'PB', name: 'Pierre B.', time: 'Hier', preview: 'Merci pour votre réactivité 🙏', unread: false },
  { initials: 'CD', name: 'Claire D.', time: '2 mai', preview: 'Quel est le délai pour une table sur mesure ?', unread: false },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let artisan = null
  if (user) {
    const { data } = await supabase.from('artisans').select('*').eq('id', user.id).single()
    artisan = data
  }

  const artisanName = artisan?.company_name || 'Atelier Martin'
  const trade = artisan?.trade || 'menuisier'
  const tradeLabel = trade === 'menuisier' ? 'Menuisier - Ébéniste'
    : trade === 'plombier' ? 'Plombier'
    : trade === 'electricien' ? 'Électricien'
    : trade === 'macon' ? 'Maçon'
    : trade === 'peintre' ? 'Peintre'
    : 'Artisan'

  return (
    <DashboardLayout artisanName={artisanName} trade={tradeLabel}>
      {/* Header */}
      <div style={{
        height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>
            Bonjour, {artisanName} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Voici un aperçu de votre chatbot.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{
            background: 'none',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '8px 10px',
            cursor: 'pointer',
            color: '#6B7280',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button style={{
            background: 'none',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#374151',
            fontSize: 14,
            fontWeight: 500,
          }}>
            Aide
          </button>
          <Link href="/dashboard/automations" style={{
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>+</span> Nouvelle automation
          </Link>
        </div>
      </div>

      <div style={{ padding: 28, flex: 1 }}>
        {/* KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 28,
        }}>
          <KPICard
            iconBg="#EFF6FF"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }
            label="Conversations"
            value="248"
            change="+12% ce mois-ci"
            changeType="positive"
            sparklineColor="#2563EB"
            sparklineTrend="up"
          />
          <KPICard
            iconBg="#ECFDF5"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            }
            label="Taux de satisfaction"
            value="96%"
            change="+4% ce mois-ci"
            changeType="positive"
            sparklineColor="#10B981"
            sparklineTrend="stable"
          />
          <KPICard
            iconBg="#FEF3C7"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            }
            label="Temps de réponse"
            value="1m 24s"
            change="-20% ce mois-ci"
            changeType="positive"
            sparklineColor="#F59E0B"
            sparklineTrend="down"
          />
          <KPICard
            iconBg="#F5F3FF"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            }
            label="Leads générés"
            value="37"
            change="+18% ce mois-ci"
            changeType="positive"
            sparklineColor="#8B5CF6"
            sparklineTrend="up"
          />
        </div>

        {/* Bottom section: 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Recent Conversations */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Conversations récentes</h2>
              <select style={{
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 13,
                color: '#374151',
                background: '#FFFFFF',
                cursor: 'pointer',
              }}>
                <option>Toutes</option>
                <option>En cours</option>
                <option>Résolues</option>
              </select>
            </div>
            <div>
              {recentConversations.map((conv, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  borderBottom: i < recentConversations.length - 1 ? '1px solid #F3F4F6' : 'none',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: avatarColors[conv.initials] || '#6B7280',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {conv.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{conv.name}</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{conv.time}</span>
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: '#6B7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {conv.preview}
                    </div>
                  </div>
                  {conv.unread && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB' }}>
              <Link href="/dashboard/conversations" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
                Voir toutes les conversations →
              </Link>
            </div>
          </div>

          {/* Live Chat Panel */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Discussion en cours</h2>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#10B981', fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  En ligne
                </span>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 18 }}>⋮</button>
            </div>

            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 380 }}>
              {/* Client bubble */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '80%',
                  background: '#F3F4F6',
                  borderRadius: '12px 12px 2px 12px',
                  padding: '10px 14px',
                }}>
                  <p style={{ fontSize: 13, color: '#111827', margin: 0 }}>Bonjour, j'aimerais un devis pour une étagère sur mesure.</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', textAlign: 'right' }}>11:42</p>
                </div>
              </div>

              {/* Bot bubble */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <div style={{
                  maxWidth: '80%',
                  background: '#EFF6FF',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '10px 14px',
                }}>
                  <p style={{ fontSize: 13, color: '#111827', margin: 0, lineHeight: 1.6 }}>
                    Bonjour Julie ! 👋<br/>
                    Avec plaisir. Pour vous établir un devis précis, j'aurais besoin de quelques informations :<br/>
                    • Dimensions souhaitées (hauteur, largeur, profondeur)<br/>
                    • Type de bois préféré<br/>
                    • Finition (brut, verni, peint, etc.)<br/>
                    • Fixation (murale, sur pied, etc.)<br/>
                    Dites-moi ce qui vous convient !
                  </p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>11:42</p>
                </div>
              </div>

              {/* Client response */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '80%',
                  background: '#F3F4F6',
                  borderRadius: '12px 12px 2px 12px',
                  padding: '10px 14px',
                }}>
                  <p style={{ fontSize: 13, color: '#111827', margin: 0 }}>
                    Hauteur 120cm, largeur 80cm, profondeur 25cm. En chêne massif avec une finition vernie. Fixation murale, s'il vous plaît.
                  </p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', textAlign: 'right' }}>11:44 ✓✓</p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <input
                placeholder="Écrire un message..."
                style={{
                  flex: 1,
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  outline: 'none',
                  color: '#111827',
                }}
              />
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </button>
              <button style={{
                background: '#2563EB',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
