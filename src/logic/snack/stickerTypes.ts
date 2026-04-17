import type { UUID } from "@/logic/entity/Entity";
import type { MachineState, ItemTypeTag, ItemVibeTag, RunState } from "./snackTypes";

// ── Sticker rarity ────────────────────────────────────────
export type StickerRarity = "common" | "uncommon" | "rare" | "legendary";

export const STICKER_RARITY_WEIGHTS: Record<StickerRarity, number> = {
    common: 50,
    uncommon: 30,
    rare: 15,
    legendary: 5,
};

export const STICKER_SELL_VALUES: Record<StickerRarity, number> = {
    common: 3,
    uncommon: 6,
    rare: 10,
    legendary: 15,
};

// ── Sticker editions (rare modifiers like Balatro) ────────
export type StickerEdition =
    | "normal"
    | "foil"
    | "holographic"
    | "polychrome"
    | "negative"
    | "golden";

export const EDITION_WEIGHTS: Record<StickerEdition, number> = {
    normal: 80,
    foil: 8,
    holographic: 5,
    polychrome: 3,
    negative: 2,
    golden: 2,
};

export type EditionBonus = {
    label: string;
    /** Extra flat coins per round just for owning it. */
    passiveCoins: number;
    /** Extra sell value added. */
    sellBonus: number;
    /** Multiplier applied to this sticker's own mult effects. 1 = normal. */
    effectMult: number;
    /** If true, doesn't consume a sticker slot. */
    freeSlot: boolean;
};

export const EDITION_BONUSES: Record<StickerEdition, EditionBonus> = {
    normal:      { label: "",            passiveCoins: 0, sellBonus: 0,  effectMult: 1,   freeSlot: false },
    foil:        { label: "Foil",        passiveCoins: 5, sellBonus: 0,  effectMult: 1,   freeSlot: false },
    holographic: { label: "Holo",        passiveCoins: 0, sellBonus: 10, effectMult: 1,   freeSlot: false },
    polychrome:  { label: "Polychrome",  passiveCoins: 0, sellBonus: 0,  effectMult: 1.5, freeSlot: false },
    negative:    { label: "Negative",    passiveCoins: 0, sellBonus: 0,  effectMult: 1,   freeSlot: true  },
    golden:      { label: "Golden",      passiveCoins: 3, sellBonus: 0,  effectMult: 1,   freeSlot: false },
};

// ── Sticker effect triggers ───────────────────────────────
export type StickerTrigger =
    | "on-sale"          // Fires per sale
    | "on-sale-row"      // Fires when entire row sells
    | "on-sale-col"      // Fires when entire column sells
    | "on-sale-diagonal" // Fires when a diagonal line sells
    | "round-start"      // Fires at start of serve phase
    | "round-end"        // Fires at end of serve phase
    | "on-kick"          // When machine gets kicked
    | "on-restock"       // When an item restocks itself
    | "passive"          // Always active modifier
    | "on-buy"           // When player buys item from catalogue
    | "scoring";         // During scoring calculation

// ── Sticker effect context (passed during resolution) ─────
export type StickerContext = {
    machine: MachineState;
    /** Current round number. */
    round: number;
    /** Current coins at time of evaluation. */
    coins: number;
    /** Number of stickers the player has. */
    stickerCount: number;
    /** All sticker instances owned. */
    stickers: StickerInstance[];
    /** How many rounds this sticker has been held. */
    roundsHeld: number;
    /** How many consecutive profitable rounds. */
    profitStreak: number;
    /** Accumulated sales this round so far. */
    salesThisRound: number;
    /** Items sold this round by type tag. */
    typeSales: Partial<Record<ItemTypeTag, number>>;
    /** Items sold this round by vibe tag. */
    vibeSales: Partial<Record<ItemVibeTag, number>>;
    /** Total items sold this round. */
    totalSold: number;
    /** Total items in machine (stocked). */
    totalStocked: number;
    /** Number of empty unlocked slots. */
    emptySlots: number;
    /** Slot index that just sold (for on-sale triggers). */
    soldSlotRow?: number;
    soldSlotCol?: number;
    /** Item type that just sold. */
    soldItemType?: ItemTypeTag;
    soldItemVibe?: ItemVibeTag;
    /** Damage taken this round. */
    damageTaken: number;
    /** Kicks this round. */
    kicks: number;
    /** Number of combos triggered this round. */
    combosTriggered: number;
    /** Current run state for advanced effects. */
    run: RunState;
};

// ── Sticker scoring result ────────────────────────────────
export type StickerResult = {
    /** Flat coins added. */
    addCoins: number;
    /** Multiplicative bonus (1 = no change, 2 = double). */
    mult: number;
    /** Extra customers this round. */
    addCustomers: number;
    /** Buy chance modifier (additive, 0.1 = +10%). */
    addBuyChance: number;
    /** Damage reduction for kicks. */
    damageReduction: number;
    /** Kick chance multiplier (0.5 = half). */
    kickChanceMult: number;
    /** Rent reduction (flat). */
    rentReduction: number;
    /** Stock cost reduction (flat per item). */
    stockCostReduction: number;
    /** HP healed. */
    hpHeal: number;
    /** Max HP bonus. */
    maxHpBonus: number;
    /** Price cap override. */
    priceCapOverride?: number;
    /** Restock triggers (slot positions to restock). */
    restocks: { row: number; col: number }[];
    /** Narration text to display. */
    narration?: string;
};

export const EMPTY_RESULT: StickerResult = {
    addCoins: 0,
    mult: 1,
    addCustomers: 0,
    addBuyChance: 0,
    damageReduction: 0,
    kickChanceMult: 1,
    rentReduction: 0,
    stockCostReduction: 0,
    hpHeal: 0,
    maxHpBonus: 0,
    restocks: [],
};

// ── Sticker definition (template) ─────────────────────────
export type StickerDef = {
    id: string;
    name: string;
    description: string;
    rarity: StickerRarity;
    trigger: StickerTrigger;
    /** Resolve the effect. Returns additive bonuses. */
    resolve: (ctx: StickerContext) => Partial<StickerResult>;
};

// ── Sticker instance (owned by player) ────────────────────
export type StickerInstance = {
    instanceId: UUID;
    defId: string;
    name: string;
    description: string;
    rarity: StickerRarity;
    edition: StickerEdition;
    /** Base sell value (before edition bonuses). */
    baseSellValue: number;
    /** Rounds this sticker has been held. */
    roundsHeld: number;
};

// ── Blind box tiers ───────────────────────────────────────
export const BLIND_BOX_COST = 8;
