import { describe, it, expect } from "vitest";
import {
    generateDraftOffering,
    maxCoolerSize,
    canAddToCooler,
    coolerSpaceLeft,
    packFitsInCooler,
    draftRerollCost,
} from "@/logic/snack/draftShop";
import { createItemInstance } from "@/logic/snack/snackFactory";
import { STARTER_ITEM_DEFS } from "@/logic/snack/itemDefs";
import { PACK_DEFS } from "@/logic/snack/packDefs";
import type { CatalogueState } from "@/logic/snack/snackTypes";
import { BASE_COOLER_SIZE, COOLER_SIZE_PER_UPGRADE } from "@/logic/snack/snackTypes";

const BASE_CATALOGUE: CatalogueState = {
    unlockedQualities: ["common"],
};

const MULTI_QUALITY: CatalogueState = {
    unlockedQualities: ["common", "good", "fancy"],
};

// ── generateDraftOffering ────────────────────────────────

describe("generateDraftOffering", () => {
    it("returns the requested number of singles", () => {
        const draft = generateDraftOffering(BASE_CATALOGUE, 5, 0);
        expect(draft.singles).toHaveLength(5);
        expect(draft.packs).toHaveLength(0);
    });

    it("returns the requested number of packs", () => {
        const draft = generateDraftOffering(BASE_CATALOGUE, 0, 3);
        expect(draft.singles).toHaveLength(0);
        expect(draft.packs).toHaveLength(3);
    });

    it("defaults to 4 singles and 2 packs", () => {
        const draft = generateDraftOffering(BASE_CATALOGUE);
        expect(draft.singles).toHaveLength(4);
        expect(draft.packs).toHaveLength(2);
    });

    it("each single has a valid defId from STARTER_ITEM_DEFS", () => {
        const validIds = new Set(STARTER_ITEM_DEFS.map((d) => d.defId));
        const draft = generateDraftOffering(BASE_CATALOGUE, 10, 0);
        for (const item of draft.singles) {
            expect(validIds.has(item.defId)).toBe(true);
        }
    });

    it("each pack has items matching its pack def contents", () => {
        const draft = generateDraftOffering(BASE_CATALOGUE, 0, PACK_DEFS.length);
        for (const pack of draft.packs) {
            const def = PACK_DEFS.find((p) => p.id === pack.packId);
            expect(def).toBeDefined();
            expect(pack.items).toHaveLength(def!.contents.length);
            for (let i = 0; i < pack.items.length; i++) {
                expect(pack.items[i].defId).toBe(def!.contents[i]);
            }
        }
    });

    it("pack cost is discounted relative to individual item costs", () => {
        const draft = generateDraftOffering(BASE_CATALOGUE, 0, PACK_DEFS.length);
        for (const pack of draft.packs) {
            const def = PACK_DEFS.find((p) => p.id === pack.packId)!;
            const individualCost = pack.items.reduce((sum, it) => sum + it.cost, 0);
            const expected = Math.max(1, Math.round(individualCost * def.costMult));
            expect(pack.totalCost).toBe(expected);
            // Should be cheaper (or equal) to buying individually
            expect(pack.totalCost).toBeLessThanOrEqual(individualCost);
        }
    });

    it("respects unlocked quality tiers", () => {
        // With only common unlocked, all items should be common
        const draft = generateDraftOffering(BASE_CATALOGUE, 6, 2);
        for (const item of draft.singles) {
            expect(item.quality).toBe("common");
        }
    });

    it("produces different results on repeated calls (randomness)", () => {
        // Run it a few times and check that not all results are identical
        const results = Array.from({ length: 10 }, () =>
            generateDraftOffering(MULTI_QUALITY, 4, 2),
        );
        const firstSinglesIds = results[0].singles.map((s) => s.defId).join(",");
        const allSame = results.every(
            (r) => r.singles.map((s) => s.defId).join(",") === firstSinglesIds,
        );
        // With 6 items and 4 picks, extremely unlikely to be identical 10 times
        expect(allSame).toBe(false);
    });

    it("pack items have unique instanceIds", () => {
        const draft = generateDraftOffering(BASE_CATALOGUE, 4, 3);
        const allIds = [
            ...draft.singles.map((s) => s.instanceId),
            ...draft.packs.flatMap((p) => p.items.map((i) => i.instanceId)),
        ];
        expect(new Set(allIds).size).toBe(allIds.length);
    });
});

// ── Cooler helpers ────────────────────────────────────────

describe("canAddToCooler", () => {
    it("returns true when cooler has space", () => {
        expect(canAddToCooler([])).toBe(true);
        const partial = Array.from({ length: BASE_COOLER_SIZE - 1 }, () =>
            createItemInstance(STARTER_ITEM_DEFS[0], "common"),
        );
        expect(canAddToCooler(partial)).toBe(true);
    });

    it("returns false when cooler is full", () => {
        const full = Array.from({ length: BASE_COOLER_SIZE }, () =>
            createItemInstance(STARTER_ITEM_DEFS[0], "common"),
        );
        expect(canAddToCooler(full)).toBe(false);
    });

    it("respects expanded cooler from upgrades", () => {
        const upgraded = maxCoolerSize(2); // BASE + 2*2 = 8
        const items = Array.from({ length: BASE_COOLER_SIZE + 1 }, () =>
            createItemInstance(STARTER_ITEM_DEFS[0], "common"),
        );
        // Would be full at base size, but not with upgrades
        expect(canAddToCooler(items, upgraded)).toBe(true);
    });
});

describe("coolerSpaceLeft", () => {
    it("returns BASE_COOLER_SIZE for empty cooler", () => {
        expect(coolerSpaceLeft([])).toBe(BASE_COOLER_SIZE);
    });

    it("returns 0 for full cooler", () => {
        const full = Array.from({ length: BASE_COOLER_SIZE }, () =>
            createItemInstance(STARTER_ITEM_DEFS[0], "common"),
        );
        expect(coolerSpaceLeft(full)).toBe(0);
    });

    it("returns expanded space with upgrades", () => {
        const upgraded = maxCoolerSize(1); // BASE + 2 = 6
        expect(coolerSpaceLeft([], upgraded)).toBe(upgraded);
    });
});

describe("packFitsInCooler", () => {
    it("returns true when cooler has enough space for pack items", () => {
        const pack = generateDraftOffering(BASE_CATALOGUE, 0, 1).packs[0];
        expect(packFitsInCooler([], pack)).toBe(true);
    });

    it("returns false when cooler cannot hold all pack items", () => {
        const almostFull = Array.from({ length: BASE_COOLER_SIZE - 1 }, () =>
            createItemInstance(STARTER_ITEM_DEFS[0], "common"),
        );
        const draft = generateDraftOffering(BASE_CATALOGUE, 0, PACK_DEFS.length);
        // Find a pack with 2+ items
        const bigPack = draft.packs.find((p) => p.items.length >= 2);
        if (bigPack) {
            expect(packFitsInCooler(almostFull, bigPack)).toBe(false);
        }
    });
});

describe("maxCoolerSize", () => {
    it("returns BASE_COOLER_SIZE with 0 upgrades", () => {
        expect(maxCoolerSize(0)).toBe(BASE_COOLER_SIZE);
    });

    it("adds COOLER_SIZE_PER_UPGRADE per upgrade level", () => {
        expect(maxCoolerSize(1)).toBe(BASE_COOLER_SIZE + COOLER_SIZE_PER_UPGRADE);
        expect(maxCoolerSize(3)).toBe(BASE_COOLER_SIZE + 3 * COOLER_SIZE_PER_UPGRADE);
    });
});

// ── draftRerollCost ──────────────────────────────────────

describe("draftRerollCost", () => {
    it("starts at 2 on round 1 with 0 rerolls", () => {
        expect(draftRerollCost(1, 0)).toBe(2);
    });

    it("escalates with rerolls", () => {
        const c0 = draftRerollCost(1, 0);
        const c1 = draftRerollCost(1, 1);
        const c2 = draftRerollCost(1, 2);
        expect(c1).toBeGreaterThan(c0);
        expect(c2).toBeGreaterThan(c1);
    });

    it("escalates with round number", () => {
        const early = draftRerollCost(1, 0);
        const late = draftRerollCost(10, 0);
        expect(late).toBeGreaterThan(early);
    });
});
