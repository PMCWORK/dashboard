import { fmtCurrency } from '../utils/format.js'

export default function MonthlyTable({ rows }) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.eyebrow}>Ledger by month</span>
        <h2 style={styles.title}>Recent months</h2>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, textAlign: 'left' }}>Month</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Sale</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Profit</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Cost</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Actual profit</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} style={i % 2 === 1 ? styles.rowAlt : undefined}>
              <td style={{ ...styles.td, fontWeight: 500 }}>{r.label}</td>
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {fmtCurrency(r.sale)}
              </td>
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {fmtCurrency(r.profit)}
              </td>
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {fmtCurrency(r.cost)}
              </td>
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--teal)' }}>
                {fmtCurrency(r.actualProfit)}
              </td>
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {r.sale > 0 ? `${((r.profit / r.sale) * 100).toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={styles.td} colSpan={6}>
                No months yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
    color: 'var(--rust)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    fontWeight: 500,
    margin: '4px 0 0',
    color: 'var(--ink)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '0 8px 10px',
    borderBottom: '1px solid var(--ink)',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px dashed var(--parchment-line)',
  },
  rowAlt: {
    background: 'rgba(198,154,59,0.05)',
  },
}
