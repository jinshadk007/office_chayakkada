# Orattice Chayakkada

One office. One saved tea round. No company chooser, tenant setup, email sign-in, or account registration.

## Everyday use

Open `https://officechayakkada.vercel.app/`, enter the shared Orattice password, add your name and drink, and let one teammate send the combined order to the tea shop on WhatsApp. The Pattu book records dues and payments across rounds. A sponsor can treat the whole team.

The first visit sets the shared password once. Everyone subsequently uses the same address and password. Orders and payments are stored on the server, so refreshes and other employees' phones see the same saved book. Browser storage only remembers the session and your name; it is not the source of shared orders.

The cinematic frontend keeps the cream/green design and existing order form. GSAP/ScrollTrigger adds headline entry, subtle parallax, staggered form reveals, and an order-section surprise. Cup selection and quantity have gentle interactions; a Malayalam delivery message and confetti appear only after the server confirms an order. Optional procedural tea-shop effects stay off until a click. There is no generated or cloned voice active.

**The new AI film has not been generated.** No video/lip-sync generator or provider credential is available in this environment. The old video is not reused or shipped. The reference photo is the static fallback. The complete replaceable video/frame integration and production prompts are ready:

- `docs/cinematic-assets.md`: exactly which files to supply and how to activate them.
- `docs/ai-tea-storyboard.md`: three-shot storyboard, exact prompts and Malayalam dialogue, consent and voice direction.
- `src/media-config.js`: inactive asset manifest; publication/consent/license checks prevent silent substitution.
- `scripts/prepare-cinematic.mjs`: exports an approved new film into optimized WebP frames, silent seek-friendly MP4, poster, and metadata. It is an optimizer, not a generator.

Desktop can scrub either the new film or its exported frames. Phone fallback is a static photo plus explicit film playback. Media loads only near the scene or after playback is requested; frame mode caches at most 24 frames and loads only nearby frames. Motion-off/reduced-motion cancels scrolling animations and pauses media. Lip-synced speech is available only through deliberate real-time film playback with approved audio, not through irregular/reverse scroll scrubbing.

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

Browser tests use system Chromium or Playwright Chromium (`npx playwright install chromium`); `CHROMIUM_PATH` can override the executable. They exercise two employee browsers, actual password/session handling, optional sound, success/failure celebrations, native scroll seeking/reverse, lazy frame seeking/reverse, mobile playback, reduced motion, sponsorship, partial payments, refresh, and persistence after restarting the local server. Cinematic tests use clearly labelled synthetic test fixtures, not a fake teammate film. FFmpeg is required for cinematic test fixtures and the asset-export script. Adapter tests use controlled PostgREST responses; they do not verify the hosted Supabase project.

## Deployment

Vercel follows GitHub `main`. Node.js 24, the Vite build, and `/api/room` are configured in source. Push tested changes to trigger the connected production build. The old video is not included. No new AI-video asset is active; the existing still provides the fallback.

Passwords use salted scrypt hashes. Password metadata is never sent to the browser. Room-scoped signed sessions last seven days. Ten incorrect password attempts trigger a one-minute pause. **Lock workspace** forgets this browser's access. Everyone with the team password can manage orders, prices, sponsorship, and payments; there are no individual employee accounts or administrator roles.

## When the live page appears unchanged

Open `/release.json` on the deployed site. This file is emitted with each build, is not cached, and reports the actual Git commit when Vercel/Git supplies it, the cinematic player feature marker, and whether a new approved film/frame sequence is configured. It contains no credentials or orders.

- `release: "cinematic-scroll-v1"` confirms the player code is present.
- `newFilmConfigured: false` means the reference photo is the expected fallback; no new AI film was generated or supplied. The film control stays hidden. Motion/optional sound controls and success interactions still work.
- A 404 means that deployment predates the build-check feature or points to a different source. In Vercel verify the connected repository is `jinshadk007/office_chayakkada`, production branch is `main`, and the Production/Current deployment uses the latest Git commit. A successful Git push alone does not prove that the production alias was updated.
- Reduced-motion or save-data settings intentionally start motion paused. The motion control can enable it explicitly.
- A database setup error prevents the shared order form from opening; check `/api/room?health=1` separately. It is not proof that the frontend release is old.

Live page and GitHub deployment-status requests are blocked from this chat environment. A production commit or the release JSON is required to distinguish an old deployment from the expected static fallback; do not report a live rollout as verified merely because local checks pass.
