/**
 * Every word on the page lives here so real brand copy can be dropped in
 * without touching a component.
 */

export const brand = {
  name: "Folks & Florets",
  tagline: "The Art of Keeping",
  note: "Preserved · Poured · Tempered · Kept",
};

export const nav = [
  { label: "Collections", href: "#collections" },
  { label: "The Craft", href: "#craft" },
  { label: "Commissions", href: "#invitation" },
];

/** The five chapters of the pinned 3D journey. */
export const chapters = [
  {
    index: "I",
    eyebrow: "Welcome",
    title: ["Folks", "Florets"],
    body: "An artisanal house of preserved botanicals, hand-poured light and estate provisions — composed for the moments meant to be kept.",
    cue: "Scroll to begin",
  },
  {
    index: "II",
    eyebrow: "The Preserved",
    title: ["Kept,", "never cut"],
    body: "Whole florets, moss and pressed stems, dried slow and set beneath optical glass or clear resin. Nothing wilts, nothing is watered. It simply stays.",
  },
  {
    index: "III",
    eyebrow: "The Flame",
    title: ["Poured", "in small batch"],
    body: "Coconut-soy wax and botanical oils, poured by hand into heavy frosted flint and capped in turned oak. Cedarwood, lavender, bergamot — forty hours of quiet, amber light.",
  },
  {
    index: "IV",
    eyebrow: "The Table",
    title: ["Tempered", "by hand"],
    body: "Single-estate couverture finished with rose and sea salt, and raw mono-floral honey sealed under a brass medallion set with dried chamomile.",
  },
  {
    index: "V",
    eyebrow: "The Gift",
    title: ["Given", "to be kept"],
    body: "Three houses, one composition — laid into velvet, veiled in vellum, closed with a wax seal holding a single dried floret.",
    cta: { label: "Explore the collections", href: "#collections" },
  },
];

export const collections = {
  eyebrow: "The Collections",
  titleLines: ["Three houses,", "one language"],
  body: "Aromatics, epicurean provisions and preserved botanicals. Each house stands alone, and each was drawn to be given alongside the others.",
  items: [
    {
      no: "01",
      name: "Aromatics",
      latin: "Lumen",
      body: "Hand-poured coconut-soy candles in frosted flint and turned oak, whole-flower tisanes and mineral botanical soaks.",
      meta: "From ₹1,450",
    },
    {
      no: "02",
      name: "Epicurean",
      latin: "Mensa",
      body: "Raw mono-floral honey, single-origin couverture finished with rose and salt, gilded truffles and glazed botanical nuts.",
      meta: "From ₹1,250",
    },
    {
      no: "03",
      name: "Preserved",
      latin: "Herbarium",
      body: "Reindeer moss set in turned walnut and cast stone, pressed botanicals floating between optical glass, plantable seed-paper journals.",
      meta: "From ₹1,100",
    },
  ],
};

export const suites = {
  eyebrow: "The Suites",
  titleLines: ["Composed", "in three tiers"],
  body: "Every piece can be given on its own. Most are given together — and the architecture of that giving is drawn as carefully as the pieces inside it.",
  items: [
    {
      no: "01",
      name: "Statements",
      body: "A single piece, given whole. The candle in its linen cube, the honey vault with its turned dipper, the moss vessel in cast stone.",
      meta: "₹1,100 – ₹2,800",
    },
    {
      no: "02",
      name: "Rituals",
      body: "Two pieces drawn to one another — flame and tisane, honey and tea, candle and seed-paper journal — set side by side in velvet-lined foam.",
      meta: "₹2,800 – ₹3,800",
    },
    {
      no: "03",
      name: "Suites",
      body: "The full house in a keepsake chest or a linen-bound trunk: aromatics, provisions, preserved botanicals and solid brass ritual tools.",
      meta: "₹5,800 – ₹18,000",
    },
  ],
};

export const craft = {
  eyebrow: "The Craft",
  titleLines: ["Nothing here", "is meant to wilt"],
  body: "A Folks & Florets commission begins as a conversation and ends at a doorway. Between the two, weeks of slow and deliberate work.",
  steps: [
    {
      no: "01",
      name: "The gathering",
      body: "Botanicals are taken at their fullest and straight to low heat. What we keep is chosen for how it will read in three years, not this afternoon.",
    },
    {
      no: "02",
      name: "The preserving",
      body: "Pressed flat between blotting sheets, or suspended in clear resin and optical glass. Colour is held by glycerine, never by dye.",
    },
    {
      no: "03",
      name: "The composition",
      body: "Scent, provision and preserved form are drawn together so a finished suite reads as one idea rather than several parcels.",
    },
    {
      no: "04",
      name: "The presentation",
      body: "Cut foam under ivory velvet, a veil of vellum, and a hand-poured wax seal set with dried florets. No shred, no filler, nothing loose.",
    },
  ],
};

export const voices = {
  eyebrow: "In their words",
  quote:
    "It arrived two winters ago. The candle is long since burned, and the pressed stems are still standing on her desk.",
  attribution: "Ananya R. — a commission for a first anniversary",
};

export const invitation = {
  eyebrow: "Commissions",
  titleLines: ["Begin something", "worth keeping"],
  body: "We take a limited number of bespoke commissions each week, and corporate suites by the season, so that every one receives the whole of our attention.",
  primary: { label: "Start a commission", href: "#invitation" },
  secondary: { label: "Speak with a curator", href: "#invitation" },
};

export const footer = {
  columns: [
    {
      title: "Collections",
      links: ["Aromatics", "Epicurean", "Preserved", "The Suites"],
    },
    {
      title: "Studio",
      links: ["Our craft", "Preserving", "Materials", "Journal"],
    },
    {
      title: "Care",
      links: ["Delivery", "Preserved botanicals", "Candle care", "Contact"],
    },
  ],
  address: "The Botanical Studio, Kotagiri, Nilgiris",
  legal: "© 2026 Folks & Florets. Composed to be kept.",
};
