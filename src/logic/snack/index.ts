export type { 
    ItemTypeTag,
    ItemVibeTag,
    ItemEffectTag,
    ItemTag,
    EffectTrigger,
    ItemEffect,
    EffectContext,
    RarityModifier,
    SnackItemDef,
    SnackItemInstance,
    SlotPosition,
    MachineSlot,
    MachineState,
    RoundLedger,
    SaleRecord,
    SpendingType,
    Customer,
    CatalogueState,
    CatalogueOffering,
    RoundEventDef,
    GamePhase,
    RoundSummary,
    RunState,
    UpgradeId,
    UpgradeDef,
    GameMode,
} from "./snackTypes";

export { RARITY_WEIGHTS, SPENDING_TYPE_PRICE_TOLERANCE, RETIREMENT_GOAL, profiteerTarget, MAX_COINS } from "./snackTypes";

export { STARTER_ITEM_DEFS, getItemDef } from "./itemDefs";

export {
    rollRarity,
    createItemInstance,
    generateCatalogueOffering,
    createMachineState,
    getSlot,
    getAdjacentSlots,
    createRoundLedger,
    createRunState,
    trashItem,
    rerollCost,
    rentForRound,
    UPGRADE_DEFS,
    getUpgradeDef,
    purchaseUpgrade,
} from "./snackFactory";

export { resolveServePhase, advanceToNextRound } from "./servePhase";

export type { SimpleEffect } from "./itemEffects";
export { rollEffect, getEffectDef, effectPriceBonus, effectSellBonus, effectDamageReduction, effectKickChanceMult } from "./itemEffects";

// ── Sticker system ────────────────────────────────────────
export type {
    StickerRarity,
    StickerEdition,
    StickerInstance,
    StickerDef,
    StickerResult,
    StickerContext,
    EditionBonus,
} from "./stickerTypes";

export {
    STICKER_RARITY_WEIGHTS,
    STICKER_SELL_VALUES,
    EDITION_WEIGHTS,
    EDITION_BONUSES,
    EMPTY_RESULT as EMPTY_STICKER_RESULT,
    BLIND_BOX_COST,
} from "./stickerTypes";

export { STICKER_DEFS, getStickerDef } from "./stickerDefs";

export {
    MAX_STICKER_SLOTS,
    rollStickerRarity,
    rollStickerEdition,
    openBlindBox,
    rollStickerPack,
    stickerSellValue,
    stickerSlotsUsed,
    canAddSticker,
    addSticker,
    removeSticker,
    sellSticker,
    resolveStickers,
    ageStickers,
    getBlindBoxCost,
} from "./stickerEngine";
