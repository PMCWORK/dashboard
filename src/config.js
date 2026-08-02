// ── Google Sheets Access via Google Apps Script Web App ────────────────────────
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyf-KRktcf9HeJWmgXBgAGr67DfnUr_nev9Eux35kEPUHe6RaaSeV0x7JKmJBTyFmqLJw/exec'

// Only tabs whose name matches this pattern are treated as sales data.
export const YEAR_TAB_PATTERN = /^\d{4}$/

// How often to re-fetch while the dashboard is open (ms).
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000
