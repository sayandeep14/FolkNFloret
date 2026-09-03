/**
 * The catalogue, transcribed from fnf.md.
 *
 * Deliberately free of imports so it can be typechecked, asserted over and
 * diffed without a database in the room. prisma/seed.ts is what writes it.
 *
 * PRICES ARE PROVISIONAL. fnf.md gives *suggested* retail, as ranges, and for
 * only some lines; anything not quoted there is interpolated and marked below.
 * Every figure needs a human pass before Phase 11.
 *
 * TAX RATES ARE PROVISIONAL. The bps figures are a best reading of Indian GST
 * by HSN and are not tax advice. Composite gift hampers in particular are a
 * genuinely contested classification — have the accountant confirm all of them
 * before the first invoice is issued.
 */

export type SeedVariant = {
  sku: string;
  name?: string;
  priceInPaise: number;
  weightGrams: number;
  stockOnHand: number;
  /** Slug + quantity of each component, for bundles only. */
  components?: { sku: string; quantity: number }[];
};

export type SeedProduct = {
  slug: string;
  title: string;
  latin?: string;
  subtitle?: string;
  collections: string[];
  isBundle?: boolean;
  taxRateBps: number;
  hsnCode: string;
  description: string;
  packaging?: string;
  materials?: string;
  careNotes?: string;
  foodNotes?: string;
  variants: SeedVariant[];
};

export const collections = [
  {
    slug: "aromatics",
    title: "Aromatics",
    description:
      "Hand-poured light and botanical steeps. The house's first room, and the one you meet with your eyes closed.",
    position: 0,
  },
  {
    slug: "epicurean",
    title: "Epicurean",
    description:
      "Raw mono-floral honey, single-origin couverture, gilded truffles and glazed botanicals. Provisions for a table that is paying attention.",
    position: 1,
  },
  {
    slug: "preserved",
    title: "Preserved",
    description:
      "Moss, pressed stems and seeded paper — botanicals kept rather than cut. Nothing here is watered, and nothing here wilts.",
    position: 2,
  },
  {
    slug: "suites",
    title: "The Suites",
    description:
      "Two pieces drawn to one another, or the whole house in a keepsake chest. Composed, not assembled.",
    position: 3,
  },
];

const CANDLE_BODY =
  "A clean-burning coconut-soy blend poured by hand into heavy-base frosted cream flint, capped flush with a lid turned from natural oak. The wick is crackling wood; the burn is forty hours of low, amber light.";

const CANDLE_PACKAGING =
  "A 2mm rigid cube wrapped in textured stone-taupe linen paper with gold-foil debossed type. Inside, a fitted velvet base cup locks the glass so it cannot travel. A plantable seed-paper care card sits under the lid.";

export const products: SeedProduct[] = [
  // -- Aromatics ------------------------------------------------------------
  {
    slug: "signature-candle",
    title: "Signature Hand-Poured Candle",
    latin: "Lumen",
    subtitle: "250g · frosted flint and turned oak",
    collections: ["aromatics"],
    taxRateBps: 1200,
    hsnCode: "3406",
    description: CANDLE_BODY,
    packaging: CANDLE_PACKAGING,
    materials:
      "Coconut-soy wax, botanical fragrance oils, wooden wick, frosted flint glass, turned natural oak.",
    careNotes:
      "Trim the wick to 5mm before every burn. Burn no longer than four hours at a time, and never leave a lit candle unattended.",
    variants: [
      // fnf.md quotes ₹1,450–₹1,850 for the solo candle. Held at the floor of
      // that range across all three editions until the buyer decides whether
      // the fragrances price differently.
      { sku: "FF-CND-01", name: "No. 01 Sylvan Mist", priceInPaise: 145000, weightGrams: 900, stockOnHand: 40 },
      { sku: "FF-CND-02", name: "No. 02 Herbal Solace", priceInPaise: 145000, weightGrams: 900, stockOnHand: 40 },
      { sku: "FF-CND-03", name: "No. 03 Sunlit Grove", priceInPaise: 145000, weightGrams: 900, stockOnHand: 40 },
    ],
  },
  {
    slug: "whole-flower-tisane",
    title: "Estate Whole-Flower Tisane",
    latin: "Lumen",
    subtitle: "75g loose leaf",
    collections: ["aromatics"],
    taxRateBps: 500,
    hsnCode: "0902",
    // Not quoted in fnf.md. Interpolated from the Tea & Honey Cellar duo.
    description:
      "Whole blossoms and leaf, never cut or dusted, in an airtight matte-cream caddy finished with a debossed linen label and a gold wax seal.",
    packaging:
      "Airtight matte-cream metal caddy, debossed linen label, gold wax seal.",
    foodNotes:
      "Best before twelve months from the batch date printed on the base. Store cool and dry, away from direct light.",
    variants: [{ sku: "FF-TIS-01", priceInPaise: 95000, weightGrams: 250, stockOnHand: 30 }],
  },
  {
    slug: "himalayan-mineral-soak",
    title: "Himalayan Mineral Soak",
    latin: "Lumen",
    subtitle: "200g",
    collections: ["aromatics"],
    taxRateBps: 1800,
    hsnCode: "3307",
    // Not quoted in fnf.md. Provisional.
    description:
      "Coarse pink salt crystals infused with botanicals and essential oils, in square flint glass under a matching square oak cap.",
    packaging: "Square flint glass jar with turned oak cap.",
    careNotes: "Keep the cap closed and the jar dry between uses.",
    variants: [{ sku: "FF-SOK-01", priceInPaise: 115000, weightGrams: 600, stockOnHand: 24 }],
  },

  // -- Epicurean ------------------------------------------------------------
  {
    slug: "mono-floral-raw-honey",
    title: "Mono-Floral Raw Honey Cellar",
    latin: "Mensa",
    subtitle: "220g · with turned wood dipper",
    collections: ["epicurean"],
    taxRateBps: 500,
    hsnCode: "0409",
    description:
      "Raw, unpasteurised and from a single bloom. Heavy-base square flint under an oak friction-fit cap, sealed with a stamped brass medallion holding real dried chamomile and lavender florets.",
    packaging:
      "Rigid sleeve-and-tray slider box. The jar rests in a velvet-wrapped die-cut insert with a miniature turned-wood dipper tied alongside in raw silk.",
    foodNotes:
      "Raw honey crystallises; warm the jar gently to clear it. Not suitable for infants under twelve months. FSSAI declarations are printed on the inner sleeve base.",
    variants: [
      { sku: "FF-HNY-01", name: "Kashmir White Acacia", priceInPaise: 125000, weightGrams: 800, stockOnHand: 36 },
      { sku: "FF-HNY-02", name: "Himalayan Wild Forest", priceInPaise: 135000, weightGrams: 800, stockOnHand: 30 },
      { sku: "FF-HNY-03", name: "Raw Sidr", priceInPaise: 165000, weightGrams: 800, stockOnHand: 18 },
    ],
  },
  {
    slug: "botanical-couverture-slab",
    title: "Botanical Couverture Slab",
    latin: "Mensa",
    subtitle: "100g · 70% single origin",
    collections: ["epicurean"],
    taxRateBps: 1800,
    hsnCode: "1806",
    // Not quoted in fnf.md. Provisional.
    description:
      "Seventy percent single-origin dark, tempered and finished with culinary rose petals, dried lavender buds and flakes of sea salt.",
    packaging:
      "Food-grade gold foil barrier wrapper inside a rigid slider drawer of linen cardstock, gold-foil debossed. The slab sits in an embossed greaseproof sleeve with an origin card.",
    foodNotes:
      "Contains cocoa and may contain traces of nuts and milk. Store between 16 and 18°C, away from strong odours.",
    variants: [{ sku: "FF-CHC-01", priceInPaise: 89000, weightGrams: 220, stockOnHand: 45 }],
  },
  {
    slug: "gilded-truffle-assortment",
    title: "Gilded Truffle Assortment",
    latin: "Mensa",
    subtitle: "Six pieces",
    collections: ["epicurean"],
    taxRateBps: 1800,
    hsnCode: "1806",
    // Not quoted in fnf.md. Provisional.
    description:
      "Ganache and praline finished with edible gold leaf and crystallised botanical petals.",
    packaging:
      "Book-style rigid box with a hidden magnetic snap. Matte-gold food-grade blister dividers cradle each truffle so none scuffs in transit.",
    foodNotes:
      "Contains dairy and may contain nuts. Best within twenty-one days. Keep cool; do not refrigerate.",
    variants: [{ sku: "FF-TRF-06", priceInPaise: 145000, weightGrams: 300, stockOnHand: 24 }],
  },
  {
    slug: "glazed-botanical-nuts",
    title: "Glazed Botanical Nuts",
    latin: "Mensa",
    subtitle: "150g",
    collections: ["epicurean"],
    taxRateBps: 1200,
    hsnCode: "2008",
    // Not quoted in fnf.md. Provisional.
    description:
      "Slow-roasted and glazed in small batches, in a reusable matte-taupe screw-cap tin.",
    packaging:
      "Reusable matte-taupe tin, embossed top label, tamper-evident botanical paper seal.",
    foodNotes:
      "Contains tree nuts. Best within ninety days of the batch date on the base.",
    variants: [
      { sku: "FF-NUT-01", name: "Rosemary & Truffle Cashews", priceInPaise: 95000, weightGrams: 320, stockOnHand: 30 },
      { sku: "FF-NUT-02", name: "Saffron & Acacia Honey Almonds", priceInPaise: 99000, weightGrams: 320, stockOnHand: 30 },
    ],
  },

  // -- Preserved ------------------------------------------------------------
  {
    slug: "seed-paper-journal",
    title: "Heirloom Plantable Seed Paper Journal",
    latin: "Herbarium",
    subtitle: "A6 · approx. 100 pages",
    collections: ["preserved"],
    taxRateBps: 1200,
    hsnCode: "4820",
    description:
      "A slow-living pocket journal bound to lie flat. The deckle-edged cotton rag cover is embedded with living wildflower and chamomile seed — once the pages are filled, the covers go into soil and come up as florets.",
    packaging:
      "A debossed unbleached kraft-board folder tied with an organic cotton band, carrying planting and care instructions.",
    materials:
      "300 GSM handmade cotton rag cover with embedded seed, 100 GSM unlined tree-free pages, exposed Coptic binding in unbleached jute, raw silk closure with a gold wax seal over a pressed botanical stem.",
    careNotes:
      "Keep dry until you mean to plant it. Damp storage will germinate the cover.",
    variants: [{ sku: "FF-JRN-01", priceInPaise: 110000, weightGrams: 320, stockOnHand: 40 }],
  },
  {
    slug: "preserved-moss-bowl",
    title: "Biophilic Preserved Moss Centrepiece",
    latin: "Herbarium",
    subtitle: "14–18cm",
    collections: ["preserved"],
    taxRateBps: 1200,
    hsnCode: "0604",
    description:
      "Reindeer, sheet and cushion moss in variegated forest greens and lichen tones, arranged by hand and accented with preserved pods and dried lichen twigs. No water, no light, no trimming — soft and vivid for three years and more.",
    packaging:
      "A custom-moulded pulp clamshell inside a rigid lid-and-base gift box, with a clear inner blister so nothing rubs against the moss in transit.",
    careNotes:
      "Handle dry. Keep away from direct moisture and out of full sun. Preserved botanicals do not tolerate humidity.",
    variants: [
      // fnf.md quotes ₹2,200–₹2,800 for the moss vessel; the range reads as
      // the two bases rather than as one uncertain figure.
      { sku: "FF-MSS-STN", name: "Cast Stone", priceInPaise: 220000, weightGrams: 2600, stockOnHand: 12 },
      { sku: "FF-MSS-WAL", name: "Turned Walnut", priceInPaise: 280000, weightGrams: 1400, stockOnHand: 10 },
    ],
  },
  {
    slug: "brass-herbarium-frame",
    title: "Double-Glass Brass Herbarium Frame",
    latin: "Herbarium",
    subtitle: '4×6"',
    collections: ["preserved"],
    taxRateBps: 1800,
    hsnCode: "8306",
    // Not quoted in fnf.md. Provisional.
    description:
      "Real pressed botanicals floating between optical glass in a solid antiqued brass standing frame.",
    packaging: "Foam-padded rigid sleeve.",
    careNotes: "Clean the glass with a dry cloth. Keep out of direct sunlight, which will fade a pressed specimen.",
    variants: [{ sku: "FF-HRB-46", priceInPaise: 195000, weightGrams: 700, stockOnHand: 15 }],
  },
  {
    slug: "brass-candle-care-suite",
    title: "Solid Brass Candle Care Suite",
    latin: "Herbarium",
    subtitle: "Snuffer and wick trimmer",
    collections: ["preserved"],
    taxRateBps: 1800,
    hsnCode: "7418",
    // Not quoted in fnf.md. Provisional.
    description:
      "A heavy turned bell snuffer and a contour wick trimmer, both matte gold.",
    packaging: "Unbleached linen drawstring pouch.",
    careNotes: "Let the snuffer cool before it goes back in the pouch.",
    variants: [{ sku: "FF-BRS-01", priceInPaise: 240000, weightGrams: 500, stockOnHand: 18 }],
  },
  {
    slug: "pearl-tasting-spoon",
    title: "Mother of Pearl Tasting Spoon",
    latin: "Herbarium",
    collections: ["preserved"],
    taxRateBps: 1200,
    hsnCode: "9601",
    // Not quoted in fnf.md. Provisional.
    description:
      "Hand-carved natural shell, non-reactive, so it will not turn honey or caviar.",
    packaging: "Slim velvet jewellery box.",
    careNotes: "Wash by hand. Never a dishwasher.",
    variants: [{ sku: "FF-SPN-01", priceInPaise: 85000, weightGrams: 90, stockOnHand: 40 }],
  },
  {
    slug: "gilded-scallop-catchall",
    title: "Gilded Scallop Shell Catchall",
    latin: "Herbarium",
    collections: ["preserved"],
    taxRateBps: 1200,
    hsnCode: "9601",
    // Not quoted in fnf.md. Provisional.
    description: "A hand-gilded natural shell to rest matches and a snuffer on.",
    packaging: "Branded tissue in a mini rigid box.",
    variants: [{ sku: "FF-SHL-01", priceInPaise: 115000, weightGrams: 200, stockOnHand: 25 }],
  },

  // -- Suites: the duos -----------------------------------------------------
  {
    slug: "duo-scribes-sanctuary",
    title: "The Scribe's Sanctuary Duo",
    latin: "Suite",
    collections: ["suites"],
    isBundle: true,
    taxRateBps: 1800,
    hsnCode: "9505",
    description:
      "A grounding woody candle and a journal whose covers can be planted. For the person who thinks on paper.",
    packaging:
      "Medium rigid magnetic clamshell in stone-taupe. The pieces sit side by side in velvet-lined foam slots cut for them.",
    variants: [
      {
        sku: "FF-DUO-SCR",
        priceInPaise: 280000,
        weightGrams: 1450,
        stockOnHand: 12,
        components: [
          { sku: "FF-CND-01", quantity: 1 },
          { sku: "FF-JRN-01", quantity: 1 },
        ],
      },
    ],
  },
  {
    slug: "duo-botanical-nectar",
    title: "The Botanical Nectar Duo",
    latin: "Suite",
    collections: ["suites"],
    isBundle: true,
    taxRateBps: 1800,
    hsnCode: "9505",
    description: "Flame and nectar: a signature candle beside raw acacia honey and its dipper.",
    packaging:
      "Medium magnetic rigid box lined in plush velvet, topped with a translucent vellum overlay.",
    variants: [
      {
        sku: "FF-DUO-NCT",
        priceInPaise: 320000,
        weightGrams: 1900,
        stockOnHand: 12,
        components: [
          { sku: "FF-CND-03", quantity: 1 },
          { sku: "FF-HNY-01", quantity: 1 },
        ],
      },
    ],
  },
  {
    slug: "duo-tea-honey-cellar",
    title: "The Tea & Honey Cellar Duo",
    latin: "Suite",
    collections: ["suites"],
    isBundle: true,
    taxRateBps: 1800,
    hsnCode: "9505",
    description:
      "Wild forest honey, a whole-flower tisane and a shell spoon that will not react with either.",
    packaging:
      "Two-slot rigid box in natural linen texture with gold-foil debossed type.",
    variants: [
      {
        sku: "FF-DUO-TEA",
        priceInPaise: 290000,
        weightGrams: 1250,
        stockOnHand: 12,
        components: [
          { sku: "FF-HNY-02", quantity: 1 },
          { sku: "FF-TIS-01", quantity: 1 },
          { sku: "FF-SPN-01", quantity: 1 },
        ],
      },
    ],
  },

  // -- Suites: the chests ---------------------------------------------------
  {
    slug: "suite-botanical-harvest",
    title: "The Botanical Harvest Suite",
    latin: "Suite",
    collections: ["suites"],
    isBundle: true,
    taxRateBps: 1800,
    hsnCode: "9505",
    description:
      "The quintessential house experience, uniting scent, taste and kept botanicals in a single chest.",
    packaging:
      "A large rigid keepsake chest with hidden magnetic closures. High-density foam under ivory velvet, sealed beneath a fragrance-misted vellum sheet and a bespoke floral wax seal.",
    foodNotes:
      "Contains honey, cocoa and tree nuts. Shipped with an insulated thermal liner during warm months.",
    variants: [
      {
        sku: "FF-SUI-HRV",
        priceInPaise: 580000,
        weightGrams: 3400,
        stockOnHand: 8,
        components: [
          { sku: "FF-CND-01", quantity: 1 },
          { sku: "FF-HNY-01", quantity: 1 },
          { sku: "FF-CHC-01", quantity: 1 },
          { sku: "FF-NUT-01", quantity: 1 },
          { sku: "FF-JRN-01", quantity: 1 },
        ],
      },
    ],
  },
  {
    slug: "suite-biophilic-sanctuary",
    title: "The Biophilic Sanctuary Chest",
    latin: "Suite",
    collections: ["suites"],
    isBundle: true,
    taxRateBps: 1800,
    hsnCode: "9505",
    description:
      "Built as a permanent ritual rather than a consumable one: moss that lasts years, brass that lasts longer.",
    packaging:
      "A two-tier rigid chest. The upper velvet tray shows the moss bowl and the candle; lift it out for the stationery and the brassware beneath.",
    variants: [
      {
        sku: "FF-SUI-BIO",
        priceInPaise: 850000,
        weightGrams: 4200,
        stockOnHand: 6,
        components: [
          { sku: "FF-MSS-WAL", quantity: 1 },
          { sku: "FF-CND-02", quantity: 1 },
          { sku: "FF-BRS-01", quantity: 1 },
          { sku: "FF-JRN-01", quantity: 1 },
          { sku: "FF-HRB-46", quantity: 1 },
        ],
      },
    ],
  },
  {
    slug: "suite-grand-heirloom",
    title: "The Connoisseur's Grand Heirloom Suite",
    latin: "Suite",
    collections: ["suites"],
    isBundle: true,
    taxRateBps: 1800,
    hsnCode: "9505",
    description:
      "The flagship: every category of the house, with the ritual tableware to use it by.",
    packaging:
      "An oversized presentation trunk in unbleached linen with leather straps and brass buckles. Ten individual velvet compartments hold everything still for nationwide transit.",
    foodNotes:
      "Contains honey, cocoa and tree nuts. Shipped with an insulated thermal liner during warm months.",
    variants: [
      {
        sku: "FF-SUI-HEI",
        priceInPaise: 1450000,
        weightGrams: 7200,
        stockOnHand: 4,
        components: [
          { sku: "FF-CND-01", quantity: 1 },
          { sku: "FF-HNY-03", quantity: 1 },
          { sku: "FF-TIS-01", quantity: 1 },
          { sku: "FF-TRF-06", quantity: 1 },
          { sku: "FF-NUT-02", quantity: 1 },
          { sku: "FF-SPN-01", quantity: 1 },
          { sku: "FF-SHL-01", quantity: 1 },
          { sku: "FF-BRS-01", quantity: 1 },
          { sku: "FF-JRN-01", quantity: 1 },
          { sku: "FF-MSS-STN", quantity: 1 },
        ],
      },
    ],
  },
];

/** Slug on the product, and the placeholder plate that stands in for it. */
export const imageSlugForVariant: Record<string, string> = {
  "FF-CND-01": "candle-sylvan-mist",
  "FF-CND-02": "candle-herbal-solace",
  "FF-CND-03": "candle-sunlit-grove",
  "FF-TIS-01": "tisane-caddy",
  "FF-SOK-01": "mineral-soak",
  "FF-HNY-01": "honey-kashmir-acacia",
  "FF-HNY-02": "honey-himalayan-forest",
  "FF-HNY-03": "honey-raw-sidr",
  "FF-CHC-01": "chocolate-slab",
  "FF-TRF-06": "truffle-assortment",
  "FF-NUT-01": "glazed-nuts",
  "FF-NUT-02": "glazed-nuts",
  "FF-JRN-01": "seed-paper-notebook",
  "FF-MSS-STN": "moss-bowl-stone",
  "FF-MSS-WAL": "moss-bowl-walnut",
  "FF-HRB-46": "herbarium-frame",
  "FF-BRS-01": "brass-candle-care",
  "FF-SPN-01": "pearl-tasting-spoon",
  "FF-SHL-01": "scallop-catchall",
  "FF-DUO-SCR": "duo-scribes-sanctuary",
  "FF-DUO-NCT": "duo-botanical-nectar",
  "FF-DUO-TEA": "duo-tea-honey-cellar",
  "FF-SUI-HRV": "suite-botanical-harvest",
  "FF-SUI-BIO": "suite-biophilic-sanctuary",
  "FF-SUI-HEI": "suite-grand-heirloom",
};
