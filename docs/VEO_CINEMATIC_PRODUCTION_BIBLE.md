# Folk & Floret — Cinematic World Production Bible

## Purpose

This document defines the footage needed to transform the landing page from a
stylized 3D garden into a photoreal, living world.

The final experience should feel like a continuous luxury short film:

1. Dawn over real flower fields.
2. A drone descends into flowers moving naturally in the wind.
3. Growers harvest blooms and a florist curates a gift.
4. A candle is lit inside a warm atelier.
5. A couple shares the gift during a romantic garden date.
6. The camera rises into a final wide garden reveal.

Do not attempt to create the people, realistic fields, or intimate human
interactions as procedural Three.js models. Generate them as controlled
cinematic footage. The website will use the footage as scroll-driven,
full-screen video layers, with WebGL reserved for subtle pollen, depth haze,
light leaks, and transitions.

## Recommended Veo workflow

Use Veo 3.1 at the highest-quality setting available to you.

Current official capabilities relevant to this production:

- Landscape and portrait generation.
- 4, 6, or 8-second clips.
- 720p, 1080p, and 4K output, subject to model/settings availability.
- Native synchronized ambience and sound.
- First-frame and last-frame interpolation.
- Up to three image references for consistent people, locations, objects, and
  visual style.
- Video extension for continuing a successful shot.

Google’s recommended prompt structure is:

> Cinematography + Subject + Action + Context + Style and ambiance

Official references:

- [Google Cloud: Ultimate prompting guide for Veo 3.1](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1/)
- [Gemini API: Generate videos with Veo 3.1](https://ai.google.dev/gemini-api/docs/veo)
- [Google DeepMind: Veo](https://deepmind.google/technologies/veo/)

## The creative idea

### Working title

**From Field to Feeling**

### Emotional arc

| Chapter | Time | Emotion | Camera language |
|---|---:|---|---|
| The Origin | Dawn | Wonder, scale, possibility | High aerial drone descending |
| The Bloom | Morning | Freshness, movement, touch | Low FPV glide and tracking |
| The Curation | Afternoon | Craft, attention, abundance | Crane-to-medium and macro |
| The Flame | Golden hour | Warmth, intimacy, anticipation | Macro rack focus and dolly |
| The Connection | Blue hour | Romance, generosity, presence | Long shot into intimate orbit |
| The Memory | Night | Fulfilment, magic, permanence | Pull-back and aerial rise |

### Visual world

- A real, cultivated flower estate in the foothills of India.
- Long rows of garden roses, ranunculus, dahlias, marigolds, cosmos, and
  lavender.
- Natural variation: uneven stems, soil, dew, insects, drifting pollen, and
  leaves with minor imperfections.
- Architecture is refined but grounded: limewashed stone, old timber,
  linen-covered worktables, antique brass, handmade ceramic vessels.
- Packaging is premium but not flashy: dusty rose boxes, deep plum typography,
  botanical green ribbon, subtle antique-gold foil.
- Human wardrobe is contemporary Indian luxury in natural materials—never
  bridal, ceremonial, costume-like, or over-styled.

### Color progression

- Dawn: misty cream, pale peach, dew green.
- Morning: botanical greens, coral, rose, marigold.
- Afternoon: linen, terracotta, cocoa, plum.
- Golden hour: honey, candle amber, soft rose.
- Blue hour: deep green, muted mauve, warm candlelight.
- Night: ink blue, plum, pools of amber, soft floral color.

## Continuity bible

Create these references before generating any video.

### Reference A — The estate

Filename: `ref_estate_master.png`

Prompt:

```text
Photoreal cinematic location reference for a luxury Indian flower estate in
the foothills at sunrise. Long cultivated rows of garden roses, ranunculus,
dahlias, marigolds, cosmos and lavender follow the gentle contours of the
land. A small limewashed stone-and-timber floral atelier stands at the edge of
the fields. Distant low mountains, faint morning mist, mature trees, narrow
earth paths, natural agricultural detail, no fantasy architecture. Refined,
quiet, believable, tactile. Soft warm dawn backlight, realistic atmospheric
perspective, deep natural color, large-format cinema photography, 16:9.
Leave the middle third visually calm enough for editorial typography.
```

### Reference B — The packaging

Filename: `ref_packaging_master.png`

Prompt:

```text
Photoreal luxury gifting brand packaging reference on a natural linen table:
a dusty rose rigid gift box with a botanical green silk ribbon, restrained
antique-gold foil details, an elegant cream candle in a handmade ceramic
vessel, artisan chocolates in a plum box, and a loose garden bouquet of roses,
ranunculus, dahlias and cosmos. Handmade, premium, contemporary, warm and
tactile. Real paper grain, minor natural imperfections, soft side light,
cinematic commercial product photography, no readable brand text, no logos,
16:9.
```

### Reference C — The couple

Generate both a clean portrait and a full-body reference. Keep clothing,
hair, accessories, age, and facial structure identical.

Filename: `ref_couple_portrait.png`

```text
Photoreal character reference of an adult Indian couple in their early
thirties, photographed together in soft window light. The woman has warm
medium-brown skin, expressive dark eyes, shoulder-length naturally wavy black
hair, minimal gold earrings, and a muted rose silk blouse. The man has warm
medium-brown skin, short textured black hair, light natural stubble, and a
deep forest-green linen shirt. Contemporary, relaxed, emotionally warm,
natural skin texture, realistic facial asymmetry, understated styling.
Neither person looks at the camera; they share a subtle spontaneous smile.
Luxury lifestyle editorial realism, neutral background, no bridal styling,
no formal wedding clothing, no text.
```

Filename: `ref_couple_fullbody.png`

```text
Full-body photoreal reference of the exact same adult Indian couple from the
portrait reference. Preserve their faces, ages, hair, clothing colors and
accessories precisely. The woman wears a flowing muted rose midi dress in
natural silk and low neutral sandals. The man wears a deep forest-green linen
shirt, tailored warm beige trousers and brown leather shoes. Relaxed natural
posture, subtle chemistry, contemporary luxury lifestyle editorial, soft
daylight, plain neutral studio background, no text.
```

### Optional Reference D — The florist

Filename: `ref_florist.png`

```text
Photoreal character reference of an adult Indian woman florist in her late
thirties with warm brown skin and naturally textured black hair tied in a
loose low bun. She wears an olive-green linen apron over a cream cotton shirt.
Her hands show believable signs of working with flowers. Calm, skilled,
assured expression, natural skin, minimal makeup, documentary-luxury
photography, soft daylight, neutral background, no text. 16:9.
```

## Global generation settings

For every principal shot:

- Aspect ratio: `16:9`.
- Duration: `8 seconds`.
- Resolution: `4K` when available; otherwise `1080p`.
- Frame rate: Veo’s native `24fps`.
- Generate at least four candidates per shot.
- Keep one successful seed for controlled variations. A seed can improve
  similarity but should not be treated as perfectly deterministic.
- Use adults only for every scene involving people.
- Prefer one continuous camera move per generated clip.
- Use the estate, packaging, and relevant character references as ingredients.
- Generate a separate `9:16` version only after the landscape edit is approved.

### Global realism direction

Append this block to every prompt:

```text
Strict photorealism and physically believable motion. Natural human anatomy,
realistic hands and fingers, natural facial micro-expressions, coherent wind
direction, physically accurate cloth, hair, foliage, candle flame and smoke.
Real optical depth of field, realistic motion blur, restrained highlight
bloom, natural dynamic range, subtle film grain, high-end luxury commercial
cinematography without looking staged or synthetic.
```

### Global exclusions

Use this as the negative prompt where Veo exposes a separate negative field:

```text
Exclude animation, illustration, CGI appearance, plastic skin, waxy faces,
beauty-filter skin, duplicated people, background faces staring at camera,
deformed hands, extra fingers, merged fingers, floating objects, morphing
flowers, melting packaging, changing wardrobe, inconsistent faces, impossible
camera acceleration, unstable horizons, excessive slow motion, oversaturated
colors, fantasy glow, heavy lens flare, artificial bokeh shapes, visible text,
misspelled typography, logos, watermarks, borders, subtitles and letterboxing.
```

## Master shot list and Veo prompts

---

## Shot 01 — Dawn over the flower estate

Final filename: `01-estate-aerial-master.mp4`

Purpose:

- Opening hero.
- Establish scale and reality immediately.
- Provide a calm central area for “Folk & Floret.”

References:

- Estate master.
- Packaging master only if a distant delivery van or atelier detail is used.

Camera:

- High aerial establishing shot.
- Smooth descending drone move.
- End at the height of the flowers, pointed down a central path.

First-frame image prompt:

```text
Extreme wide aerial first frame, 120 metres above the established luxury
flower estate at dawn. Long parallel and gently curving rows of roses,
ranunculus, dahlias, marigolds, cosmos and lavender create believable
agricultural patterns. Low foothills and faint mist in the distance. The
limewashed atelier is small near the edge of frame. Soft peach sun just above
the horizon, realistic shadows, photoreal, 16:9, calm negative space through
the central sky and distant fields for title typography.
```

Last-frame image prompt:

```text
Low wide-angle final frame from 1.5 metres above a narrow earth path between
waist-high flower rows on the same estate at dawn. Coral dahlias and pale
garden roses frame the left and right foreground. The path leads toward the
atelier in the distance. Flowers lean gently in one coherent breeze. Real
soil, dew and leaf imperfections, photoreal cinematic natural light, 16:9,
open center for title typography.
```

Veo prompt:

```text
Single continuous eight-second aerial-to-ground drone shot using the provided
first and last frames.

[00:00-00:02] Extreme wide aerial view above the flower estate at dawn. The
drone glides forward slowly. Morning mist drifts above the lowest fields.

[00:02-00:06] The drone performs a smooth, physically believable descending
arc while moving forward over the flower rows. The horizon remains stable.
Rows of blooms move in one soft breeze, creating waves of natural motion.

[00:06-00:08] The drone levels out just above the central path and continues a
gentle forward glide between flowers, ending exactly on the supplied final
frame. No abrupt speed change.

Light: warm dawn backlight with soft cool shadows and realistic atmospheric
perspective.
Ambient sound: distant morning birds, soft wind moving through thousands of
stems, very faint rural ambience. No music and no dialogue.
```

Approval criteria:

- The descent feels mechanically possible.
- Horizon does not roll.
- Flower rows remain cultivated and do not morph.
- Wind is coherent across the full field.
- There is central breathing room for the title.

---

## Shot 02 — Flying through the blooms

Final filename: `02-field-flight-master.mp4`

Purpose:

- Deliver the feeling of travelling through a living field.
- Introduce workers without making them the focus.

References:

- Estate master.
- Florist reference.

Camera:

- Low FPV-style drone.
- Close foreground parallax.
- A restrained climb into a long shot of harvesting.

First frame:

- Use the approved last frame from Shot 01.

Last-frame image prompt:

```text
Long-lens cinematic view across the same flower field in early morning.
Three adult growers are naturally harvesting blooms into shallow woven
baskets. The established florist in an olive apron is in the middle distance,
seen in three-quarter profile, inspecting one rose. Flower rows frame the
foreground with realistic shallow depth of field. The atelier sits behind
them. Photoreal, observational, warm morning light, 16:9.
```

Veo prompt:

```text
One continuous photoreal low-flight tracking shot, beginning from the final
frame of the previous scene.

[00:00-00:03] A stabilized low drone glides forward along the narrow earth
path between dense flower rows. A few petals and leaves pass very close to the
lens with strong natural parallax. The flowers bend and recover in a gentle
cross-breeze; nothing touches or obscures the lens completely.

[00:03-00:06] The camera banks gradually right around the end of a row and
rises from waist height to three metres.

[00:06-00:08] The move settles into a long shot of adult growers carefully
cutting flowers and placing them into woven baskets. The established florist
quietly inspects one bloom. Nobody looks at the camera.

Lens: 24mm during the field flight, resolving into the visual feeling of a
50mm long shot without a visible lens-change artifact. Natural motion blur,
deep environmental detail.
Ambient sound: wind through leaves, quiet snips of pruning shears, distant
birds, soft footsteps on soil. No dialogue and no music.
```

Approval criteria:

- The flight never resembles a video-game camera.
- Foreground flowers do not morph as they pass.
- All workers are adults with consistent anatomy.
- Harvesting actions are agricultural and believable.

---

## Shot 03 — From harvest to curation

Final filename: `03-curation-atelier-master.mp4`

Purpose:

- Connect the field to the gifting craft.
- Feature bouquets, chocolate, candle, packaging, and human hands.

References:

- Estate master.
- Packaging master.
- Florist reference.

Camera:

- Start as an exterior long shot.
- Crane down and track through an open atelier doorway.
- End as a medium close shot of the florist’s hands.

First-frame image prompt:

```text
Wide exterior view of the established limewashed flower atelier in late
morning. Its broad timber doors are fully open to the fields. The established
florist carries a woven basket of freshly cut flowers toward a long linen
worktable visible inside. Natural cross-breeze moves her apron and loose hair.
Photoreal cinematic architecture and landscape, 16:9.
```

Last-frame image prompt:

```text
Medium close-up inside the same atelier: the established florist’s realistic
adult hands tie a botanical-green silk ribbon around a loose garden bouquet.
On the linen worktable sit the approved dusty rose gift box, ceramic candle,
plum artisan-chocolate box, brass scissors and scattered stems. Soft window
light, tactile paper and fabric texture, no readable text, photoreal luxury
editorial, 16:9.
```

Veo prompt:

```text
Single continuous crane-and-dolly transition from the flower field into the
atelier, using the supplied first and last frames.

[00:00-00:02] Wide exterior long shot. The florist walks naturally toward the
open atelier carrying a believable basket weight. Wind moves the field behind
her.

[00:02-00:05] The camera performs a gentle crane descent and forward dolly
through the open doorway, passing from bright morning sunlight into soft
interior shade. Exposure adapts gradually like a real cinema camera.

[00:05-00:08] The camera settles beside the worktable as the florist lays down
the basket, gathers the stems and completes one precise ribbon tie around the
bouquet. Her hands remain anatomically correct and the ribbon follows real
cloth physics. End on the supplied hand-and-bouquet frame.

Ambient sound: field wind fading into quiet room tone, basket placed on wood,
paper rustle, stems brushing linen, scissors set gently on the table. No
dialogue and no music.
```

Approval criteria:

- Exposure transition feels optical, not like a crossfade.
- The florist remains the same person.
- Packaging colors and proportions match the reference.
- Fingers, ribbon, stems, and scissors remain stable.

---

## Shot 04 — The flame

Final filename: `04-candle-lighting-master.mp4`

Purpose:

- Slow the rhythm.
- Create warmth, intimacy, and a sensory transition toward evening.
- Support “Tactile. Thoughtful. Timeless.”

References:

- Packaging master.
- Florist reference if her hands appear.
- Atelier reference or a still from approved Shot 03.

Camera:

- Extreme macro of wick.
- Rack focus through flame.
- Slow dolly backward revealing the finished gift arrangement.

First-frame image prompt:

```text
Extreme macro first frame of a natural cotton candle wick in the approved
handmade cream ceramic candle. An adult woman’s anatomically correct hand
holds a lit wooden match one centimetre from the wick. The wick is not yet
burning. Background is the established atelier at golden hour, completely
soft but still natural. Photoreal macro cinema photography, realistic skin
pores and nail texture, 16:9.
```

Last-frame image prompt:

```text
Medium product-and-lifestyle final frame inside the same atelier at golden
hour. The candle now burns with a small steady flame beside the finished
bouquet, dusty rose gift box and artisan chocolates. The florist is a soft,
recognizable silhouette in the background closing the ribbon box. Sunlight
creates a warm band across the linen table. Photoreal luxury campaign,
shallow depth of field, negative space on the left for typography, 16:9.
```

Veo prompt:

```text
One continuous macro-to-medium dolly shot using the supplied first and last
frames.

[00:00-00:02] Extreme macro. The wooden match moves naturally to the cotton
wick. The wick catches after a brief realistic delay. The flame is initially
small and blue at its base.

[00:02-00:04] A thin thread of smoke curls from the match as the hand withdraws
smoothly out of frame. The camera racks focus from the match to the candle
flame.

[00:04-00:08] The camera slowly dollies backward and slightly left, revealing
the completed bouquet, gift box and chocolates in warm golden-hour light. The
candle flame reacts subtly to room air but stays lit. End exactly on the
supplied composition with clean negative space for copy.

Lens: true macro resolving into an 85mm medium product view. Warm highlights,
natural shadow detail, subtle optical halation only around the flame.
Ambient sound: wooden match strike, tiny wick ignition, soft room tone, silk
ribbon sliding across paper. No dialogue and no music.
```

Approval criteria:

- Ignition physics are convincing.
- The hand exits without morphing.
- Flame size remains restrained.
- No fantasy particles or exaggerated glow.

---

## Shot 05 — A gift becomes a moment

Final filename: `05-couple-date-master.mp4`

Purpose:

- Show the emotional outcome of gifting.
- Introduce the couple during a believable romantic garden date.

References:

- Couple portrait or full-body reference.
- Packaging master.
- Estate master.

Camera:

- Begin as a long shot through foreground flowers.
- Slow compression-lens push-in.
- Finish with a subtle 70-degree orbit as the gift is opened.

First-frame image prompt:

```text
Photoreal long shot at blue hour through softly out-of-focus foreground
flowers. The established adult Indian couple sits at a small linen-covered
table in a quiet garden clearing on the flower estate. Real candles glow in
glass hurricanes. The dusty rose gift box rests between them. Contemporary,
understated romantic date, no event decor, no wedding styling, natural
conversation and posture. Deep green foliage, cobalt evening sky, warm pools
of candlelight, 16:9. Keep the upper-left area calm for typography.
```

Last-frame image prompt:

```text
Intimate two-shot of the exact same adult Indian couple at the same garden
table. The woman has just lifted the lid of the dusty rose gift box and sees
the bouquet, candle and chocolates inside. She gives a spontaneous quiet smile
to her partner; he watches her rather than the camera. Candlelight reflects
naturally in their eyes. Real hands, unchanged wardrobe and faces, flowers
moving gently in the evening breeze, photoreal cinematic intimacy, 16:9.
```

Veo prompt:

```text
Single continuous long-shot-to-intimate-orbit move with the supplied couple,
estate and packaging references.

[00:00-00:03] Long shot through foreground flowers. The couple speaks quietly
without audible dialogue. The man slides the dusty rose gift box across the
linen table with both hands. Candle flames and nearby flowers respond to a
gentle evening breeze.

[00:03-00:06] The camera performs a slow long-lens dolly push toward them. The
woman rests one hand on the box, unties the botanical-green ribbon once, and
lifts the lid naturally.

[00:06-00:08] As she sees the curated gifts, the camera completes a restrained
70-degree clockwise orbit into an intimate two-shot. She shares a spontaneous
smile with him; he smiles back. Their eye lines meet naturally. Nobody looks
at the camera.

Light: realistic blue-hour ambience balanced with warm candlelight on skin.
Maintain facial identity, wardrobe, table arrangement, box dimensions and
hand anatomy throughout.
Ambient sound: evening insects, light wind through leaves, soft ribbon and
paper sounds, distant birds settling, a quiet natural laugh without spoken
words. No music.
```

Approval criteria:

- Both characters match the references.
- The gift action is simple and physically continuous.
- Reactions are subtle, not advertisement-style surprise.
- Table objects do not teleport or change scale.

---

## Shot 06 — The garden remembers

Final filename: `06-night-garden-finale-master.mp4`

Purpose:

- Create the final cinematic release.
- Provide a strong background for the final CTA.
- End with scale and emotional closure.

References:

- Estate master.
- Couple reference.
- An approved final frame from Shot 05.

Camera:

- Start close behind the opened gift.
- Pull backward through candlelit flowers.
- Transition into a crane/drone rise above the garden.

First frame:

- Use the approved last frame from Shot 05 or generate a matched reverse angle.

Last-frame image prompt:

```text
High, majestic aerial final frame of the same flower estate at night under a
deep indigo sky. Warm candlelit paths form a subtle organic route through the
fields toward the glowing atelier. The established couple appears as small
natural silhouettes walking together along one path. The garden remains
realistic and cultivated, not a fantasy light installation. Thin evening
mist, distant foothills, restrained warm light, photoreal cinematic scale,
16:9. Leave the central sky and upper field visually calm for the final
message and CTA.
```

Veo prompt:

```text
One continuous cinematic pull-back and aerial-rise finale, beginning from the
approved intimate date scene and ending on the supplied aerial frame.

[00:00-00:02] The camera pulls backward slowly from the open gift and the
couple, passing behind a few softly focused flowers and candle flames.

[00:02-00:05] The movement becomes a smooth crane rise above the garden table.
The couple stands naturally and begins walking side by side along the path.
They do not pose or look toward the camera.

[00:05-00:08] The crane movement transitions seamlessly into a high aerial
drone rise, revealing the real flower estate at blue hour becoming night. Warm
atelier windows and occasional protected candle lanterns define the paths.
The horizon stays stable and the camera decelerates gently into the supplied
final frame.

Light: deep natural indigo ambient light with restrained candle amber. No
fantasy glow and no excessive artificial lighting.
Ambient sound: garden insects, soft wind, distant footsteps on gravel, leaves
and flowers moving. A sparse, warm instrumental note may enter only during the
last two seconds; no vocals and no dialogue.
```

Approval criteria:

- The camera transition from crane to aerial feels continuous.
- The couple becomes smaller naturally without identity morphing.
- Candlelit paths look plausible and safe.
- Final frame has enough visual quiet for the CTA.

## Optional transition inserts

Generate these only if the principal shots cannot be joined cleanly.

### Insert A — Flower occlusion wipe

Filename: `tx-flower-occlusion.mp4`

```text
Photoreal 2-second transition plate. A stabilized camera moves forward past a
single dark rose bloom extremely close to the lens. The petals naturally fill
the entire frame for eight to twelve frames before revealing warm atelier
light on the other side. Real petal texture, coherent motion blur, no morphing,
no artificial dissolve, 16:9.
```

### Insert B — Candle flare transition

Filename: `tx-candle-flare.mp4`

```text
Photoreal 2-second optical transition plate. A real candle flame passes close
to the edge of a cinema lens, creating a restrained warm optical flare that
briefly fills most of the frame, then resolves into deep blue-hour garden
bokeh. Physically plausible lens behavior, no fantasy particles, no digital
glitch, 16:9.
```

## Generation workflow

### Phase 1 — Lock references

1. Generate 8–12 estate candidates.
2. Select one master estate with readable flower rows and real agricultural
   structure.
3. Generate packaging against a plain linen surface until proportions,
   materials, and colors are stable.
4. Generate the couple portrait.
5. Use the approved portrait to derive the full-body character reference.
6. Create the optional florist reference.
7. Do not start video generation until these references are approved.

### Phase 2 — Generate anchor frames

For each shot:

1. Generate the first frame.
2. Generate the last frame using the same references and precise continuity
   language.
3. Compare horizon, sun direction, wardrobe, hair, packaging, and location.
4. Reject anchor pairs with incompatible geometry or lighting.
5. Upscale and lightly color-match the approved pair before sending them to
   Veo.

### Phase 3 — Generate motion

1. Use first-and-last-frame interpolation for Shots 01, 03, 04, and 06.
2. Use ingredients/reference-image generation for Shots 02 and 05.
3. Generate four candidates for each shot before rewriting the prompt.
4. Change only one prompt variable per iteration:
   - camera speed;
   - subject action;
   - wind strength;
   - lens/focus;
   - lighting.
5. Save the prompt, model version, seed, references, and candidate number in a
   shot log.

### Phase 4 — Continuity edit

1. Assemble all six approved clips on a 24fps timeline.
2. Match motion direction between cuts. Default travel direction is forward
   and slightly clockwise.
3. Use flower occlusion or candle flare inserts only where a direct cut fails.
4. Do not use synthetic morph transitions.
5. Keep the final master approximately 38–44 seconds before web compression.

### Phase 5 — Color and sound

1. Normalize exposure before applying a shared grade.
2. Preserve natural greens and skin tones.
3. Use a gentle progression from dawn warmth to blue-hour contrast.
4. Build one continuous ambience bed beneath the edit.
5. Remove dialogue unless a later creative decision specifically requires it.
6. Deliver a separate ambient audio master; browser video layers will autoplay
   muted until the visitor enables sound.

## Quality-control checklist

Review every frame at full resolution.

### People

- Same face, age, hairstyle, clothing, and accessories.
- Five fingers per visible hand.
- Natural hand-object contact.
- Correct eye lines.
- Realistic walking and seated posture.
- No background person stares into camera.

### Nature

- One coherent wind direction within each scene.
- Flowers bend from stems rather than translating as rigid objects.
- Petals do not duplicate, melt, or change species.
- Dew and soil remain subtle.
- Background rows do not shimmer or crawl.

### Objects

- Gift box dimensions remain fixed.
- Ribbon does not merge into hands.
- Candle flame attaches to the wick.
- Chocolate count and tray layout do not mutate during a shot.
- Brand text is added later in HTML, never generated into the footage.

### Camera

- Stable horizon in aerial shots.
- No impossible acceleration.
- No collision through solid objects unless hidden by a complete natural
  foreground occlusion.
- Motion blur matches camera speed.
- Focus transitions are gradual and motivated.

## Web delivery specifications

Keep the original Veo masters untouched. Export separate web derivatives.

### Landscape master

- Canvas: `3840 × 2160` preferred, `1920 × 1080` minimum.
- Aspect ratio: `16:9`.
- Frame rate: `24fps`, constant.
- Color: Rec.709 SDR.
- No baked-in typography, logo, subtitles, border, or letterbox.

### Portrait master

- Canvas: `2160 × 3840` preferred, `1080 × 1920` minimum.
- Aspect ratio: `9:16`.
- Re-compose scenes; do not merely crop faces and important actions.

### Web MP4

- Codec: H.264.
- Pixel format: `yuv420p`.
- Fast start enabled.
- Frequent keyframes for responsive scroll seeking: keyframe every 12 frames.
- Landscape target bitrate: approximately 8–12 Mbps at 1080p.
- Portrait target bitrate: approximately 5–8 Mbps at 1080 × 1920.
- Muted video derivative should contain no audio track.

Example encoding command:

```bash
ffmpeg -i 01-estate-aerial-master.mp4 \
  -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -r 24 -g 12 -keyint_min 12 -sc_threshold 0 \
  -crf 20 -movflags +faststart \
  01-estate-aerial-web.mp4
```

### WebM fallback

- VP9 or AV1.
- Preserve the same frame count and duration as the MP4.
- Use identical filenames with `.webm`.

## Required final asset package

Place the approved web assets into:

```text
public/films/
```

Landscape:

```text
01-estate-aerial-web.mp4
02-field-flight-web.mp4
03-curation-atelier-web.mp4
04-candle-lighting-web.mp4
05-couple-date-web.mp4
06-night-garden-finale-web.mp4
```

Optional WebM versions:

```text
01-estate-aerial-web.webm
02-field-flight-web.webm
03-curation-atelier-web.webm
04-candle-lighting-web.webm
05-couple-date-web.webm
06-night-garden-finale-web.webm
```

Portrait:

```text
mobile/01-estate-aerial-web.mp4
mobile/02-field-flight-web.mp4
mobile/03-curation-atelier-web.mp4
mobile/04-candle-lighting-web.mp4
mobile/05-couple-date-web.mp4
mobile/06-night-garden-finale-web.mp4
```

Posters:

```text
posters/01-estate-aerial.jpg
posters/02-field-flight.jpg
posters/03-curation-atelier.jpg
posters/04-candle-lighting.jpg
posters/05-couple-date.jpg
posters/06-night-garden-finale.jpg
```

Optional continuous audio:

```text
audio/folk-and-floret-ambience.m4a
audio/folk-and-floret-ambience.ogg
```

## Scroll integration map

| Scroll | Film | Overlay | Transition |
|---:|---|---|---|
| 0–16% | Estate aerial descent | Folk & Floret | Title fades as drone reaches flowers |
| 16–32% | Low flight through blooms | The Art of Curated Connection | Flower occlusion cut |
| 32–50% | Harvest into atelier | Tactile | Match movement through doorway |
| 50–64% | Candle ignition | Thoughtful. Timeless. | Flame flare into blue hour |
| 64–84% | Couple’s garden date | Curated gifts for moments | Slow text reveal |
| 84–100% | Night aerial finale | Explore the collection | Hold final frame |

The camera movement is authored inside the generated footage. GSAP and Lenis
will control:

- clip time;
- crossfades;
- playback smoothing;
- overlay typography;
- subtle WebGL pollen and depth haze;
- optional sound activation.

The webpage should not fake additional camera rotation over human footage with
large CSS transforms. Only use very small scale compensation during crossfades
to avoid breaking realism.

## Handoff checklist

When returning the assets, include:

- Six landscape MP4 files.
- Six portrait MP4 files.
- Six landscape posters and six portrait posters.
- The original 4K masters.
- The exact Veo prompt for every approved clip.
- Model version, seed, generation method, and references used.
- Optional audio master.

Once these files are present, the site can be converted from the current
procedural garden to the final scroll-scrubbed cinematic experience.
