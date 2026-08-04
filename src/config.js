// ── Apps Script endpoint ─────────────────────────────────────────────────
// This dashboard reads your sheet via a small Google Apps Script deployed
// as a Web App (doGet), which returns every tab's raw grid as JSON. No API
// key needed, and it works regardless of the sheet's sharing settings,
// since the script runs with the deploying account's own access.
export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyf-KRktcf9HeJWmgXBgAGr67DfnUr_nev9Eux35kEPUHe6RaaSeV0x7JKmJBTyFmqLJw/exec'

// Only tabs whose name matches this pattern are treated as sales data.
// Matches "2022", "2023", ... "2099" and ignores any other tab name
// (notes, scratch pads, summaries, etc).
export const YEAR_TAB_PATTERN = /^\d{4}$/

// How often to re-fetch while the dashboard is open (ms).
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000
