import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to https://yourusername.github.io/sales-dashboard/ (no custom domain),
// keep base as '/sales-dashboard/'.
// If deploying to a CUSTOM DOMAIN (e.g. dashboard.yourdomain.com) — which is required
// for the Cloudflare Access setup in the README — use base: '/' instead.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
