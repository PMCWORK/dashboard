import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { fmtCurrency, fmtCompact } from '../utils/format.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={styles.tooltipValue}>
          {p.name}: {fmtCurrency(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function YearlyChart({ data }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>Year over year</span>
        <h2 style={styles.title}>Sale &amp; profit by year</h2>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--parchment-line)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fill: '#26241d' }}
              axisLine={{ stroke: 'var(--parchment-line)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6b6455' }}
              axisLine={false}
              tickLine={false}
              width={60}
              tickFormatter={(v) => fmtCompact(v)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(198,154,59,0.08)' }} />
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
            <Bar dataKey="sale" name="Sale" fill="var(--brass-deep)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="profit" name="Profit" fill="var(--teal)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const styles = {
  panel: {
    background: '#fffdf9',
    border: '1px solid var(--parchment-line)',
    padding: '24px',
  },
  header: { marginBottom: '16px' },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--teal)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    fontWeight: 500,
    margin: '4px 0 0',
    color: 'var(--ink)',
  },
  tooltip: {
    background: 'var(--ink)',
    color: '#fff',
    padding: '8px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
  },
  tooltipLabel: { color: '#b9c0cc', marginBottom: '4px' },
  tooltipValue: { fontWeight: 600, fontSize: '13px' },
}
