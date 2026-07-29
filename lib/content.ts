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

export const collections = {
  eyebrow: "The Collections",
  title: ["Three crafts,", "endlessly composed"],
  body: "Each collection stands alone, and each was designed to be given together.",
  /**
   * `focus` is a CSS object-position. The candle and the chocolates are two
   * different crops of the same packaging photograph — the only shot in the
   * library where either product appears.
   */
  items: [
    {
      no: "01",
      name: "Bouquets",
      latin: "Florilegium",
      body: "Loose, garden-grown arrangements built around a season rather than a formula. Cut at dawn on the estate and never held in cold storage.",
      meta: "From ₹4,800",
      image: "/imagery/estate-closeup.jpg",
      focus: "50% 62%",
    },
    {
      no: "02",
      name: "Candles",
      latin: "Lumen",
      body: "Single-origin wax and botanical oils, hand-poured into ceramic thrown for us alone. Forty hours of quiet, amber light.",
      meta: "From ₹3,200",
      image: "/imagery/packaging.jpg",
      focus: "22% 42%",
    },
    {
      no: "03",
      name: "Chocolates",
      latin: "Confectio",
      body: "Cocoa from a single estate, tempered by hand and folded with cardamom, rose and burnt honey. Made in the morning, boxed by noon.",
      meta: "From ₹2,600",
      image: "/imagery/packaging.jpg",
      focus: "90% 74%",
    },
    {
      no: "04",
      name: "The Composed Gift",
      latin: "Totum",
      body: "All three, arranged as one idea — flowers, flame and flavour wrapped in dusty rose and botanical silk, delivered to the hour.",
      meta: "From ₹9,400",
      image: "/imagery/couple.jpg",
      focus: "50% 40%",
    },
  ],
};

export const craft = {
  eyebrow: "The Craft",
  title: ["Nothing here", "is kept in stock"],
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
  quote: [
    "It arrived at eight in the morning,",
    "still cold from the field.",
    "She has kept the ribbon.",
  ],
  attribution: "Ananya R. — a commission for a first anniversary",
};

export const invitation = {
  eyebrow: "Commissions",
  title: ["Begin something", "worth remembering"],
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
