import type { MachineState, SnackItemInstance } from "./snackTypes";

/** Max evolution level before rotten risk. */
export const MAX_EVO_LEVEL = 2;

/** Rotten level sentinel. */
export const ROTTEN_LEVEL = -1;

/** Price bonus per evolution level (Vintage +2, Legendary +4 total). */
const EVO_PRICE_BONUS = 2;

/** Price multiplier when item goes rotten (sell at 40% of current price). */
const ROTTEN_PRICE_MULT = 0.4;

/** Chance a Legendary item rots each round it stays unsold. */
const ROTTEN_CHANCE = 0.35;

/** Evolution tier prefixes. */
const EVO_PREFIX: Record<number, string> = {
    1: "Vintage",
    2: "Legendary",
};

/** Narration flavor per evo level. */
export const EVO_NARRATION: Record<number, string> = {
    1: "has been aging... it's now",
    2: "has reached peak maturity... it's now",
    [-1]: "has gone bad... it's now",
};

/** Age label + color for each evo level. */
export const AGE_DISPLAY: Record<
    number,
    { letter: string; color: string; label: string; description: string }
> = {
    0: {
        letter: "F",
        color: "#39ff14",
        label: "Fresh",
        description: "Brand new, standard price.",
    },
    1: {
        letter: "V",
        color: "#ffb74d",
        label: "Vintage",
        description: "Aged one round. +2¢ value.",
    },
    2: {
        letter: "L",
        color: "#e040fb",
        label: "Legendary",
        description: "Peak maturity! +4¢ value. Risk of rotting.",
    },
    [-1]: {
        letter: "R",
        color: "#ff4040",
        label: "Rotten",
        description: "Gone bad. Sells at 40% price.",
    },
};

/**
 * Result of evolving items between rounds.
 */
export type EvolutionResult = {
    /** Items that evolved this round (with their new data). */
    evolved: { item: SnackItemInstance; slotIndex: number; newLevel: number }[];
    /** Items that went rotten this round. */
    rotted: { item: SnackItemInstance; slotIndex: number }[];
};

/**
 * Evolve all unsold items in the machine by one level (max 2).
 * Legendary items have a chance to go rotten each round.
 * Mutates the machine state in place.
 * Returns info about what evolved for narration.
 */
export const evolveUnsoldItems = (machine: MachineState): EvolutionResult => {
    const evolved: EvolutionResult["evolved"] = [];
    const rotted: EvolutionResult["rotted"] = [];

    for (let i = 0; i < machine.slots.length; i++) {
        const slot = machine.slots[i];
        if (!slot.unlocked || !slot.item) continue;

        const item = slot.item;
        const currentLevel = item.evoLevel ?? 0;

        // Already rotten — stays rotten
        if (currentLevel === ROTTEN_LEVEL) continue;

        // Legendary items risk rotting
        if (currentLevel >= MAX_EVO_LEVEL) {
            if (Math.random() < ROTTEN_CHANCE) {
                const baseName = item.baseName ?? item.name;
                item.evoLevel = ROTTEN_LEVEL;
                item.baseName = baseName;
                item.name = `Rotten ${baseName}`;
                item.price = Math.max(1, Math.round(item.price * ROTTEN_PRICE_MULT));
                rotted.push({ item, slotIndex: i });
            }
            continue;
        }

        const newLevel = currentLevel + 1;
        const baseName = item.baseName ?? item.name;
        const prefix = EVO_PREFIX[newLevel] ?? "";

        item.evoLevel = newLevel;
        item.baseName = baseName;
        item.name = `${prefix} ${baseName}`;
        item.price += EVO_PRICE_BONUS;

        evolved.push({ item, slotIndex: i, newLevel });
    }

    return { evolved, rotted };
};
