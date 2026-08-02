// ── Google Sheets API access ────────────────────────────────────────────────
// This dashboard reads your sheet with the Sheets API (not "publish to web"),
// because it needs to see *every* year-tab and pull raw grid cells rather than
// a single flat CSV table.
//
// 1. In Google Cloud Console: create/select a project, enable the
//    "Google Sheets API", then create an API key (APIs & Services → Credentials).
// 2. Restrict that key to the Sheets API only (and, ideally, to your site's
//    domain under "Application restrictions" once it's deployed).
// 3. In your actual Google Sheet: Share → General access → "Anyone with the
//    link" → Viewer. The API key alone can only read sheets that are shared
//    this way — it can't read a fully private sheet.
// 4. Grab the spreadsheet ID from its URL:
//    https://docs.google.com/spreadsheets/d/AAAAAAAA/edit  ← the AAAAAAAA part
export const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'
export const API_KEY = 'YOUR_API_KEY'

// Only tabs whose name matches this pattern are treated as sales data.
// Matches "2022", "2023", ... "2099" and ignores any other tab name
// (notes, scratch pads, summaries, etc).
export const YEAR_TAB_PATTERN = /^\d{4}$/

// How often to re-fetch while the dashboard is open (ms).
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000
