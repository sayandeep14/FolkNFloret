/**
 * Every word on the page lives here so real brand copy can be dropped in
 * without touching a component.
 */

export const brand = {
  name: "Folk & Floret",
  tagline: "The Art of Curated Connection",
  note: "Flowers · Flame · Flavour · Feeling",
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
    title: ["Folk", "Floret"],
    body: "Bespoke gifts, composed by hand for the moments that deserve more than a gesture.",
    cue: "Scroll to begin",
  },
  {
    index: "II",
    eyebrow: "The Bouquet",
    title: ["Cut at", "first light"],
    body: "Garden roses, ranunculus and cosmos, gathered the morning they are given. Never held in cold storage, never repeated twice.",
  },
  {
    index: "III",
    eyebrow: "The Flame",
    title: ["Poured", "in small batch"],
    body: "Single-origin wax and botanical oils, set by hand in ceramic thrown for us alone. Forty hours of quiet, amber light.",
  },
  {
    index: "IV",
    eyebrow: "The Confection",
    title: ["Tempered", "by hand"],
    body: "Cocoa from a single estate, folded with cardamom, rose and burnt honey. Made in the morning, boxed by noon.",
  },
  {
    index: "V",
    eyebrow: "The Gift",
    title: ["Given", "with feeling"],
    body: "Three crafts, one composition — arranged, wrapped and delivered as a single act of attention.",
    cta: { label: "Explore the collections", href: "#collections" },
  },
];

export const collections = {
  eyebrow: "The Collections",
  title: "Three crafts,\nendlessly composed",
  body: "Each collection stands alone, and each was designed to be given together. Choose a single piece, or let us compose the whole.",
  items: [
    {
      no: "01",
      name: "Bouquets",
      latin: "Florilegium",
      body: "Loose, garden-grown arrangements built around a season rather than a formula.",
      meta: "From ₹4,800",
    },
    {
      no: "02",
      name: "Candles",
      latin: "Lumen",
      body: "Hand-poured botanical wax in thrown ceramic, scented to a single memory.",
      meta: "From ₹3,200",
    },
    {
      no: "03",
      name: "Chocolates",
      latin: "Confectio",
      body: "Single-estate cocoa tempered by hand and finished with cardamom and rose.",
      meta: "From ₹2,600",
    },
  ],
};

export const craft = {
  eyebrow: "The Craft",
  title: "Nothing here\nis kept in stock",
  body: "A Folk & Floret commission begins as a conversation and ends at a doorway. Between the two, four days of deliberate work.",
  steps: [
    {
      no: "01",
      name: "The conversation",
      body: "We ask who it is for, and what it is you are actually trying to say. Everything follows from the answer.",
    },
    {
      no: "02",
      name: "The composition",
      body: "Stems, scent and cocoa are chosen together so the finished gift reads as one idea rather than three parcels.",
    },
    {
      no: "03",
      name: "The making",
      body: "Cut at dawn, poured the same morning, tempered by hand. Nothing is assembled more than a day before it travels.",
    },
    {
      no: "04",
      name: "The giving",
      body: "Wrapped in dusty rose, tied in botanical silk, and placed into the right hands at the right hour.",
    },
  ],
};

export const voices = {
  eyebrow: "In their words",
  quote:
    "It arrived at eight in the morning, still cold from the field. She has kept the ribbon.",
  attribution: "Ananya R. — a commission for a first anniversary",
};

export const invitation = {
  eyebrow: "Commissions",
  title: "Begin something\nworth remembering",
  body: "We take a limited number of bespoke commissions each week so that every one receives the whole of our attention.",
  primary: { label: "Start a commission", href: "#invitation" },
  secondary: { label: "Speak with a curator", href: "#invitation" },
};

export const footer = {
  columns: [
    {
      title: "Collections",
      links: ["Bouquets", "Candles", "Chocolates", "The Composed Gift"],
    },
    {
      title: "Studio",
      links: ["Our craft", "The estate", "Seasonality", "Journal"],
    },
    {
      title: "Care",
      links: ["Delivery", "Keeping flowers", "Candle care", "Contact"],
    },
  ],
  address: "The Flower Estate, Kotagiri, Nilgiris",
  legal: "© 2026 Folk & Floret. Composed with care.",
};
