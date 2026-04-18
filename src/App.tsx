import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { VendingMachine } from "./components/vendingMachine";
import { useFloatingFX } from "@/hooks/useFloatingFX";
import { initSfx, playSfx, startBgm } from "@/services/sfx";
import { AudioControls } from "@/components/AudioControls";
import { StickerTray } from "@/components/StickerTray";
import { StickerShopScreen } from "@/components/StickerShopScreen";
import {
    createRunState,
    STARTER_ITEM_DEFS,
    createItemInstance,
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
    resolveStickers,
    RETIREMENT_GOAL,
    profiteerTarget,
    MAX_COINS,
    detectActiveRecipes,
    findNewRecipes,
    RECIPE_DEFS,
    MAX_EVO_LEVEL,
    ROTTEN_LEVEL,
    PRICE_DIAL_MIN,
    PRICE_DIAL_MAX,
    defaultPrice,
} from "@/logic/snack";
import type { SnackItemDef } from "@/logic/snack";
import {
    simulateOneCustomer,
    createRoundSimContext,
    previewCustomerMoods,
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
    } | null;
};

const EMPTY_NARRATION: ServeNarration = {
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
};

// ── State hook ───────────────────────────────────────────

function useGameState() {
    const [run, setRun] = useState<RunState>(createRunState);
    const [catalogue, setCatalogue] = useState<CatalogueOffering>({
        items: [],
    });
    const [selectedCatalogueItem, setSelectedCatalogueItem] =
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
        setSelectedCatalogueItem(null);
    }, []);

    return {
        run,
        update,
        catalogue,
        refreshCatalogue,
        selectedCatalogueItem,
        setSelectedCatalogueItem,
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
        </div>
    );
}

// ── Customer queue preview (prep phase) ─────────────────

const MOOD_ICONS: Record<
    string,
    { icon: string; label: string; color: string }
> = {
    sweet: { icon: "🍬", label: "sweet", color: "#ff80ab" },
    salty: { icon: "🧂", label: "salty", color: "#ffe082" },
    energy: { icon: "E", label: "energy", color: "#69f0ae" },
    drink: { icon: "🥤", label: "drink", color: "#4fc3f7" },
    fancy: { icon: "💎", label: "fancy", color: "#ffd700" },
    cheap: { icon: "💰", label: "cheap", color: "#a5d6a7" },
    none: { icon: "❓", label: "any", color: "#888" },
};

function CustomerQueuePreview({
    round,
    roundEvent,
    magnetCount,
}: {
    round: number;
    roundEvent: import("@/logic/snack").RoundEventDef | null | undefined;
    magnetCount: number;
}) {
    const [moods, setMoods] = useState<string[]>([]);

    // Use primitive deps so object reference changes (structuredClone) don't reshuffle
    const eventName = roundEvent?.name;
    const eventCustomerDelta = roundEvent?.customerDelta;
    const eventBoostedMood = roundEvent?.boostedMood;
    useEffect(() => {
        const baseCount =
            3 + Math.floor(Math.random() * 3) + Math.floor(round / 3);
        const count = Math.max(
            1,
            baseCount + (eventCustomerDelta ?? 0) + magnetCount,
        );
        setMoods(previewCustomerMoods(count, roundEvent));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round, eventName, eventCustomerDelta, eventBoostedMood, magnetCount]);

    if (moods.length === 0) return null;

    return (
        <div className="vm-customer-queue">
            <span className="vm-customer-queue__label">
                Incoming — {moods.length} customer
                {moods.length !== 1 ? "s" : ""}
            </span>
            <div className="vm-customer-queue__list">
                {moods.map((mood, i) => {
                    const m = MOOD_ICONS[mood] ?? MOOD_ICONS["none"];
                    return (
                        <div
                            key={i}
                            className="vm-customer-card"
                            title={m.label}
                        >
                            <div
                                className="vm-customer-card__bubble"
                                style={{ borderColor: m.color }}
                            >
                                <span className="vm-customer-card__icon">
                                    {m.icon}
                                </span>
                            </div>
                            <div className="vm-customer-card__silhouette" />
                        </div>
                    );
                })}
            </div>
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

// ── Catalogue panel ──────────────────────────────────────

function CataloguePanel({
    catalogue,
    coins,
    selectedItem,
    onSelectItem,
}: {
    catalogue: CatalogueOffering;
    coins: number;
    selectedItem: SnackItemInstance | null;
    onSelectItem: (item: SnackItemInstance | null) => void;
}) {
    return (
        <div className="vm-catalogue">
            <div className="vm-catalogue__items">
                {catalogue.items.map((item) => {
                    const canAfford = coins >= item.cost;
                    return (
                        <button
                            type="button"
                            key={item.instanceId}
                            className={`vm-catalogue__item ${selectedItem?.instanceId === item.instanceId ? "vm-catalogue__item--selected" : ""} ${!canAfford ? "vm-catalogue__item--unaffordable" : ""}`}
                            onClick={() => {
                                playSfx("slot-select");
                                onSelectItem(
                                    selectedItem?.instanceId === item.instanceId
                                        ? null
                                        : item,
                                );
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
                                Cost: {item.cost}¢
                            </span>
                            <span className="vm-catalogue__sell">
                                Sell: {item.price}¢
                            </span>
                        </button>
                    );
                })}
            </div>
            {selectedItem && (
                <p className="vm-catalogue__hint">
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
        catalogue,
        refreshCatalogue,
        selectedCatalogueItem,
        setSelectedCatalogueItem,
    } = useGameState();

    // ── Serve narration (single source of truth) ──────────
    const [serve, setServe] = useState<ServeNarration>(EMPTY_NARRATION);
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
        useState<SnackItemDef | null>(null);
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
        setServe(EMPTY_NARRATION);

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

            // Retirement mode: check win
            if (
                draft.gameMode === "retirement" &&
                draft.coins >= RETIREMENT_GOAL
            ) {
                draft.phase = "win";
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
            ensureAudio();
            playSfx("game-start");
            initSfx().then(() => startBgm());
            const fresh = createRunState(mode);
            fresh.phase = "prep";
            fresh.roundEvent = rollRoundEvent(fresh.round);
            update(() => fresh);
            refreshCatalogue(fresh);
        },
        [update, refreshCatalogue],
    );

    const handleNewGame = useCallback(() => {
        playSfx("game-start");
        const fresh = createRunState();
        fresh.phase = "menu";
        update(() => fresh);
        setServe(EMPTY_NARRATION);
        setInteractiveServe(EMPTY_INTERACTIVE);
    }, [update]);

    const handleStartRound = useCallback(() => {
        const event = run.roundEvent;

        // Pre-compute combos from the CURRENT grid (before items leave)
        const combos = detectCombos(run.machine);

        // ── Lazy simulation: one customer at a time ──────────
        const snapshot = structuredClone(run.machine.slots);
        const baseCustomers =
            3 + Math.floor(Math.random() * 3) + Math.floor(run.round / 3);
        const customerCount = Math.max(
            1,
            baseCustomers + (event?.customerDelta ?? 0),
        );

        const simCtx = createRoundSimContext(event ?? null, run.round);
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

        const rent =
            run.gameMode === "profiteer"
                ? 0
                : rentForRound(run.round, run.rent);

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
        let stickerFlatBonus = 0;
        let stickerMult = 1;
        let stickerRentReduction = 0;
        let stickerHpHeal = 0;

        if (run.stickers.length > 0) {
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
                            [
                                "sweet",
                                "salty",
                                "sour",
                                "spicy",
                                "refreshing",
                            ].includes(tag)
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
                combosTriggered: combos.length,
                run,
            };

            for (const evt of events) {
                if (evt.bought && evt.slotIndex != null) {
                    const slot = run.machine.slots[evt.slotIndex];
                    const r = resolveStickers(run.stickers, "on-sale", {
                        ...stickerCtx,
                        soldSlotRow: slot?.position.row,
                        soldSlotCol: slot?.position.col,
                        soldItemType: evt.bought.tags.find((t) =>
                            ["drink", "snack", "candy"].includes(t),
                        ) as ItemTypeTag | undefined,
                        soldItemVibe: evt.bought.tags.find((t) =>
                            [
                                "sweet",
                                "salty",
                                "sour",
                                "spicy",
                                "refreshing",
                            ].includes(t),
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

            const scoring = resolveStickers(
                run.stickers,
                "scoring",
                stickerCtx,
            );
            stickerFlatBonus += scoring.addCoins;
            stickerMult *= scoring.mult;

            const roundEndR = resolveStickers(
                run.stickers,
                "round-end",
                stickerCtx,
            );
            stickerFlatBonus += roundEndR.addCoins;
            stickerMult *= roundEndR.mult;

            const roundStartR = resolveStickers(
                run.stickers,
                "round-start",
                stickerCtx,
            );
            stickerFlatBonus += roundStartR.addCoins;

            const passive = resolveStickers(
                run.stickers,
                "passive",
                stickerCtx,
            );
            stickerFlatBonus += passive.addCoins;
            stickerRentReduction = passive.rentReduction;
            stickerHpHeal = passive.hpHeal + roundEndR.hpHeal + scoring.hpHeal;

            const baseRevForSticker = totalSales + comboBonus + recipeBonus;
            const multBonus =
                stickerMult > 1
                    ? Math.round(baseRevForSticker * (stickerMult - 1))
                    : 0;

            if (
                multBonus > 0 ||
                stickerFlatBonus > 0 ||
                stickerRentReduction > 0
            ) {
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
                    const actualReduction = Math.min(
                        rent,
                        stickerRentReduction,
                    );
                    lines.push({
                        text: `−${actualReduction}¢ Rent Reduction!`,
                        charDelay: 20,
                        lingerMs: 500,
                        className: "vm-narration__combo",
                    });
                }
                lines.push({ text: "", charDelay: 0, lingerMs: 300 });
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

    // ── Mid-round restock: place item at 1.5x cost ────────
    const handleRestockPlace = useCallback(
        (slotIdx: number, item: SnackItemInstance) => {
            const cost = Math.ceil(item.cost * 1.5);
            if (run.coins < cost) return;
            playSfx("slot-place");
            update((draft) => {
                draft.coins -= cost;
                draft.machine.slots[slotIdx].item = { ...item };
            });
        },
        [run.coins, update],
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
        const totalEarnings = Math.min(totalSales + comboBonus, MAX_COINS);
        const effectiveRent = rent;

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
            stickerHpHeal: 0,
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
        let hasEvent = false;
        update((draft) => {
            advanceToNextRound(draft);
            hasEvent = draft.roundEvent != null;
        });
        if (hasEvent) playSfx("event-banner");
        // Evolution/rotten effects now shown in summary UI, not machine slots
        setSelectedCatalogueItem(null);
        setStickerShopOptions([]);
        setTimeout(() => {
            update((draft) => {
                refreshCatalogue(draft);
            });
        }, 0);
    }, [update, refreshCatalogue, setSelectedCatalogueItem]);

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

    // ── Sticker shop state (end-of-round reward) ─────────
    const [stickerShopOptions, setStickerShopOptions] = useState<
        import("@/logic/snack").StickerInstance[]
    >([]);
    const [stickerShopRerolls, setStickerShopRerolls] = useState(0);

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
                if (slotIndex < draft.stickers.length) {
                    draft.stickers[slotIndex] = sticker;
                } else {
                    draft.stickers.push(sticker);
                }
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

            // During restock: place selected item into empty slot
            if (restockPending) {
                if (restockSelectedDef && !slot.item) {
                    const fresh = createItemInstance(
                        restockSelectedDef,
                        "common",
                    );
                    const cost = Math.ceil(fresh.cost * 1.5);
                    if (run.coins < cost) return;
                    playSfx("slot-place");
                    handleRestockPlace(
                        run.machine.slots.findIndex(
                            (s) =>
                                s.position.row === slot.position.row &&
                                s.position.col === slot.position.col,
                        ),
                        fresh,
                    );
                    setRestockSelectedDef(null);
                }
                return;
            }

            // Place catalogue item into empty slot
            if (selectedCatalogueItem && !slot.item) {
                if (run.coins < selectedCatalogueItem.cost) return;
                playSfx("slot-place");
                update((draft) => {
                    const s = getSlot(
                        draft.machine,
                        slot.position.row,
                        slot.position.col,
                    );
                    if (!s) return;
                    s.item = selectedCatalogueItem;
                    draft.coins -= selectedCatalogueItem.cost;
                });
                setSelectedCatalogueItem(null);
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
                setSelectedCatalogueItem(null);
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
            selectedCatalogueItem,
            pickingFeatured,
            update,
            setSelectedCatalogueItem,
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
                const base = defaultPrice(s.item);
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

    const currentRent = rentForRound(run.round, run.rent);

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
        if (!audioInited.current) {
            audioInited.current = true;
            initSfx();
        }
    }, []);

    const handleHover = useCallback(
        (e: React.PointerEvent) => {
            // Do NOT call ensureAudio here — pointerover/pointermove are not
            // trusted gestures for AudioContext; only pointerdown/click qualify.
            const target = e.target as HTMLElement;
            if (
                target.closest("button") ||
                target.closest(".vm-catalogue__item")
            ) {
                playSfx("button-hover", { volume: 0.3 });
            }
        },
        [ensureAudio],
    );

    // ── Render by phase ──────────────────────────────────

    if (run.phase === "menu") {
        return (
            <div className="GameContainer" onPointerDown={ensureAudio}>
                <AudioControls />
                <div className="GameSurface" onPointerOver={handleHover}>
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
        <div className="GameContainer" onPointerDown={ensureAudio}>
            <AudioControls onQuit={handleNewGame} />
            <div className="GameContainer__row">
                {/* Sticker tray — vertical left of machine */}
                <StickerTray
                    stickers={run.stickers}
                    maxSlots={run.maxStickerSlots}
                    onSell={
                        run.phase === "prep" ? handleSellSticker : undefined
                    }
                />
                <div className="GameSurface" onPointerOver={handleHover}>
                    {/* Backdrop to dismiss popout on outside click */}
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
                        run.roundEvent && (
                            <div className="vm-event-banner-wrap">
                                <div className="vm-event-banner">
                                    <span className="vm-event-banner__icon">
                                        {">>"}
                                    </span>
                                    <span className="vm-event-banner__name">
                                        {run.roundEvent.name}
                                    </span>
                                    <span className="vm-event-banner__desc">
                                        {run.roundEvent.description}
                                    </span>
                                </div>
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
                            {/* Start round button — always in stable position during prep */}
                            {run.phase === "prep" && (
                                <>
                                    {run.gameMode === "retirement" && (
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
                                    <CustomerQueuePreview
                                        round={run.round}
                                        roundEvent={run.roundEvent}
                                        magnetCount={0}
                                    />
                                    <div className="vm-prep-actions vm-prep-actions--start">
                                        <button
                                            type="button"
                                            className="vm-start-round"
                                            onClick={handleStartRound}
                                        >
                                            Start Round {run.round}
                                        </button>
                                        <button
                                            type="button"
                                            className={`vm-upgrades-btn ${upgradeOpen ? "vm-upgrades-btn--active" : ""}`}
                                            onClick={() =>
                                                setUpgradeOpen((o) => !o)
                                            }
                                        >
                                            Upgrades
                                        </button>
                                        <button
                                            type="button"
                                            className={`vm-upgrades-btn ${recipeBookOpen ? "vm-upgrades-btn--active" : ""}`}
                                            onClick={() =>
                                                setRecipeBookOpen((o) => !o)
                                            }
                                        >
                                            Combos{" "}
                                            {run.discoveredRecipes.length > 0
                                                ? `(${run.discoveredRecipes.length})`
                                                : ""}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Catalogue slides in/out based on phase */}
                            <div
                                className={`vm-catalogue-wrapper ${run.phase === "prep" ? "vm-catalogue-wrapper--visible" : "vm-catalogue-wrapper--hidden"}`}
                            >
                                <CataloguePanel
                                    catalogue={catalogue}
                                    coins={run.coins}
                                    selectedItem={selectedCatalogueItem}
                                    onSelectItem={setSelectedCatalogueItem}
                                />
                            </div>

                            {/* Serve phase — narration typewriter */}
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

                            {/* Mid-round restock UI */}
                            {restockPending && (
                                <div className="vm-restock">
                                    <h3 className="vm-restock__title">
                                        {">>"} EMERGENCY RESTOCK
                                    </h3>
                                    <p className="vm-restock__subtitle">
                                        {restockSelectedDef
                                            ? `Now click an empty slot to place ${restockSelectedDef.name}.`
                                            : "Pick an item below, then click an empty slot on the machine."}
                                    </p>
                                    <p className="vm-restock__coins">
                                        Coins: {run.coins}¢
                                    </p>
                                    <div className="vm-restock__items">
                                        {STARTER_ITEM_DEFS.map((def) => {
                                            const item = createItemInstance(
                                                def,
                                                "common",
                                            );
                                            const restockCost = Math.ceil(item.cost * 1.5);
                                            const canAfford =
                                                run.coins >= restockCost;
                                            const isSelected =
                                                restockSelectedDef?.defId ===
                                                def.defId;
                                            return (
                                                <button
                                                    key={def.defId}
                                                    type="button"
                                                    className={`vm-restock__item ${!canAfford ? "vm-restock__item--disabled" : ""} ${isSelected ? "vm-restock__item--selected" : ""}`}
                                                    disabled={!canAfford}
                                                    onClick={() => {
                                                        setRestockSelectedDef(
                                                            isSelected
                                                                ? null
                                                                : def,
                                                        );
                                                    }}
                                                >
                                                    <span className="vm-restock__item-name">
                                                        {def.name}
                                                    </span>
                                                    <span className="vm-restock__item-cost">
                                                        {restockCost}¢
                                                    </span>
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
                    {/* /vm-content-row */}

                    {/* Upgrade popover overlay */}
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
                                {UPGRADE_DEFS.map((def) => {
                                    const count = run.upgradeCounts[def.id];
                                    const isFeatured =
                                        def.id === "feature-slot";
                                    const owned = isFeatured && count >= 1;
                                    const maxed =
                                        !isFeatured &&
                                        count >= def.maxPurchases;
                                    const cost =
                                        maxed || owned ? 0 : def.cost(count);
                                    const canAfford =
                                        owned || run.coins >= cost;
                                    return (
                                        <button
                                            type="button"
                                            key={def.id}
                                            className={`vm-upgrades__btn ${maxed ? "vm-upgrades__btn--maxed" : ""}${owned ? " vm-upgrades__btn--owned" : ""}`}
                                            disabled={maxed || !canAfford}
                                            onClick={() =>
                                                handleUpgrade(def.id)
                                            }
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

                    {/* Recipe book popover */}
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
                                        run.discoveredRecipes.includes(
                                            recipe.id,
                                        );
                                    const active = activeRecipesForBook.some(
                                        (r) => r.id === recipe.id,
                                    );
                                    return (
                                        <div
                                            key={recipe.id}
                                            className={`vm-recipe-book__entry ${discovered ? "vm-recipe-book__entry--found" : "vm-recipe-book__entry--hidden"} ${active ? "vm-recipe-book__entry--active" : ""}`}
                                        >
                                            <span className="vm-recipe-book__name">
                                                {discovered
                                                    ? recipe.name
                                                    : "???"}
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

                    {/* Round summary overlay */}
                    {run.phase === "summary" && run.lastSummary && (
                        <RoundSummary
                            summary={run.lastSummary}
                            round={run.round}
                            gameMode={run.gameMode}
                            onContinue={handleSummaryContinue}
                        />
                    )}

                    {/* Game over */}
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

                    {/* Win screen */}
                    {run.phase === "win" && (
                        <div className="vm-game-over vm-game-over--win">
                            <h3>🎉 You Retired Rich!</h3>
                            <p>
                                {run.coins}¢ in the bank after {run.round}{" "}
                                rounds.
                            </p>
                            <p className="vm-game-over__stats">
                                {run.stickers.length} stickers collected
                            </p>
                            <button type="button" onClick={handleNewGame}>
                                Back to Menu
                            </button>
                        </div>
                    )}

                    {/* Sticker shop (end of round reward) */}
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
            {/* /GameContainer__row */}
        </div>
    );
}
