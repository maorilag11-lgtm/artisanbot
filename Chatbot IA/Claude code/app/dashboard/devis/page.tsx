import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const statusConfig = {
  draft: { label: 'Brouillon', bg: '#F3F4F6', color: '#6B7280' },
  sent: { label: 'Envoyé', bg: '#EFF6FF', color: '#2563EB' },
  accepted: { label: 'Accepté', bg: '#ECFDF5', color: '#059669' },
  rejected: { label: 'Refusé', bg: '#FEF2F2', color: '#DC2626' },
}

export default async function DevisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let quotes: Array<{
    id: string
    amount: number
    status: string
    created_at: string
    clients: { name: string | null; email: string | null } | null
  }> = []

  if (user) {
    const { data } = await supabase
      .from('quotes')
      .select('id, amount, status, created_at, clients(name, email)')
      .eq('artisan_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    quotes = (data || []) as typeof quotes
  }

  const totalAmount = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.amount, 0)
  const sentCount = quotes.filter(q => q.status === 'sent').length
  const acceptedCount = quotes.filter(q => q.status === 'accepted').length
  const draftCount = quotes.filter(q => q.status === 'draft').length

  return (
    <DashboardLayout>
      <div style={{ height: 64, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Devis</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Gérez vos devis et brouillons.</p>
        </div>
        <button style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          + Nouveau devis
        </button>
      </div>

      <div style={{ padding: 28 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'CA accepté', value: `${totalAmount.toLocaleString('fr-FR')} €`, color: '#10B981', bg: '#ECFDF5' },
            { label: 'Devis envoyés', value: sentCount.toString(), color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Devis acceptés', value: acceptedCount.toString(), color: '#059669', bg: '#ECFDF5' },
            { label: 'Brouillons', value: draftCount.toString(), color: '#6B7280', bg: '#F3F4F6' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Tous les devis</h2>
          </div>
          {quotes.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Aucun devis pour l'instant</div>
              <p style={{ fontSize: 13 }}>Les devis créés via le chatbot, le formulaire public ou manuellement apparaîtront ici.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Client', 'Montant', 'Statut', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => {
                  const status = statusConfig[q.status as keyof typeof statusConfig] || statusConfig.draft
                  return (
                    <tr key={q.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{q.clients?.name || 'Client inconnu'}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{q.clients?.email || ''}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                        {q.amount.toLocaleString('fr-FR')} €
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>
                        {new Date(q.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ padding: '4px 10px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#FFFFFF', color: '#374151', fontSize: 12, cursor: 'pointer' }}>Voir</button>
                          {q.status === 'draft' && (
                            <button style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', fontSize: 12, cursor: 'pointer' }}>Envoyer</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
