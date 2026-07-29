# Folk & Floret — outstanding image brief

What the site uses today, what is still missing, and prompts for the gaps.

Generate at **16:9, 2752 × 1536 or larger** unless the entry says otherwise.
Deliver PNG; the build converts to web JPEG in `public/imagery/`.

House style for every prompt below — keep this consistent:

> Photoreal cinematic photography on a cultivated flower estate in the Indian
> foothills. Limewashed stone, old timber, linen, antique brass, handmade
> ceramic. Packaging is a dusty rose rigid box, botanical green silk ribbon,
> restrained antique-gold foil, plum chocolate box, cream ceramic candle.
> Natural imperfections, real grain, no logos, no readable text, no fantasy
> lighting, nobody looking at the camera.

---

## 1. In use now

| Slot | File | Source |
|---|---|---|
| Chapter I — The Origin | `estate-dawn.jpg` | `ref_estate_master_frame1_ultra_wide` |
| Chapter II — The Field | `field-flight.jpg` | `field_flight_master_last` |
| Chapter III — The Atelier | `atelier-exterior.jpg` | new (`7pe21p`) |
| Chapter IV — The Gift | `atelier-table.jpg` | new (`5imy1t`) |
| Chapter V — The Giving | `couple-evening.jpg` | new (`qv22p2`) |
| Collection — Bouquets | `bouquet-tying.jpg` | new (`zg9l9t`) |
| Collection — Candles | `candle-lighting.jpg` | new (`fh0ihk`) |
| Collection — Chocolates | `packaging.jpg` (crop) | `ref_packaging_master` |
| Collection — Composed Gift | `gift-opening.jpg` | new (`ycw1by`) |

Held in `assets/ref/` but not currently on the site: `ref_estate_master`,
`red_estate_master_framelast_closeup`, `ref_florist`, `ref_couple_portrait`,
`ref_couple_fullbody`. These are good images — they simply lost their slots to
stronger ones. No need to regenerate them.

**Note on `atelier-table.jpg`:** it arrived at 1376 × 768, half the resolution
of everything else. It holds up because the left third is soft and out of
focus, but a 2752 × 1536 regeneration of the same composition would be worth
having. Prompt in §2.5.

---

## 2. Still needed

Ordered by how much each would improve the page.

### 2.1 Chocolates, as a subject — **highest value**

The Chocolates card is the only slot without its own frame: it is the far-right
corner of the packaging still, cropped to the extreme (`object-position:
100% 50%`). It does read as chocolates — the open plum box and truffles are
clear — but it shares the gift box with the Composed Gift card, and it is the
one product on the site never photographed as the subject. A dedicated frame
would also free that crop to be less severe.

```text
Photoreal macro product photograph of artisan chocolates on a linen-covered
timber table in a limewashed stone workroom. Eight to ten hand-tempered
truffles and filled squares sit in a plum-coloured rigid box with a fitted
paper tray, one lifted onto a small handmade ceramic dish beside it. Visible
craft detail: cocoa dusting, a hand-piped line of tempered chocolate, a faint
bloom of cardamom powder, one truffle cut open to show a soft rose-and-honey
ganache. Soft directional afternoon window light from the left, shallow depth
of field, deep natural browns against dusty rose and linen. Cinematic
commercial food photography, no logos, no readable text, 16:9.
```

### 2.2 Night aerial finale — closing frame for the commission CTA

The bible's Shot 06 last frame. The CTA section currently sits on flat ink;
this would let the journey end on an image instead. Its own brief already
exists in `VEO_CINEMATIC_PRODUCTION_BIBLE.md` (§ Shot 06) — reproduced here so
this file stands alone.

```text
High, majestic aerial final frame of a cultivated flower estate at night under
a deep indigo sky. Warm candlelit paths form a subtle organic route through
the fields toward a glowing limewashed stone atelier. An adult couple appears
as small natural silhouettes walking together along one path. The garden
remains realistic and cultivated, not a fantasy light installation. Thin
evening mist, distant foothills, restrained warm light, photoreal cinematic
scale, 16:9. Leave the central sky and upper field visually calm for the final
message and CTA.
```

### 2.3 Portrait masters for phones — **9:16, 2160 × 3840**

Every frame is currently 16:9, and on a phone the shader covers to fill, which
crops hard into the sides and throws away composition. Re-compose rather than
crop — move the subject, do not just centre it.

Needed for the five journey chapters:

1. **Origin, portrait.** Vertical aerial down a single flower row toward
   distant foothills at sunrise, mist in the middle distance, the row leading
   the eye from the bottom of the frame to the horizon in the upper third.
   Keep the lower half calm for the headline.
2. **Field, portrait.** A grower cutting blooms into a shallow woven basket,
   framed vertically with flower rows filling the foreground and the atelier
   small in the upper background.
3. **Atelier, portrait.** The stone atelier's open doorway seen vertically
   from the flower beds, the florist stepping out with a basket, roofline and
   sky in the upper third.
4. **Gift, portrait.** The wrapping table shot from above at a steep angle:
   dusty rose box, green silk ribbon, ceramic candle, plum chocolate box and
   a loose bouquet arranged down the frame, bare linen occupying the top
   third for the headline.
5. **Giving, portrait.** The couple at the candlelit garden table, vertical,
   with the gift box and hurricane candles in the lower half and blue-hour
   sky and foliage above.

### 2.4 Candle being poured — for the Craft section

The Craft section is the one part of the page with no imagery at all. A
making-of frame for step 02 or 03 would let it carry a photograph.

```text
Photoreal close photograph of a candlemaker pouring warm cream-coloured
botanical wax from a small brass pouring pitcher into a handmade speckled
ceramic vessel, on a linen-covered timber bench in a limewashed stone
workroom. A wick is held straight by a simple wooden bridge. Dried lavender,
rose petals and small amber oil bottles sit nearby, softly out of focus. Warm
side light from a window at the left, gentle steam, shallow depth of field,
honest craft detail. No logos, no readable text, 16:9.
```

### 2.5 `atelier-table` at full resolution — optional

Same composition as the supplied `5imy1t`, regenerated larger.

```text
Photoreal interior photograph of a limewashed stone floral atelier in warm
late-morning window light. In the foreground, a long linen-covered table runs
from the lower left of the frame to the right. On the right-hand third: a
dusty rose rigid gift box tied with botanical green silk ribbon, a lit cream
ceramic candle, a small porcelain dish of artisan chocolates, and a loose
garden bouquet of roses, ranunculus, dahlias, cosmos and lavender. In the
mid-background on the right, an adult Indian florist in an olive apron ties
ribbon around a second box, seen in three-quarter profile, not looking at the
camera. The left third of the frame is deliberately empty — bare limewashed
wall and plain linen tabletop crossed by a soft diagonal shaft of window
light — reserved for typography. Photoreal, tactile, unstyled, no logos, no
readable text, 16:9.
```

---

## 3. When you deliver

Drop the PNGs anywhere in `assets/ref/` and say which is which. The
conversion step is:

```bash
sips -s format jpeg -s formatOptions 76 --resampleWidth 1920 \
  assets/ref/<file>.png --out public/imagery/<slot>.jpg
```

Then update the `image` and `size` fields in `lib/journey.ts` (chapters) or
`lib/content.ts` (collection cards). `size` must be the **actual output pixel
dimensions** — the shader uses it to cover-fit, and a wrong value stretches the
frame.
