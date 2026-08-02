import { useEffect, useMemo, useState, useCallback } from 'react'
import { fetchAllYears } from './utils/fetchSheet.js'
import { REFRESH_INTERVAL_MS } from './config.js'
import KpiStrip from './components/KpiStrip.jsx'
import TrendChart from './components/TrendChart.jsx'
import YearlyChart from './components/YearlyChart.jsx'
import MonthlyTable from './components/MonthlyTable.jsx'

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function aggregate(rows) {
  if (rows.length === 0) {
    return {
      kpis: { totalSale: 0, totalProfit: 0, actualProfit: 0, avgMargin: 0, saleDelta: null, profitDelta: null },
      trend: [],
      yearly: [],
      monthly: [],
    }
  }

  const sorted = [...rows].sort((a, b) => a.date - b.date)
  const lastDate = sorted[sorted.length - 1].date
  const cutoff7 = new Date(lastDate)
  cutoff7.setUTCDate(cutoff7.getUTCDate() - 7)
  const cutoff14 = new Date(lastDate)
  cutoff14.setUTCDate(cutoff14.getUTCDate() - 14)

  const recent = rows.filter((r) => r.date > cutoff7)
  const prior = rows.filter((r) => r.date <= cutoff7 && r.date > cutoff14)

  const sum = (arr, key) => arr.reduce((acc, r) => acc + r[key], 0)
  const pctDelta = (curr, prev) => (prev === 0 ? null : ((curr - prev) / prev) * 100)

  const totalSale = sum(rows, 'sale')
  const totalProfit = sum(rows, 'profit')
  const totalCost = sum(rows, 'cost')

  // ── Trend: last 30 recorded days ──────────────────────────────────────
  const trend = sorted.slice(-30).map((r) => ({
    label: r.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    sale: r.sale,
    profit: r.profit,
  }))

  // ── Yearly rollup ──────────────────────────────────────────────────────
  const byYearMap = new Map()
  for (const r of rows) {
    const y = r.date.getUTCFullYear()
    const existing = byYearMap.get(y) || { year: String(y), sale: 0, profit: 0, cost: 0 }
    existing.sale += r.sale
    existing.profit += r.profit
    existing.cost += r.cost
    byYearMap.set(y, existing)
  }
  const yearly = [...byYearMap.values()].sort((a, b) => a.year.localeCompare(b.year))

  // ── Monthly rollup (most recent first, for the table) ──────────────────
  const byMonthMap = new Map()
  for (const r of rows) {
    const key = monthKey(r.date)
    const existing = byMonthMap.get(key) || {
      key,
      label: r.date.toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      sale: 0,
      profit: 0,
      cost: 0,
    }
    existing.sale += r.sale
    existing.profit += r.profit
    existing.cost += r.cost
    byMonthMap.set(key, existing)
  }
  const monthly = [...byMonthMap.values()]
    .map((m) => ({ ...m, actualProfit: m.profit - m.cost }))
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 12)

  return {
    kpis: {
      totalSale,
      totalProfit,
      actualProfit: totalProfit - totalCost,
      avgMargin: totalSale > 0 ? (totalProfit / totalSale) * 100 : 0,
      saleDelta: pctDelta(sum(recent, 'sale'), sum(prior, 'sale')),
      profitDelta: pctDelta(sum(recent, 'profit'), sum(prior, 'profit')),
    },
    trend,
    yearly,
    monthly,
  }
}

export default function App() {
  const [rows, setRows] = useState([])
  const [conflictCount, setConflictCount] = useState(0)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('')
  const [lastSynced, setLastSynced] = useState(null)

  const load = useCallback(async () => {
    try {
      const { rows: data, conflictCount: conflicts } = await fetchAllYears()
      setRows(data)
      setConflictCount(conflicts)
      setLastSynced(new Date())
      setStatus('ready')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong loading the sheet.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  const { kpis, trend, yearly, monthly } = useMemo(() => aggregate(rows), [rows])

  return (
    <div style={styles.page}>
      <header className="masthead" style={styles.masthead}>
        <div>
          <div style={styles.eyebrow}>Sales Ledger</div>
          <h1 style={styles.h1}>Daily Sales Dashboard</h1>
        </div>
        <div style={styles.stamp}>
          <div style={styles.stampInner}>
            <span style={styles.stampDot(status)} />
            <div style={styles.stampText}>
              {status === 'loading' && 'SYNCING…'}
              {status === 'error' && 'SYNC FAILED'}
              {status === 'ready' && 'LIVE'}
            </div>
            <div style={styles.stampTime}>
              {lastSynced
                ? lastSynced.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </div>
          </div>
        </div>
      </header>

      <div className="tear-edge" />

      <main style={styles.main}>
        {status === 'error' && (
          <div style={styles.errorBox}>
            <strong>Couldn't load the sheet.</strong> {errorMsg}
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              Check <code>SPREADSHEET_ID</code> and <code>API_KEY</code> in <code>src/config.js</code>,
              and that the sheet is shared as "Anyone with the link — Viewer."
            </div>
          </div>
        )}

        {status === 'loading' && rows.length === 0 && (
          <div style={styles.loadingBox}>Loading the ledger…</div>
        )}

        {rows.length > 0 && (
          <>
            <KpiStrip kpis={kpis} />

            <div className="grid2">
              <TrendChart data={trend} />
              <YearlyChart data={yearly} />
            </div>

            <MonthlyTable rows={monthly} />
          </>
        )}
      </main>

      <footer style={styles.footer}>
        Pulled directly from Google Sheets · refreshes automatically every{' '}
        {Math.round(REFRESH_INTERVAL_MS / 60000)} min
        {conflictCount > 0 && (
          <span style={{ color: 'var(--rust)' }}>
            {' '}
            · {conflictCount} date conflict{conflictCount > 1 ? 's' : ''} found (check console)
          </span>
        )}
      </footer>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 24px 60px',
  },
  masthead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '48px 0 24px',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--brass-deep)',
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontSize: '38px',
    fontWeight: 600,
    margin: '4px 0 0',
    color: 'var(--ink)',
  },
  stamp: {
    width: '92px',
    height: '92px',
    borderRadius: '50%',
    border: '2px solid var(--brass-deep)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-8deg)',
    flexShrink: 0,
  },
  stampInner: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    border: '1px dashed var(--brass-deep)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
  },
  stampDot: (status) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: status === 'ready' ? 'var(--teal)' : status === 'error' ? 'var(--rust)' : 'var(--brass-deep)',
    marginBottom: '2px',
  }),
  stampText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--ink)',
  },
  stampTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingTop: '24px',
  },
  errorBox: {
    background: '#fdf1ee',
    border: '1px solid var(--rust)',
    color: '#5a2318',
    padding: '16px 20px',
    fontSize: '14px',
  },
  loadingBox: {
    padding: '60px 0',
    textAlign: 'center',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  footer: {
    marginTop: '40px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
}
