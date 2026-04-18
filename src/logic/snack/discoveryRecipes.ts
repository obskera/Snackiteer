import type { MachineState } from "./snackTypes";

// ── Discovery Recipes ─────────────────────────────────────
// Hidden recipes that trigger when specific items are stocked together.
// Players discover them organically during gameplay.

export type RecipeDef = {
    id: string;
    name: string;
    /** Item defIds required (all must be stocked). */
    ingredients: string[];
    /** Bonus coins awarded when recipe is active during serve. */
    bonus: number;
    /** Flavor text shown on discovery. */
    discoveryText: string;
    /** Short description for the recipe book. */
    description: string;
};

export const RECIPE_DEFS: RecipeDef[] = [
    {
        id: "gamer-fuel",
        name: "GAMER FUEL",
        ingredients: ["soda-can", "candy-bar", "energy-drink"],
        bonus: 8,
        discoveryText:
            "The ultimate gamer combo discovered! Caffeine + sugar + more caffeine!",
        description: "Soda + Candy + Energy Drink = pure gaming power.",
    },
    {
        id: "movie-night",
        name: "MOVIE NIGHT",
        ingredients: ["soda-can", "chips-bag", "candy-bar"],
        bonus: 6,
        discoveryText:
            "A classic movie snack combo! All that's missing is the projector.",
        description: "Soda + Chips + Candy = cozy cinema vibes.",
    },
    {
        id: "high-roller",
        name: "HIGH ROLLER",
        ingredients: ["gourmet-snack", "energy-drink", "mystery-box"],
        bonus: 10,
        discoveryText:
            "Premium taste meets mystery! Only the boldest stock this combo.",
        description: "Gourmet + Energy + Mystery = living dangerously.",
    },
    {
        id: "sugar-rush",
        name: "SUGAR RUSH",
        ingredients: ["candy-bar", "soda-can", "mystery-box"],
        bonus: 7,
        discoveryText: "Maximum sweetness achieved! Dentists hate this combo.",
        description: "Candy + Soda + Mystery = tooth-melting goodness.",
    },
    {
        id: "crunch-time",
        name: "CRUNCH TIME",
        ingredients: ["chips-bag", "gourmet-snack"],
        bonus: 5,
        discoveryText: "Two crunchy snacks, one satisfied customer!",
        description: "Chips + Gourmet = the ultimate crunch.",
    },
    {
        id: "full-spread",
        name: "FULL SPREAD",
        ingredients: [
            "soda-can",
            "chips-bag",
            "candy-bar",
            "energy-drink",
            "gourmet-snack",
            "mystery-box",
        ],
        bonus: 20,
        discoveryText: "Every item in the machine! You're a true Snackiteer!",
        description: "Stock ALL items = legendary vending mastery.",
    },
];

/**
 * Detect which recipes are active based on currently stocked items.
 * Returns recipe IDs that have all required ingredients in the machine.
 */
export const detectActiveRecipes = (machine: MachineState): RecipeDef[] => {
    const stockedDefIds = new Set(
        machine.slots
            .filter((s) => s.unlocked && s.item)
            .map((s) => s.item!.defId),
    );

    return RECIPE_DEFS.filter((recipe) =>
        recipe.ingredients.every((id) => stockedDefIds.has(id)),
    );
};

/**
 * Find newly discovered recipes (active recipes not in the known set).
 */
export const findNewRecipes = (
    activeRecipes: RecipeDef[],
    discoveredIds: Set<string>,
): RecipeDef[] => {
    return activeRecipes.filter((r) => !discoveredIds.has(r.id));
};
