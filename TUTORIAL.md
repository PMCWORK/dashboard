# Getting your Sales Ledger dashboard live — full walkthrough

This assumes zero prior setup. Follow it top to bottom and you'll have a
live, auto-updating dashboard at the end. Should take about 20-30 minutes,
mostly waiting on things to propagate (DNS, GitHub Pages, etc).

---

## Part 1 — Get your spreadsheet ID

1. Open your actual Google Sheet (the one you edit — not a published link).
2. Look at the address bar. The URL looks like:
   ```
   https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#gid=0
   ```
3. Copy the long ID between `/d/` and `/edit` — that's your **Spreadsheet ID**.
   Save it somewhere, you'll need it in Part 3.

*(The publish-to-web CSV link you shared earlier is a different thing — it
only exports one sheet at a time and can't be used to pull all your year-tabs
automatically. The Spreadsheet ID above is what the app actually needs.)*

## Part 2 — Create a Google Sheets API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Top left, click the project dropdown → **New Project**. Name it anything
   (e.g. "sales-dashboard") → Create.
3. Once it's created and selected, go to the search bar at top and type
   **"Google Sheets API"** → click it → click **Enable**.
4. Left sidebar → **Credentials** → **+ Create Credentials** → **API key**.
5. A key appears (looks like `AIzaSy...`). Copy it — this is your **API Key**.
6. Click **Edit API key** (or find it in the credentials list and edit it):
   - Under **API restrictions**, choose "Restrict key" → check only
     **Google Sheets API**.
   - Leave "Application restrictions" as None for now — you can lock this
     down to your deployed domain later once it's live (HTTP referrers →
     add `https://yourdomain.com/*`).
   - Save.

## Part 3 — Share the sheet so the key can read it

1. Back in your Google Sheet → **Share** (top right).
2. Under "General access," change to **"Anyone with the link"** → set role
   to **Viewer**.
3. Done — this is what lets the API key read it without needing you to log
   in every time. (This is the same public-by-link tradeoff we already
   talked through — the dashboard page itself gets locked down in Part 6.)

## Part 4 — Configure the app

1. Unzip the project you downloaded.
2. Open `src/config.js` in any text editor.
3. Replace the placeholders:
   ```js
   export const SPREADSHEET_ID = 'paste-your-id-from-part-1'
   export const API_KEY = 'paste-your-key-from-part-2'
   ```
4. Save.

## Part 5 — Run it locally to confirm it works

You'll need [Node.js](https://nodejs.org/) installed (any recent version).

1. Open a terminal in the project folder.
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. It'll print a local URL (like `http://localhost:5173`) — open it in your
   browser.
4. You should see your real sales data: KPI cards, the trend chart, the
   year-over-year chart, and the monthly table. Check the numbers roughly
   match what you'd expect.
5. If you see an error instead, it'll tell you what's wrong (usually a typo
   in the config, or the sheet not shared correctly). Press `Ctrl+C` in the
   terminal to stop the dev server when you're done checking.

## Part 6 — Push to GitHub

1. Go to [github.com](https://github.com) → **New repository**. Name it
   e.g. `sales-dashboard`. Keep it public or private, doesn't matter for
   this step. Don't add a README/gitignore (you already have one).
2. In your terminal, inside the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sales-dashboard.git
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` — GitHub will show you this exact command on the
   new repo's page too.)

## Part 7 — Turn on GitHub Pages

1. In your repo on GitHub → **Settings** → **Pages** (left sidebar).
2. Under "Build and deployment" → **Source** → choose **GitHub Actions**.
3. Go to the **Actions** tab in your repo — you should see a workflow run
   start automatically (triggered by your push). Wait for it to finish
   (green checkmark, usually 1-2 minutes).
4. Once done, your site is live at:
   ```
   https://YOUR_USERNAME.github.io/sales-dashboard/
   ```
   (This only works if `vite.config.js`'s `base` matches your repo name,
   which it already does by default — `/sales-dashboard/`. If you rename
   the repo, update that line to match.)

At this point: **it's live, but public to anyone with the link.** If that's
fine for now, you're done — skip to Part 9. If you want it locked to just
you, continue to Part 8.

## Part 8 — Make it private (Cloudflare Access)

Only do this if you have or are willing to get a custom domain
(~$10-15/year from any registrar).

1. **Buy/have a domain.**
2. Add it to [Cloudflare](https://dash.cloudflare.com/) (free plan) as a site.
   Cloudflare gives you two nameservers.
3. At your domain registrar, replace the existing nameservers with
   Cloudflare's. (Takes anywhere from a few minutes to ~24hr to propagate.)
4. Back in your repo: **Settings → Pages → Custom domain** → enter something
   like `dashboard.yourdomain.com`.
5. Edit `public/CNAME` in your project to contain that exact domain, then
   commit and push the change.
6. In Cloudflare DNS: add a **CNAME** record — name `dashboard`, target
   `YOUR_USERNAME.github.io`, proxy status **ON** (orange cloud).
7. In `vite.config.js`, change `base: '/sales-dashboard/'` to `base: '/'`
   (custom domains serve from root), then commit and push.
8. In Cloudflare, go to **Zero Trust** (left sidebar, may prompt you to set
   up a free Zero Trust org name the first time) → **Access** →
   **Applications** → **Add an application** → **Self-hosted**.
   - Domain: `dashboard.yourdomain.com`, path `/*`
   - Add a policy: Action = Allow, Include = Emails → your own email
   - Save
9. Visit `dashboard.yourdomain.com` — you should now get a Cloudflare login
   prompt (email + one-time code) before seeing anything.

## Part 9 — You're live

- The dashboard re-checks your sheet every 5 minutes while someone has it
  open, and fresh on every page load — so your daily entries show up
  automatically, no redeploy needed.
- **Adding a new year**: just add a new tab named for the year (e.g. `2027`)
  in the same layout as 2026 — it's picked up automatically next refresh.
- If the footer ever shows a "date conflict" warning, open the browser's
  console (right-click → Inspect → Console tab) for the exact dates — it
  usually means a typo'd date somewhere in the sheet, same kind we fixed
  before launch.
