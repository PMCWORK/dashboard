# Sales Ledger — live dashboard from Google Sheets

A React dashboard that reads your daily Sale / Profit / Cost figures straight
from your Google Sheet's year-tabs (2022, 2023, 2024, 2025, 2026, and any
future year you add) and redraws itself automatically as the sheet updates.
No backend, no database — just a static site on GitHub Pages that calls the
Google Sheets API directly.

## How it reads your sheet

Your sheet isn't a clean single table — different years have different
numbers of month-blocks side by side, footer/summary rows, blank spacers, and
some inconsistent formatting in the older years. Rather than assume a fixed
layout, the parser **scans every cell in each year-tab for anything shaped
like a date** (`DD-MM-YY`), and reads the four cells to its right as
`Sale, Profit, Percentage, Cost`. This works across all your years without
needing to know exactly how many month-blocks are on a row or where the
Total/Average rows fall — they simply don't look like dates, so they're
skipped automatically.

A few rules baked in, based on what we confirmed about your data:
- **Percentage is ignored** — margin is computed as Profit ÷ Sale instead,
  since the sheet's own percentage cells break (`#DIV/0!`) on blank days.
- **The year always comes from the tab name**, not the cell — this silently
  corrects a handful of typo'd years in the older tabs (e.g. `07-07-27`).
- **A fully blank Sale cell means "hasn't happened yet"** and is skipped
  entirely. **An explicit `0` means a real zero-sale day** and is counted.
- Non-numeric placeholders (`Uncalculated`, `-/-`, `"Included in next
  month"`, etc.) are treated as `0` for that field rather than breaking
  the parser.
- Known limitation: a couple of 2022 monthly statements cover non-calendar
  periods (e.g. "Feb 4 to Mar 28"), so monthly totals from that year won't
  always match a strict calendar-month sum, even though each day's numbers
  are correct.

Only tabs named as a 4-digit year (matching `YEAR_TAB_PATTERN` in
`src/config.js`) are read — any other tab (notes, scratch pads, etc.) is
ignored automatically.

## 1. Set up Google Sheets API access

1. In [Google Cloud Console](https://console.cloud.google.com/), create or
   pick a project, then enable the **Google Sheets API**
   (APIs & Services → Library).
2. Create an **API key** (APIs & Services → Credentials → Create Credentials
   → API key). Restrict it to the Sheets API, and later to your deployed
   domain under "Application restrictions."
3. In your actual sheet: **Share → General access → "Anyone with the link" →
   Viewer.** The API key can only read sheets shared this way — it cannot
   read a fully private sheet.
4. Copy your spreadsheet ID from its URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

## 2. Configure the app

Open `src/config.js` and set:

```js
export const SPREADSHEET_ID = 'your-spreadsheet-id'
export const API_KEY = 'your-api-key'
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed localhost URL — you should see your real sale/profit/cost
data across every year-tab.

## 4. Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `sales-dashboard`) and push this project to it
2. In `vite.config.js`, set `base` to match your repo name:
   ```js
   base: '/sales-dashboard/',
   ```
   (If your repo is `yourusername.github.io`, or you're using a custom
   domain per step 5, use `base: '/'` instead.)
3. In your repo on GitHub: **Settings → Pages → Source → GitHub Actions**
4. Push to `main` — the included workflow (`.github/workflows/deploy.yml`)
   builds and publishes automatically. Check the **Actions** tab for
   progress.

Every push rebuilds and redeploys. The dashboard itself re-fetches the sheet
every 5 minutes while open, and fresh on every page load — day-to-day
updates to your sheet show up without any redeploy.

## 5. Make it private (only you can view it)

By default this site is public to anyone with the URL — GitHub Pages has no
built-in login wall. To restrict access to just yourself, put it behind
**Cloudflare Access** (free for personal use):

1. **Get a custom domain** (any registrar, ~$10-15/yr) — Cloudflare Access
   can't sit in front of a bare `yourusername.github.io` URL, only a domain
   you control.
2. **Point GitHub Pages at it**: repo Settings → Pages → Custom domain →
   `dashboard.yourdomain.com`. Edit `public/CNAME` in this project to contain
   that exact domain.
3. **Add the domain to Cloudflare** (free plan), update your nameservers at
   the registrar to the ones Cloudflare gives you.
4. **DNS record**: in Cloudflare, add a CNAME `dashboard` → `yourusername.github.io`,
   proxy toggle **ON** (orange cloud).
5. **Zero Trust → Access → Applications → Add an application → Self-hosted**:
   domain = `dashboard.yourdomain.com`, path `/*`. Add a policy allowing only
   your email.

After that, visiting the dashboard prompts for an email + one-time code
before showing anything.

Caveat: this protects the *dashboard page*. Your Sheets API key is still
visible in the deployed JavaScript (it's a client-side app), so it's only as
safe as "restricted to the Sheets API + your domain" makes it — someone
determined could still find and reuse the key to read the sheet directly. If
this data is actually sensitive rather than just "don't want it publicly
Google-able," the next step up is a small serverless proxy that holds the
credentials server-side and requires its own auth — ask if you want that
built instead.

## Adding future years

Just add a new tab named for the year (e.g. `2027`) in the same layout as
your 2026 tab — the dashboard will pick it up automatically on the next
refresh, no code changes needed.
