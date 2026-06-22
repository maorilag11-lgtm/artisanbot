import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/server'
import { listEvents } from '@/lib/google-calendar/client'

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let events: Array<{ id?: string; summary: string; start: { dateTime: string }; end: { dateTime: string } }> = []
  let calendarError = false

  if (user) {
    const { data: artisan } = await supabase
      .from('artisans')
      .select('google_refresh_token, google_calendar_id')
      .eq('id', user.id)
      .single()

    if (artisan?.google_refresh_token) {
      try {
        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        events = await listEvents(
          artisan.google_refresh_token,
          artisan.google_calendar_id || 'primary',
          now.toISOString(),
          nextWeek.toISOString()
        )
      } catch {
        calendarError = true
      }
    }
  }

  return (
    <DashboardLayout>
      <div style={{ height: 64, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Planning</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Vos rendez-vous Google Calendar.</p>
        </div>
        <button style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          + Nouveau rendez-vous
        </button>
      </div>

      <div style={{ padding: 28 }}>
        {calendarError && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
            ⚠️ Impossible de charger Google Calendar. Vérifiez votre connexion dans les paramètres.
          </div>
        )}

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Prochains rendez-vous (7 jours)</h2>
          </div>
          {events.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                {calendarError ? 'Google Calendar non connecté' : 'Aucun rendez-vous cette semaine'}
              </div>
              <p style={{ fontSize: 13 }}>
                {calendarError
                  ? 'Connectez votre Google Calendar dans les paramètres pour voir vos rendez-vous ici.'
                  : 'Les rendez-vous créés via l\'assistant ou le chatbot apparaîtront ici.'}
              </p>
            </div>
          ) : (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map((event, i) => {
                const start = new Date(event.start.dateTime)
                const end = new Date(event.end.dateTime)
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    background: '#F9FAFB',
                  }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600, textTransform: 'uppercase' }}>
                        {start.toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                        {start.getDate()}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{event.summary}</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>
                        {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#059669' }}>
                      Confirmé
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
