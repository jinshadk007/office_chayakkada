# Chayakkada

A simple office tea corner. No email, account registration, verification, or separate login page.

## Use

1. Open the site and enter your company name and a shared password (6+ characters).
2. Copy the invite link. Send the link and company password to your teammates.
3. Teammates enter the password inline, add their name, and choose their drink.
4. One person shares the combined order with the tea shop on WhatsApp.
5. Finish the delivered round to record dues in the Pattu book. A sponsor can cover the whole round. Record payments as money is received.

Tea round and Pattu book are separate tabs. Drink prices are editable, existing orders retain their original prices, and balances carry between rounds. Payments are recorded manually; the app does not transfer money.

## Run

Requires Node.js 24.

```sh
npm ci --cache /tmp/npm-cache
npm run dev
npm test
npm run test:browser
npm run build
```

Local development uses SQLite in `.local/chayakkada.sqlite`. No credentials are required locally. The browser test exercises the real local password/session API with two isolated employee browsers. It uses system Chromium if installed, or Playwright Chromium (`npx playwright install chromium`); `CHROMIUM_PATH` can override the executable.

Use the existing checkout. Cloud tasks are already isolated; do not create a worktree unless requested. Restart the development server after backend changes. `npm run preview` serves static assets only; use the dev server for API testing.

## Supabase and Vercel

Production uses Supabase **as the database**. Supabase Auth email settings are no longer part of the employee flow.

- Connect `jinshadk007/office_chayakkada` in Vercel with `main` as the production branch.
- Use Node.js 24. The checked-in Vercel configuration handles the Vite build and `/api/room` function.
- Set `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) in Vercel's secure environment settings. Never put it in chat, source, or a `VITE_` variable.
- The project URL is included in `config/supabase-public.js`. `SUPABASE_URL` can override it.
- Apply `supabase/migrations/202611090001_create_tea_rooms.sql` after inspecting the target project. It creates the rooms table, enables row-level security, and denies direct browser access. Only the server role reads or writes the table.
- Push changes to trigger the connected build. The owner-provided production URL is `https://officechayakkada.vercel.app/`.

No additional database migration is needed for passwords: private password metadata is stored inside the existing protected room JSON. Production refuses ephemeral local storage if the database secret is missing. The public health endpoint reports configuration presence, not a successful database round-trip.

This managed environment currently blocks requests to the production website and Supabase/Vercel APIs; hosted deployment and database connectivity must be verified after Vercel completes its build.

## Access

Passwords are salted and hashed with scrypt. Plain passwords are never stored or returned. Password metadata stays server-side and is stripped from every room response. The browser receives a signed, room-scoped session lasting seven days, not the password. Invite links contain neither passwords nor sessions. Ten incorrect password attempts lock further unlock attempts for one minute. Locking the workspace forgets this browser's session.

Everyone with the link **and password** can manage the shared orders, sponsorship, prices, and payment book. There are no individual accounts or admin roles. Share these only within the company. Recent workspaces and remembered names are local to the browser; they do not reveal room data without a valid session.

Older rooms created with email sign-in are preserved. In the browser previously signed in to an older room, open its invite link and set a shared password inline. The server verifies that existing Supabase session before the one-time upgrade. Without that old session, create a new workspace or arrange an administrator-assisted migration; unauthenticated users cannot claim old financial records. No new email sign-in screen is provided.

## Checks

Node tests cover password hashing, session scope/expiry/tampering, hidden password metadata, protected reads and payments, internal action rejection, safe legacy upgrade, throttling, ledger calculations, sponsorship, partial/full payments, concurrent Supabase updates, and invitation validation.

Browser checks cover direct landing, password creation, incorrect/correct unlock, two employees sharing orders, copying the order/invitation, persistence, sponsorship, ledger entries, payments, locking, joining, and responsive layouts at 320/390/768/1440 pixels. Actual WhatsApp delivery and hosted Supabase operations are not tested by the local suite.
