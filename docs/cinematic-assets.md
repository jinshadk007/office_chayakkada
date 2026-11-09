# Supply the new film — activation guide

The frontend is implemented. The **new AI video is not generated or included**: no video/lip-sync generation capability or provider credentials are available in this environment. Existing footage has not been repurposed as new footage. Until new approved assets are supplied, the website displays the reference photo and the ordering interface remains fully functional.

## Required from the video creator

1. **A genuinely new film**, ideally `chaaya-film.mp4`: H.264/yuv420p, fast-start, portrait 9:16, about 18 seconds (maximum 20 for the frame optimizer). Use the approved reference teammate's actual identity, the three-shot storyboard, and licensed/consented Malayalam audio. Supply short-GOP encoding (roughly one keyframe every 0.5 seconds) for responsive native seeking. Do not send another copy, reversal, crop, or interpolation of the old clip.
2. **A poster**, `chaaya-poster.jpg` or WebP: a clear identity-consistent still from the new film, ideally 360×640 or larger.
3. **Consent and publication approval**: a private record that the teammate consents to these fictional scenes and any use of their likeness/voice; a licensed voice source; and owner approval of the actual final film. Store only the redacted record ID in app configuration.

Optional:

- Optimized numbered WebP frames, `frame-001.webp`, `frame-002.webp`, etc., plus exact width/height and count. Use 12 fps/240px width as the default lightweight export; at most 240 frames. The app lazy-loads nearby frames with a bounded cache. MP4-only operation also works.
- `chaaya-ml.vtt`, accurate captions for the spoken film.
- Separate licensed/consented Malayalam voice snippets for deliberate success events. These are optional and inactive by default. Do not claim a generic actor is the teammate's real voice.

Use `docs/ai-tea-storyboard.md` for the exact scene prompts, script, and reject criteria. `docs/cinematic-approval.example.json` is a private production checklist template, not evidence that consent has already been granted.

## Optimize the new film

Requires FFmpeg/ffprobe. Keep review assets outside `public/` until publication approval.

```sh
node scripts/prepare-cinematic.mjs \
  /path/to/NEW-chaaya-film.mp4 \
  /private/path/to/approval.json \
  /tmp/chaaya-review
```

The output directory must not already exist. The tool verifies the approval fields and rejects the known original clip by its hash. That hash check alone cannot prove a different file is new; human provenance/identity review remains required. It outputs:

- `frame-001.webp` onwards;
- `film-silent.mp4` with fast-start and short keyframe intervals;
- `poster.jpg`;
- `provenance.json` with actual frame count, frame dimensions, source hash, and redacted consent reference.

Review identity, Malayalam pronunciation, lip-sync, visual continuity, and the exact final film. Obtain publication approval. Only then put the files under `public/media/approved/chaaya/`. The optimizer never changes the live manifest or activates assets automatically.

## Configure a new approved film

Edit only `generatedScene` in `src/media-config.js` after the above approvals. Example values below are placeholders, not permission:

```js
export const generatedScene = {
  publicationApproved: true,
  newlyGeneratedFilm: true,
  consentReference: 'YOUR-REDACTED-CONSENT-AND-RELEASE-ID',
  license: 'YOUR-LIKENESS-AND-VOICE-LICENSE-REFERENCE',
  src: '/media/approved/chaaya/film-silent.mp4',
  poster: '/media/approved/chaaya/poster.jpg',
  captions: null,
  audioApproved: false,
  framePath: '/media/approved/chaaya/frame-',
  frameCount: 216, // use the ACTUAL count from provenance.json
  width: 240,     // use the ACTUAL dimensions from provenance.json
  height: 426,
  disclosure: 'AI-generated scene · used with permission',
};
```

For **MP4-only scroll mode**, set `framePath: null` and `frameCount: 0`. The desktop player seeks the film from scroll progress. With frames provided, it draws the selected frame to a canvas and avoids also downloading the movie until film playback is explicitly requested.

For **approved voice/lip-synced playback**, provide the newly generated film with its licensed audio as `src`, set `audioApproved: true`, and supply the caption path. Video is always muted during scroll scrubbing. On phones or desktop, the explicit **Play film** action runs at normal timing; it remains muted until the user has enabled **Sound on**. This preserves the produced film's actual lip-sync. Arbitrary reverse scrolling cannot be synchronized to continuous natural speech.

## What the frontend handles

- GSAP and ScrollTrigger load as separate chunks; the core order screen renders first.
- Desktop scrubs video/frames forward and backward; frame requests are near-view, limited to three concurrent loads and 24 cached images.
- Phones/save-data/reduced-motion start with the still image. On phones, approved film playback is user-triggered. Reduced-motion pauses automatic movement and media.
- Motion and sound controls are independent. AudioContext is never created before the user enables sound. No speech assets play unless individually approved in the manifest.
- Missing video/frames keep the poster; playback failure does not block an order. No consent flags means no generated media requests or film button.
- The hero/form layout, menu prices, password access, shared orders, payment ledger, and Supabase API are preserved.
- Confetti/tea delivery success feedback is triggered only after a successful order response. Failed requests do not celebrate.

## Verification

```sh
npm test
npm run build
npm run test:browser
```

The browser suite creates a synthetic color-grid test video and tiny image fixtures in a temporary test environment. It verifies seeking, reverse scrolling, frame loading, phone playback, and motion/audio behavior. Those fixtures are not AI-generated teammate assets, are not published, and do not claim generation is complete. The real supplied film still needs visual and voice review before release.
