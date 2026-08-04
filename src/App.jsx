import { useEffect, useMemo, useState, useCallback } from 'react'
import { fetchAllYears } from './utils/fetchSheet.js'
import { REFRESH_INTERVAL_MS } from './config.js'
import KpiStrip from './components/KpiStrip.jsx'
import TrendChart from './components/TrendChart.jsx'
import YearlyChart from './components/YearlyChart.jsx'
import MonthlyTable from './components/MonthlyTable.jsx'
import MarginTrendChart from './components/MarginTrendChart.jsx'
import DayOfWeekChart from './components/DayOfWeekChart.jsx'
import CalendarHeatmap from './components/CalendarHeatmap.jsx'
import CumulativeChart from './components/CumulativeChart.jsx'
import YoyComparisonChart from './components/YoyComparisonChart.jsx'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MS_PER_DAY = 86400000

// Picks the "current" year defensively: the latest calendar year that has
// at least a handful of rows, rather than blindly trusting whatever year
// the single latest date falls in. This stops one stray/mistyped future
// date (a typo like "...-27" instead of "...-22") from hijacking the
// This Year KPIs, heatmap, and YoY comparison.
const MIN_ROWS_FOR_CURRENT_YEAR = 5

function pickCurrentYear(rows) {
  const countsByYear = new Map()
  for (const r of rows) {
    const y = r.date.getUTCFullYear()
    countsByYear.set(y, (countsByYear.get(y) || 0) + 1)
  }
  const years = [...countsByYear.keys()].sort((a, b) => b - a)
  for (const y of years) {
    if (countsByYear.get(y) >= MIN_ROWS_FOR_CURRENT_YEAR) return y
  }
  return years[0]
}

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function dayOfYear(d) {
  return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / MS_PER_DAY) + 1
}

function yearTotals(rows) {
  const totalSale = rows.reduce((a, r) => a + r.sale, 0)
  const totalProfit = rows.reduce((a, r) => a + r.profit, 0)
  const totalCost = rows.reduce((a, r) => a + r.cost, 0)
  return {
    totalSale,
    totalProfit,
    actualProfit: totalProfit - totalCost,
    avgMargin: totalSale > 0 ? (totalProfit / totalSale) * 100 : 0,
  }
}

function buildHeatmapWeeks(rows, year) {
  const byDate = new Map(
    rows.filter((r) => r.date.getUTCFullYear() === year).map((r) => [r.date.toISOString().slice(0, 10), r.sale])
  )
  const maxSale = Math.max(0, ...byDate.values())
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  const cells = []
  for (let i = 0; i < start.getUTCDay(); i++) cells.push(null)
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + MS_PER_DAY)) {
    const key = d.toISOString().slice(0, 10)
    const hasEntry = byDate.has(key)
    const sale = hasEntry ? byDate.get(key) : null
    const level = !hasEntry ? -1 : maxSale > 0 ? Math.min(4, Math.floor((sale / maxSale) * 4)) : 0
    cells.push({ date: key, sale, level })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

function buildYoyData(rows, curYear, prevYear) {
  const cumByDoY = (year) => {
    const map = new Map()
    let running = 0
    rows
      .filter((r) => r.date.getUTCFullYear() === year)
      .sort((a, b) => a.date - b.date)
      .forEach((r) => {
        running += r.sale
        map.set(dayOfYear(r.date), running)
      })
    return map
  }
  const curMap = cumByDoY(curYear)
  const prevMap = cumByDoY(prevYear)
  const maxDoyCur = curMap.size ? Math.max(...curMap.keys()) : 0
  const maxDoy = Math.max(maxDoyCur, prevMap.size ? Math.max(...prevMap.keys()) : 0, 1)

  const arr = []
  let lastCur = 0
  let lastPrev = null
  for (let doy = 1; doy <= maxDoy; doy++) {
    if (curMap.has(doy)) lastCur = curMap.get(doy)
    if (prevMap.has(doy)) lastPrev = prevMap.get(doy)
    const labelDate = new Date(Date.UTC(curYear, 0, 1) + (doy - 1) * MS_PER_DAY)
    arr.push({
      label: labelDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      thisYear: doy <= maxDoyCur ? lastCur : null,
      lastYear: lastPrev,
    })
  }
  return arr
}

function aggregate(rows) {
  if (rows.length === 0) {
    return {
      kpis: { totalSale: 0, totalProfit: 0, actualProfit: 0, avgMargin: 0, saleDelta: null, profitDelta: null },
      thisYearKpis: { totalSale: 0, totalProfit: 0, actualProfit: 0, avgMargin: 0 },
      currentYear: new Date().getFullYear(),
      trend: [],
      yearly: [],
      monthly: [],
      marginTrend: [],
      dayOfWeek: [],
      heatmapWeeks: [],
      cumulative: [],
      yoy: [],
    }
  }

  const sorted = [...rows].sort((a, b) => a.date - b.date)
  const lastDate = sorted[sorted.length - 1].date
  const currentYear = pickCurrentYear(rows)
  const previousYear = currentYear - 1

  const cutoff7 = new Date(lastDate)
  cutoff7.setUTCDate(cutoff7.getUTCDate() - 7)
  const cutoff14 = new Date(lastDate)
  cutoff14.setUTCDate(cutoff14.getUTCDate() - 14)
  const recent = rows.filter((r) => r.date > cutoff7)
  const prior = rows.filter((r) => r.date <= cutoff7 && r.date > cutoff14)
  const sum = (arr, key) => arr.reduce((acc, r) => acc + r[key], 0)
  const pctDelta = (curr, prev) => (prev === 0 ? null : ((curr - prev) / prev) * 100)

  const allTime = yearTotals(rows)
  const thisYearKpis = yearTotals(rows.filter((r) => r.date.getUTCFullYear() === currentYear))

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

  // ── Monthly rollup ───────────────────────────────────────────────────────
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
  const monthArrAsc = [...byMonthMap.values()].sort((a, b) => a.key.localeCompare(b.key))
  const monthly = [...monthArrAsc].reverse().map((m) => ({ ...m, actualProfit: m.profit - m.cost })).slice(0, 12)
  const marginTrend = monthArrAsc.slice(-12).map((m) => ({
    label: m.label,
    margin: m.sale > 0 ? (m.profit / m.sale) * 100 : 0,
  }))

  // ── Day-of-week averages ─────────────────────────────────────────────────
  const dowSums = Array(7).fill(0)
  const dowCounts = Array(7).fill(0)
  for (const r of rows) {
    const idx = r.date.getUTCDay()
    dowSums[idx] += r.sale
    dowCounts[idx]++
  }
  const dayOfWeek = WEEKDAY_LABELS.map((label, i) => ({
    label,
    avgSale: dowCounts[i] ? dowSums[i] / dowCounts[i] : 0,
  }))

  // ── Calendar heatmap for the current year ───────────────────────────────
  const heatmapWeeks = buildHeatmapWeeks(rows, currentYear)

  // ── Cumulative running total, current year ──────────────────────────────
  let running = 0
  const cumulative = rows
    .filter((r) => r.date.getUTCFullYear() === currentYear)
    .sort((a, b) => a.date - b.date)
    .map((r) => {
      running += r.sale
      return {
        label: r.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        cumulative: running,
      }
    })

  // ── Year-over-year comparison ────────────────────────────────────────────
  const yoy = buildYoyData(rows, currentYear, previousYear)

  return {
    kpis: {
      ...allTime,
      saleDelta: pctDelta(sum(recent, 'sale'), sum(prior, 'sale')),
      profitDelta: pctDelta(sum(recent, 'profit'), sum(prior, 'profit')),
    },
    thisYearKpis,
    currentYear,
    previousYear,
    trend,
    yearly,
    monthly,
    marginTrend,
    dayOfWeek,
    heatmapWeeks,
    cumulative,
    yoy,
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

  const { kpis, thisYearKpis, currentYear, previousYear, trend, yearly, monthly, marginTrend, dayOfWeek, heatmapWeeks, cumulative, yoy } =
    useMemo(() => aggregate(rows), [rows])

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
              Check <code>APPS_SCRIPT_URL</code> in <code>src/config.js</code>, and that the Apps
              Script is deployed with access set to "Anyone."
            </div>
          </div>
        )}

        {status === 'loading' && rows.length === 0 && (
          <div style={styles.loadingBox}>Loading the ledger…</div>
        )}

        {rows.length > 0 && (
          <>
            <KpiStrip kpis={kpis} thisYear={thisYearKpis} currentYearLabel={currentYear} />

            <div className="grid2">
              <TrendChart data={trend} />
              <YearlyChart data={yearly} />
            </div>

            <div className="grid2">
              <MarginTrendChart data={marginTrend} />
              <DayOfWeekChart data={dayOfWeek} />
            </div>

            <CalendarHeatmap weeks={heatmapWeeks} year={currentYear} />

            <div className="grid2">
              <CumulativeChart data={cumulative} year={currentYear} />
              <YoyComparisonChart data={yoy} thisYearLabel={String(currentYear)} lastYearLabel={String(previousYear)} />
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
