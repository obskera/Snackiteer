import { type UUID, generateId } from "@/logic/entity/Entity";

// ── Tag axes ──────────────────────────────────────────────
/** Axis 1 – what the item IS */
export type ItemTypeTag = "drink" | "snack" | "candy" | "premium";

/** Axis 2 – how it FEELS */
export type ItemVibeTag = "sweet" | "salty" | "sour" | "spicy" | "refreshing";

/** Axis 3 – special power (rare items only) */
export type ItemEffectTag =
    | "energy"
    | "comfort"
    | "mystery"
    | "hype"
    | "luxury";

export type ItemTag = ItemTypeTag | ItemVibeTag | ItemEffectTag;

// ── Effect triggers ───────────────────────────────────────
export type EffectTrigger =
    | "on-stock"
    | "round-start"
    | "on-sale"
    | "on-adjacent-sale"
    | "round-end";

export type ItemEffect = {
    id: UUID;
    name: string;
    description: string;
    trigger: EffectTrigger;
    /** Resolved once per trigger event (no re-entrant chains). */
    apply: (ctx: EffectContext) => void;
};

export type EffectContext = {
    /** The slot position of the item that owns this effect. */
    sourceSlot: SlotPosition;
    /** Current machine state (read-only snapshot for resolution). */
    machine: MachineState;
    /** Mutable round ledger — effects write bonuses here. */
    ledger: RoundLedger;
};

// ── Rarity (per-instance modifier) ───────────────────────
export type RarityModifier = "common" | "uncommon" | "rare" | "legendary";

export const RARITY_WEIGHTS: Record<RarityModifier, number> = {
    common: 70,
    uncommon: 20,
    rare: 8,
    legendary: 2,
};

// ── Item definition (template in catalogue) ──────────────
export type SnackItemDef = {
    /** Unique identifier for this item TYPE (e.g. "soda-can"). */
    defId: string;
    name: string;
    /** 1-2 base tags (type + vibe). All items have these. */
    tags: [ItemTypeTag, ItemVibeTag];
    baseCost: number;
    basePrice: number;
};

// ── Item instance (lives in machine or catalogue) ────────
export type SnackItemInstance = {
    instanceId: UUID;
    defId: string;
    name: string;
    tags: ItemTag[];
    /** Per-instance rarity roll. */
    rarity: RarityModifier;
    /** Cost the player paid to stock this item. */
    cost: number;
    /** Player-set sell price (defaults to basePrice, adjustable in prep). */
    price: number;
    /** Effect granted by rarity/roll. undefined for common items. */
    effect?: ItemEffect;
    /** Simple effect ID for jam build. */
    effectId?: string;
    /** Display name of the effect. */
    effectName?: string;
    /** Display description of the effect. */
    effectDesc?: string;
};

// ── Slot & machine ───────────────────────────────────────
export type SlotPosition = { row: number; col: number };

export type MachineSlot = {
    position: SlotPosition;
    unlocked: boolean;
    featured: boolean;
    item: SnackItemInstance | null;
};

export type MachineState = {
    slots: MachineSlot[];
    /** Grid dimensions (always 3×3, but explicit for adjacency math). */
    rows: 3;
    cols: 3;
};

// ── Round ledger (accumulates bonuses during serve phase) ─
export type RoundLedger = {
    /** Per-sale profit entries. */
    sales: SaleRecord[];
    /** Bonus coins from effects. */
    bonusCoins: number;
    /** Multiplier applied to next sale (stacks multiplicatively). */
    nextSaleMultiplier: number;
    /** Per-tag sale counters (for round-end rebate effects). */
    tagSaleCounts: Partial<Record<ItemTag, number>>;
};

export type SaleRecord = {
    itemInstanceId: UUID;
    baseProfit: number;
    multiplier: number;
    finalProfit: number;
};

// ── Customer ─────────────────────────────────────────────
export type SpendingType =
    | "cheapskate"
    | "budget"
    | "normal"
    | "enthusiast"
    | "whale";

export const SPENDING_TYPE_PRICE_TOLERANCE: Record<SpendingType, number> = {
    cheapskate: 0.5,
    budget: 0.8,
    normal: 1.0,
    enthusiast: 1.3,
    whale: 2.0,
};

export type Customer = {
    id: UUID;
    spendingType: SpendingType;
    /** Optional tag preference. null = impulse buyer. */
    preference: ItemTag | null;
};

// ── Catalogue & upgrades ─────────────────────────────────
export type CatalogueState = {
    /** How many items the catalogue shows per round. */
    choiceCount: number;
    /** Bonus weight toward rarer items (0 = default odds). */
    rarityBonus: number;
    /** Weighted effect themes (increase odds of specific triggers). */
    effectThemeWeights: Partial<Record<EffectTrigger, number>>;
};

export type CatalogueOffering = {
    items: SnackItemInstance[];
};

// ── Upgrades ─────────────────────────────────────────────
export type UpgradeId = "unlock-slot" | "better-catalogue" | "reinforce-machine";

export type UpgradeDef = {
    id: UpgradeId;
    name: string;
    description: string;
    /** Cost for the Nth purchase (0-indexed). */
    cost: (timesBought: number) => number;
    /** Max times this upgrade can be purchased. */
    maxPurchases: number;
};

// ── Round event definitions ──────────────────────────────
export type RoundEventDef = {
    name: string;
    description: string;
    /** Mood that gets boosted (more customers want it). */
    boostedMood?: string;
    /** Customer count modifier (+/-). */
    customerDelta?: number;
    /** Anger modifier (multiplied). */
    angerMult?: number;
    /** Sell-chance multiplier (e.g. 1.3 = +30% buy rate). */
    sellChanceMult?: number;
    /** Revenue multiplier (e.g. 0.8 = 20% less money per sale). */
    priceMult?: number;
    /** Flat damage reduction per kick this round. */
    damageReduction?: number;
    /** HP regenerated at start of round. */
    hpRegen?: number;
};

import type { StickerInstance } from "./stickerTypes";

// ── Game mode & win conditions ────────────────────────────
export type GameMode = "retirement" | "profiteer";

/** Retirement: accumulate this many coins to win. */
export const RETIREMENT_GOAL = 300;

/** Profiteer: net-profit target for a given round. */
export const profiteerTarget = (round: number): number =>
    Math.floor(8 + round * 3 + (round ** 1.3));

/** Max coins (prevent overflow). */
export const MAX_COINS = 99_999;

// ── Game run state ───────────────────────────────────────
export type GamePhase = "menu" | "prep" | "serve" | "summary" | "game-over" | "win";

export type RoundSummary = {
    totalSales: number;
    totalProfit: number;
    itemsSold: number;
    rentPaid: number;
    netProfit: number;
    /** Total HP damage dealt by angry customers this round. */
    damageTaken: number;
    /** Number of kicks this round. */
    kicks: number;
};

export type RunState = {
    phase: GamePhase;
    gameMode: GameMode;
    round: number;
    coins: number;
    rent: number;
    machineHp: number;
    maxMachineHp: number;
    machine: MachineState;
    catalogue: CatalogueState;
    /** Current round's event (if any). Rolled at start of prep phase. */
    roundEvent: RoundEventDef | null;
    /** Last completed round summary (shown in summary phase). */
    lastSummary: RoundSummary | null;
    /** How many times each upgrade has been purchased. */
    upgradeCounts: Record<UpgradeId, number>;
    /** How many times the catalogue has been rerolled this round. */
    rerollCount: number;
    /** Machine stickers (Balatro-style jokers). */
    stickers: StickerInstance[];
    /** Max sticker slots (default 5). */
    maxStickerSlots: number;
    /** Consecutive profitable rounds (for scaling stickers). */
    profitStreak: number;
};
