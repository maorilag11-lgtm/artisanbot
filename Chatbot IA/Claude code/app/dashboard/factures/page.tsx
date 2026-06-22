import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/server'

const statusConfig = {
  pending: { label: 'En attente', bg: '#FEF3C7', color: '#D97706' },
  paid: { label: 'Payée', bg: '#ECFDF5', color: '#059669' },
  overdue: { label: 'En retard', bg: '#FEF2F2', color: '#DC2626' },
}

export default async function FacturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let invoices: Array<{
    id: string
    amount: number
    status: string
    due_date: string
    created_at: string
    clients: { name: string | null; email: string | null } | null
  }> = []

  if (user) {
    const { data } = await supabase
      .from('invoices')
      .select('id, amount, status, due_date, created_at, clients(name, email)')
      .eq('artisan_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    invoices = (data || []) as typeof invoices
  }

  const totalPending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  return (
    <DashboardLayout>
      <div style={{ height: 64, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>Factures</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Gérez vos factures et suivez les paiements.</p>
        </div>
        <button style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          + Nouvelle facture
        </button>
      </div>

      <div style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'À encaisser', value: `${totalPending.toLocaleString('fr-FR')} €`, color: '#F59E0B', bg: '#FEF3C7' },
            { label: 'Factures payées', value: paidCount.toString(), color: '#059669', bg: '#ECFDF5' },
            { label: 'En retard', value: overdueCount.toString(), color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Total factures', value: invoices.length.toString(), color: '#6B7280', bg: '#F3F4F6' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Toutes les factures</h2>
          </div>
          {invoices.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Aucune facture pour l'instant</div>
              <p style={{ fontSize: 13 }}>Créez une facture depuis un devis accepté ou manuellement.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Client', 'Montant', 'Échéance', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const status = statusConfig[inv.status as keyof typeof statusConfig] || statusConfig.pending
                  return (
                    <tr key={inv.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{inv.clients?.name || 'Client inconnu'}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{inv.clients?.email || ''}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                        {inv.amount.toLocaleString('fr-FR')} €
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: inv.status === 'overdue' ? '#DC2626' : '#6B7280' }}>
                        {new Date(inv.due_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ padding: '4px 10px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#FFFFFF', color: '#374151', fontSize: 12, cursor: 'pointer' }}>Voir</button>
                          {(inv.status === 'pending' || inv.status === 'overdue') && (
                            <button style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#F59E0B', color: '#FFFFFF', fontSize: 12, cursor: 'pointer' }}>Relancer</button>
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
