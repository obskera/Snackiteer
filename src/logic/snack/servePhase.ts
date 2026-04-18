import type { RunState, RoundSummary } from "./snackTypes";
import { rentForRound } from "./snackFactory";
import { evolveUnsoldItems } from "./itemEvolution";
import type { EvolutionResult } from "./itemEvolution";

/**
 * Resolve a serve phase: simulate customer purchases, pay rent,
 * and return the updated state + summary.
 *
 * Mutates the provided draft in-place (designed for structuredClone use).
 */
export const resolveServePhase = (draft: RunState): RoundSummary => {
    let totalSales = 0;
    let itemsSold = 0;

    for (const slot of draft.machine.slots) {
        if (!slot.item || !slot.unlocked) continue;
        // Placeholder sell chance — will be replaced by real customer AI
        const sellChance = 0.6;
        if (Math.random() < sellChance) {
            totalSales += slot.item.price;
            itemsSold++;
            slot.item = null;
        }
    }

    const rent = rentForRound(draft.round, draft.rent);
    const netProfit = totalSales - rent;

    draft.coins += totalSales;
    draft.coins -= rent;

    const summary: RoundSummary = {
        totalSales,
        totalProfit: totalSales,
        itemsSold,
        rentPaid: rent,
        netProfit,
        damageTaken: 0,
        kicks: 0,
    };

    if (draft.coins < 0) {
        draft.phase = "game-over";
    } else {
        draft.phase = "summary";
        draft.lastSummary = summary;
    }

    return summary;
};

import { rollRoundEvent } from "./roundEvents";

import { ageStickers } from "./stickerEngine";

/**
 * Transition from summary → next prep phase.
 * Returns evolution results for narration.
 */
export const advanceToNextRound = (draft: RunState): EvolutionResult => {
    // Evolve unsold items before advancing
    const evoResult = evolveUnsoldItems(draft.machine);
    draft.round += 1;
    draft.phase = "prep";
    draft.rerollCount = 0;
    // Age stickers (increment roundsHeld)
    ageStickers(draft.stickers);
    // Roll the next round's event so players can see it during prep
    draft.roundEvent = rollRoundEvent(draft.round);
    // Apply HP regen if the event grants it
    if (draft.roundEvent?.hpRegen) {
        draft.machineHp = Math.min(
            draft.maxMachineHp,
            draft.machineHp + draft.roundEvent.hpRegen,
        );
    }
    return evoResult;
};
