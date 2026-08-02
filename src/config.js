// ── Google Sheets Access via Google Apps Script Web App ────────────────────────
// Using Google Apps Script avoids needing Google Cloud Console API Keys or 2FA.
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyf-KRktcf9HeJWmgXBgAGr67DfnUr_nev9Eux35kEPUHe6RaaSeV0x7JKmJBTyFmqLJw/exec'

// Fallback Google Sheets API (if APPS_SCRIPT_URL is blank)
export const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'
export const API_KEY = 'YOUR_API_KEY'

// Only tabs whose name matches this pattern are treated as sales data.
// Matches "2022", "2023", ... "2099" and ignores any other tab name.
export const YEAR_TAB_PATTERN = /^\d{4}$/

// How often to re-fetch while the dashboard is open (ms).
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000

