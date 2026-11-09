# Chayakkada

A responsive office tea-ordering website with Supabase Auth. Employees sign in, open a company invitation, add drinks, and send the combined order to the shop on WhatsApp. A sponsor can cover a round; the Pattu book keeps dues and payment records.

## Local development

Requires Node.js 24.

```sh
npm ci --cache /tmp/npm-cache
# Create .env.local from .env.example only if it does not already exist.
# Add your Supabase project URL and publishable key to .env.local.
npm run dev
```

Do not overwrite an existing `.env.local`; the current cloud checkout already contains the public project URL/key supplied in chat. No secret key is stored there.

The repository includes the owner-provided project URL and publishable key in `config/supabase-public.js` so a GitHub-connected build has working public configuration without the ignored local env file. These are public identifiers, not a server secret. To override them for another project, set these **public** variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-project-publishable-key
```

The API uses those public values to verify users with Supabase Auth. Optional server equivalents are `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Email sign-in must be enabled in the Supabase project. Authentication is required locally as well as in production; there is no development sign-in bypass.

Without server database credentials, local room data uses SQLite at `.local/chayakkada.sqlite` (ignored by Git). To use hosted Supabase room data locally, also set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) and apply the migration below. The secret stays on the server. Restart the development server after backend or environment changes.

Use the existing checkout: cloud tasks are isolated and do not need a separate worktree.

```sh
npm test
npm run test:browser
npm run build
```

The browser test uses system Chromium if installed, or Playwright's Chromium. Install a browser with `npx playwright install chromium` if needed; `CHROMIUM_PATH` overrides its executable. The test starts its own local fake Auth server and Vite on port 5176. It exercises the real SDK without production accounts or email delivery. `npm run preview` serves static build assets only; use `npm run dev` to test the full API locally.

## Supabase Auth configuration

In **Supabase Dashboard → Authentication**:

1. Enable the **Email** provider. The app supports email/password sign-in, account creation with email confirmation, password reset, session refresh, and sign-out. OAuth providers are not configured.
2. Under **URL Configuration**, set **Site URL** to the final deployed website URL.
3. Add redirect URLs for your environments, for example `http://localhost:5173/auth/**` in development and `https://your-site.vercel.app/auth/**` in production. The wildcard covers callback query parameters; restrict production entries to your own site.
4. Check email delivery settings and templates. Production email may need your own SMTP provider. The app uses Supabase's confirmation and password-reset emails.

Confirmation returns through `/auth/callback`; recovery returns through `/auth/reset`. PKCE is enabled: open email links in the browser that requested them. The company invitation survives authentication through a validated `next` URL. Only this site's workspace home can be a return destination, preventing external login redirects.

## Database setup

Inspect the selected Supabase project, then apply:

```text
supabase/migrations/202611090001_create_tea_rooms.sql
```

Use the Supabase plugin migration tool, CLI, or project SQL Editor. The migration creates `tea_rooms`, enables row-level security, and denies direct browser table access. Only the server role can read, insert, or update rows. Do not give the browser a secret/service-role key or add broad anonymous table policies.

All workspace API requests verify the Bearer access token with `supabase.auth.getUser(token)`. Missing, expired, invalid, and forged sessions cannot read or modify rooms. A client-side redirect is not the authorization boundary. Temporary Auth verification failures fail closed without treating them as valid users.

Workspace UUID links are invitations: any **signed-in user with the link** has equal access to that room's orders, prices, sponsor, and Pattu book. There are no separate admin roles, membership approvals, or per-employee edit restrictions in this version. Do not share invitation links outside the company. Signing in does not list or expose other workspace links.

## Vercel deployment

1. The tested app is on GitHub `main`. Connect `jinshadk007/office_chayakkada` in Vercel with `main` as the production branch. The owner-provided site is `https://officechayakkada.vercel.app/`. A Git push triggers the connected build; verify its status in Vercel.
2. Public Supabase project settings are included in the source. `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` can override them; set both together when changing projects.
3. Add server-only `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) in Vercel's secure environment settings. `SUPABASE_URL` can override the included project URL. Never put a secret under a `VITE_` variable. Public values are embedded at build time, so redeploy after changes.
4. Apply the database migration and configure Supabase Auth URLs as above.
5. Use Node.js 24. `vercel.json` configures Vite, the room API, and direct navigation to login and Auth callback routes.
6. Deploy, then verify sign-up/email confirmation, login, invitation links in two browsers, password recovery, signing out, and anonymous API rejection on the real site.

```sh
npx vercel deploy --prod
```

Production deliberately refuses local/ephemeral room storage if server database credentials are missing. The Supabase SDK uses HTTPS with TLS verification.

The source has been pushed to the connected production branch; public deployment success has not been independently verified here. Supabase/Vercel tools are not exposed in this chat despite the tagged plugin. This managed environment denies requests to the Supabase project host and `api.vercel.com` and `officechayakkada.vercel.app`. Allow the specific project hostname and required Vercel API/login destinations in environment settings before retrying live setup. Keep secret keys and tokens in secure settings, never in chat.

## Frontend flow

After sign-in, create a company workspace or paste a teammate's invitation link. Recently opened workspaces appear on that account's browser. Invitations and remembered names are validated and scoped to the signed-in user; this list is local browser history, not a cloud workspace directory.

Inside a workspace, use **Tea round** for orders and **Pattu book** for balances, payments, and shop prices. Tabs support keyboard navigation. Finishing a round opens the Pattu book automatically. The order form previews the drink total before submission. Loading, retry, confirmation-email, password visibility, and sign-out states keep account and workspace actions clear on mobile and desktop.

## Ordering and the Pattu book

- **Shared ordering:** active browsers refresh every 2.5 seconds. Revision checks prevent simultaneous updates from overwriting each other.
- **One shop message:** copy the summary or open WhatsApp with it prefilled. A person chooses the recipient and sends it. Sending does not finish or charge the round.
- **Sponsor:** a named sponsor covers all drinks in that round, including later additions. Finishing records the sponsor's debt instead of employees' debts; sponsorship resets for the next round.
- **Pattu book (പറ്റുപുസ്തകം):** after delivery, finish the round to record dues. Record partial/full payments, undo mistaken payment records, view history, or copy balances. This records money already received; it does not transfer money.
- **Prices:** initial values are samples. Price changes apply to new orders; existing orders keep their original price. Money is stored as integer paise.
- **Names:** balances group names case-insensitively. People with the same name should use a distinguishing name.

## Validation and remaining work

Node tests cover the ordering/ledger domain, Supabase storage adapter, verified bearer authentication, anonymous API rejection, invalid tokens, and safe return URLs. Adapter tests use a controlled PostgREST transport. Browser tests exercise auth forms, invalid login, confirmation instructions, password recovery/update, invitations, protected workspace loading, shared orders, persistence, logout, forged sessions, and responsive layouts at 320/390/768/1440 pixels with simulated Auth.

The frontend production build and local checks do not establish hosted connectivity. Hosted Auth configuration, database migration application, real email delivery, real password recovery, and Vercel deployment still require project access and live validation. Actual WhatsApp delivery is not tested.
