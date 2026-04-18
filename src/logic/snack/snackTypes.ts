import type { UUID } from "@/logic/entity/Entity";

// ── Tag axes ──────────────────────────────────────────────
/** Axis 1 – what the item IS (category) */
export type ItemTypeTag = "drink" | "snack" | "candy";

/** Axis 2 – how it FEELS (vibe) */
export type ItemVibeTag = "sweet" | "salty" | "sour" | "spicy" | "refreshing";

export type ItemTag = ItemTypeTag | ItemVibeTag;

// ── Quality (per-instance tier) ───────────────────────────
export type ItemQuality = "common" | "good" | "fancy";

export const QUALITY_PRICE_MULT: Record<ItemQuality, number> = {
    common: 1.0,
    good: 1.5,
    fancy: 2.5,
};

// ── Item definition (template in catalogue) ──────────────
export type SnackItemDef = {
    /** Unique identifier for this item TYPE (e.g. "soda-can"). */
    defId: string;
    name: string;
    /** Base tags: category + vibe. */
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
    /** Quality tier for this instance. */
    quality: ItemQuality;
    /** Cost the player paid to stock this item. */
    cost: number;
    /** Player-set sell price (defaults to scaled basePrice, adjustable in prep). */
    price: number;
    /** Evolution level: 0 = base, 1 = Vintage, 2 = Legendary. Unsold items evolve between rounds. */
    evoLevel?: number;
    /** Original base name before evolution prefix was applied. */
    baseName?: string;
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
    /** Quality tiers currently available for purchase in the catalogue. */
    unlockedQualities: ItemQuality[];
};

export type CatalogueOffering = {
    items: SnackItemInstance[];
};

// ── Upgrades ─────────────────────────────────────────────
export type UpgradeId =
    | "unlock-slot"
    | "better-catalogue"
    | "reinforce-machine"
    | "feature-slot";

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
    Math.floor(8 + round * 3 + round ** 1.3);

/** Max coins (prevent overflow). */
export const MAX_COINS = 99_999;

// ── Game run state ───────────────────────────────────────
export type GamePhase =
    | "menu"
    | "prep"
    | "serve"
    | "summary"
    | "sticker-shop"
    | "game-over"
    | "win";

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
    /** Items that evolved this round. */
    evolved: { name: string; level: number }[];
    /** Items that went rotten this round. */
    rotted: { name: string }[];
    /** New recipes discovered this round. */
    newRecipes: { name: string; bonus: number }[];
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
    /** IDs of discovered recipes (persisted across rounds). */
    discoveredRecipes: string[];
    /** Locked sticker def ID — guaranteed to appear in next sticker shop. Max 1. */
    lockedStickerDefId: string | null;
};
