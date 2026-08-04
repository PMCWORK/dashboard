import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fmtCurrency, fmtCompact } from '../utils/format.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      <div style={styles.tooltipValue}>{fmtCurrency(payload[0].value)} so far</div>
    </div>
  )
}

export default function CumulativeChart({ data, year }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>Running total</span>
        <h2 style={styles.title}>Cumulative sale, {year}</h2>
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brass-deep)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--brass-deep)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--parchment-line)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fill: '#6b6455' }}
              axisLine={{ stroke: 'var(--parchment-line)' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              tick={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#6b6455' }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v) => fmtCompact(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="cumulative" stroke="var(--brass-deep)" strokeWidth={2} fill="url(#cumulativeFill)" />
          </AreaChart>
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
