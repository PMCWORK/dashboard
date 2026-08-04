import { fmtCurrency } from '../utils/format.js'

const LEVEL_COLORS = ['#efe6d3', '#dfc888', '#c69a3b', '#a87c24', '#7a5a15']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function CalendarHeatmap({ weeks, year }) {
  // Figure out which week-column each month label should sit above,
  // based on the first cell of that month found scanning left to right.
  const monthTicks = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstReal = week.find((c) => c !== null)
    if (!firstReal) return
    const m = new Date(firstReal.date).getUTCMonth()
    if (m !== lastMonth) {
      monthTicks.push({ wi, label: MONTH_LABELS[m] })
      lastMonth = m
    }
  })

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>Daily pattern</span>
        <h2 style={styles.title}>{year} at a glance</h2>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ position: 'relative', marginBottom: '4px', height: '14px', minWidth: weeks.length * 13 }}>
          {monthTicks.map((t) => (
            <span key={t.wi} style={{ ...styles.monthLabel, left: `${t.wi * 13}px` }}>
              {t.label}
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 11px)', gap: '2px', minWidth: weeks.length * 13 }}>
          {weeks.map((week, wi) =>
            week.map((cell, di) => (
              <div
                key={`${wi}-${di}`}
                title={cell ? `${cell.date}: ${cell.sale === null ? 'no data' : fmtCurrency(cell.sale)}` : ''}
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '2px',
                  background: !cell || cell.level === -1 ? 'var(--parchment-line)' : LEVEL_COLORS[cell.level],
                }}
              />
            ))
          )}
        </div>
      </div>
      <div style={styles.legend}>
        <span>Less</span>
        {LEVEL_COLORS.map((c) => (
          <div key={c} style={{ width: '11px', height: '11px', borderRadius: '2px', background: c }} />
        ))}
        <span>More</span>
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
    color: 'var(--rust)',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, margin: '4px 0 0', color: 'var(--ink)' },
  monthLabel: {
    position: 'absolute',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '10px',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
}
