/**
 * The five chapters of the pinned journey. Each one owns a photograph, the
 * copy laid over it, and how the camera should drift within that frame.
 */
export type Chapter = {
  index: string;
  eyebrow: string;
  /** Split across lines for the per-character reveal. */
  title: string[];
  body: string;
  image: string;
  /** Natural pixel size, for cover-fitting in the shader. */
  size: [number, number];
  /** Ken Burns: start and end zoom across the chapter's scroll range. */
  zoom: [number, number];
  /** Slow pan within the frame, in UV units. */
  pan: [number, number];
  /** Type polarity over this photograph. */
  tone: "light" | "dark";
  cue?: string;
  cta?: { label: string; href: string };
};

export const chapters: Chapter[] = [
  {
    index: "I",
    eyebrow: "Folk & Floret",
    title: ["The art of", "curated", "connection"],
    body: "Bespoke gifts, composed by hand on a flower estate in the Nilgiris, for the moments that deserve more than a gesture.",
    image: "/imagery/estate-dawn.jpg",
    size: [1920, 1072],
    zoom: [1.12, 1.0],
    pan: [0, 0.02],
    tone: "dark",
    cue: "Scroll to begin",
  },
  {
    index: "II",
    eyebrow: "The Field",
    title: ["Cut at", "first light"],
    body: "Garden roses, ranunculus and cosmos, gathered the morning they are given. Never held in cold storage, never repeated twice.",
    image: "/imagery/field-flight.jpg",
    size: [1920, 1072],
    zoom: [1.0, 1.1],
    pan: [0.03, 0],
    tone: "dark",
  },
  {
    index: "III",
    eyebrow: "The Atelier",
    title: ["Composed", "by one pair", "of hands"],
    body: "Every commission is arranged by a single florist from stem to ribbon, so the finished gift reads as one idea rather than three parcels.",
    image: "/imagery/florist.jpg",
    size: [1920, 1072],
    zoom: [1.08, 1.0],
    pan: [-0.02, 0.01],
    tone: "dark",
  },
  {
    index: "IV",
    eyebrow: "The Gift",
    title: ["Dusty rose,", "botanical silk,", "antique gold"],
    body: "Flowers, a hand-poured candle and single-estate chocolates, boxed together the morning they travel.",
    image: "/imagery/packaging.jpg",
    size: [1920, 1072],
    zoom: [1.0, 1.14],
    pan: [0.02, -0.02],
    tone: "dark",
  },
  {
    index: "V",
    eyebrow: "The Giving",
    title: ["Given", "with feeling"],
    body: "The whole of it — field, flame and flavour — placed into the right hands at the right hour.",
    image: "/imagery/couple.jpg",
    size: [1920, 1047],
    zoom: [1.1, 1.02],
    pan: [0, 0.02],
    tone: "dark",
    cta: { label: "See the collections", href: "#collections" },
  },
];

/** Chapters sit at integer stations 0..CHAPTER_SPAN. */
export const CHAPTER_SPAN = chapters.length - 1;

export const journeyImages = chapters.map((c) => c.image);
