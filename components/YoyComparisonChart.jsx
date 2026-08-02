import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { fmtCurrency, fmtCompact } from '../utils/format.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      {payload.map(
        (p) =>
          p.value !== null &&
          p.value !== undefined && (
            <div key={p.dataKey} style={styles.tooltipValue}>
              {p.name}: {fmtCurrency(p.value)}
            </div>
          )
      )}
    </div>
  )
}

export default function YoyComparisonChart({ data, thisYearLabel, lastYearLabel }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>Year over year, same point in the year</span>
        <h2 style={styles.title}>
          {thisYearLabel} vs {lastYearLabel}, cumulative sale
        </h2>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
            <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="lastYear"
              name={lastYearLabel}
              stroke="var(--text-muted)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="thisYear"
              name={thisYearLabel}
              stroke="var(--brass-deep)"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
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
    color: 'var(--teal)',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, margin: '4px 0 0', color: 'var(--ink)' },
  tooltip: { background: 'var(--ink)', color: '#fff', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' },
  tooltipLabel: { color: '#b9c0cc', marginBottom: '4px' },
  tooltipValue: { fontWeight: 600, fontSize: '13px' },
}
