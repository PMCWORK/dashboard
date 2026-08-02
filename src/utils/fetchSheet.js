import { SPREADSHEET_ID, API_KEY, APPS_SCRIPT_URL, YEAR_TAB_PATTERN } from '../config.js'

// Matches things like "02-01-26", "1-2-2026", "25.-04-22" (typo separators),
// "07-07-27" (typo year — corrected later using the tab's real year).
const DATE_CELL = /^\s*(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})\s*$/

// Matches ISO formatted date string from Apps Script JSON like "2026-01-02T00:00:00.000Z"
const ISO_DATE_CELL = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?\s*$/

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

function parseYearGrid(grid) {
  const rows = []
  for (const row of grid) {
    for (let col = 0; col < row.length; col++) {
      const cell = row[col]
      if (cell === undefined || cell === null) continue

      let day, month, year
      const strCell = String(cell).trim()

      const isoMatch = ISO_DATE_CELL.exec(strCell)
      if (isoMatch) {
        year = parseInt(isoMatch[1], 10)
        month = parseInt(isoMatch[2], 10)
        day = parseInt(isoMatch[3], 10)
      } else {
        const match = DATE_CELL.exec(strCell)
        if (!match) continue
        day = parseInt(match[1], 10)
        month = parseInt(match[2], 10)
        year = expandYear(match[3])
      }

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

async function fetchFromAppsScript() {
  const res = await fetch(APPS_SCRIPT_URL)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Could not read Apps Script Web App (status ${res.status}). ${body}`)
  }
  const data = await res.json()
  const sheets = data.sheets || []
  const yearTabs = sheets.filter((s) => YEAR_TAB_PATTERN.test((s.title || '').trim()))

  if (yearTabs.length === 0) {
    throw new Error(
      'No tabs in the spreadsheet matched a 4-digit year name (e.g. "2026"). Check your sheet tab names.'
    )
  }

  return yearTabs.map((s) => parseYearGrid(s.values || []))
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
  let results
  if (APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim() !== '') {
    results = await fetchFromAppsScript()
  } else {
    const allTitles = await fetchSpreadsheetMeta()
    const yearTabs = allTitles.filter((t) => YEAR_TAB_PATTERN.test(t.trim()))

    if (yearTabs.length === 0) {
      throw new Error(
        'No tabs matched a 4-digit year name (e.g. "2026"). Check YEAR_TAB_PATTERN in config.js and your tab names.'
      )
    }

    results = await Promise.all(
      yearTabs.map(async (title) => {
        const grid = await fetchTabGrid(title)
        return parseYearGrid(grid)
      })
    )
  }

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

