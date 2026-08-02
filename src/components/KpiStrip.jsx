import { fmtCurrency, fmtPercent } from '../utils/format.js'

function Tab({ label, value, delta }) {
  const positive = delta === null || delta === undefined ? null : delta >= 0
  return (
    <div style={styles.tab}>
      <div style={styles.tabLabel}>{label}</div>
      <div style={styles.tabValue}>{value}</div>
      {delta !== null && delta !== undefined && (
        <div style={{ ...styles.tabDelta, color: positive ? 'var(--teal)' : 'var(--rust)' }}>
          {positive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs prior period
        </div>
      )}
    </div>
  )
}

function Strip({ tabs }) {
  return (
    <div style={styles.strip}>
      {tabs.map((t) => (
        <Tab key={t.label} {...t} />
      ))}
    </div>
  )
}

export default function KpiStrip({ kpis, thisYear, currentYearLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <div style={styles.sectionLabel}>This year ({currentYearLabel})</div>
        <Strip
          tabs={[
            { label: 'Sale', value: fmtCurrency(thisYear.totalSale), delta: null },
            { label: 'Profit', value: fmtCurrency(thisYear.totalProfit), delta: null },
            { label: 'Actual profit', value: fmtCurrency(thisYear.actualProfit), delta: null },
            { label: 'Margin', value: fmtPercent(thisYear.avgMargin), delta: null },
          ]}
        />
      </div>
      <div>
        <div style={styles.sectionLabel}>All-time</div>
        <Strip
          tabs={[
            { label: 'Total sale', value: fmtCurrency(kpis.totalSale), delta: kpis.saleDelta },
            { label: 'Total profit', value: fmtCurrency(kpis.totalProfit), delta: kpis.profitDelta },
            { label: 'Actual profit', value: fmtCurrency(kpis.actualProfit), delta: null },
            { label: 'Avg. margin', value: fmtPercent(kpis.avgMargin), delta: null },
          ]}
        />
      </div>
    </div>
  )
}

const styles = {
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--brass-deep)',
    marginBottom: '6px',
    paddingLeft: '2px',
  },
  strip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2px',
    background: 'var(--parchment-line)',
    border: '1px solid var(--parchment-line)',
  },
  tab: {
    background: 'var(--parchment)',
    padding: '20px 22px',
    position: 'relative',
  },
  tabLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  tabValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--ink)',
    lineHeight: 1.1,
  },
  tabDelta: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    marginTop: '8px',
  },
}
