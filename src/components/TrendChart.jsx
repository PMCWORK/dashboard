import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const fmtCurrency = (n) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

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

export default function TrendChart({ data }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>Daily ledger</span>
        <h2 style={styles.title}>Sale &amp; profit, last 30 recorded days</h2>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
              width={60}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="sale"
              name="Sale"
              stroke="var(--brass-deep)"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: 'var(--brass-deep)' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="var(--teal)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: 'var(--teal)' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
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
    color: 'var(--brass-deep)',
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
