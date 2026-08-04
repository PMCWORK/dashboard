import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { fmtCurrency, fmtCompact } from '../utils/format.js'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{p.label}</div>
      <div style={styles.tooltipValue}>Avg {fmtCurrency(p.avgSale)}</div>
    </div>
  )
}

export default function DayOfWeekChart({ data }) {
  const maxIdx = data.reduce((best, d, i) => (d.avgSale > data[best].avgSale ? i : best), 0)
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>By weekday</span>
        <h2 style={styles.title}>Average sale by day of week</h2>
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--parchment-line)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6b6455' }}
              axisLine={{ stroke: 'var(--parchment-line)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6b6455' }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v) => fmtCompact(v)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(198,154,59,0.08)' }} />
            <Bar dataKey="avgSale" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={i === maxIdx ? 'var(--brass-deep)' : 'var(--parchment-line)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const styles = {
  panel: { background: '#fffdf9', border: '1px solid var(--parchment-line)', padding: '24px' },
  header: { marginBottom: '16px' },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--brass-deep)',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, margin: '4px 0 0', color: 'var(--ink)' },
  tooltip: { background: 'var(--ink)', color: '#fff', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' },
  tooltipLabel: { color: '#b9c0cc', marginBottom: '4px' },
  tooltipValue: { fontWeight: 600, fontSize: '13px' },
}
