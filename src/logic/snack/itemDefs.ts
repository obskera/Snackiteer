import type { SnackItemDef } from "./snackTypes";

/** MVP starter catalogue — 6 base item definitions. Quality tiers are applied on top. */
export const STARTER_ITEM_DEFS: SnackItemDef[] = [
    {
        defId: "soda-can",
        name: "Soda Can",
        tags: ["drink", "sweet"],
        baseCost: 3,
        basePrice: 5,
    },
    {
        defId: "chips-bag",
        name: "Chips Bag",
        tags: ["snack", "salty"],
        baseCost: 2,
        basePrice: 4,
    },
    {
        defId: "candy-bar",
        name: "Candy Bar",
        tags: ["candy", "sweet"],
        baseCost: 2,
        basePrice: 4,
    },
    {
        defId: "energy-drink",
        name: "Energy Drink",
        tags: ["drink", "sour"],
        baseCost: 4,
        basePrice: 7,
    },
    {
        defId: "gourmet-snack",
        name: "Gourmet Snack",
        tags: ["snack", "spicy"],
        baseCost: 4,
        basePrice: 7,
    },
    {
        defId: "mystery-box",
        name: "Mystery Box",
        tags: ["candy", "sweet"],
        baseCost: 3,
        basePrice: 6,
    },
];

export const getItemDef = (defId: string): SnackItemDef | undefined =>
    STARTER_ITEM_DEFS.find((d) => d.defId === defId);
