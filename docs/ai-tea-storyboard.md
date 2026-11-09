# New AI tea film — production brief, not a generated asset

Status: **not generated; not published.** The current environment has no video-generation or lip-sync tool, and no Runway/Luma/Fal/Replicate/voice-provider credential. GSAP renders frontend motion; it does not generate video, facial acting, voices, or lip-sync.

The user selected the teammate in the existing tea-delivery clip as the intended reference. Do not use the other attached portraits, swap faces, invent a replacement person, or treat the original clip as the requested new film.

## Consent and approval before generation

Record the teammate's explicit consent for: using his likeness in these fictional tea-preparation/delivery scenes; the exact Malayalam script below; distribution on the Orattice website; and any voice reproduction. Consent to use a photo is not automatically consent to clone a voice. Use a licensed Malayalam voice actor with permission, or a consented teammate recording. No approved voice recording is currently present in the repository.

Obtain owner approval of this storyboard before generating the realistic performance. The later instruction to create a new video does not supply a teammate consent record or a voice license. After generation, review the actual film and obtain publication approval separately. Keep actual consent documents private; put only a redacted reference ID in `src/media-config.js`.

## Reference assets

- Existing supplied reference clip: the attached 2.42-second `tea-delivery.mp4`. It is reference-only and has been removed from the website assets.
- Existing still reference: `public/media/tea-delivery.jpg`.
- Confirm the subject matches the approved reference before generating. Keep facial geometry, skin tone, hairstyle, age, and clothing consistent. Do not improve, stylize, replace, or combine faces.
- These references guide identity only. **Generate new footage for all three shots. Do not interpolate, crop, reverse, or repackage old footage and describe it as new AI video.**

## Exact master prompt

Create a NEW, realistic 18-second cinematic comedy sequence for Orattice's internal Kerala office tea corner. Use only the consented teammate shown in the supplied identity reference. Preserve his exact facial appearance and identity throughout every shot. He wears his reference navy office shirt. Warm late-afternoon Kerala office light, cream and muted green tea-shop palette, natural skin detail, believable hands, physically stable cups and tea. Gentle film grain, subtle depth of field, restrained comedy, no exaggerated cartoon acting. Frame in 9:16 with face and tray safely visible in the central 70% so a desktop editorial card can crop safely. Export 1080×1920 at 24 fps. Three new six-second shots. No title text burned into the film. No added logos or random coworkers' faces. All dialogue is in natural Malayalam, performed by the approved speaker; no unlicensed voice cloning. Mouth shapes must accurately synchronize to the final approved audio; generate/lip-sync only after the final voice track is available. Do not claim acceptable lip-sync until a fluent Malayalam reviewer has checked it.

### Shot 1 — 00:00–00:06: mission-critical brewing

New medium close-up at a compact office tea counter. The reference teammate carefully prepares fresh tea in a stainless-steel kettle, then raises one eyebrow at a harmless overdramatic desktop countdown. He pours tea neatly into two paper cups. Keep his face clearly visible and his hands anatomically correct. Tiny cinematic push-in of about 6%, a brief focused expression changing into a knowing smile. No spilling, burns, dangerous stunts, or distorted steam. He turns slightly toward camera and says with a warm, conversational comic pause:

> ജോലി ഒക്കെ പിന്നെ ചെയ്യാം, ആദ്യം ഒരു ചായ!

Delivery: playful, friendly, about 4.3 seconds; leave breathing space at the beginning and end. Meaning: Work can wait a bit—first, tea! Use the licensed/consented voice file for this exact line.

### Shot 2 — 00:06–00:12: the dramatic delivery

A completely new office corridor shot. The same teammate walks steadily toward camera carrying a small green tray with four stable paper cups. Start with a low tray-level angle, then gently track backward and tilt up to his face. Play the entrance as if it were a heroic action-film arrival, but with everyday office sincerity. One controlled 5% camera push-in and a small satisfied grin. Cups do not duplicate, merge, float, or spill. He looks toward an unseen team and says:

> ചായ റെഡി! എല്ലാവരും വേഗം വാ!

Delivery: cheerful, gently triumphant, natural Malayalam, about 3.5 seconds. Keep lip-sync and facial identity stable during the camera move.

### Shot 3 — 00:12–00:18: the office invitation

New medium portrait shot at the tea table. The reference teammate puts down the tray gently, gives the camera a friendly beckoning gesture, then a tiny amused shoulder shrug and smile. Camera makes a very slow 4% push-in, with no abrupt face zoom. Keep the face, fingers, and tray continuous. He says:

> ഡാ മക്കളേ, ചായ കുടിക്കാൻ വരുന്നില്ലേ?

Delivery: affectionate office banter, not shouting or mockery, about 4.2 seconds with a humorous half-second pause before the final invitation. End with a held smiling expression for at least 0.7 seconds, so the final scroll frame is clear.

## Negative prompt / reject criteria

Reject changed facial identity; different ages, hair, glasses or facial features; beauty-filter smoothing; replacement or blended faces; extra fingers; distorted teeth, cups, or tray; duplicated cups; liquid passing through objects; accidental background faces; invented speech; non-Malayalam accents presented as natural Malayalam; lip movements that disagree with phonemes; involuntary facial tics; exaggerated camera shake; unsafe pouring; misleading claims that this fictional performance is an authentic office recording.

## Voice / sound direction

Record each line separately as clean 48 kHz WAV. Use the consented teammate or a licensed Malayalam actor; do not imitate an identifiable third-party voice. A generic actor must not be described as the teammate's authentic voice. Warm conversational Malayalam, light office comedy, gentle breath, no caricature or forced accent. Supply voice consent/license reference and correct pronunciation review. Normalize spoken tracks around -18 LUFS with peaks below -2 dBTP. Soft cup clink/pour effects must stay underneath the voice; no continuous loud soundtrack. Add captions matching the final words exactly.

## Reviewable exports

1. Review master: 18-second H.264 film with final licensed voice and correct lip-sync, plus a silent review copy.
2. Poster: natural held smiling frame, same identity.
3. Synchronized WebVTT captions for spoken film playback.
4. Optimized silent visual frames: 12 fps, width 240–360, WebP, bounded to 240 frames. Generate these from the NEW film only.
5. Separate approved voice lines for optional click-triggered audio.
6. A provenance and consent reference, content hash of the new film, and owner publication approval.

Scroll scrubbing controls visuals, including reverse scroll. It cannot continuously lip-sync arbitrary spoken audio to irregular scrolling. Therefore scroll mode is silent with optional gentle effects. The explicit **Play cinematic film** action plays the approved film at its real timing; optional sound then preserves the film's actual lip-sync. Do not auto-speak dialogue as the user scrolls.

## Integration

`src/frame-player.js` is an on-demand, bounded image renderer. `src/tea-experience.js` uses GSAP ScrollTrigger to drive an approved sequence. `src/media-config.js` keeps generated video and voice disabled unless `publicationApproved`, `consentReference`, `license`, and approved asset paths are supplied. No original-video frames are configured as the new cinematic sequence.

Before approval, the website shows its existing reference photo. No old video, old frame sequence, or unapproved film is loaded. The film playback control only appears when a new approved asset is configured. The order form, prices, shared password, sponsorship, payment book, and Supabase logic are unchanged.
