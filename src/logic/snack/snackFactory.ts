import { generateId } from "@/logic/entity/Entity";
import type {
    CatalogueOffering,
    CatalogueState,
    ItemQuality,
    MachineSlot,
    MachineState,
    RoundLedger,
    RunState,
    SnackItemDef,
    SnackItemInstance,
    UpgradeDef,
    UpgradeId,
} from "./snackTypes";
import { QUALITY_PRICE_MULT } from "./snackTypes";
import { STARTER_ITEM_DEFS, getItemDef } from "./itemDefs";

// ── Item instance factory ────────────────────────────────

export const createItemInstance = (
    def: SnackItemDef,
    quality: ItemQuality,
): SnackItemInstance => {
    const mult = QUALITY_PRICE_MULT[quality];
    return {
        instanceId: generateId(),
        defId: def.defId,
        name: def.name,
        tags: [...def.tags],
        quality,
        cost: Math.round(def.baseCost * mult),
        price: Math.round(def.basePrice * mult),
    };
};

// ── Catalogue generation ─────────────────────────────────

/**
 * Generates the fixed catalogue: every base item def × every unlocked quality tier.
 * Players always see all items; higher tiers unlock via upgrades.
 */
export const generateCatalogueOffering = (
    catalogue: CatalogueState,
    availableDefs: SnackItemDef[] = STARTER_ITEM_DEFS,
): CatalogueOffering => {
    const items: SnackItemInstance[] = [];
    for (const quality of catalogue.unlockedQualities) {
        for (const def of availableDefs) {
            items.push(createItemInstance(def, quality));
        }
    }
    return { items };
};

// ── Machine factory ──────────────────────────────────────

const INITIAL_UNLOCKED_COUNT = 3;

export const createMachineState = (): MachineState => {
    const slots: MachineSlot[] = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const index = row * 3 + col;
            slots.push({
                position: { row, col },
                unlocked: index < INITIAL_UNLOCKED_COUNT,
                featured: false,
                item: null,
            });
        }
    }
    return { slots, rows: 3, cols: 3 };
};

export const getSlot = (
    machine: MachineState,
    row: number,
    col: number,
): MachineSlot | undefined =>
    machine.slots.find((s) => s.position.row === row && s.position.col === col);

export const getAdjacentSlots = (
    machine: MachineState,
    pos: { row: number; col: number },
): MachineSlot[] => {
    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ];
    return offsets
        .map(([dr, dc]) => getSlot(machine, pos.row + dr, pos.col + dc))
        .filter((s): s is MachineSlot => s != null && s.unlocked);
};

// ── Round ledger factory ─────────────────────────────────

export const createRoundLedger = (): RoundLedger => ({
    sales: [],
    bonusCoins: 0,
    nextSaleMultiplier: 1,
    tagSaleCounts: {},
});

// ── Run state factory ────────────────────────────────────

const STARTING_COINS = 20;
const STARTING_RENT = 5;
const MAX_MACHINE_HP = 100;

export const createRunState = (
    mode: import("./snackTypes").GameMode = "retirement",
): RunState => ({
    phase: "menu",
    gameMode: mode,
    round: 1,
    coins: STARTING_COINS,
    rent: STARTING_RENT,
    machineHp: MAX_MACHINE_HP,
    maxMachineHp: MAX_MACHINE_HP,
    machine: createMachineState(),
    catalogue: {
        unlockedQualities: ["common"],
    },
    roundEvent: null,
    lastSummary: null,
    upgradeCounts: {
        "unlock-slot": 0,
        "better-catalogue": 0,
        "reinforce-machine": 0,
        "feature-slot": 0,
    },
    rerollCount: 0,
    stickers: [],
    maxStickerSlots: 5,
    profitStreak: 0,
    discoveredRecipes: [],
    lockedStickerDefId: null,
});

// ── Price dial ───────────────────────────────────────────

/** Max discount below default price. */
export const PRICE_DIAL_MIN = -2;
/** Max markup above default price. */
export const PRICE_DIAL_MAX = 3;

/**
 * Default sell price for an item (before any player adjustment).
 * Uses the item def's basePrice × quality multiplier.
 */
export const defaultPrice = (item: SnackItemInstance): number => {
    const def = getItemDef(item.defId);
    const base = def?.basePrice ?? item.cost + 2;
    return Math.round(base * QUALITY_PRICE_MULT[item.quality]);
};

/**
 * Price adjustment relative to the item's default.
 * Positive = overpriced, negative = underpriced, 0 = default.
 */
export const priceAdjustment = (item: SnackItemInstance): number =>
    item.price - defaultPrice(item);

// ── Economy helpers ──────────────────────────────────────

/** Cost to reroll the catalogue. Base 3¢ + 1¢ per round + 2¢ per previous reroll. */
export const rerollCost = (round: number, rerollCount: number): number =>
    3 + Math.floor(round / 2) + rerollCount * 2;

/** Trash an item from a slot, refunding 10% of its cost. */
export const trashItem = (
    run: RunState,
    row: number,
    col: number,
): { refund: number } | null => {
    const slot = getSlot(run.machine, row, col);
    if (!slot?.item) return null;
    const refund = Math.max(1, Math.round(slot.item.cost * 0.1));
    run.coins += refund;
    slot.item = null;
    return { refund };
};

/** Calculate rent for a given round (escalates). */
export const rentForRound = (round: number, baseRent: number): number =>
    baseRent + Math.floor(round * 1.5);

// ── Upgrades ─────────────────────────────────────────────

const LOCKED_SLOT_COUNT = 6; // 9 total - 3 initially unlocked

export const UPGRADE_DEFS: UpgradeDef[] = [
    {
        id: "unlock-slot",
        name: "Unlock Slot",
        description: "Open the next machine slot",
        cost: (n) => 15 + n * 10,
        maxPurchases: LOCKED_SLOT_COUNT,
    },
    {
        id: "better-catalogue",
        name: "Better Catalogue",
        description: "Unlock higher quality items in the shop (Good → Fancy)",
        cost: (n) => 15 + n * 10,
        maxPurchases: 2,
    },
    {
        id: "reinforce-machine",
        name: "Reinforce Machine",
        description: "+20 max HP (heals too)",
        cost: (n) => 10 + n * 6,
        maxPurchases: 5,
    },
    {
        id: "feature-slot",
        name: "Featured Slot",
        description: "Pick a slot to feature — customers love it",
        cost: () => 10,
        maxPurchases: 1,
    },
];

export const getUpgradeDef = (id: UpgradeId): UpgradeDef =>
    UPGRADE_DEFS.find((u) => u.id === id)!;

/** Try to purchase an upgrade. Returns true if successful. Mutates draft. */
export const purchaseUpgrade = (draft: RunState, id: UpgradeId): boolean => {
    const def = getUpgradeDef(id);
    const count = draft.upgradeCounts[id];
    if (count >= def.maxPurchases) return false;
    const cost = def.cost(count);
    if (draft.coins < cost) return false;

    draft.coins -= cost;
    draft.upgradeCounts[id] = count + 1;

    switch (id) {
        case "unlock-slot": {
            const locked = draft.machine.slots.find((s) => !s.unlocked);
            if (locked) locked.unlocked = true;
            break;
        }
        case "better-catalogue": {
            const nextQuality =
                draft.catalogue.unlockedQualities.length === 1
                    ? "good"
                    : "fancy";
            if (!draft.catalogue.unlockedQualities.includes(nextQuality)) {
                draft.catalogue.unlockedQualities.push(nextQuality);
            }
            break;
        }
        case "reinforce-machine": {
            draft.maxMachineHp += 20;
            draft.machineHp += 20;
            break;
        }
    }
    return true;
};
