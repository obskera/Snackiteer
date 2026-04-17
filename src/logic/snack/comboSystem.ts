import type { MachineSlot, MachineState } from "./snackTypes";

export type ComboResult = {
    /** Human-readable combo name. */
    name: string;
    /** Bonus coins awarded. */
    bonus: number;
    /** Positions involved. */
    positions: { row: number; col: number }[];
    /** Whether combo-boost effect enhanced this combo. */
    boosted?: boolean;
};

type ComboRule = {
    name: string;
    /** Tags that must overlap between adjacent items. */
    sharedTag: string;
    /** Bonus per pair. */
    bonus: number;
};

const COMBO_RULES: ComboRule[] = [
    { sharedTag: "sweet", name: "Sweet Combo", bonus: 2 },
    { sharedTag: "salty", name: "Salt Stack", bonus: 2 },
    { sharedTag: "drink", name: "Drink Duo", bonus: 3 },
    { sharedTag: "candy", name: "Candy Pair", bonus: 2 },
    { sharedTag: "snack", name: "Snack Synergy", bonus: 2 },
    { sharedTag: "premium", name: "Luxury Line", bonus: 4 },
    { sharedTag: "energy", name: "Energy Surge", bonus: 3 },
    { sharedTag: "sour", name: "Sour Power", bonus: 2 },
    { sharedTag: "spicy", name: "Spice Chain", bonus: 3 },
    { sharedTag: "refreshing", name: "Chill Zone", bonus: 3 },
];

/**
 * Detect tag-based combos from adjacent items in the machine.
 * Each pair of adjacent items sharing a tag triggers once (no double-counting).
 */
export const detectCombos = (machine: MachineState): ComboResult[] => {
    const results: ComboResult[] = [];
    // Track seen pairs to avoid double-counting (A-B and B-A)
    const seenPairs = new Set<string>();

    for (const slot of machine.slots) {
        if (!slot.unlocked || !slot.item) continue;
        const { row, col } = slot.position;

        // Check right and down neighbors only (avoids duplicates)
        const neighbors: [number, number][] = [[row, col + 1], [row + 1, col]];

        for (const [nr, nc] of neighbors) {
            const neighbor = machine.slots.find(
                (s) => s.position.row === nr && s.position.col === nc,
            );
            if (!neighbor?.unlocked || !neighbor.item) continue;

            const pairKey = `${row},${col}-${nr},${nc}`;
            if (seenPairs.has(pairKey)) continue;

            // Find shared tags
            const tagsA = new Set(slot.item.tags);
            const sharedTags = neighbor.item.tags.filter((t) => tagsA.has(t));

            for (const tag of sharedTags) {
                const rule = COMBO_RULES.find((r) => r.sharedTag === tag);
                if (!rule) continue;
                seenPairs.add(pairKey + tag);

                // combo-boost: +2¢ if either item in the pair has it
                const hasComboBoost =
                    slot.item!.effectId === "combo-boost" ||
                    neighbor.item!.effectId === "combo-boost";

                results.push({
                    name: rule.name,
                    bonus: rule.bonus + (hasComboBoost ? 2 : 0),
                    positions: [
                        { row, col },
                        { row: nr, col: nc },
                    ],
                    boosted: hasComboBoost,
                });
            }
        }
    }

    return results;
};
