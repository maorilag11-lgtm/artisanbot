interface SparklineProps {
  color: string
  trend: 'up' | 'down' | 'stable'
}

function Sparkline({ color, trend }: SparklineProps) {
  const points = trend === 'up'
    ? '0,35 20,28 40,30 60,20 80,22 100,12 120,8'
    : trend === 'down'
    ? '0,10 20,14 40,12 60,18 80,16 100,22 120,28'
    : '0,20 20,18 40,22 60,19 80,21 100,18 120,20'

  return (
    <svg width="120" height="40" viewBox="0 0 120 40" fill="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,40 ${points} 120,40`}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
    </svg>
  )
}

interface KPICardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  sparklineColor: string
  sparklineTrend: 'up' | 'down' | 'stable'
}

export function KPICard({
  icon,
  iconBg,
  label,
  value,
  change,
  changeType,
  sparklineColor,
  sparklineTrend,
}: KPICardProps) {
  const changeColor = changeType === 'positive' ? '#10B981' : changeType === 'negative' ? '#EF4444' : '#6B7280'

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      padding: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: changeColor, marginBottom: 12 }}>{change}</div>
      <Sparkline color={sparklineColor} trend={sparklineTrend} />
    </div>
  )
}
