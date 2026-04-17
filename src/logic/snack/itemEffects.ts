import type { RarityModifier } from "./snackTypes";

/**
 * Simple data-driven item effects for the jam build.
 * Each effect is identified by an `effectId` string and resolved
 * by a pure function during serve phase.
 */

export type SimpleEffect = {
    effectId: string;
    name: string;
    description: string;
    /** When the effect fires. */
    trigger: "on-sale" | "round-start" | "round-end" | "passive";
};

// ── Effect definitions ───────────────────────────────────

const EFFECTS: SimpleEffect[] = [
    // Uncommon effects
    { effectId: "price-boost-1", name: "Markup", description: "Passive: +1¢ to every sale of this item", trigger: "passive" },
    { effectId: "attract", name: "Eye Catcher", description: "Passive: +10% chance customers buy from the machine", trigger: "passive" },
    { effectId: "tough", name: "Reinforced", description: "Passive: reduces kick damage by 2 while stocked", trigger: "passive" },

    // Rare effects
    { effectId: "price-boost-2", name: "Premium Label", description: "Passive: +2¢ to every sale of this item", trigger: "passive" },
    { effectId: "combo-boost", name: "Synergy+", description: "Passive: adjacent combos involving this item give +2¢", trigger: "passive" },
    { effectId: "double-sale", name: "Two-for-One", description: "On sale: 20% chance the item stays in stock after being bought", trigger: "on-sale" },
    { effectId: "calm-aura", name: "Calm Aura", description: "Passive: -25% kick chance while stocked", trigger: "passive" },

    // Legendary effects
    { effectId: "price-boost-3", name: "Gold Standard", description: "Passive: +4¢ to every sale of this item", trigger: "passive" },
    { effectId: "magnet", name: "Customer Magnet", description: "Round start: +1 extra customer visits per round", trigger: "round-start" },
    { effectId: "phoenix", name: "Phoenix Stock", description: "On sale: restocks itself once after being bought (loses effect)", trigger: "on-sale" },
    { effectId: "jackpot", name: "Jackpot", description: "On sale: 10% chance to triple the sale price", trigger: "on-sale" },
];

const UNCOMMON_EFFECTS = EFFECTS.filter((e) =>
    ["price-boost-1", "attract", "tough"].includes(e.effectId),
);
const RARE_EFFECTS = EFFECTS.filter((e) =>
    ["price-boost-2", "combo-boost", "double-sale", "calm-aura"].includes(e.effectId),
);
const LEGENDARY_EFFECTS = EFFECTS.filter((e) =>
    ["price-boost-3", "magnet", "phoenix", "jackpot"].includes(e.effectId),
);

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Roll an effect for the given rarity. Common items get no effect. */
export const rollEffect = (rarity: RarityModifier): SimpleEffect | undefined => {
    switch (rarity) {
        case "uncommon": return pick(UNCOMMON_EFFECTS);
        case "rare": return pick(RARE_EFFECTS);
        case "legendary": return pick(LEGENDARY_EFFECTS);
        default: return undefined;
    }
};

export const getEffectDef = (effectId: string): SimpleEffect | undefined =>
    EFFECTS.find((e) => e.effectId === effectId);

/** Price bonus from passive price-boost effects. */
export const effectPriceBonus = (effectId: string | undefined): number => {
    if (!effectId) return 0;
    switch (effectId) {
        case "price-boost-1": return 1;
        case "price-boost-2": return 2;
        case "price-boost-3": return 4;
        default: return 0;
    }
};

/** Sell chance modifier from passive effects. Returns additive bonus (e.g. 0.10). */
export const effectSellBonus = (effectId: string | undefined): number => {
    if (!effectId) return 0;
    if (effectId === "attract") return 0.10;
    return 0;
};

/** Kick damage reduction from passive effects. */
export const effectDamageReduction = (effectId: string | undefined): number => {
    if (!effectId) return 0;
    if (effectId === "tough") return 2;
    return 0;
};

/** Kick chance reduction multiplier from passive effects. */
export const effectKickChanceMult = (effectId: string | undefined): number => {
    if (!effectId) return 1;
    if (effectId === "calm-aura") return 0.75;
    return 1;
};
