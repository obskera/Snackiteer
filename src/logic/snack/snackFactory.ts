import { generateId } from "@/logic/entity/Entity";
import type {
    CatalogueOffering,
    CatalogueState,
    MachineSlot,
    MachineState,
    RarityModifier,
    RoundLedger,
    RunState,
    SnackItemDef,
    SnackItemInstance,
    UpgradeDef,
    UpgradeId,
} from "./snackTypes";
import { RARITY_WEIGHTS } from "./snackTypes";
import { STARTER_ITEM_DEFS } from "./itemDefs";
import { rollEffect } from "./itemEffects";

// ── Rarity rolling ───────────────────────────────────────

/** Pick a rarity using weighted random + catalogue bonus. */
export const rollRarity = (rarityBonus: number): RarityModifier => {
    const weights = { ...RARITY_WEIGHTS };
    // Shift weight from common toward rarer tiers.
    const shift = Math.min(rarityBonus, weights.common - 10);
    weights.common -= shift;
    weights.uncommon += shift * 0.5;
    weights.rare += shift * 0.3;
    weights.legendary += shift * 0.2;

    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;

    for (const [rarity, weight] of Object.entries(weights)) {
        roll -= weight;
        if (roll <= 0) return rarity as RarityModifier;
    }
    return "common";
};

// ── Item instance factory ────────────────────────────────

export const createItemInstance = (
    def: SnackItemDef,
    rarity: RarityModifier,
): SnackItemInstance => {
    const costMultiplier =
        rarity === "uncommon"
            ? 1.2
            : rarity === "rare"
              ? 1.5
              : rarity === "legendary"
                ? 2.0
                : 1.0;

    const effect = rollEffect(rarity);

    return {
        instanceId: generateId(),
        defId: def.defId,
        name: def.name,
        tags: [...def.tags],
        rarity,
        cost: Math.round(def.baseCost * costMultiplier),
        price: def.basePrice,
        effect: undefined,
        effectId: effect?.effectId,
        effectName: effect?.name,
        effectDesc: effect?.description,
    };
};

// ── Catalogue generation ─────────────────────────────────

export const generateCatalogueOffering = (
    catalogue: CatalogueState,
    availableDefs: SnackItemDef[] = STARTER_ITEM_DEFS,
): CatalogueOffering => {
    const items: SnackItemInstance[] = [];
    for (let i = 0; i < catalogue.choiceCount; i++) {
        const def =
            availableDefs[Math.floor(Math.random() * availableDefs.length)];
        const rarity = rollRarity(catalogue.rarityBonus);
        items.push(createItemInstance(def, rarity));
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
    machine.slots.find(
        (s) => s.position.row === row && s.position.col === col,
    );

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

export const createRunState = (mode: import("./snackTypes").GameMode = "retirement"): RunState => ({
    phase: "menu",
    gameMode: mode,
    round: 1,
    coins: STARTING_COINS,
    rent: STARTING_RENT,
    machineHp: MAX_MACHINE_HP,
    maxMachineHp: MAX_MACHINE_HP,
    machine: createMachineState(),
    catalogue: {
        choiceCount: 5,
        rarityBonus: 0,
        effectThemeWeights: {},
    },
    roundEvent: null,
    lastSummary: null,
    upgradeCounts: {
        "unlock-slot": 0,
        "better-catalogue": 0,
        "reinforce-machine": 0,
    },
    rerollCount: 0,
    stickers: [],
    maxStickerSlots: 5,
    profitStreak: 0,
});

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
        description: "Rarer items appear in shop",
        cost: (n) => 12 + n * 8,
        maxPurchases: 5,
    },
    {
        id: "reinforce-machine",
        name: "Reinforce Machine",
        description: "+20 max HP (heals too)",
        cost: (n) => 10 + n * 6,
        maxPurchases: 5,
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
            draft.catalogue.rarityBonus += 5;
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
