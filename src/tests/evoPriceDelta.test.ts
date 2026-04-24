import { describe, it, expect } from "vitest";
import { evoPriceDelta, ROTTEN_LEVEL } from "@/logic/snack/itemEvolution";

describe("evoPriceDelta", () => {
    it("returns 0 for Fresh items", () => {
        expect(evoPriceDelta(5, 0)).toBe(0);
    });

    it("returns +2 for Vintage", () => {
        expect(evoPriceDelta(5, 1)).toBe(2);
    });

    it("returns +4 for Legendary", () => {
        expect(evoPriceDelta(5, 2)).toBe(4);
    });

    it("clamps to MAX_EVO_LEVEL bonus when given a higher level", () => {
        // Future-proof: even if some caller passes a too-high level, cap it.
        expect(evoPriceDelta(5, 99)).toBe(4);
    });

    it("returns negative delta for Rotten that lands on round(price * 0.4)", () => {
        // 9 * 0.4 = 3.6 → round → 4. delta = 4 - 9 = -5
        expect(evoPriceDelta(9, ROTTEN_LEVEL)).toBe(-5);
    });

    it("floors rotten price at 1¢ via min(1, ...)", () => {
        // 2 * 0.4 = 0.8 → 1 (floor). delta = 1 - 2 = -1
        expect(evoPriceDelta(2, ROTTEN_LEVEL)).toBe(-1);
        // 1 * 0.4 = 0.4 → 1 (floor). delta = 1 - 1 = 0
        expect(evoPriceDelta(1, ROTTEN_LEVEL)).toBe(0);
    });

    it("anchor price reconstructs evolved price when added to default", () => {
        // Legendary item: anchor = default + delta = 5 + 4 = 9
        expect(5 + evoPriceDelta(5, 2)).toBe(9);
        // Rotten item starting from default 9: anchor = 9 + (-5) = 4
        expect(9 + evoPriceDelta(9, ROTTEN_LEVEL)).toBe(4);
    });
});
