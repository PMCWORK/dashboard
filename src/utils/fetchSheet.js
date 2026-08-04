import { APPS_SCRIPT_URL, YEAR_TAB_PATTERN } from '../config.js'

// Text-format dates like "02-01-26", "1-2-2026", "25.-04-22" (typo separators).
const TEXT_DATE = /^\s*(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})\s*$/
// ISO datetime strings — what Apps Script's getValues() produces (after JSON
// serialization) if the sheet's Date column is a real Date-typed cell rather
// than plain text, e.g. "2026-01-02T00:00:00.000Z".
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})T/

function expandYear(yearStr) {
  const n = parseInt(yearStr, 10)
  if (yearStr.length <= 2) return 2000 + n
  return n
}

/**
 * Reads a single cell and, if it looks like a date in either the ISO form
 * (real Date-typed cells, serialized by Apps Script/JSON) or the DD-MM-YY
 * text form (plain-text cells), returns {day, month, year}. Otherwise null.
 */
function parseDateCell(cell) {
  if (typeof cell !== 'string' && typeof cell !== 'number') return null
  const str = String(cell)

  const iso = ISO_DATE.exec(str)
  if (iso) {
    return { year: parseInt(iso[1], 10), month: parseInt(iso[2], 10), day: parseInt(iso[3], 10) }
  }

  const text = TEXT_DATE.exec(str)
  if (text) {
    const day = parseInt(text[1], 10)
    const month = parseInt(text[2], 10)
    const year = expandYear(text[3])
    return { day, month, year }
  }

  return null
}

function parseLenientNumber(cell) {
  if (cell === undefined || cell === null) return 0
  if (typeof cell === 'number') return cell
  const cleaned = String(cell).replace(/[^0-9.\-]/g, '')
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

function isBlank(cell) {
  return cell === undefined || cell === null || String(cell).trim() === ''
}

/**
 * Scans a raw 2D grid (array of row arrays, as returned by Apps Script's
 * getValues()) for date-shaped cells, and reads the four cells to the right
 * of each as Sale, Profit, Percentage (ignored), Cost. Works regardless of
 * how many month-blocks sit side by side, blank spacer rows, footer/summary
 * rows, or label columns — those never match either date pattern, so
 * they're skipped automatically rather than needing special-case handling.
 *
 * The year comes from the cell itself, NOT the tab name — some "year tabs"
 * are actually fiscal-year statements that legitimately start with Nov/Dec
 * of the previous calendar year, so forcing the tab's year onto those rows
 * would collide them with real entries later in the same tab.
 */
function parseYearGrid(grid) {
  const rows = []
  for (const row of grid) {
    for (let col = 0; col < row.length; col++) {
      const parsed = parseDateCell(row[col])
      if (!parsed) continue
      const { day, month, year } = parsed
      if (day < 1 || day > 31 || month < 1 || month > 12) continue

      const saleCell = row[col + 1]
      // Fully blank Sale means "this day hasn't happened yet" — skip entirely,
      // don't count it as a zero-sales day.
      if (isBlank(saleCell)) continue

      const sale = parseLenientNumber(saleCell)
      const profit = parseLenientNumber(row[col + 2])
      const cost = parseLenientNumber(row[col + 4])

      const date = new Date(Date.UTC(year, month - 1, day))
      if (Number.isNaN(date.getTime())) continue

      rows.push({ date, sale, profit, cost })
    }
  }
  return rows
}

async function fetchPayload() {
  const res = await fetch(APPS_SCRIPT_URL)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Could not reach the Apps Script endpoint (status ${res.status}). ${body}`)
  }
  return res.json()
}

export async function fetchAllYears() {
  const payload = await fetchPayload()
  const allSheets = payload.sheets || []
  const yearSheets = allSheets.filter((s) => YEAR_TAB_PATTERN.test((s.title || '').trim()))

  if (yearSheets.length === 0) {
    throw new Error(
      'No tabs matched a 4-digit year name (e.g. "2026"). Check YEAR_TAB_PATTERN in config.js and your tab names.'
    )
  }

  const parsedPerSheet = yearSheets.map((s) => parseYearGrid(s.values || []))

  // Some dates collide across (or within) tabs — usually a typo'd month/year
  // in the source sheet rather than a real second entry for that day. To
  // avoid silently corrupting a real value with a stray one, we keep
  // whichever entry is found first and skip later conflicts, but report
  // how many were skipped so it's visible something needs checking.
  const byDate = new Map()
  const conflicts = []
  for (const row of parsedPerSheet.flat()) {
    const key = row.date.toISOString().slice(0, 10)
    if (byDate.has(key)) {
      conflicts.push(key)
      continue
    }
    byDate.set(key, row)
  }

  if (conflicts.length > 0) {
    console.warn(
      `Sales Ledger: ${conflicts.length} date conflict(s) found (likely typo'd dates in the sheet) — kept the first value for each, skipped the rest:`,
      conflicts
    )
  }

  return {
    rows: [...byDate.values()].sort((a, b) => a.date - b.date),
    conflictCount: conflicts.length,
  }
}
