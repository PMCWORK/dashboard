// Bangladeshi Taka formatting with South Asian lakh/crore digit grouping
// (e.g. 1234567 -> ৳12,34,567 instead of ৳1,234,567).
export function fmtCurrency(n) {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  return `${sign}৳${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function fmtCompact(n) {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 10000000) return `${sign}৳${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 100000) return `${sign}৳${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}৳${(abs / 1000).toFixed(0)}k`
  return `${sign}৳${abs.toFixed(0)}`
}

export function fmtPercent(n) {
  return `${n.toFixed(1)}%`
}
