/**
 * Area system — each round takes place at a location that biases
 * customer mood rolls and applies a random sub-modifier.
 */

// ── Area definition ──────────────────────────────────────

export type AreaDef = {
    id: string;
    name: string;
    emoji: string;
    /** Short flavor text shown to the player. */
    flavor: string;
    /** Moods boosted at this location (added extra copies to mood pool). */
    boostedMoods: string[];
};

export type AreaModifier = {
    id: string;
    name: string;
    /** Shown alongside the area name. */
    description: string;
    /** Extra mood boost (stacks with area). */
    boostedMood?: string;
    /** Customer count delta. */
    customerDelta?: number;
    /** Anger multiplier. */
    angerMult?: number;
    /** Sell-chance multiplier. */
    sellChanceMult?: number;
    /** Price multiplier. */
    priceMult?: number;
    /** Flat damage reduction per kick. */
    damageReduction?: number;
    /** HP regenerated at start of round. */
    hpRegen?: number;
    /** Rent delta for this round only. */
    rentDelta?: number;
};

export type RoundArea = {
    area: AreaDef;
    modifier: AreaModifier;
};

// ── Area pool (15 areas) ─────────────────────────────────
// Boosted moods reflect actual item tags: sweet, salty, sour, spicy, drink, snack, candy, cheap

export const AREA_POOL: AreaDef[] = [
    {
        id: "office",
        name: "Office Building",
        emoji: "🏢",
        flavor: "Corporate drones on break.",
        boostedMoods: ["salty", "drink"],
    },
    {
        id: "movie-theater",
        name: "Movie Theater",
        emoji: "🎬",
        flavor: "Popcorn vibes and candy cravings.",
        boostedMoods: ["sweet", "candy"],
    },
    {
        id: "gym",
        name: "Gym",
        emoji: "💪",
        flavor: "Post-workout fuel needed.",
        boostedMoods: ["sour", "drink"],
    },
    {
        id: "school",
        name: "School",
        emoji: "🏫",
        flavor: "Kids with pocket change.",
        boostedMoods: ["sweet", "cheap"],
    },
    {
        id: "boardwalk",
        name: "Beach Boardwalk",
        emoji: "🏖️",
        flavor: "Summer crowds and salty air.",
        boostedMoods: ["salty", "drink"],
    },
    {
        id: "night-market",
        name: "Night Market",
        emoji: "🌙",
        flavor: "Adventurous eaters after dark.",
        boostedMoods: ["spicy", "sour"],
    },
    {
        id: "hospital",
        name: "Hospital Lobby",
        emoji: "🏥",
        flavor: "Comfort cravings in the waiting room.",
        boostedMoods: ["sweet", "drink"],
    },
    {
        id: "airport",
        name: "Airport Terminal",
        emoji: "✈️",
        flavor: "Rushed travelers overpaying.",
        boostedMoods: ["drink", "snack"],
    },
    {
        id: "mall",
        name: "Shopping Mall",
        emoji: "🛍️",
        flavor: "Impulse buyers everywhere.",
        boostedMoods: ["sweet", "candy"],
    },
    {
        id: "construction",
        name: "Construction Site",
        emoji: "🚧",
        flavor: "Hungry workers need fuel.",
        boostedMoods: ["salty", "spicy"],
    },
    {
        id: "campus",
        name: "College Campus",
        emoji: "🎓",
        flavor: "Budget students stretching every cent.",
        boostedMoods: ["cheap", "snack"],
    },
    {
        id: "theme-park",
        name: "Theme Park",
        emoji: "🎢",
        flavor: "Sugar-fueled fun seekers.",
        boostedMoods: ["sweet", "candy"],
    },
    {
        id: "tech-office",
        name: "Tech Office",
        emoji: "💻",
        flavor: "Caffeine-addicted devs.",
        boostedMoods: ["sour", "drink"],
    },
    {
        id: "stadium",
        name: "Sports Stadium",
        emoji: "🏟️",
        flavor: "Game day snacking.",
        boostedMoods: ["salty", "drink"],
    },
    {
        id: "downtown",
        name: "Downtown Corner",
        emoji: "🏙️",
        flavor: "Mixed crowd, anything goes.",
        boostedMoods: [],
    },
];

// ── Sub-modifier pool ────────────────────────────────────

export const MODIFIER_POOL: AreaModifier[] = [
    {
        id: "festival-crowd",
        name: "Festival Nearby",
        description: "+2 customers",
        customerDelta: 2,
    },
    {
        id: "ghost-town",
        name: "Ghost Town",
        description: "−2 customers",
        customerDelta: -2,
    },
    {
        id: "happy-hour",
        name: "Happy Hour",
        description: "+20% prices",
        priceMult: 1.2,
    },
    {
        id: "coupon-day",
        name: "Coupon Day",
        description: "−20% prices",
        priceMult: 0.8,
    },
    {
        id: "food-critic",
        name: "Food Critic Visit",
        description: "+30% prices · +50% anger",
        priceMult: 1.3,
        angerMult: 1.5,
    },
    {
        id: "chill-vibes",
        name: "Chill Vibes",
        description: "−50% anger",
        angerMult: 0.5,
    },
    {
        id: "rush-hour",
        name: "Rush Hour",
        description: "+3 customers · +25% anger",
        customerDelta: 3,
        angerMult: 1.25,
    },
    {
        id: "maintenance",
        name: "Quick Maintenance",
        description: "+15 HP restored",
        hpRegen: 15,
    },
    {
        id: "sugar-rush",
        name: "Sugar Rush",
        description: "Sweets boosted · +15% buy rate",
        boostedMood: "sweet",
        sellChanceMult: 1.15,
    },
    {
        id: "salt-craving",
        name: "Salt Craving",
        description: "Salty boosted · +15% buy rate",
        boostedMood: "salty",
        sellChanceMult: 1.15,
    },
    {
        id: "spice-challenge",
        name: "Spice Challenge",
        description: "Spicy boosted · +25% prices",
        boostedMood: "spicy",
        priceMult: 1.25,
    },
    {
        id: "thirst-wave",
        name: "Thirst Wave",
        description: "Drinks boosted · +1 customer",
        boostedMood: "drink",
        customerDelta: 1,
    },
    {
        id: "inflation",
        name: "Inflation",
        description: "Rent +4 this round",
        rentDelta: 4,
    },
    {
        id: "tax-break",
        name: "Tax Break",
        description: "Rent −3 this round",
        rentDelta: -3,
    },
    {
        id: "armored-casing",
        name: "Reinforced Casing",
        description: "−5 kick damage",
        damageReduction: 5,
    },
    {
        id: "bargain-hunters",
        name: "Bargain Hunters",
        description: "Cheap boosted · +2 customers · −25% prices",
        boostedMood: "cheap",
        customerDelta: 2,
        priceMult: 0.75,
    },
    {
        id: "loyalty-program",
        name: "Loyalty Program",
        description: "+25% buy rate",
        sellChanceMult: 1.25,
    },
    {
        id: "bad-reviews",
        name: "Bad Yelp Reviews",
        description: "−20% buy rate · −1 customer",
        sellChanceMult: 0.8,
        customerDelta: -1,
    },
];

// ── Rolling helpers ──────────────────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/**
 * Roll a shuffled sequence of areas for a run.
 * Returns one area per round (up to `count`).
 * If we need more rounds than areas, it wraps around with a fresh shuffle.
 */
export const rollAreaSequence = (count: number): AreaDef[] => {
    const result: AreaDef[] = [];
    let pool = shuffle(AREA_POOL);
    let idx = 0;
    for (let i = 0; i < count; i++) {
        if (idx >= pool.length) {
            pool = shuffle(AREA_POOL);
            idx = 0;
        }
        result.push(pool[idx++]);
    }
    return result;
};

/** Roll a random sub-modifier for a round. */
export const rollAreaModifier = (): AreaModifier =>
    pick(MODIFIER_POOL);

/** Roll a complete RoundArea (area + modifier) for a given round index. */
export const rollRoundArea = (areaSequence: AreaDef[], roundIndex: number): RoundArea => ({
    area: areaSequence[roundIndex % areaSequence.length],
    modifier: rollAreaModifier(),
});
