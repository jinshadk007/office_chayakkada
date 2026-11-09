# Orattice Chayakkada

One office. One saved tea round. No company chooser, tenant setup, email sign-in, or account registration.

## Everyday use

Open `https://officechayakkada.vercel.app/`, enter the shared Orattice password, add your name and drink, and let one teammate send the combined order to the tea shop on WhatsApp. The Pattu book records dues and payments across rounds. A sponsor can treat the whole team.

The first visit sets the shared password once. Everyone subsequently uses the same address and password. Orders and payments are stored on the server, so refreshes and other employees' phones see the same saved book. Browser storage only remembers the session and your name; it is not the source of shared orders.

The uploaded tea-delivery reference is included as a compressed, silent 2.4-second clip. The cup mascot, steam, order reactions, and sponsor celebration are decorative. **Pause the fun** stops video and animations. Reduced-motion preferences start the scene paused. The phone ordering view uses a compact clip so the form stays close to the top.

## Database connection — required for the live site

We are keeping Supabase for shared persistence, as requested. Supabase Auth and email verification are not part of everyday ordering.

1. In **Supabase → Settings → API Keys → Secret keys**, get the project's server secret key.
2. In **Vercel → officechayakkada → Settings → Environment Variables**, add `SUPABASE_SECRET_KEY` for **Production** (and Preview if required). Save and redeploy. Keep the actual key in that secure field, not in source or chat. Legacy `SUPABASE_SERVICE_ROLE_KEY` also works.
3. The project URL is already configured in `config/supabase-public.js`; `SUPABASE_URL` can override it.
4. Inspect the project and apply `supabase/migrations/202611090001_create_tea_rooms.sql` if the table has not been created. This enables row-level security and restricts table access to the server role.

`DATABASE_NOT_CONFIGURED` means the deployed function has no server key. A successful frontend deployment does not establish database readiness. The health endpoint now makes an actual read-only table query: open `/api/room?health=1` and check `ready`. A failure returns a safe code and a precise next action, without exposing keys or orders. `DATABASE_TABLE_MISSING` means to apply the SQL migration; `DATABASE_KEY_REJECTED` means to correct the server key; `DATABASE_PERMISSION_DENIED` means to use the server secret and check table grants. A successful read does not by itself verify every write operation. There is deliberately no empty browser-only fallback that would make employees' orders diverge or mask lost connectivity.

The chat environment currently has no Supabase/Vercel tools, login, or server secret, and network requests to these services are blocked. Hosted connectivity cannot be claimed until credentials/settings are supplied and the real site is verified.

## Existing data

The backend reuses a single existing book named **Orattice** (case insensitive), including its current password, orders, and Pattu book. If no such book exists, it uses a stable ID from `config/orattice.js`. Old data is never deleted. If multiple older Orattice books exist, setup stops and asks the organiser to select/consolidate them; it does not guess or overwrite financial records. No new schema is required for this change.

An older email-protected Orattice book can be given a shared password from the original signed-in browser. Its old Supabase session is verified server-side for that one-time upgrade. No new email login page is offered. Without that original session, an organiser must migrate access; anonymous visitors cannot claim the saved book.

## Development and checks

Requires Node.js 24. Use the existing checkout; cloud tasks are already isolated and do not need a worktree.

```sh
npm ci --cache /tmp/npm-cache
npm run dev
npm test
npm run test:browser
npm run build
```

Local development uses persistent SQLite at `.local/chayakkada.sqlite`, with no credentials required. Tests use their own temporary databases and never clear the development book. `TEA_SQLITE_PATH` can override the local path. Hosted production never falls back to SQLite. `npm run preview` only serves static assets; use the dev server for functional API checks.

Browser tests use system Chromium or Playwright Chromium (`npx playwright install chromium`); `CHROMIUM_PATH` can override the executable. They exercise two employee browsers, actual password/session handling, video playback/pause, reduced motion, sponsorship, partial payments, responsive layouts, refresh, and persistence after restarting the local server. Adapter tests use controlled PostgREST responses; they do not verify the hosted Supabase project.

## Deployment

Vercel follows GitHub `main`. Node.js 24, the Vite build, and `/api/room` are configured in source. Push tested changes to trigger the connected production build. The uploaded original MOV is not included; only its compressed silent clip and poster are served.

Passwords use salted scrypt hashes. Password metadata is never sent to the browser. Room-scoped signed sessions last seven days. Ten incorrect password attempts trigger a one-minute pause. **Lock workspace** forgets this browser's access. Everyone with the team password can manage orders, prices, sponsorship, and payments; there are no individual employee accounts or administrator roles.
