import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { VendingMachine } from "./components/vendingMachine";
import { useFloatingFX } from "@/hooks/useFloatingFX";
import {
    initSfx,
    playSfx,
    startBgm,
    ensureAudioContext,
    unlockAudio,
    isSfxMuted,
    applyPersistedAudioSettings,
} from "@/services/sfx";
import { AudioControls } from "@/components/AudioControls";
import { StickerTray } from "@/components/StickerTray";
import { StickerShopScreen } from "@/components/StickerShopScreen";
import { HowToPlayButton } from "@/components/HowToPlay";
import { generateId } from "@/logic/entity/Entity";
import {
    createRunState,
    generateCatalogueOffering,
    getSlot,
    rentForRound,
    advanceToNextRound,
    UPGRADE_DEFS,
    purchaseUpgrade,
    rollStickerShop,
    STICKER_BUY_COSTS,
    REROLL_BASE_COST,
    sellSticker,
    EDITION_BONUSES,
    resolveStickers,
    RETIREMENT_GOAL,
    PROFITEER_ROUNDS,
    profiteerTarget,
    MAX_COINS,
    detectActiveRecipes,
    findNewRecipes,
    RECIPE_DEFS,
    MAX_EVO_LEVEL,
    ROTTEN_LEVEL,
    AGE_DISPLAY,
    PRICE_DIAL_MIN,
    PRICE_DIAL_MAX,
    defaultPrice,
    evoPriceDelta,
    generateDraftOffering,
    canAddToCooler,
    draftRerollCost,
    maxCoolerSize,
} from "@/logic/snack";
import {
    simulateOneCustomer,
    createRoundSimContext,
    eventsToNarration,
} from "@/logic/snack/serveNarration";
import type {
    SlotRemoval,
    HpDamage,
    CoinGain,
    SlotRestock,
    ServeEvent,
    RoundSimContext,
} from "@/logic/snack/serveNarration";
import { rollRoundEvent } from "@/logic/snack/roundEvents";
import { rollAreaSequence, rollRoundArea } from "@/logic/snack/areaDefs";
import { detectCombos } from "@/logic/snack/comboSystem";
import { useTypewriter } from "@/hooks/useTypewriter";
import type { TypewriterLine } from "@/hooks/useTypewriter";
import type {
    MachineSlot,
    SlotPosition,
    RunState,
    RoundSummary as RoundSummaryType,
    RoundEventDef,
    SnackItemInstance,
    CatalogueOffering,
    DraftOffering,
    UpgradeId,
    ItemTypeTag,
    ItemVibeTag,
    GameMode,
} from "@/logic/snack";
import "./App.css";

// ── Interactive serve state (minimal — just tracks if serve is active) ─

type InteractiveServeState = {
    /** Whether the serve phase is actively running narration. */
    active: boolean;
};

const EMPTY_INTERACTIVE: InteractiveServeState = {
    active: false,
};

// ── Serve narration — single source of truth ─────────────

type ServeNarration = {
    runId: number;
    lines: TypewriterLine[];
    removals: SlotRemoval[];
    hpDamages: HpDamage[];
    coinGains: CoinGain[];
    restocks: SlotRestock[];
    summary: RoundSummaryType;
    stickerHpHeal: number;
    appliedRemovals: Set<number>;
    appliedHpDamages: Set<number>;
    appliedCoinGains: Set<number>;
    appliedRestocks: Set<number>;
    /** Number of lines to pre-reveal instantly (for post-restock continuation). */
    skipLines: number;
    /** Line index where narration should pause for mid-round restock (null = no pause). */
    restockPauseAt: number | null;
    /** Pending simulation data for after restock. */
    pendingRestock: {
        remainingCustomers: number;
        roundEvent: RoundEventDef | null;
        round: number;
        rent: number;
        /** Simulation context for resuming lazy simulation. */
        simContext: RoundSimContext;
        /** First-batch events (for tally accumulation). */
        firstBatchEvents: ServeEvent[];
        /** Recipe data discovered during first batch. */
        newRecipes: { name: string; bonus: number }[];
        /** Combo bonus already credited in first batch. */
        firstBatchComboBonus: number;
        /** Recipe bonus already credited in first batch. */
        firstBatchRecipeBonus: number;
        /** Active combos from first batch (for summary replay). */
        firstBatchCombos: number;
    } | null;
};

const createEmptyNarration = (): ServeNarration => ({
    runId: 0,
    lines: [],
    removals: [],
    hpDamages: [],
    coinGains: [],
    restocks: [],
    summary: {
        totalSales: 0,
        totalProfit: 0,
        itemsSold: 0,
        rentPaid: 0,
        netProfit: 0,
        damageTaken: 0,
        kicks: 0,
        evolved: [],
        rotted: [],
        newRecipes: [],
    },
    stickerHpHeal: 0,
    appliedRemovals: new Set(),
    appliedHpDamages: new Set(),
    appliedCoinGains: new Set(),
    appliedRestocks: new Set(),
    skipLines: 0,
    restockPauseAt: null,
    pendingRestock: null,
});

// ── Sticker scoring helper (shared by start-round and restock-continue) ─

type StickerScoringInput = {
    stickers: import("@/logic/snack").StickerInstance[];
    events: ServeEvent[];
    totalSales: number;
    itemsSold: number;
    damageTaken: number;
    kicks: number;
    combosTriggered: number;
    comboBonus: number;
    recipeBonus: number;
    rent: number;
    run: RunState;
};

type StickerScoringResult = {
    stickerFlatBonus: number;
    stickerMult: number;
    stickerRentReduction: number;
    stickerHpHeal: number;
    multBonus: number;
    /** Narration lines to append (relative indices; caller offsets). */
    lines: TypewriterLine[];
    /** Coin gains with lineIndex relative to the returned `lines` array. */
    coinGains: CoinGain[];
};

function computeStickerScoring(
    input: StickerScoringInput,
): StickerScoringResult {
    const empty: StickerScoringResult = {
        stickerFlatBonus: 0,
        stickerMult: 1,
        stickerRentReduction: 0,
        stickerHpHeal: 0,
        multBonus: 0,
        lines: [],
        coinGains: [],
    };
    if (input.stickers.length === 0) return empty;

    const {
        stickers,
        events,
        totalSales,
        itemsSold,
        damageTaken,
        kicks,
        combosTriggered,
        comboBonus,
        recipeBonus,
        rent,
        run,
    } = input;

    const typeSales: Partial<Record<ItemTypeTag, number>> = {};
    const vibeSales: Partial<Record<ItemVibeTag, number>> = {};
    for (const evt of events) {
        if (evt.bought) {
            for (const tag of evt.bought.tags) {
                if (["drink", "snack", "candy"].includes(tag)) {
                    typeSales[tag as ItemTypeTag] =
                        (typeSales[tag as ItemTypeTag] ?? 0) + 1;
                }
                if (
                    ["sweet", "salty", "sour", "spicy", "refreshing"].includes(
                        tag,
                    )
                ) {
                    vibeSales[tag as ItemVibeTag] =
                        (vibeSales[tag as ItemVibeTag] ?? 0) + 1;
                }
            }
        }
    }

    const totalStocked = run.machine.slots.filter(
        (s) => s.unlocked && s.item,
    ).length;
    const emptyUnlocked = run.machine.slots.filter(
        (s) => s.unlocked && !s.item,
    ).length;

    const stickerCtx = {
        machine: run.machine,
        round: run.round,
        coins: run.coins,
        profitStreak: run.profitStreak,
        salesThisRound: totalSales,
        typeSales,
        vibeSales,
        totalSold: itemsSold,
        totalStocked,
        emptySlots: emptyUnlocked,
        damageTaken,
        kicks,
        combosTriggered,
        run,
    };

    let stickerFlatBonus = 0;
    let stickerMult = 1;

    for (const evt of events) {
        if (evt.bought && evt.slotIndex != null) {
            const slot = run.machine.slots[evt.slotIndex];
            const r = resolveStickers(stickers, "on-sale", {
                ...stickerCtx,
                soldSlotRow: slot?.position.row,
                soldSlotCol: slot?.position.col,
                soldItemType: evt.bought.tags.find((t) =>
                    ["drink", "snack", "candy"].includes(t),
                ) as ItemTypeTag | undefined,
                soldItemVibe: evt.bought.tags.find((t) =>
                    ["sweet", "salty", "sour", "spicy", "refreshing"].includes(
                        t,
                    ),
                ) as ItemVibeTag | undefined,
            });
            stickerFlatBonus += r.addCoins;
            if (r.mult > 1) {
                stickerFlatBonus += Math.round(
                    evt.bought.price * (r.mult - 1),
                );
            }
        }
    }

    const scoring = resolveStickers(stickers, "scoring", stickerCtx);
    stickerFlatBonus += scoring.addCoins;
    stickerMult *= scoring.mult;

    const roundEndR = resolveStickers(stickers, "round-end", stickerCtx);
    stickerFlatBonus += roundEndR.addCoins;
    stickerMult *= roundEndR.mult;

    const roundStartR = resolveStickers(stickers, "round-start", stickerCtx);
    stickerFlatBonus += roundStartR.addCoins;

    const passive = resolveStickers(stickers, "passive", stickerCtx);
    stickerFlatBonus += passive.addCoins;
    const stickerRentReduction = passive.rentReduction;
    const stickerHpHeal =
        passive.hpHeal + roundEndR.hpHeal + scoring.hpHeal;

    // Cap mult and flat bonus so narrated credit matches the final summary.
    stickerMult = Math.min(stickerMult, 10);
    stickerFlatBonus = Math.min(stickerFlatBonus, 9999);

    const baseRevForSticker = totalSales + comboBonus + recipeBonus;
    const multBonus =
        stickerMult > 1
            ? Math.round(baseRevForSticker * (stickerMult - 1))
            : 0;

    const lines: TypewriterLine[] = [];
    const coinGains: CoinGain[] = [];

    if (multBonus > 0 || stickerFlatBonus > 0 || stickerRentReduction > 0) {
        lines.push({
            text: "── Sticker Effects ──",
            charDelay: 15,
            lingerMs: 600,
            className: "vm-narration__combo-header",
        });
        if (stickerMult > 1) {
            const label =
                stickerMult % 1 === 0
                    ? `×${stickerMult}`
                    : `×${stickerMult.toFixed(1)}`;
            lines.push({
                text: `${label} Sticker Multiplier! +${multBonus}¢`,
                charDelay: 20,
                lingerMs: 500,
                className: "vm-narration__combo",
            });
            coinGains.push({
                lineIndex: lines.length - 1,
                amount: multBonus,
            });
        }
        if (stickerFlatBonus > 0) {
            lines.push({
                text: `+${stickerFlatBonus}¢ Sticker Bonus!`,
                charDelay: 20,
                lingerMs: 500,
                className: "vm-narration__combo",
            });
            coinGains.push({
                lineIndex: lines.length - 1,
                amount: stickerFlatBonus,
            });
        }
        if (stickerRentReduction > 0) {
            const actualReduction = Math.min(rent, stickerRentReduction);
            lines.push({
                text: `−${actualReduction}¢ Rent Reduction!`,
                charDelay: 20,
                lingerMs: 500,
                className: "vm-narration__combo",
            });
        }
        lines.push({ text: "", charDelay: 0, lingerMs: 300 });
    }

    return {
        stickerFlatBonus,
        stickerMult,
        stickerRentReduction,
        stickerHpHeal,
        multBonus,
        lines,
        coinGains,
    };
}

// ── State hook ───────────────────────────────────────────

function useGameState() {
    const [run, setRun] = useState<RunState>(createRunState);
    const [catalogue, setCatalogue] = useState<CatalogueOffering>({
        items: [],
    });
    const [draft, setDraft] = useState<DraftOffering>({
        singles: [],
        aged: [],
        soldAgedIds: [],
        packs: [],
    });
    const [selectedCatalogueItem, setSelectedCatalogueItem] =
        useState<SnackItemInstance | null>(null);
    const [selectedCoolerItem, setSelectedCoolerItem] =
        useState<SnackItemInstance | null>(null);

    const update = useCallback((fn: (draft: RunState) => RunState | void) => {
        setRun((prev) => {
            const next = structuredClone(prev);
            const result = fn(next);
            return result ?? next;
        });
    }, []);

    const refreshCatalogue = useCallback((state: RunState) => {
        setCatalogue(generateCatalogueOffering(state.catalogue));
        setDraft(generateDraftOffering(state.catalogue));
        setSelectedCatalogueItem(null);
        setSelectedCoolerItem(null);
    }, []);

    const refreshDraft = useCallback((state: RunState) => {
        setDraft(generateDraftOffering(state.catalogue));
        setSelectedCatalogueItem(null);
    }, []);

    return {
        run,
        update,
        catalogue,
        draft,
        setDraft,
        refreshCatalogue,
        refreshDraft,
        selectedCatalogueItem,
        setSelectedCatalogueItem,
        selectedCoolerItem,
        setSelectedCoolerItem,
    };
}

// ── Menu screen ──────────────────────────────────────────

function MenuScreen({ onStart }: { onStart: (mode: GameMode) => void }) {
    return (
        <div className="vm-menu">
            <h1 className="vm-menu__title">
                {"SNACKITEER".split("").map((ch, i) => (
                    <span
                        key={i}
                        className="vm-title-bar__char"
                        style={{
                            animationDelay: `${(Math.sin(i * 2.3) * 1000 + 500) % 1800}ms`,
                        }}
                    >
                        {ch}
                    </span>
                ))}
            </h1>
            <p className="vm-menu__sub">Vending machine roguelike</p>
            <div className="vm-menu__modes">
                <button
                    type="button"
                    className="vm-menu__mode-btn vm-menu__mode-btn--retirement"
                    onClick={() => onStart("retirement")}
                >
                    <span className="vm-menu__mode-name">
                        🏦 Retirement Fund
                    </span>
                    <span className="vm-menu__mode-desc">
                        Accumulate {RETIREMENT_GOAL}¢ to retire rich
                    </span>
                </button>
                <button
                    type="button"
                    className="vm-menu__mode-btn vm-menu__mode-btn--profiteer"
                    onClick={() => onStart("profiteer")}
                >
                    <span className="vm-menu__mode-name">📈 Profiteer</span>
                    <span className="vm-menu__mode-desc">
                        Hit escalating profit targets each round
                    </span>
                </button>
            </div>
            <HowToPlayButton />
        </div>
    );
}

// ── Round summary overlay ────────────────────────────────

function RoundSummary({
    summary,
    round,
    gameMode,
    onContinue,
}: {
    summary: NonNullable<RunState["lastSummary"]>;
    round: number;
    gameMode: GameMode;
    onContinue: () => void;
}) {
    const isPositive = summary.netProfit >= 0;
    const target = gameMode === "profiteer" ? profiteerTarget(round) : null;
    const metTarget = target != null ? summary.netProfit >= target : true;
    const profiteerLoss = target != null && !metTarget;
    return (
        <div className="vm-summary">
            <div className="vm-summary__card">
                <h3
                    className={`vm-summary__title ${profiteerLoss ? "vm-summary__title--loss" : ""}`}
                >
                    {profiteerLoss
                        ? "Target Missed"
                        : `Round ${round} Complete`}
                </h3>
                <div className="vm-summary__rows">
                    <div className="vm-summary__row">
                        <span>Items sold</span>
                        <span>{summary.itemsSold}</span>
                    </div>
                    <div className="vm-summary__row">
                        <span>Revenue</span>
                        <span className="vm-summary__positive">
                            +{summary.totalProfit}¢
                        </span>
                    </div>
                    {summary.rentPaid > 0 && (
                        <div className="vm-summary__row">
                            <span>Rent</span>
                            <span className="vm-summary__negative">
                                -{summary.rentPaid}¢
                            </span>
                        </div>
                    )}
                    {summary.damageTaken > 0 && (
                        <div className="vm-summary__row">
                            <span>
                                Damage ({summary.kicks} kick
                                {summary.kicks !== 1 ? "s" : ""})
                            </span>
                            <span className="vm-summary__negative">
                                -{summary.damageTaken} HP
                            </span>
                        </div>
                    )}
                    <div className="vm-summary__divider" />
                    <div className="vm-summary__row vm-summary__row--total">
                        <span>Net</span>
                        <span
                            className={
                                isPositive
                                    ? "vm-summary__positive"
                                    : "vm-summary__negative"
                            }
                        >
                            {isPositive ? "+" : ""}
                            {summary.netProfit}¢
                        </span>
                    </div>
                    {target != null && (
                        <div className="vm-summary__row">
                            <span>Profit target</span>
                            <span
                                className={
                                    metTarget
                                        ? "vm-summary__positive"
                                        : "vm-summary__negative"
                                }
                            >
                                {metTarget ? "[Y]" : "[N]"} {target}¢
                            </span>
                        </div>
                    )}
                </div>

                {/* Combo discoveries */}
                {summary.newRecipes.length > 0 && (
                    <div className="vm-summary__section vm-summary__recipes">
                        <div className="vm-summary__section-title vm-summary__section-title--recipe">
                            {">> NEW COMBO"}
                            {summary.newRecipes.length > 1 ? "S" : ""}
                            {" DISCOVERED!"}
                        </div>
                        {summary.newRecipes.map((r, i) => (
                            <div key={i} className="vm-summary__recipe-item">
                                <span className="vm-summary__recipe-name">
                                    {r.name}
                                </span>
                                <span className="vm-summary__recipe-bonus">
                                    +{r.bonus}¢
                                </span>
                            </div>
                        ))}
                        <div className="vm-summary__particles vm-summary__particles--recipe" />
                    </div>
                )}

                {/* Evolution / rotten results (skip if game over) */}
                {!profiteerLoss &&
                    (summary.evolved.length > 0 ||
                        summary.rotted.length > 0) && (
                        <div className="vm-summary__section vm-summary__aging">
                            <div className="vm-summary__section-title vm-summary__section-title--age">
                                {"-- ITEM AGING --"}
                            </div>
                            {summary.evolved.map((e, i) => (
                                <div
                                    key={`e${i}`}
                                    className="vm-summary__age-item vm-summary__age-item--evo"
                                    style={{
                                        animationDelay: `${i * 0.35}s`,
                                        ["--intensity" as string]: i + 1,
                                    }}
                                >
                                    <span className="vm-summary__age-arrow">
                                        {">"}
                                    </span>
                                    <span>{e.name}</span>
                                    <span className="vm-summary__age-level">
                                        {e.level === 2
                                            ? "LEGENDARY"
                                            : "VINTAGE"}
                                    </span>
                                </div>
                            ))}
                            {summary.rotted.map((r, i) => (
                                <div
                                    key={`r${i}`}
                                    className="vm-summary__age-item vm-summary__age-item--rot"
                                    style={{
                                        animationDelay: `${(summary.evolved.length + i) * 0.35}s`,
                                        ["--intensity" as string]:
                                            summary.evolved.length + i + 1,
                                    }}
                                >
                                    <span className="vm-summary__age-arrow">
                                        {"!"}
                                    </span>
                                    <span>{r.name}</span>
                                    <span className="vm-summary__age-level">
                                        ROTTEN
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                <button
                    type="button"
                    className="vm-summary__continue"
                    onClick={onContinue}
                >
                    {profiteerLoss ? "Game Over" : "Continue"}
                </button>
            </div>
        </div>
    );
}

// ── Draft panel (replaces old static catalogue) ──────────

function DraftPanel({
    draft,
    coins,
    cooler,
    slots,
    round,
    rerollCount,
    selectedShopItem,
    maxCooler,
    onSelectItem,
    onPlaceInSlot,
    onSendToCooler,
    onReroll,
}: {
    draft: DraftOffering;
    coins: number;
    cooler: SnackItemInstance[];
    slots: import("@/logic/snack").MachineSlot[];
    round: number;
    rerollCount: number;
    selectedShopItem: SnackItemInstance | null;
    maxCooler: number;
    onSelectItem: (item: SnackItemInstance | null) => void;
    onPlaceInSlot: (slotIdx: number) => void;
    onSendToCooler: () => void;
    onReroll: () => void;
}) {
    const rerollPrice = draftRerollCost(round, rerollCount);
    const canReroll = coins >= rerollPrice;

    return (
        <div className="vm-catalogue">
            <div className="vm-catalogue__header">
                <span className="vm-catalogue__title">Shop</span>
                <span className="vm-coins" style={{ fontSize: 'clamp(9px, 2vw, 12px)' }}>🪙 {coins}¢</span>
                <button
                    type="button"
                    className="vm-catalogue__reroll"
                    disabled={!canReroll}
                    onClick={onReroll}
                >
                    Reroll {rerollPrice}¢
                </button>
            </div>

            {/* All shop items in one 3-column grid: base singles + aged */}
            <div className="vm-catalogue__items">
                {draft.singles.map((item) => {
                    const canAfford = coins >= item.cost;
                    const isSelected =
                        selectedShopItem?.instanceId === item.instanceId;
                    return (
                        <button
                            type="button"
                            key={item.instanceId}
                            className={`vm-catalogue__item ${isSelected ? "vm-catalogue__item--selected" : ""} ${!canAfford ? "vm-catalogue__item--unaffordable" : ""}`}
                            disabled={!canAfford}
                            onClick={() => {
                                playSfx("slot-select");
                                onSelectItem(isSelected ? null : item);
                            }}
                        >
                            <span className="vm-catalogue__name">
                                {item.name}
                            </span>
                            <span
                                className={`vm-catalogue__quality vm-catalogue__quality--${item.quality}`}
                            >
                                {item.quality}
                            </span>
                            <span className="vm-catalogue__cost">
                                {item.cost}¢
                            </span>
                        </button>
                    );
                })}
                {draft.aged.map((item) => {
                    const isSold = draft.soldAgedIds.includes(item.instanceId);
                    const canAfford = !isSold && coins >= item.cost;
                    const isSelected =
                        selectedShopItem?.instanceId === item.instanceId;
                    return (
                        <button
                            type="button"
                            key={item.instanceId}
                            className={`vm-catalogue__item ${isSelected ? "vm-catalogue__item--selected" : ""} ${isSold ? "vm-catalogue__item--sold" : !canAfford ? "vm-catalogue__item--unaffordable" : ""}`}
                            disabled={!canAfford}
                            onClick={() => {
                                playSfx("slot-select");
                                onSelectItem(isSelected ? null : item);
                            }}
                        >
                            {isSold ? (
                                <span className="vm-catalogue__sold">Sold Out</span>
                            ) : (
                                <>
                                    <span className="vm-catalogue__name">
                                        {item.baseName ?? item.name}
                                    </span>
                                    {(item.evoLevel ?? 0) !== 0 && AGE_DISPLAY[item.evoLevel!] && (
                                        <span
                                            className="vm-catalogue__age"
                                            style={{ color: AGE_DISPLAY[item.evoLevel!].color }}
                                        >
                                            {AGE_DISPLAY[item.evoLevel!].label}
                                        </span>
                                    )}
                                    <span
                                        className={`vm-catalogue__quality vm-catalogue__quality--${item.quality}`}
                                    >
                                        {item.quality}
                                    </span>
                                    <span className="vm-catalogue__cost">
                                        {item.cost}¢
                                    </span>
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Packs hidden for now */}

            {/* Mini grid — pick a slot to place, or send to cooler */}
            <div className="vm-shop-placement">
                <span className="vm-shop-placement__label">
                    {selectedShopItem
                        ? `Place ${selectedShopItem.name}:`
                        : "Select an item above"}
                </span>
                <div className="vm-shop-grid">
                    {slots.map((slot, idx) => {
                        const empty = slot.unlocked && !slot.item;
                        const active = !!selectedShopItem;
                        return (
                            <button
                                type="button"
                                key={idx}
                                className={`vm-shop-grid__cell ${!slot.unlocked ? "vm-shop-grid__cell--locked" : ""} ${slot.item ? "vm-shop-grid__cell--full" : ""} ${empty ? "vm-shop-grid__cell--empty" : ""} ${!active ? "vm-shop-grid__cell--inactive" : ""}`}
                                disabled={!empty || !active}
                                onClick={() => onPlaceInSlot(idx)}
                                title={
                                    slot.item
                                        ? slot.item.name
                                        : slot.unlocked
                                          ? "Empty"
                                          : "Locked"
                                }
                            >
                                {slot.item ? (
                                    <span className="vm-shop-grid__name">
                                        {slot.item.name.slice(0, 3)}
                                    </span>
                                ) : slot.unlocked ? (
                                    "+"
                                ) : (
                                    "🔒"
                                )}
                            </button>
                        );
                    })}
                </div>
                {selectedShopItem && canAddToCooler(cooler, maxCooler) ? (
                    <button
                        type="button"
                        className="vm-shop-placement__cooler-btn"
                        onClick={onSendToCooler}
                    >
                        → Cooler
                    </button>
                ) : (
                    <button
                        type="button"
                        className="vm-shop-placement__cooler-btn vm-shop-placement__cooler-btn--inactive"
                        disabled
                    >
                        → Cooler
                    </button>
                )}
                {cooler.length > 0 && (
                    <span className="vm-shop-placement__cooler-count">
                        Cooler: {cooler.map((i) => i.name).join(", ")} ({cooler.length}/{maxCooler})
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Cooler panel (holding area) ──────────────────────────

function CoolerPanel({
    cooler,
    maxCooler,
    slots,
    selectedItem,
    onSelect,
    onPlaceInSlot,
}: {
    cooler: SnackItemInstance[];
    maxCooler: number;
    slots: MachineSlot[];
    selectedItem: SnackItemInstance | null;
    onSelect: (item: SnackItemInstance | null) => void;
    onPlaceInSlot: (slotIdx: number) => void;
}) {
    if (cooler.length === 0) {
        return (
            <div className="vm-cooler">
                <span className="vm-cooler__label">
                    Cooler ({cooler.length}/{maxCooler})
                </span>
                <p className="vm-cooler__hint">
                    No items in cooler. Buy from the Shop to stock up!
                </p>
            </div>
        );
    }

    return (
        <div className="vm-cooler">
            <span className="vm-cooler__label">
                Cooler ({cooler.length}/{maxCooler})
            </span>
            <div className="vm-cooler__items">
                {cooler.map((item) => {
                    const isSelected =
                        selectedItem?.instanceId === item.instanceId;
                    return (
                        <button
                            type="button"
                            key={item.instanceId}
                            className={`vm-cooler__item ${isSelected ? "vm-cooler__item--selected" : ""}`}
                            onClick={() => {
                                playSfx("slot-select");
                                onSelect(isSelected ? null : item);
                            }}
                        >
                            <span className="vm-cooler__item-name">
                                {item.name}
                            </span>
                            <span
                                className={`vm-cooler__item-quality vm-cooler__item-quality--${item.quality}`}
                            >
                                {item.quality}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="vm-shop-placement">
                <span className="vm-shop-placement__label">
                    {selectedItem
                        ? `Place ${selectedItem.name}:`
                        : "Select a cooler item above"}
                </span>
                <div className="vm-shop-grid">
                    {slots.map((slot, idx) => {
                        const empty = slot.unlocked && !slot.item;
                        const active = !!selectedItem;
                        return (
                            <button
                                type="button"
                                key={idx}
                                className={`vm-shop-grid__cell ${!slot.unlocked ? "vm-shop-grid__cell--locked" : ""} ${slot.item ? "vm-shop-grid__cell--full" : ""} ${empty ? "vm-shop-grid__cell--empty" : ""} ${!active ? "vm-shop-grid__cell--inactive" : ""}`}
                                disabled={!empty || !active}
                                onClick={() => onPlaceInSlot(idx)}
                                title={
                                    slot.item
                                        ? slot.item.name
                                        : slot.unlocked
                                          ? "Empty"
                                          : "Locked"
                                }
                            >
                                {slot.item ? (
                                    <span className="vm-shop-grid__name">
                                        {(slot.item.baseName ?? slot.item.name).slice(0, 3)}
                                    </span>
                                ) : slot.unlocked ? (
                                    "+"
                                ) : (
                                    "🔒"
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {selectedItem && (
                <p className="vm-cooler__hint">
                    Click an empty slot to place {selectedItem.name}
                </p>
            )}
        </div>
    );
}

// ── App ──────────────────────────────────────────────────

export default function App() {
    const {
        run,
        update,
        draft,
        setDraft,
        refreshCatalogue,
        refreshDraft,
        setSelectedCatalogueItem,
        selectedCoolerItem,
        setSelectedCoolerItem,
    } = useGameState();

    // ── Serve narration (single source of truth) ──────────
    const [serve, setServe] = useState<ServeNarration>(createEmptyNarration);
    // ── Interactive serve (tracks whether serve is active) ──
    const [, setInteractiveServe] =
        useState<InteractiveServeState>(EMPTY_INTERACTIVE);

    const fx = useFloatingFX();
    const nfx = useFloatingFX(); // narration-area floating effects
    const [shaking, setShaking] = useState(false);
    const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const {
        visibleLines,
        done: narrationDone,
        skip: skipNarration,
    } = useTypewriter(serve.lines, serve.runId, serve.skipLines);

    // Remove items from slots / apply HP damage / spawn floaters as narration reaches each line
    useEffect(() => {
        if (serve.runId === 0) return;
        const currentLineCount = visibleLines.length;

        for (const r of serve.removals) {
            if (
                r.lineIndex < currentLineCount &&
                !serve.appliedRemovals.has(r.lineIndex)
            ) {
                serve.appliedRemovals.add(r.lineIndex);
                update((draft) => {
                    draft.machine.slots[r.slotIndex].item = null;
                });
                // Spawn coin floater at removal moment (item leaving = money in)
                const matchedCoin = serve.coinGains.find(
                    (c) => c.slotIndex === r.slotIndex,
                );
                if (matchedCoin) {
                    fx.spawnCoin(r.slotIndex, matchedCoin.amount);
                }
            }
        }

        for (const h of serve.hpDamages) {
            if (
                h.lineIndex < currentLineCount &&
                !serve.appliedHpDamages.has(h.lineIndex)
            ) {
                serve.appliedHpDamages.add(h.lineIndex);
                update((draft) => {
                    draft.machineHp = Math.max(0, draft.machineHp - h.damage);
                });
                fx.spawnDamage(h.damage);
                playSfx("damage");
                // Trigger machine shake
                setShaking(true);
                clearTimeout(shakeTimer.current);
                shakeTimer.current = setTimeout(() => setShaking(false), 450);
            }
        }

        for (const c of serve.coinGains) {
            if (
                c.lineIndex < currentLineCount &&
                !serve.appliedCoinGains.has(c.lineIndex)
            ) {
                serve.appliedCoinGains.add(c.lineIndex);
                update((draft) => {
                    draft.coins = Math.min(draft.coins + c.amount, MAX_COINS);
                });
                // Only spawn floater for combo/non-sale gains (sales spawn at removal)
                if (c.slotIndex == null) {
                    nfx.spawnCoin(-1, c.amount);
                    playSfx("combo");
                }
            }
        }

        for (const rs of serve.restocks) {
            if (
                rs.lineIndex < currentLineCount &&
                !serve.appliedRestocks.has(rs.lineIndex)
            ) {
                serve.appliedRestocks.add(rs.lineIndex);
                update((draft) => {
                    draft.machine.slots[rs.slotIndex].item = rs.item;
                });
                fx.spawnEffect(rs.slotIndex, ">> Restock!");
                playSfx("restock");
            }
        }
    }, [
        visibleLines,
        serve,
        update,
        fx.spawnCoin,
        fx.spawnDamage,
        fx.spawnEffect,
        nfx.spawnCoin,
    ]);

    // When narration finishes, transition to summary
    // ── Mid-round restock state ─────────────────────────────
    const [restockPending, setRestockPending] = useState(false);
    const [restockSelectedDef, setRestockSelectedDef] =
        useState<SnackItemInstance | null>(null);
    const prevNarrationDoneRef = useRef(false);

    useEffect(() => {
        // Only trigger on false→true transition of narrationDone
        // to prevent stale done=true from firing after restock continue
        const justFinished = narrationDone && !prevNarrationDoneRef.current;
        prevNarrationDoneRef.current = narrationDone;
        if (!justFinished || serve.runId === 0) return;

        // If there's a pending mid-round restock, show restock UI instead of summary
        if (serve.pendingRestock) {
            setRestockPending(true);
            setSelectedSlotPos(null);
            setRestockSelectedDef(null);
            return;
        }

        const summary = serve.summary;
        setServe(createEmptyNarration());

        update((draft) => {
            // Deduct rent at end of round
            draft.coins -= summary.rentPaid;
            // Cap coins
            draft.coins = Math.min(draft.coins, MAX_COINS);
            // Track profit streak
            if (summary.netProfit > 0) {
                draft.profitStreak++;
            } else {
                draft.profitStreak = 0;
            }
            // Apply sticker HP heal
            if (serve.stickerHpHeal > 0) {
                draft.machineHp = Math.min(
                    draft.maxMachineHp,
                    draft.machineHp + serve.stickerHpHeal,
                );
            }

            // Loss conditions
            if (draft.coins < 0 || draft.machineHp <= 0) {
                draft.phase = "game-over";
                playSfx("game-over");
                return;
            }

            // Profiteer mode: must meet profit target — show summary first so
            // the player sees what they made vs the target before game-over.
            if (
                draft.gameMode === "profiteer" &&
                summary.netProfit < profiteerTarget(draft.round)
            ) {
                draft.phase = "summary";
                draft.lastSummary = summary;
                playSfx("game-over");
                return;
            }

            // Profiteer mode: survived all rounds = win!
            if (
                draft.gameMode === "profiteer" &&
                draft.round >= PROFITEER_ROUNDS
            ) {
                draft.phase = "win";
                draft.lastSummary = summary;
                playSfx("round-end");
                return;
            }

            // Retirement mode: check win
            if (
                draft.gameMode === "retirement" &&
                draft.coins >= RETIREMENT_GOAL
            ) {
                draft.phase = "win";
                draft.lastSummary = summary;
                playSfx("round-end");
                return;
            }

            draft.phase = "summary";
            draft.lastSummary = summary;
            playSfx("round-end");
        });
    }, [narrationDone, serve, update]);

    // ── Phase transitions ────────────────────────────────

    const handleStartGame = useCallback(
        (mode: GameMode) => {
            // Synchronously kick off resume() inside the user gesture (iOS).
            // Buffers are already decoded from the mount-time preload, so we
            // just need the context to be running before playing.
            const unlocked = unlockAudio();
            applyPersistedAudioSettings();
            unlocked
                .then(() => initSfx())
                .then(() => {
                    if (isSfxMuted()) return;
                    playSfx("game-start");
                    startBgm();
                });
            const fresh = createRunState(mode);
            fresh.phase = "prep";
            fresh.roundEvent = rollRoundEvent(fresh.round);
            fresh.areaSequence = rollAreaSequence(20);
            fresh.currentArea = rollRoundArea(fresh.areaSequence, fresh.round - 1);
            update(() => fresh);
            refreshCatalogue(fresh);
        },
        [update, refreshCatalogue],
    );

    const handleNewGame = useCallback(() => {
        const unlocked = unlockAudio();
        applyPersistedAudioSettings();
        unlocked.then(() => initSfx()).then(() => {
            if (!isSfxMuted()) playSfx("game-start");
        });
        const fresh = createRunState();
        fresh.phase = "menu";
        update(() => fresh);
        setServe(createEmptyNarration());
        setInteractiveServe(EMPTY_INTERACTIVE);
    }, [update]);

    const handleStartRound = useCallback(() => {
        const event = run.roundEvent;
        const area = run.currentArea;

        // Pre-compute combos from the CURRENT grid (before items leave)
        const combos = detectCombos(run.machine);

        // ── Lazy simulation: one customer at a time ──────────
        const snapshot = structuredClone(run.machine.slots);
        const baseCustomers =
            3 + Math.floor(Math.random() * 3) + Math.floor(run.round / 3);
        const eventDelta = event?.customerDelta ?? 0;
        const areaDelta = area?.modifier.customerDelta ?? 0;
        const customerCount = Math.max(
            1,
            baseCustomers + eventDelta + areaDelta,
        );

        const simCtx = createRoundSimContext(
            event ?? null,
            run.round,
            area?.area.boostedMoods,
            area?.modifier,
        );
        const soldSlots = new Set<number>();
        const events: ServeEvent[] = [];
        let machineEmptied = false;
        let customersServed = 0;

        for (let i = 0; i < customerCount; i++) {
            const result = simulateOneCustomer(snapshot, soldSlots, simCtx);

            if (result.event.bought == null && result.machineEmpty) {
                // Machine is empty before this customer could be served — pause
                machineEmptied = true;
                break;
            }

            events.push(result.event);
            customersServed++;

            // If this sale emptied the machine and more customers remain, pause
            if (result.machineEmpty && i < customerCount - 1) {
                machineEmptied = true;
                break;
            }
        }

        const remainingCustomers = customerCount - customersServed;

        const baseRent =
            run.gameMode === "profiteer"
                ? 0
                : rentForRound(run.round, run.rent);
        const rent = Math.max(0, baseRent + (area?.modifier.rentDelta ?? 0));

        playSfx("round-start");
        update((draft) => {
            draft.phase = "serve";
        });
        setSelectedSlotPos(null);
        setInteractiveServe({ active: true });

        // Customer narration (arrivals, reactions, buys, kicks)
        const narration = eventsToNarration(events);
        const lines: TypewriterLine[] = [...narration.lines];
        const removals = [...narration.removals];
        const hpDamages = [...narration.hpDamages];
        const coinGains: CoinGain[] = [...narration.coinGains];
        const restocks: SlotRestock[] = [...narration.restocks];

        // ── Discovery Recipes ─────────────────────────────────
        const activeRecipes = detectActiveRecipes(run.machine);
        const knownSet = new Set(run.discoveredRecipes);
        const newRecipes = findNewRecipes(activeRecipes, knownSet);
        let recipeBonus = 0;

        if (activeRecipes.length > 0) {
            lines.push({
                text: "── Active Combos ──",
                charDelay: 15,
                lingerMs: 600,
                className: "vm-narration__combo-header",
            });
            for (const recipe of activeRecipes) {
                const isNew = newRecipes.some((r) => r.id === recipe.id);
                if (isNew) {
                    lines.push({
                        text: `>> NEW COMBO: ${recipe.name}!`,
                        charDelay: 15,
                        lingerMs: 800,
                        className: "vm-narration__recipe-new",
                    });
                    lines.push({
                        text: recipe.discoveryText,
                        charDelay: 20,
                        lingerMs: 600,
                        className: "vm-narration__recipe-flavor",
                    });
                }
                lines.push({
                    text: `${recipe.name}: +${recipe.bonus}¢`,
                    charDelay: 20,
                    lingerMs: 500,
                    className: "vm-narration__combo",
                });
                coinGains.push({
                    lineIndex: lines.length - 1,
                    amount: recipe.bonus,
                });
                recipeBonus += recipe.bonus;
            }
            lines.push({ text: "", charDelay: 0, lingerMs: 300 });
        }

        // Record new recipe discoveries
        if (newRecipes.length > 0) {
            update((draft) => {
                for (const r of newRecipes) {
                    if (!draft.discoveredRecipes.includes(r.id)) {
                        draft.discoveredRecipes.push(r.id);
                    }
                }
            });
        }

        // ── Machine emptied → pause for restock ──────────────
        if (machineEmptied && remainingCustomers > 0) {
            lines.push({
                text: "── MACHINE EMPTY! ──",
                charDelay: 12,
                lingerMs: 800,
                className: "vm-narration__combo-header",
            });
            lines.push({
                text: "The vending machine is completely sold out!",
                charDelay: 20,
                lingerMs: 600,
                className: "vm-narration__arrival",
            });
            lines.push({
                text: `${remainingCustomers} customer${remainingCustomers > 1 ? "s" : ""} still waiting in line...`,
                charDelay: 20,
                lingerMs: 600,
                className: "vm-narration__mood",
            });

            const firstBatchSales = events.reduce(
                (sum, e) => sum + (e.bought?.price ?? 0),
                0,
            );
            const firstBatchSold = events.filter((e) => e.bought).length;
            const firstBatchDamage = events.reduce(
                (sum, e) => sum + (e.kicked ? e.damage : 0),
                0,
            );
            const firstBatchKicks = events.filter((e) => e.kicked).length;

            setServe({
                runId: serve.runId + 1,
                lines,
                removals,
                hpDamages,
                coinGains,
                restocks,
                summary: {
                    totalSales: firstBatchSales,
                    totalProfit: 0,
                    itemsSold: firstBatchSold,
                    rentPaid: 0,
                    netProfit: 0,
                    damageTaken: firstBatchDamage,
                    kicks: firstBatchKicks,
                    evolved: [],
                    rotted: [],
                    newRecipes: newRecipes.map((r) => ({
                        name: r.name,
                        bonus: r.bonus,
                    })),
                },
                stickerHpHeal: 0,
                appliedRemovals: new Set(),
                appliedHpDamages: new Set(),
                appliedCoinGains: new Set(),
                appliedRestocks: new Set(),
                skipLines: 0,
                restockPauseAt: lines.length - 1,
                pendingRestock: {
                    remainingCustomers,
                    roundEvent: event ?? null,
                    round: run.round,
                    rent,
                    simContext: simCtx,
                    firstBatchEvents: events,
                    newRecipes: newRecipes.map((r) => ({
                        name: r.name,
                        bonus: r.bonus,
                    })),
                    firstBatchComboBonus: 0,
                    firstBatchRecipeBonus: recipeBonus,
                    firstBatchCombos: combos.length,
                },
            });
            return;
        }

        // Tally sales from events
        const totalSales = events.reduce(
            (sum, e) => sum + (e.bought?.price ?? 0),
            0,
        );
        const itemsSold = events.filter((e) => e.bought).length;
        const damageTaken = events.reduce(
            (sum, e) => sum + (e.kicked ? e.damage : 0),
            0,
        );
        const kicks = events.filter((e) => e.kicked).length;

        // Combo bonuses — escalating labels
        let comboBonus = 0;
        if (combos.length > 0) {
            lines.push({
                text: "── Combo Bonuses ──",
                charDelay: 15,
                lingerMs: 600,
                className: "vm-narration__combo-header",
            });
            const comboLabels = ["", "+", "NICE! +", "HOT! +", ">> FRENZY! +"];
            combos.forEach((combo, i) => {
                const level = Math.min(i + 1, 4);
                const prefix = comboLabels[level];
                lines.push({
                    text: `${combo.name}! ${prefix}${combo.bonus}¢`,
                    charDelay: 20,
                    lingerMs: 500,
                    className: "vm-narration__combo",
                });
                coinGains.push({
                    lineIndex: lines.length - 1,
                    amount: combo.bonus,
                });
                comboBonus += combo.bonus;
            });
            lines.push({ text: "", charDelay: 0, lingerMs: 300 });
        }

        // ── Sticker effects (post-serve) ──────
        const __stickerResult = computeStickerScoring({
            stickers: run.stickers,
            events,
            totalSales,
            itemsSold,
            damageTaken,
            kicks,
            combosTriggered: combos.length,
            comboBonus,
            recipeBonus,
            rent,
            run,
        });
        const stickerFlatBonus = __stickerResult.stickerFlatBonus;
        const stickerMult = __stickerResult.stickerMult;
        const stickerRentReduction = __stickerResult.stickerRentReduction;
        const stickerHpHeal = __stickerResult.stickerHpHeal;
        {
            const __offset = lines.length;
            for (const l of __stickerResult.lines) lines.push(l);
            for (const c of __stickerResult.coinGains) {
                coinGains.push({ ...c, lineIndex: c.lineIndex + __offset });
            }
        }

        const cappedMult = Math.min(stickerMult, 10);
        const cappedFlat = Math.min(stickerFlatBonus, 9999);
        const baseRevenue = totalSales + comboBonus + recipeBonus;
        const multedRevenue =
            cappedMult > 1 ? Math.round(baseRevenue * cappedMult) : baseRevenue;
        const totalEarnings = Math.min(multedRevenue + cappedFlat, MAX_COINS);
        const effectiveRent = Math.max(0, rent - stickerRentReduction);

        // Preview which items will evolve/rot when entering next round
        const evoPreview: { name: string; level: number }[] = [];
        const rotPreview: { name: string }[] = [];
        for (let si = 0; si < snapshot.length; si++) {
            const slot = snapshot[si];
            if (!slot.unlocked || !slot.item) continue;
            // Only age items still in machine (not sold)
            if (soldSlots.has(si)) continue;
            const lvl = slot.item.evoLevel ?? 0;
            if (lvl === ROTTEN_LEVEL) continue;
            const baseName = slot.item.baseName ?? slot.item.name;
            if (lvl >= MAX_EVO_LEVEL) {
                // Will potentially rot (show as "at risk")
                rotPreview.push({ name: baseName });
            } else {
                evoPreview.push({ name: baseName, level: lvl + 1 });
            }
        }

        const summary: RoundSummaryType = {
            totalSales,
            totalProfit: totalEarnings,
            itemsSold,
            rentPaid: effectiveRent,
            netProfit: totalEarnings - effectiveRent,
            damageTaken,
            kicks,
            evolved: evoPreview,
            rotted: rotPreview,
            newRecipes: newRecipes.map((r) => ({
                name: r.name,
                bonus: r.bonus,
            })),
        };

        setServe({
            runId: serve.runId + 1,
            lines,
            removals,
            hpDamages,
            coinGains,
            restocks,
            summary,
            stickerHpHeal,
            appliedRemovals: new Set(),
            appliedHpDamages: new Set(),
            appliedCoinGains: new Set(),
            appliedRestocks: new Set(),
            skipLines: 0,
            restockPauseAt: null,
            pendingRestock: null,
        });
    }, [run, update, serve.runId]);

    // ── Mid-round restock: place cooler item into empty slot ─
    const handleRestockPlace = useCallback(
        (slotIdx: number, item: SnackItemInstance) => {
            playSfx("slot-place");
            update((draft) => {
                draft.machine.slots[slotIdx].item = { ...item };
                draft.cooler = draft.cooler.filter(
                    (b) => b.instanceId !== item.instanceId,
                );
            });
        },
        [update],
    );

    // ── Mid-round restock: continue serving ──────────────
    const handleRestockContinue = useCallback(() => {
        setRestockPending(false);
        setRestockSelectedDef(null);
        const pending = serve.pendingRestock;
        if (!pending) return;

        // First-batch tallies from the partial summary
        const firstBatch = serve.summary;

        // ── Lazy simulate remaining customers against REAL (restocked) state ──
        const snapshot2 = structuredClone(run.machine.slots);
        const soldSlots2 = new Set<number>();
        const events2: ServeEvent[] = [];

        for (let i = 0; i < pending.remainingCustomers; i++) {
            const result = simulateOneCustomer(
                snapshot2,
                soldSlots2,
                pending.simContext,
            );
            if (result.event.bought == null && result.machineEmpty) break;
            events2.push(result.event);
            if (result.machineEmpty) break;
        }

        // Build narration for second batch, offset by first batch's line count
        const narration2 = eventsToNarration(events2);
        const prevLineCount = serve.lines.length;
        const headerLine: TypewriterLine = {
            text: "── Emergency Restock Complete! ──",
            charDelay: 12,
            lingerMs: 600,
            className: "vm-narration__combo-header",
        };
        const offset = prevLineCount + 1; // +1 for header line
        const newLines: TypewriterLine[] = [headerLine, ...narration2.lines];
        const newRemovals = narration2.removals.map((r) => ({
            ...r,
            lineIndex: r.lineIndex + offset,
        }));
        const newHpDamages = narration2.hpDamages.map((h) => ({
            ...h,
            lineIndex: h.lineIndex + offset,
        }));
        const newCoinGains: CoinGain[] = narration2.coinGains.map((c) => ({
            ...c,
            lineIndex: c.lineIndex + offset,
        }));
        const newRestocks: SlotRestock[] = narration2.restocks.map((r) => ({
            ...r,
            lineIndex: r.lineIndex + offset,
        }));

        // Combine tallies from both batches
        const batch2Sales = events2.reduce(
            (sum, e) => sum + (e.bought?.price ?? 0),
            0,
        );
        const batch2Sold = events2.filter((e) => e.bought).length;
        const batch2Damage = events2.reduce(
            (sum, e) => sum + (e.kicked ? e.damage : 0),
            0,
        );
        const batch2Kicks = events2.filter((e) => e.kicked).length;

        const totalSales = firstBatch.totalSales + batch2Sales;
        const itemsSold = firstBatch.itemsSold + batch2Sold;
        const damageTaken = firstBatch.damageTaken + batch2Damage;
        const kicks = firstBatch.kicks + batch2Kicks;

        // Combos from current grid (post-restock — new items may form combos)
        const allLines = [...serve.lines, ...newLines];
        const allRemovals = [...serve.removals, ...newRemovals];
        const allHpDamages = [...serve.hpDamages, ...newHpDamages];
        const allCoinGains: CoinGain[] = [...serve.coinGains, ...newCoinGains];
        const allRestocks: SlotRestock[] = [...serve.restocks, ...newRestocks];

        const combos = detectCombos(run.machine);
        let comboBonus = 0;
        if (combos.length > 0) {
            allLines.push({
                text: "── Combo Bonuses ──",
                charDelay: 15,
                lingerMs: 600,
                className: "vm-narration__combo-header",
            });
            const comboLabels = ["", "+", "NICE! +", "HOT! +", ">> FRENZY! +"];
            combos.forEach((combo, i) => {
                const level = Math.min(i + 1, 4);
                const prefix = comboLabels[level];
                allLines.push({
                    text: `${combo.name}! ${prefix}${combo.bonus}¢`,
                    charDelay: 20,
                    lingerMs: 500,
                    className: "vm-narration__combo",
                });
                allCoinGains.push({
                    lineIndex: allLines.length - 1,
                    amount: combo.bonus,
                });
                comboBonus += combo.bonus;
            });
            allLines.push({ text: "", charDelay: 0, lingerMs: 300 });
        }

        const rent =
            pending.round > 0
                ? run.gameMode === "profiteer"
                    ? 0
                    : rentForRound(pending.round, run.rent)
                : 0;

        // Combine first + second batch for sticker scoring
        const allEvents: ServeEvent[] = [
            ...pending.firstBatchEvents,
            ...events2,
        ];
        const recipeBonus = pending.firstBatchRecipeBonus;
        const combinedComboBonus =
            pending.firstBatchComboBonus + comboBonus;
        const combosTriggered = pending.firstBatchCombos + combos.length;

        const stickerResult = computeStickerScoring({
            stickers: run.stickers,
            events: allEvents,
            totalSales,
            itemsSold,
            damageTaken,
            kicks,
            combosTriggered,
            comboBonus: combinedComboBonus,
            recipeBonus,
            rent,
            run,
        });
        {
            const __offset = allLines.length;
            for (const l of stickerResult.lines) allLines.push(l);
            for (const c of stickerResult.coinGains) {
                allCoinGains.push({
                    ...c,
                    lineIndex: c.lineIndex + __offset,
                });
            }
        }

        const cappedMult = Math.min(stickerResult.stickerMult, 10);
        const cappedFlat = Math.min(stickerResult.stickerFlatBonus, 9999);
        const baseRevenue = totalSales + combinedComboBonus + recipeBonus;
        const multedRevenue =
            cappedMult > 1
                ? Math.round(baseRevenue * cappedMult)
                : baseRevenue;
        const totalEarnings = Math.min(multedRevenue + cappedFlat, MAX_COINS);
        const effectiveRent = Math.max(
            0,
            rent - stickerResult.stickerRentReduction,
        );

        // Evo preview from remaining unsold items post-restock
        const evoPreview: { name: string; level: number }[] = [];
        const rotPreview: { name: string }[] = [];
        for (let si = 0; si < snapshot2.length; si++) {
            const slot = snapshot2[si];
            if (!slot.unlocked || !slot.item) continue;
            // Only age items still in machine (not sold in second batch)
            if (soldSlots2.has(si)) continue;
            const lvl = slot.item.evoLevel ?? 0;
            if (lvl === ROTTEN_LEVEL) continue;
            const baseName = slot.item.baseName ?? slot.item.name;
            if (lvl >= MAX_EVO_LEVEL) {
                rotPreview.push({ name: baseName });
            } else {
                evoPreview.push({ name: baseName, level: lvl + 1 });
            }
        }

        const summary: RoundSummaryType = {
            totalSales,
            totalProfit: totalEarnings,
            itemsSold,
            rentPaid: effectiveRent,
            netProfit: totalEarnings - effectiveRent,
            damageTaken,
            kicks,
            evolved: evoPreview,
            rotted: rotPreview,
            newRecipes: pending.newRecipes,
        };

        playSfx("restock");
        // Pre-mark first-batch effects as applied so they don't re-fire
        // when the typewriter replays from the start with all lines.
        const preAppliedRemovals = new Set(
            serve.removals.map((r) => r.lineIndex),
        );
        const preAppliedHpDamages = new Set(
            serve.hpDamages.map((h) => h.lineIndex),
        );
        const preAppliedCoinGains = new Set(
            serve.coinGains.map((c) => c.lineIndex),
        );
        const preAppliedRestocks = new Set(
            serve.restocks.map((r) => r.lineIndex),
        );

        // Bump runId so typewriter replays from start with all lines (old + new)
        setServe({
            runId: serve.runId + 1,
            lines: allLines,
            removals: allRemovals,
            hpDamages: allHpDamages,
            coinGains: allCoinGains,
            restocks: allRestocks,
            summary,
            stickerHpHeal: stickerResult.stickerHpHeal,
            appliedRemovals: preAppliedRemovals,
            appliedHpDamages: preAppliedHpDamages,
            appliedCoinGains: preAppliedCoinGains,
            appliedRestocks: preAppliedRestocks,
            skipLines: prevLineCount,
            restockPauseAt: null,
            pendingRestock: null,
        });
    }, [run, serve, update]);

    const handleSummaryContinue = useCallback(() => {
        // Profiteer: if target was missed, continue goes to game-over
        if (
            run.gameMode === "profiteer" &&
            run.lastSummary != null &&
            run.lastSummary.netProfit < profiteerTarget(run.round)
        ) {
            update((draft) => {
                draft.phase = "game-over";
            });
            return;
        }
        // Transition to sticker shop
        const options = rollStickerShop(run.lockedStickerDefId);
        setStickerShopOptions(options);
        setStickerShopRerolls(0);
        update((draft) => {
            draft.phase = "sticker-shop";
        });
    }, [
        update,
        run.gameMode,
        run.lastSummary,
        run.round,
        run.lockedStickerDefId,
    ]);

    /** After sticker shop (pick or skip), advance to next round prep. */
    const handleStickerShopDone = useCallback(() => {
        // Compute next-round state synchronously so we can refresh catalogue
        // without scheduling setState inside another setState updater.
        const next = structuredClone(run);
        advanceToNextRound(next);
        const hasEvent = next.roundEvent != null;
        update(() => next);
        if (hasEvent) playSfx("event-banner");
        setSelectedCatalogueItem(null);
        setStickerShopOptions([]);
        refreshCatalogue(next);
    }, [run, update, refreshCatalogue, setSelectedCatalogueItem]);

    const handleUpgrade = useCallback(
        (id: UpgradeId) => {
            // Featured slot: if already purchased, enter move mode (free)
            if (id === "feature-slot" && run.upgradeCounts[id] >= 1) {
                playSfx("slot-select");
                setPickingFeatured(true);
                setUpgradeOpen(false);
                return;
            }
            const cost =
                UPGRADE_DEFS.find((d) => d.id === id)?.cost(
                    run.upgradeCounts[id],
                ) ?? 0;
            const maxed =
                run.upgradeCounts[id] >=
                (UPGRADE_DEFS.find((d) => d.id === id)?.maxPurchases ?? 0);
            if (maxed || run.coins < cost) {
                playSfx("upgrade-fail");
                return;
            }
            playSfx("upgrade-buy");
            update((draft) => {
                purchaseUpgrade(draft, id);
            });
            // After purchasing featured slot, enter pick mode
            if (id === "feature-slot") {
                setPickingFeatured(true);
                setUpgradeOpen(false);
            }
        },
        [update, run.upgradeCounts, run.coins],
    );

    // ── Slot interaction (prep phase only) ───────────────

    const [selectedSlotPos, setSelectedSlotPos] = useState<SlotPosition | null>(
        null,
    );
    const [highlightNextLocked, setHighlightNextLocked] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [recipeBookOpen, setRecipeBookOpen] = useState(false);
    const [pickingFeatured, setPickingFeatured] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [coolerOpen, setCoolerOpen] = useState(false);
    const [areaDetailOpen, setAreaDetailOpen] = useState(false);

    // ── Sticker shop state (end-of-round reward) ─────────
    const [stickerShopOptions, setStickerShopOptions] = useState<
        import("@/logic/snack").StickerInstance[]
    >([]);
    const [stickerShopRerolls, setStickerShopRerolls] = useState(0);

    // Reset transient UI state on every phase transition so stale selections
    // or open popovers don't linger across prep/serve/summary/shop boundaries.
    useEffect(() => {
        setSelectedSlotPos(null);
        setSelectedShopItem(null);
        setSelectedCoolerItem(null);
        setSelectedCatalogueItem(null);
        setPickingFeatured(false);
        setUpgradeOpen(false);
        setCoolerOpen(false);
        setShopOpen(false);
        setRecipeBookOpen(false);
        setAreaDetailOpen(false);
        setHighlightNextLocked(false);
    }, [run.phase, setSelectedCoolerItem, setSelectedCatalogueItem]);

    const handleUpgradeHover = useCallback((id: UpgradeId | null) => {
        setHighlightNextLocked(id === "unlock-slot");
    }, []);

    const handleSellSticker = useCallback(
        (instanceId: string) => {
            playSfx("slot-select");
            update((draft) => {
                sellSticker(draft, instanceId);
            });
        },
        [update],
    );

    const handlePickSticker = useCallback(
        (
            sticker: import("@/logic/snack").StickerInstance,
            slotIndex: number,
        ) => {
            const cost = STICKER_BUY_COSTS[sticker.rarity];
            if (run.coins < cost) {
                playSfx("upgrade-fail");
                return;
            }
            playSfx("upgrade-buy");
            update((draft) => {
                draft.coins -= cost;
                // If locked sticker was bought, clear the lock
                if (draft.lockedStickerDefId === sticker.defId) {
                    draft.lockedStickerDefId = null;
                }

                const usesFreeSlot = EDITION_BONUSES[sticker.edition].freeSlot;
                if (usesFreeSlot) {
                    draft.stickers.push(sticker);
                    return;
                }

                const slottedStickers = draft.stickers.filter(
                    (owned) => !EDITION_BONUSES[owned.edition].freeSlot,
                );
                const stickerToReplace = slottedStickers[slotIndex] ?? null;

                if (stickerToReplace) {
                    const replaceIdx = draft.stickers.findIndex(
                        (owned) =>
                            owned.instanceId === stickerToReplace.instanceId,
                    );
                    if (replaceIdx >= 0) {
                        draft.stickers[replaceIdx] = sticker;
                        return;
                    }
                }

                draft.stickers.push(sticker);
            });
            // Advance to next round prep
            handleStickerShopDone();
        },
        [run.coins, update, handleStickerShopDone],
    );

    const handleStickerShopSkip = useCallback(() => {
        handleStickerShopDone();
    }, [handleStickerShopDone]);

    const handleStickerShopReroll = useCallback(() => {
        const cost = REROLL_BASE_COST * (stickerShopRerolls + 1);
        if (run.coins < cost) {
            playSfx("upgrade-fail");
            return;
        }
        playSfx("slot-select");
        update((draft) => {
            draft.coins -= cost;
        });
        const newOptions = rollStickerShop(run.lockedStickerDefId);
        setStickerShopOptions(newOptions);
        setStickerShopRerolls((n) => n + 1);
    }, [stickerShopRerolls, run.coins, run.lockedStickerDefId, update]);

    const handleStickerLock = useCallback(
        (defId: string) => {
            playSfx("slot-select");
            update((draft) => {
                // Toggle: if already locked, unlock; otherwise lock this one
                draft.lockedStickerDefId =
                    draft.lockedStickerDefId === defId ? null : defId;
            });
        },
        [update],
    );

    // ── Draft shop handlers ────────────────────────────────

    const [selectedShopItem, setSelectedShopItem] =
        useState<SnackItemInstance | null>(null);

    /** Buy the selected shop item and place it directly into a machine slot. */
    const handleShopPlaceInSlot = useCallback(
        (slotIdx: number) => {
            const item = selectedShopItem;
            if (!item || run.coins < item.cost) return;
            const slot = run.machine.slots[slotIdx];
            if (!slot?.unlocked || slot.item) return;
            playSfx("slot-place");
            // Create a fresh copy with a new instanceId for placement
            const placed: SnackItemInstance = { ...item, instanceId: generateId() };
            update((d) => {
                d.coins -= item.cost;
                d.machine.slots[slotIdx].item = placed;
            });
            // Aged items: mark as sold. Base items: stay in shop.
            const isAged = draft.aged.some((a) => a.instanceId === item.instanceId);
            if (isAged) {
                setDraft((prev) => ({
                    ...prev,
                    soldAgedIds: [...prev.soldAgedIds, item.instanceId],
                }));
            }
            setSelectedShopItem(null);
        },
        [selectedShopItem, run.coins, run.machine.slots, draft.aged, update, setDraft],
    );

    /** Buy the selected shop item and send it to the cooler. */
    const handleShopSendToCooler = useCallback(() => {
        const item = selectedShopItem;
        if (!item || run.coins < item.cost || !canAddToCooler(run.cooler, maxCoolerSize(run.upgradeCounts["expand-cooler"]))) return;
        playSfx("slot-place");
        const placed: SnackItemInstance = { ...item, instanceId: generateId() };
        update((d) => {
            d.coins -= item.cost;
            d.cooler.push(placed);
        });
        // Aged items: mark as sold. Base items: stay in shop.
        const isAged = draft.aged.some((a) => a.instanceId === item.instanceId);
        if (isAged) {
            setDraft((prev) => ({
                ...prev,
                soldAgedIds: [...prev.soldAgedIds, item.instanceId],
            }));
        }
        setSelectedShopItem(null);
    }, [selectedShopItem, run.coins, run.cooler, draft.aged, update, setDraft]);

    const handleDraftReroll = useCallback(() => {
        const cost = draftRerollCost(run.round, run.rerollCount);
        if (run.coins < cost) {
            playSfx("upgrade-fail");
            return;
        }
        playSfx("slot-select");
        update((draft) => {
            draft.coins -= cost;
            draft.rerollCount += 1;
        });
        refreshDraft(run);
    }, [run, update, refreshDraft]);

    const handleCoolerPlaceInSlot = useCallback(
        (slotIdx: number) => {
            const item = selectedCoolerItem;
            if (!item) return;
            const slot = run.machine.slots[slotIdx];
            if (!slot?.unlocked || slot.item) return;

            playSfx("slot-place");
            update((draft) => {
                const target = draft.machine.slots[slotIdx];
                if (!target?.unlocked || target.item) return;
                target.item = item;
                draft.cooler = draft.cooler.filter(
                    (b) => b.instanceId !== item.instanceId,
                );
            });
            setSelectedCoolerItem(null);
            setSelectedSlotPos(null);
        },
        [selectedCoolerItem, run.machine.slots, update, setSelectedCoolerItem],
    );

    const handleSlotClick = useCallback(
        (slot: MachineSlot) => {
            // Allow slot clicks during prep and during restock
            if (run.phase !== "prep" && !restockPending) return;
            if (!slot.unlocked) return;

            // Picking featured slot mode
            if (pickingFeatured) {
                playSfx("slot-place");
                update((draft) => {
                    // Clear old featured
                    for (const s of draft.machine.slots) s.featured = false;
                    // Set new featured
                    const s = getSlot(
                        draft.machine,
                        slot.position.row,
                        slot.position.col,
                    );
                    if (s) s.featured = true;
                });
                setPickingFeatured(false);
                return;
            }

            // During restock: place selected cooler item into empty slot
            if (restockPending) {
                if (restockSelectedDef && !slot.item) {
                    handleRestockPlace(
                        run.machine.slots.findIndex(
                            (s) =>
                                s.position.row === slot.position.row &&
                                s.position.col === slot.position.col,
                        ),
                        restockSelectedDef,
                    );
                    setRestockSelectedDef(null);
                }
                return;
            }

            // Place cooler item into empty slot
            if (selectedCoolerItem && !slot.item) {
                playSfx("slot-place");
                update((draft) => {
                    const s = getSlot(
                        draft.machine,
                        slot.position.row,
                        slot.position.col,
                    );
                    if (!s) return;
                    s.item = selectedCoolerItem;
                    draft.cooler = draft.cooler.filter(
                        (b) => b.instanceId !== selectedCoolerItem.instanceId,
                    );
                });
                setSelectedCoolerItem(null);
                setSelectedSlotPos(null);
                return;
            }

            // Toggle selection on filled slot
            if (slot.item) {
                setSelectedSlotPos((prev) =>
                    prev &&
                    prev.row === slot.position.row &&
                    prev.col === slot.position.col
                        ? null
                        : slot.position,
                );
                setSelectedCoolerItem(null);
                return;
            }

            // Click empty slot with nothing selected — deselect
            setSelectedSlotPos(null);
        },
        [
            run.phase,
            run.machine.slots,
            run.coins,
            restockPending,
            restockSelectedDef,
            handleRestockPlace,
            selectedCoolerItem,
            pickingFeatured,
            update,
            setSelectedCoolerItem,
        ],
    );

    const handleTrash = useCallback(
        (row: number, col: number) => {
            update((draft) => {
                const s = getSlot(draft.machine, row, col);
                if (!s?.item) return;
                const refund = Math.max(1, Math.round(s.item.cost * 0.1));
                s.item = null;
                draft.coins += refund;
                playSfx("slot-select");
            });
            setSelectedSlotPos(null);
        },
        [update],
    );

    const handleRepair = useCallback(() => {
        update((draft) => {
            const missing = draft.maxMachineHp - draft.machineHp;
            if (missing <= 0) return;
            const cost = missing * 2;
            if (draft.coins < cost) return;
            playSfx("repair");
            draft.coins -= cost;
            draft.machineHp = draft.maxMachineHp;
        });
    }, [update]);

    const handlePriceAdjust = useCallback(
        (row: number, col: number, delta: number) => {
            update((draft) => {
                const s = getSlot(draft.machine, row, col);
                if (!s?.item) return;
                // Dial centers on the item's evo-adjusted base price, so
                // Vintage/Legendary/Rotten prices don't get clamped back toward
                // the Fresh default when the dial is touched.
                const fresh = defaultPrice(s.item);
                const base = fresh + evoPriceDelta(fresh, s.item.evoLevel ?? 0);
                const newPrice = s.item.price + delta;
                // Clamp to [base + DIAL_MIN, base + DIAL_MAX], floor 1
                const clamped = Math.max(
                    1,
                    Math.min(
                        base + PRICE_DIAL_MAX,
                        Math.max(base + PRICE_DIAL_MIN, newPrice),
                    ),
                );
                if (clamped === s.item.price) return;
                s.item.price = clamped;
                playSfx("button-hover");
            });
        },
        [update],
    );

    const currentRent = run.gameMode === "profiteer"
        ? 0
        : Math.max(0, rentForRound(run.round, run.rent) + (run.currentArea?.modifier.rentDelta ?? 0));

    // Combo glow: slots that are part of an active combo pair in prep
    const comboSlots = useMemo(() => {
        if (run.phase !== "prep") return new Set<number>();
        const combos = detectCombos(run.machine);
        const indices = new Set<number>();
        for (const c of combos) {
            for (const pos of c.positions) {
                indices.add(pos.row * run.machine.cols + pos.col);
            }
        }
        return indices;
    }, [run.phase, run.machine]);

    // Serve glow: slots whose item matches the current customer's mood
    const serveMatchSlots = useMemo(() => new Set<number>(), []);

    // ── Auto-scroll narration (within container only) ─────
    const narrationEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = narrationEndRef.current;
        if (el?.parentElement) {
            el.parentElement.scrollTop = el.parentElement.scrollHeight;
        }
    }, [visibleLines]);

    // Init audio on first pointer interaction so hover/click SFX work on menu
    const audioInited = useRef(false);
    const ensureAudio = useCallback(() => {
        // Create/resume AudioContext synchronously inside user gesture (mobile requirement)
        ensureAudioContext();
        if (!audioInited.current) {
            audioInited.current = true;
            initSfx();
        }
    }, []);

    // Eagerly preload SFX/BGM buffers at mount. Decoding works on a suspended
    // AudioContext, so this primes everything before the user's first tap —
    // critical on mobile where the first gesture IS the Start button and
    // there's no warm-up time for hover/click events.
    useEffect(() => {
        if (audioInited.current) return;
        audioInited.current = true;
        initSfx();
    }, []);

    const handleHover = useCallback(
        (e: React.PointerEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.closest("button") ||
                target.closest(".vm-catalogue__item") ||
                target.closest(".sticker:not(.sticker--empty)")
            ) {
                playSfx("button-hover", { volume: 0.3 });
            }
        },
        [],
    );

    // ── Render by phase ──────────────────────────────────

    if (run.phase === "menu") {
        return (
            <div className="GameContainer" onPointerDown={ensureAudio} onPointerOver={handleHover}>
                <AudioControls />
                <div className="GameSurface">
                    <MenuScreen onStart={handleStartGame} />
                </div>
            </div>
        );
    }

    // ── Compute restock UI data (before return) ────────────
    // (item-first flow: no slot pre-selection needed)

    // ── Compute active recipes for recipe book ───────────
    const activeRecipesForBook = detectActiveRecipes(run.machine);

    return (
        <div className="GameContainer" onPointerDown={ensureAudio} onPointerOver={handleHover}>
            <AudioControls onQuit={handleNewGame} />
            <div className="GameContainer__row">
                <div className="GameContainer__sidebar">
                    <StickerTray
                        stickers={run.stickers}
                        maxSlots={run.maxStickerSlots}
                        onSell={
                            run.phase === "prep" ? handleSellSticker : undefined
                        }
                    />
                    {run.phase === "prep" && (
                        <div className="sidebar-actions">
                        </div>
                    )}
                </div>

                <div className="GameSurface">
                    {selectedSlotPos && run.phase === "prep" && (
                        <div
                            className="vm-popout-backdrop"
                            onClick={() => setSelectedSlotPos(null)}
                        />
                    )}

                    <div className="vm-title-bar">
                        <span className="vm-title-bar__text">
                            {"SNACKITEER".split("").map((ch, i) => (
                                <span
                                    key={i}
                                    className="vm-title-bar__char"
                                    style={{
                                        animationDelay: `${(Math.sin(i * 2.3) * 1000 + 500) % 1800}ms`,
                                    }}
                                >
                                    {ch}
                                </span>
                            ))}
                        </span>
                    </div>

                    {(run.phase === "prep" || run.phase === "serve") &&
                        run.currentArea && (
                            <div className="vm-event-banner-wrap">
                                <button
                                    type="button"
                                    className="vm-event-banner vm-event-banner--area vm-event-banner--compact"
                                    onClick={() => setAreaDetailOpen(o => !o)}
                                >
                                    <span className="vm-event-banner__name">
                                        {run.currentArea.area.emoji} {run.currentArea.area.name}
                                        {run.roundEvent ? ` • ${run.roundEvent.name}` : ""}
                                    </span>
                                    <span className="vm-event-banner__tap-hint">tap for details</span>
                                </button>
                                {areaDetailOpen && (
                                    <>
                                        <div className="vm-event-detail-backdrop" onClick={() => setAreaDetailOpen(false)} />
                                        <div className="vm-event-detail" onClick={(e) => e.stopPropagation()}>
                                            <div className="vm-event-detail__section">
                                                <strong>{run.currentArea.area.emoji} {run.currentArea.area.name}</strong>
                                                <span>{run.currentArea.area.flavor}</span>
                                                <span className="vm-event-detail__mod">
                                                    <strong>{run.currentArea.modifier.name}</strong>: {run.currentArea.modifier.description}
                                                </span>
                                            </div>
                                            {run.roundEvent && (
                                                <div className="vm-event-detail__section">
                                                    <strong>{">>"} {run.roundEvent.name}</strong>
                                                    <span>{run.roundEvent.description}</span>
                                                </div>
                                            )}
                                            <button type="button" className="vm-event-detail__close" onClick={() => setAreaDetailOpen(false)}>
                                                Close
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                    {pickingFeatured && (
                        <div className="vm-featured-pick-banner">
                            <span>Click a slot to feature it</span>
                            <button
                                type="button"
                                className="vm-featured-pick-banner__cancel"
                                onClick={() => setPickingFeatured(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    <div className="vm-content-row">
                        <div className="vm-main-column">
                            <VendingMachine
                                slots={run.machine.slots}
                                coins={run.coins}
                                round={run.round}
                                rent={currentRent}
                                gameMode={run.gameMode}
                                profitTarget={
                                    run.gameMode === "profiteer"
                                        ? profiteerTarget(run.round)
                                        : null
                                }
                                machineHp={run.machineHp}
                                maxMachineHp={run.maxMachineHp}
                                selectedSlotPos={
                                    run.phase === "prep" ? selectedSlotPos : null
                                }
                                highlightNextLocked={highlightNextLocked}
                                floaters={fx.floaters}
                                shaking={shaking}
                                headerExtra={null}
                                actionSlot={
                                    run.phase === "prep" ? (
                                        <div className="vm-prep-actions vm-prep-actions--start">
                                            <button
                                                type="button"
                                                className="vm-start-round"
                                                onClick={() => setShopOpen(true)}
                                            >
                                                Stock Machine
                                            </button>
                                            <button
                                                type="button"
                                                className={`vm-shop-btn ${upgradeOpen ? "vm-shop-btn--active" : ""}`}
                                                onClick={() => setUpgradeOpen((open) => !open)}
                                            >
                                                Upgrades
                                            </button>
                                            <button
                                                type="button"
                                                className={`vm-shop-btn ${coolerOpen ? "vm-shop-btn--active" : ""}`}
                                                onClick={() => setCoolerOpen((o) => !o)}
                                            >
                                                Cooler ({run.cooler.length}/{maxCoolerSize(run.upgradeCounts["expand-cooler"])})
                                            </button>
                                        </div>
                                    ) : undefined
                                }
                                serveMatchSlots={serveMatchSlots}
                                comboSlots={comboSlots}
                                onSlotClick={handleSlotClick}
                                onTrash={handleTrash}
                                onPriceAdjust={
                                    run.phase === "prep"
                                        ? handlePriceAdjust
                                        : undefined
                                }
                                onRepair={
                                    run.phase === "prep" ? handleRepair : undefined
                                }
                            />

                            <div className="vm-below-machine">
                                {run.phase === "prep" &&
                                    run.gameMode === "retirement" && (
                                        <p className="vm-mode-info vm-mode-info--retirement">
                                            🏦 {run.coins}/{RETIREMENT_GOAL}¢ —{" "}
                                            {Math.min(
                                                100,
                                                Math.round(
                                                    (run.coins /
                                                        RETIREMENT_GOAL) *
                                                        100,
                                                ),
                                            )}
                                            % to retirement
                                        </p>
                                    )}

                                {run.phase === "serve" &&
                                    serve.runId > 0 &&
                                    !restockPending && (
                                        <>
                                            {!narrationDone && (
                                                <button
                                                    type="button"
                                                    className="vm-narration__skip"
                                                    onClick={skipNarration}
                                                >
                                                    Skip {">>"}
                                                </button>
                                            )}
                                            <div className="vm-narration">
                                                {nfx.floaters.length > 0 && (
                                                    <div
                                                        className="vm-narration__fx"
                                                        aria-hidden
                                                    >
                                                        {nfx.floaters.map((f) => (
                                                            <span
                                                                key={f.id}
                                                                className="vm-narration__floater"
                                                                style={{
                                                                    ["--fx-offset-x" as string]: `${f.offsetX}px`,
                                                                    ["--fx-delay" as string]: `${f.delayMs}ms`,
                                                                }}
                                                            >
                                                                {f.text}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {visibleLines.map((line, i) => (
                                                    <p
                                                        key={`${i}-${line.text.length}`}
                                                        className={`vm-narration__line ${line.className ?? ""}`}
                                                    >
                                                        {line.text}
                                                        {i ===
                                                            visibleLines.length -
                                                                1 && (
                                                            <span className="vm-narration__cursor">
                                                                ▌
                                                            </span>
                                                        )}
                                                    </p>
                                                ))}
                                                <div ref={narrationEndRef} />
                                            </div>
                                        </>
                                    )}

                                {restockPending && (
                                    <div className="vm-restock">
                                        <h3 className="vm-restock__title">
                                            {">>"} EMERGENCY RESTOCK
                                        </h3>
                                        <p className="vm-restock__subtitle">
                                            {run.cooler.length === 0
                                                ? "Your cooler is empty — nothing to restock with!"
                                                : restockSelectedDef
                                                  ? `Place ${restockSelectedDef.name} in an empty slot:`
                                                  : "Pick a cooler item below, then place it in a slot."}
                                        </p>
                                        <div className="vm-restock__items">
                                            {run.cooler.map((item) => {
                                                const isSelected =
                                                    restockSelectedDef?.instanceId ===
                                                    item.instanceId;

                                                return (
                                                    <button
                                                        key={item.instanceId}
                                                        type="button"
                                                        className={`vm-restock__item ${isSelected ? "vm-restock__item--selected" : ""}`}
                                                        onClick={() => {
                                                            setRestockSelectedDef(
                                                                isSelected
                                                                    ? null
                                                                    : item,
                                                            );
                                                        }}
                                                    >
                                                        <span className="vm-restock__item-name">
                                                            {item.name}
                                                        </span>
                                                        <span
                                                            className={`vm-restock__item-quality vm-restock__item-quality--${item.quality}`}
                                                        >
                                                            {item.quality}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="vm-shop-grid">
                                            {run.machine.slots.map((slot, idx) => {
                                                const empty = slot.unlocked && !slot.item;
                                                const active = !!restockSelectedDef;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={idx}
                                                        className={`vm-shop-grid__cell ${!slot.unlocked ? "vm-shop-grid__cell--locked" : ""} ${slot.item ? "vm-shop-grid__cell--full" : ""} ${empty ? "vm-shop-grid__cell--empty" : ""} ${!active ? "vm-shop-grid__cell--inactive" : ""}`}
                                                        disabled={!empty || !active}
                                                        onClick={() => {
                                                            if (restockSelectedDef && empty) {
                                                                handleRestockPlace(idx, restockSelectedDef);
                                                                setRestockSelectedDef(null);
                                                            }
                                                        }}
                                                        title={
                                                            slot.item
                                                                ? slot.item.name
                                                                : slot.unlocked
                                                                  ? "Empty"
                                                                  : "Locked"
                                                        }
                                                    >
                                                        {slot.item ? (
                                                            <span className="vm-shop-grid__name">
                                                                {(slot.item.baseName ?? slot.item.name).slice(0, 3)}
                                                            </span>
                                                        ) : slot.unlocked ? (
                                                            "+"
                                                        ) : (
                                                            "🔒"
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            type="button"
                                            className="vm-restock__continue"
                                            onClick={handleRestockContinue}
                                        >
                                            Continue Serving {">"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {upgradeOpen && (
                        <div
                            className="vm-upgrade-popover"
                            onClick={() => setUpgradeOpen(false)}
                        >
                            <div
                                className="vm-upgrade-popover__card"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h4 className="vm-upgrades__title">Upgrades</h4>
                                <span className="vm-coins" style={{ fontSize: 'clamp(9px, 2vw, 12px)', alignSelf: 'center' }}>🪙 {run.coins}¢</span>
                                {UPGRADE_DEFS.map((def) => {
                                    const count = run.upgradeCounts[def.id];
                                    const isFeatured = def.id === "feature-slot";
                                    const owned = isFeatured && count >= 1;
                                    const maxed =
                                        !isFeatured &&
                                        count >= def.maxPurchases;
                                    const cost =
                                        maxed || owned ? 0 : def.cost(count);
                                    const canAfford = owned || run.coins >= cost;

                                    return (
                                        <button
                                            type="button"
                                            key={def.id}
                                            className={`vm-upgrades__btn ${maxed ? "vm-upgrades__btn--maxed" : ""}${owned ? " vm-upgrades__btn--owned" : ""}`}
                                            disabled={maxed || !canAfford}
                                            onClick={() => handleUpgrade(def.id)}
                                            onPointerEnter={() =>
                                                handleUpgradeHover(def.id)
                                            }
                                            onPointerLeave={() =>
                                                handleUpgradeHover(null)
                                            }
                                        >
                                            <span className="vm-upgrades__name">
                                                {owned
                                                    ? "Move Featured"
                                                    : def.name}
                                            </span>
                                            <span className="vm-upgrades__desc">
                                                {owned
                                                    ? "Pick a new slot to feature"
                                                    : def.description}
                                            </span>
                                            <span className="vm-upgrades__cost">
                                                {maxed
                                                    ? "MAXED"
                                                    : owned
                                                      ? "FREE"
                                                      : `${cost}¢`}
                                            </span>
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    className="vm-upgrade-popover__close"
                                    onClick={() => setUpgradeOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {recipeBookOpen && (
                        <div
                            className="vm-upgrade-popover"
                            onClick={() => setRecipeBookOpen(false)}
                        >
                            <div
                                className="vm-upgrade-popover__card"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h4 className="vm-upgrades__title">Combos</h4>
                                {run.discoveredRecipes.length === 0 && (
                                    <p className="vm-recipe-book__empty">
                                        No combos discovered yet. Stock
                                        different item combinations to find
                                        hidden combos!
                                    </p>
                                )}
                                {RECIPE_DEFS.map((recipe) => {
                                    const discovered =
                                        run.discoveredRecipes.includes(recipe.id);
                                    const active = activeRecipesForBook.some(
                                        (r) => r.id === recipe.id,
                                    );

                                    return (
                                        <div
                                            key={recipe.id}
                                            className={`vm-recipe-book__entry ${discovered ? "vm-recipe-book__entry--found" : "vm-recipe-book__entry--hidden"} ${active ? "vm-recipe-book__entry--active" : ""}`}
                                        >
                                            <span className="vm-recipe-book__name">
                                                {discovered ? recipe.name : "???"}
                                            </span>
                                            <span className="vm-recipe-book__desc">
                                                {discovered
                                                    ? recipe.description
                                                    : "Stock different items to discover..."}
                                            </span>
                                            <span className="vm-recipe-book__bonus">
                                                {discovered
                                                    ? `+${recipe.bonus}¢`
                                                    : "?¢"}
                                            </span>
                                            {active && (
                                                <span className="vm-recipe-book__active-badge">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    className="vm-upgrade-popover__close"
                                    onClick={() => setRecipeBookOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {shopOpen && run.phase === "prep" && (
                        <div
                            className="vm-shop-popover"
                            onClick={() => setShopOpen(false)}
                        >
                            <div
                                className="vm-shop-popover__card"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DraftPanel
                                    draft={draft}
                                    coins={run.coins}
                                    cooler={run.cooler}
                                    slots={run.machine.slots}
                                    round={run.round}
                                    rerollCount={run.rerollCount}
                                    selectedShopItem={selectedShopItem}
                                    maxCooler={maxCoolerSize(run.upgradeCounts["expand-cooler"])}
                                    onSelectItem={setSelectedShopItem}
                                    onPlaceInSlot={handleShopPlaceInSlot}
                                    onSendToCooler={handleShopSendToCooler}
                                    onReroll={handleDraftReroll}
                                />
                                <div className="vm-shop-popover__actions">
                                    <button
                                        type="button"
                                        className="vm-shop-back"
                                        onClick={() => setShopOpen(false)}
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        className="vm-start-round"
                                        onClick={() => { setShopOpen(false); handleStartRound(); }}
                                    >
                                        Start Round {run.round}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {coolerOpen && run.phase === "prep" && (
                        <div
                            className="vm-shop-popover"
                            onClick={() => setCoolerOpen(false)}
                        >
                            <div
                                className="vm-shop-popover__card"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <CoolerPanel
                                    cooler={run.cooler}
                                    maxCooler={maxCoolerSize(run.upgradeCounts["expand-cooler"])}
                                    slots={run.machine.slots}
                                    selectedItem={selectedCoolerItem}
                                    onSelect={setSelectedCoolerItem}
                                    onPlaceInSlot={handleCoolerPlaceInSlot}
                                />
                                <button
                                    type="button"
                                    className="vm-shop-popover__close"
                                    onClick={() => setCoolerOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {run.phase === "summary" && run.lastSummary && (
                        <RoundSummary
                            summary={run.lastSummary}
                            round={run.round}
                            gameMode={run.gameMode}
                            onContinue={handleSummaryContinue}
                        />
                    )}

                    {run.phase === "game-over" && (
                        <div className="vm-game-over">
                            <h3>Game Over</h3>
                            {run.machineHp <= 0 && (
                                <p>Your machine was destroyed!</p>
                            )}
                            {run.coins < 0 && <p>Can’t pay rent!</p>}
                            {run.gameMode === "profiteer" &&
                                run.coins >= 0 &&
                                run.machineHp > 0 &&
                                run.lastSummary != null &&
                                (() => {
                                    const target = profiteerTarget(run.round);
                                    const net = run.lastSummary.netProfit;
                                    const shortfall = target - net;

                                    return (
                                        <div className="vm-game-over__profit-breakdown">
                                            <p className="vm-game-over__row">
                                                <span>Net profit</span>
                                                <span
                                                    className={
                                                        net >= 0
                                                            ? "vm-summary__positive"
                                                            : "vm-summary__negative"
                                                    }
                                                >
                                                    {net >= 0 ? "+" : ""}
                                                    {net}c
                                                </span>
                                            </p>
                                            <p className="vm-game-over__row">
                                                <span>Target</span>
                                                <span>+{target}c</span>
                                            </p>
                                            <p className="vm-game-over__row vm-game-over__row--miss">
                                                <span>Missed by</span>
                                                <span>{shortfall}c</span>
                                            </p>
                                        </div>
                                    );
                                })()}
                            <p className="vm-game-over__stats">
                                Round {run.round} · {run.coins}c earned
                            </p>
                            <button type="button" onClick={handleNewGame}>
                                Back to Menu
                            </button>
                        </div>
                    )}

                    {run.phase === "win" && (
                        <div className="vm-game-over vm-game-over--win">
                            <h3>🎉 You Retired Rich!</h3>
                            <p>
                                {run.coins}¢ in the bank after {run.round}{" "}
                                rounds.
                            </p>
                            {run.lastSummary && (
                                <p className="vm-game-over__stats">
                                    Final round: +{run.lastSummary.totalProfit}¢
                                    revenue · {run.lastSummary.itemsSold} items
                                    sold
                                </p>
                            )}
                            <p className="vm-game-over__stats">
                                {run.stickers.length} stickers collected
                            </p>
                            <button type="button" onClick={handleNewGame}>
                                Back to Menu
                            </button>
                        </div>
                    )}

                    {run.phase === "sticker-shop" &&
                        stickerShopOptions.length > 0 && (
                            <StickerShopScreen
                                options={stickerShopOptions}
                                currentStickers={run.stickers}
                                maxSlots={run.maxStickerSlots}
                                coins={run.coins}
                                rerollCount={stickerShopRerolls}
                                lockedDefId={run.lockedStickerDefId}
                                onBuy={handlePickSticker}
                                onSkip={handleStickerShopSkip}
                                onReroll={handleStickerShopReroll}
                                onLock={handleStickerLock}
                            />
                        )}
                </div>
            </div>
        </div>
    );
}
