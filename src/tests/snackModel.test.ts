import { describe, it, expect } from "vitest";
import {
    rollRarity,
    createItemInstance,
    generateCatalogueOffering,
    createMachineState,
    getSlot,
    getAdjacentSlots,
    createRoundLedger,
    createRunState,
    trashItem,
    rentForRound,
} from "@/logic/snack/snackFactory";
import { STARTER_ITEM_DEFS } from "@/logic/snack/itemDefs";
import type {
    CatalogueState,
    RarityModifier,
} from "@/logic/snack/snackTypes";

describe("rollRarity", () => {
    it("returns a valid rarity modifier", () => {
        const valid: RarityModifier[] = [
            "common",
            "uncommon",
            "rare",
            "legendary",
        ];
        for (let i = 0; i < 50; i++) {
            expect(valid).toContain(rollRarity(0));
        }
    });

    it("higher bonus shifts weight toward rarer tiers", () => {
        const counts: Record<RarityModifier, number> = {
            common: 0,
            uncommon: 0,
            rare: 0,
            legendary: 0,
        };
        for (let i = 0; i < 1000; i++) {
            counts[rollRarity(40)]++;
        }
        // With bonus 40, common should be less dominant
        expect(counts.common).toBeLessThan(600);
        expect(counts.uncommon + counts.rare + counts.legendary).toBeGreaterThan(
            400,
        );
    });
});

describe("createItemInstance", () => {
    const sodaDef = STARTER_ITEM_DEFS[0]; // soda-can

    it("creates a common instance with base cost", () => {
        const item = createItemInstance(sodaDef, "common");
        expect(item.defId).toBe("soda-can");
        expect(item.name).toBe("Soda Can");
        expect(item.tags).toEqual(["drink", "sweet"]);
        expect(item.rarity).toBe("common");
        expect(item.cost).toBe(sodaDef.baseCost);
        expect(item.price).toBe(sodaDef.basePrice);
        expect(item.effect).toBeUndefined();
        expect(item.instanceId).toBeTruthy();
    });

    it("increases cost for higher rarities", () => {
        const uncommon = createItemInstance(sodaDef, "uncommon");
        const rare = createItemInstance(sodaDef, "rare");
        const legendary = createItemInstance(sodaDef, "legendary");
        expect(uncommon.cost).toBeGreaterThan(sodaDef.baseCost);
        expect(rare.cost).toBeGreaterThan(uncommon.cost);
        expect(legendary.cost).toBeGreaterThan(rare.cost);
    });
});

describe("generateCatalogueOffering", () => {
    it("generates the correct number of items", () => {
        const catalogue: CatalogueState = {
            choiceCount: 5,
            rarityBonus: 0,
            effectThemeWeights: {},
        };
        const offering = generateCatalogueOffering(catalogue);
        expect(offering.items).toHaveLength(5);
    });

    it("respects custom choice count", () => {
        const catalogue: CatalogueState = {
            choiceCount: 8,
            rarityBonus: 0,
            effectThemeWeights: {},
        };
        const offering = generateCatalogueOffering(catalogue);
        expect(offering.items).toHaveLength(8);
    });

    it("each item has a unique instanceId", () => {
        const catalogue: CatalogueState = {
            choiceCount: 5,
            rarityBonus: 0,
            effectThemeWeights: {},
        };
        const offering = generateCatalogueOffering(catalogue);
        const ids = offering.items.map((i) => i.instanceId);
        expect(new Set(ids).size).toBe(5);
    });
});

describe("createMachineState", () => {
    it("creates a 3x3 grid with 3 unlocked slots", () => {
        const machine = createMachineState();
        expect(machine.slots).toHaveLength(9);
        expect(machine.rows).toBe(3);
        expect(machine.cols).toBe(3);

        const unlocked = machine.slots.filter((s) => s.unlocked);
        expect(unlocked).toHaveLength(3);
    });

    it("first 3 slots (top row) are unlocked", () => {
        const machine = createMachineState();
        expect(getSlot(machine, 0, 0)?.unlocked).toBe(true);
        expect(getSlot(machine, 0, 1)?.unlocked).toBe(true);
        expect(getSlot(machine, 0, 2)?.unlocked).toBe(true);
        expect(getSlot(machine, 1, 0)?.unlocked).toBe(false);
    });

    it("all slots start empty and not featured", () => {
        const machine = createMachineState();
        for (const slot of machine.slots) {
            expect(slot.item).toBeNull();
            expect(slot.featured).toBe(false);
        }
    });
});

describe("getSlot", () => {
    it("returns the correct slot", () => {
        const machine = createMachineState();
        const slot = getSlot(machine, 1, 2);
        expect(slot?.position).toEqual({ row: 1, col: 2 });
    });

    it("returns undefined for out-of-bounds", () => {
        const machine = createMachineState();
        expect(getSlot(machine, 3, 0)).toBeUndefined();
        expect(getSlot(machine, -1, 0)).toBeUndefined();
    });
});

describe("getAdjacentSlots", () => {
    it("corner slot has 2 potential neighbors", () => {
        const machine = createMachineState();
        // Unlock all for this test
        machine.slots.forEach((s) => (s.unlocked = true));
        const adj = getAdjacentSlots(machine, { row: 0, col: 0 });
        expect(adj).toHaveLength(2);
    });

    it("center slot has 4 neighbors when all unlocked", () => {
        const machine = createMachineState();
        machine.slots.forEach((s) => (s.unlocked = true));
        const adj = getAdjacentSlots(machine, { row: 1, col: 1 });
        expect(adj).toHaveLength(4);
    });

    it("excludes locked slots", () => {
        const machine = createMachineState(); // only top row unlocked
        const adj = getAdjacentSlots(machine, { row: 0, col: 1 });
        // left (0,0) and right (0,2) are unlocked, below (1,1) is locked
        expect(adj).toHaveLength(2);
    });
});

describe("createRoundLedger", () => {
    it("starts with empty sales and 1x multiplier", () => {
        const ledger = createRoundLedger();
        expect(ledger.sales).toEqual([]);
        expect(ledger.bonusCoins).toBe(0);
        expect(ledger.nextSaleMultiplier).toBe(1);
        expect(ledger.tagSaleCounts).toEqual({});
    });
});

describe("createRunState", () => {
    it("initializes with correct defaults", () => {
        const run = createRunState();
        expect(run.phase).toBe("prep");
        expect(run.round).toBe(1);
        expect(run.coins).toBe(20);
        expect(run.rent).toBe(5);
        expect(run.machine.slots).toHaveLength(9);
        expect(run.catalogue.choiceCount).toBe(5);
        expect(run.roundEvent).toBeNull();
    });
});

describe("trashItem", () => {
    it("refunds 10% of cost and removes item", () => {
        const run = createRunState();
        const item = createItemInstance(STARTER_ITEM_DEFS[0], "common");
        item.cost = 10;
        const slot = getSlot(run.machine, 0, 0)!;
        slot.item = item;
        const startCoins = run.coins;

        const result = trashItem(run, 0, 0);
        expect(result).not.toBeNull();
        expect(result!.refund).toBe(1); // 10% of 10
        expect(run.coins).toBe(startCoins + 1);
        expect(slot.item).toBeNull();
    });

    it("returns null for empty slot", () => {
        const run = createRunState();
        expect(trashItem(run, 0, 0)).toBeNull();
    });

    it("refunds minimum of 1 coin", () => {
        const run = createRunState();
        const item = createItemInstance(STARTER_ITEM_DEFS[0], "common");
        item.cost = 2; // 10% = 0.2, rounds to 0, but min is 1
        const slot = getSlot(run.machine, 0, 0)!;
        slot.item = item;

        const result = trashItem(run, 0, 0);
        expect(result!.refund).toBe(1);
    });
});

describe("rentForRound", () => {
    it("escalates rent each round", () => {
        const baseRent = 5;
        const r1 = rentForRound(1, baseRent);
        const r5 = rentForRound(5, baseRent);
        const r10 = rentForRound(10, baseRent);
        expect(r1).toBeLessThan(r5);
        expect(r5).toBeLessThan(r10);
    });

    it("returns base rent + floor(round * 1.5)", () => {
        expect(rentForRound(1, 5)).toBe(5 + Math.floor(1 * 1.5));
        expect(rentForRound(4, 5)).toBe(5 + Math.floor(4 * 1.5));
    });
});
