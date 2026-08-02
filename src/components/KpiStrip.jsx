const fmtCurrency = (n) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

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

export default function KpiStrip({ kpis }) {
  return (
    <div style={styles.strip}>
      <Tab label="Total sale" value={fmtCurrency(kpis.totalSale)} delta={kpis.saleDelta} />
      <Tab label="Total profit" value={fmtCurrency(kpis.totalProfit)} delta={kpis.profitDelta} />
      <Tab label="Actual profit" value={fmtCurrency(kpis.actualProfit)} delta={null} />
      <Tab label="Avg. margin" value={`${kpis.avgMargin.toFixed(1)}%`} delta={null} />
    </div>
  )
}

const styles = {
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
    fontSize: '30px',
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
