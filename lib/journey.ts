/**
 * The five chapters of the pinned journey. Each one owns a photograph, the
 * copy laid over it, and how the frame should drift while it is held.
 *
 * Images are chosen so the left third — where the copy sits — is the calmest
 * part of the frame, and so the sequence runs dawn → morning → afternoon →
 * blue hour without a jump in light.
 */
export type Chapter = {
  index: string;
  eyebrow: string;
  /** Split across lines for the per-character reveal. Each line must fit one line. */
  title: string[];
  body: string;
  image: string;
  /** Natural pixel size, for cover-fitting in the shader. */
  size: [number, number];
  /** Ken Burns: start and end zoom across the chapter's scroll range. */
  zoom: [number, number];
  /** Slow pan within the frame, in UV units. */
  pan: [number, number];
  /**
   * Extra crop bias applied only on portrait viewports. Every frame is 16:9,
   * so a phone cover-crops to the middle ~half and can lose the subject
   * entirely. This drags the visible window back onto it. A stopgap until the
   * 9:16 portrait masters exist — see docs/IMAGE_BRIEF.md §2.3.
   */
  mobileShift?: [number, number];
  /**
   * Optional scroll-scrubbed film for this chapter. The still above stays the
   * poster and the fallback: the video only takes over once a frame has
   * decoded, so a refused autoplay, a slow connection or a weak device simply
   * leaves the photograph in place.
   *
   * Sources must be encoded all-intra — see docs/IMAGE_BRIEF.md §4.
   */
  film?: { src: string; srcSmall: string; size: [number, number] };
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
    size: [1920, 1071],
    zoom: [1.12, 1.0],
    pan: [0, 0.02],
    film: {
      src: "/films/estate-descent.mp4",
      srcSmall: "/films/estate-descent-sm.mp4",
      size: [1280, 720],
    },
    cue: "Scroll to begin",
  },
  {
    index: "II",
    eyebrow: "The Field",
    title: ["Cut at", "first light"],
    body: "Garden roses, ranunculus and cosmos, gathered the morning they are given. Never held in cold storage, never repeated twice.",
    image: "/imagery/field-flight.jpg",
    size: [1920, 1071],
    zoom: [1.0, 1.1],
    pan: [0.03, 0],
    mobileShift: [-0.04, 0],
  },
  {
    index: "III",
    eyebrow: "The Atelier",
    title: ["Carried in", "from the beds", "each morning"],
    body: "A limewashed stone workroom at the edge of the fields. Everything that leaves it was standing in the ground a few hours before.",
    image: "/imagery/atelier-exterior.jpg",
    size: [1920, 1071],
    zoom: [1.08, 1.0],
    pan: [-0.02, 0.01],
    mobileShift: [0.07, 0],
  },
  {
    index: "IV",
    eyebrow: "The Gift",
    title: ["Dusty rose,", "botanical silk,", "antique gold"],
    body: "Flowers, a hand-poured candle and single-estate chocolates, boxed together on the morning they travel.",
    // The left third of this frame is bare wall and linen — the calmest copy
    // space in the whole library, so the type sits directly on the photograph.
    image: "/imagery/atelier-table.jpg",
    size: [1920, 1071],
    zoom: [1.0, 1.1],
    pan: [0.02, -0.01],
    mobileShift: [0.2, -0.03],
  },
  {
    index: "V",
    eyebrow: "The Giving",
    title: ["Given", "with feeling"],
    body: "Field, flame and flavour — placed into the right hands at the right hour, and remembered long after the flowers have gone.",
    image: "/imagery/couple-evening.jpg",
    size: [1920, 1071],
    zoom: [1.1, 1.02],
    pan: [0, 0.02],
    mobileShift: [0.13, 0],
    cta: { label: "See the collections", href: "#collections" },
  },
];

/** Chapters sit at integer stations 0..CHAPTER_SPAN. */
export const CHAPTER_SPAN = chapters.length - 1;

export const journeyImages = chapters.map((c) => c.image);
