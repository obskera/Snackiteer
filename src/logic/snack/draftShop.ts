import type {
    CatalogueState,
    DraftOffering,
    ItemQuality,
    PackOffering,
    SnackItemInstance,
} from "./snackTypes";
import { BASE_COOLER_SIZE, COOLER_SIZE_PER_UPGRADE } from "./snackTypes";
import { createItemInstance } from "./snackFactory";
import { STARTER_ITEM_DEFS, getItemDef } from "./itemDefs";
import { PACK_DEFS } from "./packDefs";
import { ROTTEN_LEVEL } from "./itemEvolution";

// ── Config ───────────────────────────────────────────────

/** How many single items to offer per draft hand. */
const SINGLES_COUNT = 4;
/** How many packs to offer per draft hand. */
const PACKS_COUNT = 2;
/** How many pre-aged items to offer per draft hand. */
const AGED_COUNT = 2;

// ── Helpers ──────────────────────────────────────────────

/** Pick a random element from an array. */
const pick = <T>(arr: readonly T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

/** Shuffle an array in place (Fisher-Yates). */
const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/** Pick a random quality from the unlocked tiers. */
const pickQuality = (catalogue: CatalogueState): ItemQuality =>
    pick(catalogue.unlockedQualities);

// ── Age weights ──────────────────────────────────────────
type AgeEntry = { level: number; prefix: string; priceAdj: number };
const AGE_TABLE: { weight: number; entry: AgeEntry }[] = [
    { weight: 35, entry: { level: 0, prefix: "", priceAdj: 0 } },        // Fresh
    { weight: 35, entry: { level: 1, prefix: "Vintage", priceAdj: 2 } },  // Vintage
    { weight: 20, entry: { level: 2, prefix: "Legendary", priceAdj: 4 } },// Legendary
    { weight: 10, entry: { level: ROTTEN_LEVEL, prefix: "Rotten", priceAdj: -2 } }, // Rotten
];
const AGE_TOTAL = AGE_TABLE.reduce((s, e) => s + e.weight, 0);

const rollAge = (): AgeEntry => {
    let r = Math.random() * AGE_TOTAL;
    for (const { weight, entry } of AGE_TABLE) {
        r -= weight;
        if (r <= 0) return entry;
    }
    return AGE_TABLE[0].entry;
};

/** Create an item with a pre-rolled age modifier. */
const createAgedItem = (
    catalogue: CatalogueState,
): SnackItemInstance => {
    const def = pick(STARTER_ITEM_DEFS);
    const quality = pickQuality(catalogue);
    const inst = createItemInstance(def, quality);
    const age = rollAge();
    if (age.level !== 0) {
        inst.baseName = inst.name;
        inst.name = `${age.prefix} ${inst.name}`;
        inst.evoLevel = age.level;
        inst.price = Math.max(1, inst.price + age.priceAdj);
        // Aged items cost less to buy (discount for risk/reward)
        if (age.level === ROTTEN_LEVEL) {
            inst.cost = Math.max(1, Math.round(inst.cost * 0.4));
        } else {
            inst.cost = Math.max(1, Math.round(inst.cost * 0.8));
        }
    }
    return inst;
};

// ── Draft generation ─────────────────────────────────────

/**
 * Generate a draft hand: random single items + random packs.
 * Each call produces a fresh random selection.
 */
export function generateDraftOffering(
    catalogue: CatalogueState,
    singlesCount: number = SINGLES_COUNT,
    packsCount: number = PACKS_COUNT,
): DraftOffering {
    // Singles: pick random defs, random quality
    const availableDefs = [...STARTER_ITEM_DEFS];
    shuffle(availableDefs);
    const singles: SnackItemInstance[] = [];
    for (let i = 0; i < singlesCount; i++) {
        const def = availableDefs[i % availableDefs.length];
        const quality = pickQuality(catalogue);
        singles.push(createItemInstance(def, quality));
    }

    // Aged items: existing items with random age modifier (separate track)
    const aged: SnackItemInstance[] = [];
    for (let i = 0; i < AGED_COUNT; i++) {
        aged.push(createAgedItem(catalogue));
    }

    // Packs: pick random pack defs, roll items
    const availablePacks = [...PACK_DEFS];
    shuffle(availablePacks);
    const packs: PackOffering[] = [];
    for (let i = 0; i < packsCount && i < availablePacks.length; i++) {
        const packDef = availablePacks[i];
        const quality = packDef.quality ?? pickQuality(catalogue);
        const items: SnackItemInstance[] = [];
        let baseCost = 0;
        for (const defId of packDef.contents) {
            const itemDef = getItemDef(defId);
            if (!itemDef) continue;
            const inst = createItemInstance(itemDef, quality);
            items.push(inst);
            baseCost += inst.cost;
        }
        const totalCost = Math.max(1, Math.round(baseCost * packDef.costMult));
        packs.push({
            packId: packDef.id,
            name: packDef.name,
            items,
            totalCost,
            hint: packDef.hint,
        });
    }

    return { singles, aged, soldAgedIds: [], packs };
}

// ── Cooler helpers ───────────────────────────────────────

/** Compute max cooler size from upgrade count. */
export const maxCoolerSize = (expandCoolerCount: number): number =>
    BASE_COOLER_SIZE + expandCoolerCount * COOLER_SIZE_PER_UPGRADE;

/** Can the cooler hold more items? */
export const canAddToCooler = (
    cooler: SnackItemInstance[],
    maxCooler: number = BASE_COOLER_SIZE,
): boolean => cooler.length < maxCooler;

/** How many more items can the cooler hold? */
export const coolerSpaceLeft = (
    cooler: SnackItemInstance[],
    maxCooler: number = BASE_COOLER_SIZE,
): number => maxCooler - cooler.length;

/** Check if a pack fits in the cooler. */
export const packFitsInCooler = (
    cooler: SnackItemInstance[],
    pack: PackOffering,
    maxCooler: number = BASE_COOLER_SIZE,
): boolean => coolerSpaceLeft(cooler, maxCooler) >= pack.items.length;

/** Reroll cost for the catalogue draft. Escalates per reroll. */
export const draftRerollCost = (
    round: number,
    rerollCount: number,
): number => 2 + Math.floor(round / 3) + rerollCount * 2;
