export type {
    ItemTypeTag,
    ItemVibeTag,
    ItemTag,
    ItemQuality,
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

export {
    QUALITY_PRICE_MULT,
    SPENDING_TYPE_PRICE_TOLERANCE,
    RETIREMENT_GOAL,
    profiteerTarget,
    MAX_COINS,
} from "./snackTypes";

export { STARTER_ITEM_DEFS, getItemDef } from "./itemDefs";

export {
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
    PRICE_DIAL_MIN,
    PRICE_DIAL_MAX,
    defaultPrice,
    priceAdjustment,
} from "./snackFactory";

export { resolveServePhase, advanceToNextRound } from "./servePhase";

// ── Item evolution ────────────────────────────────────────
export type { EvolutionResult } from "./itemEvolution";
export {
    evolveUnsoldItems,
    MAX_EVO_LEVEL,
    ROTTEN_LEVEL,
    EVO_NARRATION,
    AGE_DISPLAY,
} from "./itemEvolution";

// ── Discovery recipes ─────────────────────────────────────
export type { RecipeDef } from "./discoveryRecipes";
export {
    RECIPE_DEFS,
    detectActiveRecipes,
    findNewRecipes,
} from "./discoveryRecipes";

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
    rollStickerShop,
    STICKER_BUY_COSTS,
    REROLL_BASE_COST,
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
