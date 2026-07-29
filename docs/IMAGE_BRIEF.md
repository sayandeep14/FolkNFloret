# Folk & Floret — asset brief

What the site uses, what is still missing, and the encoding rules.

Stills: **16:9, 2752 × 1536 or larger**, PNG. The build converts to web JPEG in
`public/imagery/`.

House style for every prompt — keep this consistent:

> Photoreal cinematic photography on a cultivated flower estate in the Indian
> foothills. Limewashed stone, old timber, linen, antique brass, handmade
> ceramic. Packaging is a dusty rose rigid box, botanical green silk ribbon,
> restrained antique-gold foil, plum chocolate box, cream ceramic candle.
> Natural imperfections, real grain, no logos, no readable text, no fantasy
> lighting, nobody looking at the camera.

---

## 1. In use now

| Slot | Asset |
|---|---|
| Chapter I — The Origin | `films/estate-descent.mp4` (scroll-scrubbed) over `estate-dawn.jpg` |
| Chapter II — The Field | `field-flight.jpg` |
| Chapter III — The Atelier | `atelier-exterior.jpg` |
| Chapter IV — The Gift | `atelier-table.jpg` |
| Chapter V — The Giving | `couple-evening.jpg` |
| Collection — Bouquets | `bouquet-tying.jpg` |
| Collection — Candles | `candle-lighting.jpg` |
| Collection — Chocolates | `chocolates.jpg` |
| Collection — Composed Gift | `gift-opening.jpg` |
| The Craft | `candles.jpg` (wax being poured) |
| Commissions / CTA | `estate-night.jpg` |

Held in `assets/ref/` but not on the site: `ref_estate_master`,
`red_estate_master_framelast_closeup`, `ref_florist`, `ref_couple_portrait`,
`ref_couple_fullbody`, `ref_packaging_master`. Good images that lost their slots
to stronger ones — no need to regenerate.

Unused video: `I_can_notice_a_scene_transitio.mp4` (720p, 10s) and
`hf_20260729_…mp4` (1080p, 8s). Neither is wired up. See §4 before adding them.

---

## 2. Still needed

### 2.1 Portrait masters — **9:16, 2160 × 3840** — the only real gap

Every frame is 16:9. On a phone the shader cover-crops to roughly the middle
half, which can drop the subject out of shot entirely. There is a per-chapter
`mobileShift` in `lib/journey.ts` dragging the crop back onto the subject, but
it is a stopgap — it cannot invent framing that was never shot.

**Re-compose, do not crop.** Move the subject; don't just centre it.

1. **Origin.** Vertical aerial down a single flower row toward distant
   foothills at sunrise, mist in the middle distance, the row leading the eye
   from the bottom of frame to the horizon in the upper third. Keep the lower
   half calm for the headline.
2. **Field.** A grower cutting blooms into a shallow woven basket, framed
   vertically, flower rows filling the foreground, the atelier small in the
   upper background.
3. **Atelier.** The stone atelier's open doorway seen vertically from the
   flower beds, the florist stepping out with a basket, roofline and sky in the
   upper third.
4. **Gift.** The wrapping table from a steep overhead angle: dusty rose box,
   green silk ribbon, ceramic candle, plum chocolate box and a loose bouquet
   arranged down the frame, bare linen occupying the top third for the
   headline.
5. **Giving.** The couple at the candlelit garden table, vertical, gift box and
   hurricane candles in the lower half, blue-hour sky and foliage above.

### 2.2 A second film — optional

Chapter I is the only scrubbed film. The obvious second is the bible's Shot 02,
the low flight through the blooms, which would carry chapter II. Only worth it
if the descent proves itself in use — two films roughly doubles the video
budget. Same encoding rules as §4.

---

## 3. Delivered

Everything previously listed here has landed:

- **Chocolates as a subject** → `chocolates.jpg`. The card was a corner crop of
  the packaging still; it now has its own frame.
- **Night aerial finale** → `estate-night.jpg`, now the Commissions background.
  The page opens at dawn and closes at night.
- **Candle being poured** → `candles.jpg`, now the Craft section, which
  previously had no imagery at all.
- **`atelier-table` at full resolution** → replaced the 1376px version with a
  1920px frame that has an even cleaner empty left third.

---

## 4. Video encoding — read before adding any film

**The single thing that matters: scroll-scrubbed video must be encoded
all-intra (`-g 1`), so every frame is a keyframe.**

`scene1.mp4` arrived with exactly **one** keyframe, at t=0. Every seek would
have decoded from frame 0 forward — up to 192 frames per scroll tick — which is
unusably janky. This is the usual reason scroll-scrubbed video stutters on the
web.

Counter-intuitively, all-intra is not more expensive here. Dense keyframes let
the bitrate drop, so the file lands *smaller* than a conventional encode at
higher resolution:

| Encode | Size |
|---|---:|
| all-intra, 1280×720, crf 27 | **6.7 MB** ← shipped |
| `-g 4`, 1280×720, crf 24 | 7.7 MB |
| `-g 12` (old bible spec), 1600 wide, crf 23 | 9.6 MB |
| all-intra, 960×540, crf 28 | **3.7 MB** ← mobile tier |

Commands:

```bash
# Desktop tier
ffmpeg -i source.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -vf scale=1280:-2 -r 24 -g 1 -crf 27 -movflags +faststart \
  public/films/<name>.mp4

# Mobile tier
ffmpeg -i source.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -vf scale=960:-2 -r 24 -g 1 -crf 28 -movflags +faststart \
  public/films/<name>-sm.mp4
```

Verify before shipping — this must equal the frame count, not 1:

```bash
ffprobe -v error -select_streams v:0 -skip_frame nokey \
  -show_entries frame=pts_time -of csv=p=0 public/films/<name>.mp4 | wc -l
```

Audio is stripped: the film never plays, it is only ever seeked.

### Composition rules for a scrubbed film

- **The last frame must lead into the next chapter's still.** The descent ends
  low on the path between the rows, which is where the Field photograph picks
  up, so the wipe reads as one continuous move. Design for this.
- **No camera move in the still it replaces.** The Ken Burns zoom is disabled
  automatically for a chapter with a film — two pushes fight each other.
- Keep the copy side of frame calm for the whole clip, not just at the ends.

---

## 5. When you deliver

Drop files anywhere in `assets/ref/` and say which is which.

Stills:

```bash
sips -s format jpeg -s formatOptions 76 --resampleWidth 1920 \
  assets/ref/<file>.png --out public/imagery/<slot>.jpg
```

Then update `lib/journey.ts` (chapters) or `lib/content.ts` (cards, craft,
CTA). `size` must be the **actual output pixel dimensions** — the shader uses it
to cover-fit, and a wrong value stretches the frame.
