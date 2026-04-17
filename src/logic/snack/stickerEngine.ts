import { generateId } from "@/logic/entity/Entity";
import type {
    StickerRarity,
    StickerEdition,
    StickerInstance,
    StickerContext,
    StickerResult,
} from "./stickerTypes";
import {
    STICKER_RARITY_WEIGHTS,
    STICKER_SELL_VALUES,
    EDITION_WEIGHTS,
    EDITION_BONUSES,
    EMPTY_RESULT,
    BLIND_BOX_COST,
} from "./stickerTypes";
import { STICKER_DEFS, getStickerDef } from "./stickerDefs";
import type { RunState } from "./snackTypes";

// ── Constants ─────────────────────────────────────────────
export const MAX_STICKER_SLOTS = 5;

// ── Random helpers ────────────────────────────────────────
function weightedPick<T extends string>(weights: Record<T, number>): T {
    const entries = Object.entries(weights) as [T, number][];
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [key, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return key;
    }
    return entries[entries.length - 1][0];
}

// ── Rolling ───────────────────────────────────────────────
export const rollStickerRarity = (): StickerRarity =>
    weightedPick(STICKER_RARITY_WEIGHTS);

export const rollStickerEdition = (): StickerEdition =>
    weightedPick(EDITION_WEIGHTS);

/** Open a blind box — returns a random sticker instance. */
export const openBlindBox = (): StickerInstance => {
    const rarity = rollStickerRarity();
    const edition = rollStickerEdition();

    // Pick a random def matching the rolled rarity
    const pool = STICKER_DEFS.filter(d => d.rarity === rarity);
    const def = pool[Math.floor(Math.random() * pool.length)];

    return {
        instanceId: generateId(),
        defId: def.id,
        name: def.name,
        description: def.description,
        rarity,
        edition,
        baseSellValue: STICKER_SELL_VALUES[rarity],
        roundsHeld: 0,
    };
};

/** Roll a sticker pack — returns 3-5 sticker options to choose from. */
export const rollStickerPack = (): StickerInstance[] => {
    const count = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
    const results: StickerInstance[] = [];
    const usedDefIds = new Set<string>();
    for (let i = 0; i < count; i++) {
        const rarity = rollStickerRarity();
        const edition = rollStickerEdition();
        // Avoid duplicates
        let pool = STICKER_DEFS.filter(d => d.rarity === rarity && !usedDefIds.has(d.id));
        if (pool.length === 0) pool = STICKER_DEFS.filter(d => d.rarity === rarity);
        const def = pool[Math.floor(Math.random() * pool.length)];
        usedDefIds.add(def.id);
        results.push({
            instanceId: generateId(),
            defId: def.id,
            name: def.name,
            description: def.description,
            rarity,
            edition,
            baseSellValue: STICKER_SELL_VALUES[rarity],
            roundsHeld: 0,
        });
    }
    return results;
};

// ── Sell value calculation ────────────────────────────────
export const stickerSellValue = (sticker: StickerInstance, stickers: StickerInstance[]): number => {
    const editionBonus = EDITION_BONUSES[sticker.edition].sellBonus;
    const growthBonus = sticker.defId === "growth-fund" ? sticker.roundsHeld * 2 : 0;
    const junkyardBonus = stickers.some(s => s.defId === "junkyard") ? 8 : 0;
    return sticker.baseSellValue + editionBonus + growthBonus + junkyardBonus;
};

// ── Slot count (accounting for negative editions) ─────────
export const stickerSlotsUsed = (stickers: StickerInstance[]): number =>
    stickers.filter(s => !EDITION_BONUSES[s.edition].freeSlot).length;

export const canAddSticker = (stickers: StickerInstance[]): boolean =>
    stickerSlotsUsed(stickers) < MAX_STICKER_SLOTS;

// ── Add / remove stickers from run state ──────────────────
export const addSticker = (draft: RunState, sticker: StickerInstance): boolean => {
    if (!canAddSticker(draft.stickers)) return false;
    draft.stickers.push(sticker);
    return true;
};

export const removeSticker = (draft: RunState, instanceId: string): StickerInstance | null => {
    const idx = draft.stickers.findIndex(s => s.instanceId === instanceId);
    if (idx === -1) return null;
    return draft.stickers.splice(idx, 1)[0];
};

export const sellSticker = (draft: RunState, instanceId: string): number => {
    const sticker = draft.stickers.find(s => s.instanceId === instanceId);
    if (!sticker) return 0;
    const value = stickerSellValue(sticker, draft.stickers);
    removeSticker(draft, instanceId);
    draft.coins += value;
    return value;
};

// ── Effect resolution ─────────────────────────────────────

/** Merge a partial result into an accumulator. */
const mergeResult = (acc: StickerResult, partial: Partial<StickerResult>, editionMult: number): void => {
    if (partial.addCoins) acc.addCoins += partial.addCoins;
    if (partial.mult && partial.mult !== 1) {
        // Apply edition mult to the bonus portion
        const bonusMult = (partial.mult - 1) * editionMult + 1;
        acc.mult *= bonusMult;
    }
    if (partial.addCustomers) acc.addCustomers += partial.addCustomers;
    if (partial.addBuyChance) acc.addBuyChance += partial.addBuyChance;
    if (partial.damageReduction) acc.damageReduction += partial.damageReduction;
    if (partial.kickChanceMult && partial.kickChanceMult !== 1) acc.kickChanceMult *= partial.kickChanceMult;
    if (partial.rentReduction) acc.rentReduction += partial.rentReduction;
    if (partial.stockCostReduction) acc.stockCostReduction += partial.stockCostReduction;
    if (partial.hpHeal) acc.hpHeal += partial.hpHeal;
    if (partial.maxHpBonus) acc.maxHpBonus += partial.maxHpBonus;
    if (partial.priceCapOverride) acc.priceCapOverride = Math.max(acc.priceCapOverride ?? 0, partial.priceCapOverride);
    if (partial.restocks) acc.restocks.push(...partial.restocks);
};

/** Resolve all sticker effects for a given trigger. */
export const resolveStickers = (
    stickers: StickerInstance[],
    trigger: string,
    baseCtx: Omit<StickerContext, "roundsHeld" | "stickerCount" | "stickers">,
): StickerResult => {
    const acc: StickerResult = { ...EMPTY_RESULT, restocks: [] };
    const hasAmplifier = stickers.some(s => s.defId === "amplifier");
    const hasCatalyst = stickers.some(s => s.defId === "catalyst");
    const hasAntimatter = stickers.some(s => s.defId === "antimatter");

    for (const sticker of stickers) {
        const def = getStickerDef(sticker.defId);
        if (!def) continue;
        if (def.trigger !== trigger) continue;

        const editionInfo = EDITION_BONUSES[sticker.edition];
        let editionMult = editionInfo.effectMult;
        if (hasAntimatter && sticker.edition === "negative") editionMult *= 2;

        const ctx: StickerContext = {
            ...baseCtx,
            roundsHeld: sticker.roundsHeld,
            stickerCount: stickers.length,
            stickers,
        };

        const result = def.resolve(ctx);

        // Apply amplifier: +50% to flat coin bonuses
        if (hasAmplifier && result.addCoins && result.addCoins > 0) {
            result.addCoins = Math.floor(result.addCoins * 1.5);
        }
        // Apply catalyst: +0.2 to mult bonuses
        if (hasCatalyst && result.mult && result.mult > 1) {
            result.mult += 0.2;
        }

        mergeResult(acc, result, editionMult);
    }

    // Edition passive coins (foil, golden)
    if (trigger === "round-end") {
        for (const sticker of stickers) {
            const editionInfo = EDITION_BONUSES[sticker.edition];
            acc.addCoins += editionInfo.passiveCoins;
        }
    }

    return acc;
};

/** Increment roundsHeld for all stickers (call at end of round). */
export const ageStickers = (stickers: StickerInstance[]): void => {
    for (const s of stickers) s.roundsHeld++;
};

/** Get the blind box cost. */
export const getBlindBoxCost = (): number => BLIND_BOX_COST;
