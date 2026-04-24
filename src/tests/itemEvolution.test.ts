import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    evolveUnsoldItems,
    ROTTEN_LEVEL,
    MAX_EVO_LEVEL,
} from "@/logic/snack/itemEvolution";
import type { MachineState, SnackItemInstance } from "@/logic/snack";

function makeItem(overrides: Partial<SnackItemInstance> = {}): SnackItemInstance {
    return {
        instanceId: "i1",
        defId: "soda-can",
        name: "Soda Can",
        baseName: undefined,
        cost: 3,
        price: 5,
        quality: "common",
        tags: ["drink", "sweet"],
        evoLevel: 0,
        ...overrides,
    } as SnackItemInstance;
}

function makeMachine(item: SnackItemInstance | null): MachineState {
    return {
        rows: 1,
        cols: 1,
        slots: [
            {
                position: { row: 0, col: 0 },
                unlocked: true,
                item,
                featured: false,
            },
        ],
    };
}

describe("itemEvolution", () => {
    let randomSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        randomSpy = vi.spyOn(Math, "random");
    });
    afterEach(() => {
        randomSpy.mockRestore();
    });

    it("evolves Fresh → Vintage with +2¢ price", () => {
        const item = makeItem({ price: 5, evoLevel: 0 });
        const machine = makeMachine(item);
        const result = evolveUnsoldItems(machine);

        expect(item.evoLevel).toBe(1);
        expect(item.name).toBe("Vintage Soda Can");
        expect(item.price).toBe(7);
        expect(result.evolved).toHaveLength(1);
        expect(result.rotted).toHaveLength(0);
    });

    it("evolves Vintage → Legendary with another +2¢", () => {
        const item = makeItem({
            price: 7,
            evoLevel: 1,
            baseName: "Soda Can",
            name: "Vintage Soda Can",
        });
        const machine = makeMachine(item);
        evolveUnsoldItems(machine);

        expect(item.evoLevel).toBe(MAX_EVO_LEVEL);
        expect(item.name).toBe("Legendary Soda Can");
        expect(item.price).toBe(9);
    });

    it("rots a Legendary item when the roll is below the rotten chance", () => {
        randomSpy.mockReturnValue(0.01); // < 0.35 → rots
        const item = makeItem({
            price: 9,
            evoLevel: MAX_EVO_LEVEL,
            baseName: "Soda Can",
            name: "Legendary Soda Can",
        });
        const machine = makeMachine(item);
        const result = evolveUnsoldItems(machine);

        expect(item.evoLevel).toBe(ROTTEN_LEVEL);
        expect(item.name).toBe("Rotten Soda Can");
        // 9 × 0.4 = 3.6 → rounds to 4 (the 40% penalty)
        expect(item.price).toBe(4);
        expect(result.rotted).toHaveLength(1);
        expect(result.evolved).toHaveLength(0);
    });

    it("keeps Legendary unchanged when the rotten roll fails", () => {
        randomSpy.mockReturnValue(0.99); // > 0.35 → no rot
        const item = makeItem({
            price: 9,
            evoLevel: MAX_EVO_LEVEL,
            baseName: "Soda Can",
            name: "Legendary Soda Can",
        });
        const machine = makeMachine(item);
        const result = evolveUnsoldItems(machine);

        expect(item.evoLevel).toBe(MAX_EVO_LEVEL);
        expect(item.price).toBe(9);
        expect(result.rotted).toHaveLength(0);
        expect(result.evolved).toHaveLength(0);
    });

    it("does NOT re-age a rotten item — it stays rotten with the same price", () => {
        const item = makeItem({
            price: 4,
            evoLevel: ROTTEN_LEVEL,
            baseName: "Soda Can",
            name: "Rotten Soda Can",
        });
        const machine = makeMachine(item);

        // Multiple round passes
        for (let i = 0; i < 5; i++) {
            randomSpy.mockReturnValue(0.01); // would rot if eligible
            const r = evolveUnsoldItems(machine);
            expect(r.evolved).toHaveLength(0);
            expect(r.rotted).toHaveLength(0);
        }

        expect(item.evoLevel).toBe(ROTTEN_LEVEL);
        expect(item.name).toBe("Rotten Soda Can");
        expect(item.price).toBe(4); // price penalty preserved
    });

    it("enforces a minimum sell price of 1¢ when rotting a cheap item", () => {
        randomSpy.mockReturnValue(0.01);
        const item = makeItem({
            price: 2,
            evoLevel: MAX_EVO_LEVEL,
            baseName: "Gumball",
            name: "Legendary Gumball",
        });
        const machine = makeMachine(item);
        evolveUnsoldItems(machine);

        // 2 × 0.4 = 0.8 → rounds to 1 (floor at 1)
        expect(item.evoLevel).toBe(ROTTEN_LEVEL);
        expect(item.price).toBe(1);
    });
});
