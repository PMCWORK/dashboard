import { SPREADSHEET_ID, API_KEY, YEAR_TAB_PATTERN } from '../config.js'

// Matches things like "02-01-26", "1-2-2026", "25.-04-22" (typo separators),
// "07-07-27" (typo year — corrected later using the tab's real year).
// Deliberately lenient: \D+ swallows any run of non-digit junk between parts.
const DATE_CELL = /^\s*(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})\s*$/

function parseLenientNumber(cell) {
  if (cell === undefined || cell === null) return 0
  const cleaned = String(cell).replace(/[^0-9.\-]/g, '')
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

function isBlank(cell) {
  return cell === undefined || cell === null || String(cell).trim() === ''
}

function expandYear(yearStr) {
  const n = parseInt(yearStr, 10)
  if (yearStr.length <= 2) return 2000 + n
  return n
}

/**
 * Scans a raw 2D grid (array of row arrays, as returned by the Sheets API)
 * for date-shaped cells, and reads the four cells to the right of each as
 * Sale, Profit, Percentage (ignored), Cost. Works regardless of how many
 * month-blocks sit side by side, blank spacer rows, footer/summary rows,
 * or label columns — those never match the date pattern, so they're
 * skipped automatically rather than needing special-case handling.
 *
 * The year comes from the cell itself (expanding 2-digit years), NOT from
 * the tab name — some "year tabs" are actually fiscal-year statements that
 * legitimately start with Nov/Dec of the *previous* calendar year, so
 * forcing the tab's year onto those rows would collide them with real
 * entries later in the same tab and silently overwrite data.
 */
function parseYearGrid(grid) {
  const rows = []
  for (const row of grid) {
    for (let col = 0; col < row.length; col++) {
      const cell = row[col]
      if (typeof cell !== 'string' && typeof cell !== 'number') continue
      const match = DATE_CELL.exec(String(cell))
      if (!match) continue

      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      const year = expandYear(match[3])
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

async function fetchSpreadsheetMeta() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}&fields=sheets.properties.title`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Could not read spreadsheet metadata (status ${res.status}). ${body}`)
  }
  const data = await res.json()
  return (data.sheets || []).map((s) => s.properties.title)
}

async function fetchTabGrid(tabTitle) {
  const range = encodeURIComponent(`'${tabTitle}'`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}&valueRenderOption=UNFORMATTED_VALUE`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Could not read tab "${tabTitle}" (status ${res.status}). ${body}`)
  }
  const data = await res.json()
  return data.values || []
}

export async function fetchAllYears() {
  const allTitles = await fetchSpreadsheetMeta()
  const yearTabs = allTitles.filter((t) => YEAR_TAB_PATTERN.test(t.trim()))

  if (yearTabs.length === 0) {
    throw new Error(
      'No tabs matched a 4-digit year name (e.g. "2026"). Check YEAR_TAB_PATTERN in config.js and your tab names.'
    )
  }

  const results = await Promise.all(
    yearTabs.map(async (title) => {
      const grid = await fetchTabGrid(title)
      return parseYearGrid(grid)
    })
  )

  // Some dates collide across (or within) tabs — usually a typo'd month/year
  // in the source sheet rather than a real second entry for that day. To
  // avoid silently corrupting a real value with a stray one, we keep
  // whichever entry is found first and skip later conflicts, but report
  // how many were skipped so it's visible something needs checking.
  const byDate = new Map()
  const conflicts = []
  for (const row of results.flat()) {
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
