import { useState, useCallback, useEffect, useRef } from "react";
import { VendingMachine } from "./components/vendingMachine";
import { useFloatingFX } from "@/hooks/useFloatingFX";
import { initSfx, playSfx, startBgm } from "@/services/sfx";
import { AudioControls } from "@/components/AudioControls";
import { StickerTray } from "@/components/StickerTray";
import { StickerPackPopover } from "@/components/StickerPackPopover";
import { DetailPopover } from "@/components/DetailPopover";
import {
    createRunState,
    generateCatalogueOffering,
    getSlot,
    rentForRound,
    advanceToNextRound,
    UPGRADE_DEFS,
    purchaseUpgrade,
    rerollCost,
    rollStickerPack,
    BLIND_BOX_COST,
    addSticker,
    removeSticker,
    sellSticker,
    canAddSticker,
    ageStickers,
    resolveStickers,
    RETIREMENT_GOAL,
    profiteerTarget,
    MAX_COINS,
} from "@/logic/snack";
import {
    simulateCustomers,
    eventsToNarration,
} from "@/logic/snack/serveNarration";
import type { SlotRemoval, HpDamage, CoinGain, SlotRestock } from "@/logic/snack/serveNarration";
import { rollRoundEvent } from "@/logic/snack/roundEvents";
import { detectCombos } from "@/logic/snack/comboSystem";
import { useTypewriter } from "@/hooks/useTypewriter";
import type { TypewriterLine } from "@/hooks/useTypewriter";
import type {
    MachineSlot,
    SlotPosition,
    RunState,
    RoundSummary as RoundSummaryType,
    SnackItemInstance,
    CatalogueOffering,
    UpgradeId,
    ItemTypeTag,
    ItemVibeTag,
    GameMode,
} from "@/logic/snack";
import "./App.css";

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
};

const EMPTY_NARRATION: ServeNarration = {
    runId: 0,
    lines: [],
    removals: [],
    hpDamages: [],
    coinGains: [],
    restocks: [],
    summary: { totalSales: 0, totalProfit: 0, itemsSold: 0, rentPaid: 0, netProfit: 0, damageTaken: 0, kicks: 0 },
    stickerHpHeal: 0,
    appliedRemovals: new Set(),
    appliedHpDamages: new Set(),
    appliedCoinGains: new Set(),
    appliedRestocks: new Set(),
};

// ── State hook ───────────────────────────────────────────

function useGameState() {
    const [run, setRun] = useState<RunState>(createRunState);
    const [catalogue, setCatalogue] = useState<CatalogueOffering>({ items: [] });
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
                        style={{ animationDelay: `${(Math.sin(i * 2.3) * 1000 + 500) % 1800}ms` }}
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
                    <span className="vm-menu__mode-name">🏦 Retirement Fund</span>
                    <span className="vm-menu__mode-desc">Accumulate {RETIREMENT_GOAL}¢ to retire rich</span>
                </button>
                <button
                    type="button"
                    className="vm-menu__mode-btn vm-menu__mode-btn--profiteer"
                    onClick={() => onStart("profiteer")}
                >
                    <span className="vm-menu__mode-name">📈 Profiteer</span>
                    <span className="vm-menu__mode-desc">Hit escalating profit targets each round</span>
                </button>
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
    return (
        <div className="vm-summary">
            <div className="vm-summary__card">
                <h3 className="vm-summary__title">Round {round} Complete</h3>
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
                            <span>Damage ({summary.kicks} kick{summary.kicks !== 1 ? "s" : ""})</span>
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
                            <span className={metTarget ? "vm-summary__positive" : "vm-summary__negative"}>
                                {metTarget ? "✓" : "✗"} {target}¢
                            </span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="vm-summary__continue"
                    onClick={onContinue}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

// ── Catalogue panel ──────────────────────────────────────

function CataloguePanel({
    catalogue,
    coins,
    rerollPrice,
    selectedItem,
    onSelectItem,
    onReroll,
    blindBoxCost,
    canBuyBlindBox,
    onBlindBox,
}: {
    catalogue: CatalogueOffering;
    coins: number;
    rerollPrice: number;
    selectedItem: SnackItemInstance | null;
    onSelectItem: (item: SnackItemInstance | null) => void;
    onReroll: () => void;
    blindBoxCost: number;
    canBuyBlindBox: boolean;
    onBlindBox: () => void;
}) {
    const canReroll = coins >= rerollPrice;
    const canAffordBox = coins >= blindBoxCost;
    const [detailItem, setDetailItem] = useState<SnackItemInstance | null>(null);
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
                            <span className="vm-catalogue__name">{item.name}</span>
                            <span className="vm-catalogue__rarity">
                                {item.rarity}
                            </span>
                            <span className="vm-catalogue__cost">
                                Cost: {item.cost}¢
                            </span>
                            {item.effectName && (
                                <span className="vm-catalogue__effect">
                                    ✦ {item.effectName}
                                </span>
                            )}
                            {item.effectDesc && (
                                <span
                                    className="vm-catalogue__details-btn"
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDetailItem(item);
                                    }}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setDetailItem(item); } }}
                                >
                                    Details
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            {selectedItem && (
                <p className="vm-catalogue__hint">
                    Click an empty slot to place {selectedItem.name}
                </p>
            )}
            {detailItem && detailItem.effectDesc && (
                <DetailPopover
                    name={detailItem.name}
                    rarity={detailItem.rarity}
                    description={detailItem.effectDesc}
                    extra={detailItem.effectName ? `✦ ${detailItem.effectName}` : undefined}
                    onClose={() => setDetailItem(null)}
                />
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
    const fx = useFloatingFX();
    const [shaking, setShaking] = useState(false);
    const shakeTimer = useRef<ReturnType<typeof setTimeout>>();

    const { visibleLines, done: narrationDone, skip: skipNarration } = useTypewriter(
        serve.lines,
        serve.runId,
    );

    // Remove items from slots / apply HP damage / spawn floaters as narration reaches each line
    useEffect(() => {
        if (serve.runId === 0) return;
        const currentLineCount = visibleLines.length;

        for (const r of serve.removals) {
            if (r.lineIndex < currentLineCount && !serve.appliedRemovals.has(r.lineIndex)) {
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
            if (h.lineIndex < currentLineCount && !serve.appliedHpDamages.has(h.lineIndex)) {
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
            if (c.lineIndex < currentLineCount && !serve.appliedCoinGains.has(c.lineIndex)) {
                serve.appliedCoinGains.add(c.lineIndex);
                update((draft) => {
                    draft.coins = Math.min(draft.coins + c.amount, MAX_COINS);
                });
                // Only spawn floater for combo/non-sale gains (sales spawn at removal)
                if (c.slotIndex == null) {
                    fx.spawnCoin(-1, c.amount);
                    playSfx("combo");
                }
            }
        }

        for (const rs of serve.restocks) {
            if (rs.lineIndex < currentLineCount && !serve.appliedRestocks.has(rs.lineIndex)) {
                serve.appliedRestocks.add(rs.lineIndex);
                update((draft) => {
                    draft.machine.slots[rs.slotIndex].item = rs.item;
                });
                fx.spawnEffect(rs.slotIndex, "🔥 Restock!");
                playSfx("restock");
            }
        }
    }, [visibleLines, serve, update, fx.spawnCoin, fx.spawnDamage, fx.spawnEffect]);

    // When narration finishes, transition to summary
    useEffect(() => {
        if (!narrationDone || serve.runId === 0) return;

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
                draft.machineHp = Math.min(draft.maxMachineHp, draft.machineHp + serve.stickerHpHeal);
            }

            // Loss conditions
            if (draft.coins < 0 || draft.machineHp <= 0) {
                draft.phase = "game-over";
                playSfx("game-over");
                return;
            }

            // Profiteer mode: must meet profit target
            if (draft.gameMode === "profiteer" && summary.netProfit < profiteerTarget(draft.round)) {
                draft.phase = "game-over";
                playSfx("game-over");
                return;
            }

            // Retirement mode: check win
            if (draft.gameMode === "retirement" && draft.coins >= RETIREMENT_GOAL) {
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

    const handleStartGame = useCallback((mode: GameMode) => {
        ensureAudio();
        playSfx("game-start");
        initSfx().then(() => startBgm());
        const fresh = createRunState(mode);
        fresh.phase = "prep";
        fresh.roundEvent = rollRoundEvent(fresh.round);
        update(() => fresh);
        refreshCatalogue(fresh);
    }, [update, refreshCatalogue]);

    const handleNewGame = useCallback(() => {
        playSfx("game-start");
        const fresh = createRunState();
        fresh.phase = "menu";
        update(() => fresh);
        setServe(EMPTY_NARRATION);
    }, [update]);

    const handleStartRound = useCallback(() => {
        // Use the pre-rolled event from state (visible during prep)
        const event = run.roundEvent;

        // Simulate on a snapshot — does NOT mutate run state
        const snapshot = structuredClone(run.machine.slots);
        // Customer count scales with round: base 3-5, +1 per 3 rounds
        const baseCustomers = 3 + Math.floor(Math.random() * 3) + Math.floor(run.round / 3);
        // Magnet effect: +1 customer per magnet item
        const magnetCount = snapshot.filter(
            (s) => s.unlocked && s.item?.effectId === "magnet",
        ).length;
        const customerCount = Math.max(1, baseCustomers + (event?.customerDelta ?? 0) + magnetCount);
        const events = simulateCustomers(snapshot, customerCount, event, run.round);

        let totalSales = 0;
        let itemsSold = 0;
        let damageTaken = 0;
        let kicks = 0;
        for (const evt of events) {
            if (evt.bought) {
                totalSales += evt.bought.price;
                itemsSold++;
            }
            if (evt.kicked) {
                damageTaken += evt.damage;
                kicks++;
            }
        }
        const rent = run.gameMode === "profiteer" ? 0 : rentForRound(run.round, run.rent);

        const { lines, removals, hpDamages, coinGains, restocks } = eventsToNarration(events);

        // Detect combos from the pre-serve machine layout
        const combos = detectCombos(run.machine);
        let comboBonus = 0;
        if (combos.length > 0) {
            lines.push({ text: "── Combo Bonuses ──", charDelay: 15, lingerMs: 600, className: "vm-narration__combo-header" });
            for (const combo of combos) {
                lines.push({
                    text: `${combo.name}! +${combo.bonus}¢`,
                    charDelay: 20,
                    lingerMs: 500,
                    className: "vm-narration__combo",
                });
                coinGains.push({ lineIndex: lines.length - 1, amount: combo.bonus });
                comboBonus += combo.bonus;
            }
            lines.push({ text: "", charDelay: 0, lingerMs: 300 });
        }

        // ── Sticker effects ────────────────────────────────
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
                        if (["drink", "snack", "candy", "premium"].includes(tag)) {
                            typeSales[tag as ItemTypeTag] = (typeSales[tag as ItemTypeTag] ?? 0) + 1;
                        }
                        if (["sweet", "salty", "sour", "spicy", "refreshing"].includes(tag)) {
                            vibeSales[tag as ItemVibeTag] = (vibeSales[tag as ItemVibeTag] ?? 0) + 1;
                        }
                    }
                }
            }
            const totalStocked = run.machine.slots.filter(s => s.unlocked && s.item).length;
            const emptyUnlocked = run.machine.slots.filter(s => s.unlocked && !s.item).length;

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

            // Per-sale triggers — mult applies only to that sale's price
            for (const evt of events) {
                if (evt.bought && evt.slotIndex != null) {
                    const slot = run.machine.slots[evt.slotIndex];
                    const r = resolveStickers(run.stickers, "on-sale", {
                        ...stickerCtx,
                        soldSlotRow: slot.position.row,
                        soldSlotCol: slot.position.col,
                        soldItemType: evt.bought.tags.find(t =>
                            ["drink", "snack", "candy", "premium"].includes(t),
                        ) as ItemTypeTag | undefined,
                        soldItemVibe: evt.bought.tags.find(t =>
                            ["sweet", "salty", "sour", "spicy", "refreshing"].includes(t),
                        ) as ItemVibeTag | undefined,
                    });
                    stickerFlatBonus += r.addCoins;
                    // Per-sale mult applies only to THIS sale's price, converted to flat bonus
                    if (r.mult > 1) {
                        stickerFlatBonus += Math.round(evt.bought.price * (r.mult - 1));
                    }
                }
            }

            // Scoring — global mult on base revenue
            const scoring = resolveStickers(run.stickers, "scoring", stickerCtx);
            stickerFlatBonus += scoring.addCoins;
            stickerMult *= scoring.mult;

            // Round-end — global mult on base revenue
            const roundEndR = resolveStickers(run.stickers, "round-end", stickerCtx);
            stickerFlatBonus += roundEndR.addCoins;
            stickerMult *= roundEndR.mult;

            // Round-start (flat bonuses — customers already simulated)
            const roundStartR = resolveStickers(run.stickers, "round-start", stickerCtx);
            stickerFlatBonus += roundStartR.addCoins;

            // Passive
            const passive = resolveStickers(run.stickers, "passive", stickerCtx);
            stickerFlatBonus += passive.addCoins;
            stickerRentReduction = passive.rentReduction;
            stickerHpHeal = passive.hpHeal + roundEndR.hpHeal + scoring.hpHeal;

            // Sticker narration
            const baseRevenue = totalSales + comboBonus;
            const multBonus = stickerMult > 1 ? Math.round(baseRevenue * (stickerMult - 1)) : 0;

            if (multBonus > 0 || stickerFlatBonus > 0 || stickerRentReduction > 0) {
                lines.push({ text: "── Sticker Effects ──", charDelay: 15, lingerMs: 600, className: "vm-narration__combo-header" });
                if (stickerMult > 1) {
                    const label = stickerMult % 1 === 0 ? `×${stickerMult}` : `×${stickerMult.toFixed(1)}`;
                    lines.push({
                        text: `${label} Sticker Multiplier! +${multBonus}¢`,
                        charDelay: 20, lingerMs: 500, className: "vm-narration__combo",
                    });
                    coinGains.push({ lineIndex: lines.length - 1, amount: multBonus });
                }
                if (stickerFlatBonus > 0) {
                    lines.push({
                        text: `+${stickerFlatBonus}¢ Sticker Bonus!`,
                        charDelay: 20, lingerMs: 500, className: "vm-narration__combo",
                    });
                    coinGains.push({ lineIndex: lines.length - 1, amount: stickerFlatBonus });
                }
                if (stickerRentReduction > 0) {
                    const actualReduction = Math.min(rent, stickerRentReduction);
                    lines.push({
                        text: `−${actualReduction}¢ Rent Reduction!`,
                        charDelay: 20, lingerMs: 500, className: "vm-narration__combo",
                    });
                }
                lines.push({ text: "", charDelay: 0, lingerMs: 300 });
            }
        }

        // Apply sticker mult to total revenue, then add flat bonus
        // Cap global mult at 10× and flat bonus at 9999 to prevent overflow
        const cappedMult = Math.min(stickerMult, 10);
        const cappedFlat = Math.min(stickerFlatBonus, 9999);
        const baseRevenue = totalSales + comboBonus;
        const multedRevenue = cappedMult > 1 ? Math.round(baseRevenue * cappedMult) : baseRevenue;
        const totalEarnings = Math.min(multedRevenue + cappedFlat, MAX_COINS);
        const effectiveRent = Math.max(0, rent - stickerRentReduction);

        const summary: RoundSummaryType = {
            totalSales,
            totalProfit: totalEarnings,
            itemsSold,
            rentPaid: effectiveRent,
            netProfit: totalEarnings - effectiveRent,
            damageTaken,
            kicks,
        };

        playSfx("round-start");

        update((draft) => {
            draft.phase = "serve";
        });

        setSelectedSlotPos(null);
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
        });
    }, [run, update, serve.runId]);

    const handleSummaryContinue = useCallback(() => {
        let hasEvent = false;
        update((draft) => {
            advanceToNextRound(draft);
            hasEvent = draft.roundEvent != null;
        });
        if (hasEvent) playSfx("event-banner");
        // Refresh catalogue for next round using latest state
        setSelectedCatalogueItem(null);
        // Need to read fresh state after update
        setTimeout(() => {
            update((draft) => {
                refreshCatalogue(draft);
            });
        }, 0);
    }, [update, refreshCatalogue, setSelectedCatalogueItem]);

    const handleUpgrade = useCallback(
        (id: UpgradeId) => {
            const cost = UPGRADE_DEFS.find((d) => d.id === id)?.cost(run.upgradeCounts[id]) ?? 0;
            const maxed = run.upgradeCounts[id] >= (UPGRADE_DEFS.find((d) => d.id === id)?.maxPurchases ?? 0);
            if (maxed || run.coins < cost) {
                playSfx("upgrade-fail");
                return;
            }
            playSfx("upgrade-buy");
            update((draft) => {
                purchaseUpgrade(draft, id);
            });
        },
        [update, run.upgradeCounts, run.coins],
    );

    // ── Slot interaction (prep phase only) ───────────────

    const [selectedSlotPos, setSelectedSlotPos] = useState<SlotPosition | null>(null);
    const [highlightNextLocked, setHighlightNextLocked] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [stickerPack, setStickerPack] = useState<import("@/logic/snack").StickerInstance[] | null>(null);

    const handleUpgradeHover = useCallback((id: UpgradeId | null) => {
        setHighlightNextLocked(id === "unlock-slot");
    }, []);

    const currentRerollCost = rerollCost(run.round, run.rerollCount);

    const handleReroll = useCallback(() => {
        if (run.coins < currentRerollCost) {
            playSfx("upgrade-fail");
            return;
        }
        playSfx("slot-select");
        update((draft) => {
            draft.coins -= rerollCost(draft.round, draft.rerollCount);
            draft.rerollCount += 1;
        });
        // Need fresh state for catalogue gen — use setTimeout to read after update
        setTimeout(() => {
            update((draft) => {
                refreshCatalogue(draft);
            });
        }, 0);
    }, [run.coins, currentRerollCost, update, refreshCatalogue]);

    const handleBlindBox = useCallback(() => {
        if (run.coins < BLIND_BOX_COST) {
            playSfx("upgrade-fail");
            return;
        }
        playSfx("upgrade-buy");
        const pack = rollStickerPack();
        update((draft) => {
            draft.coins -= BLIND_BOX_COST;
        });
        setStickerPack(pack);
    }, [run.coins, update]);

    const handleSellSticker = useCallback((instanceId: string) => {
        playSfx("slot-select");
        update((draft) => {
            sellSticker(draft, instanceId);
        });
    }, [update]);

    const handlePickSticker = useCallback((sticker: import("@/logic/snack").StickerInstance, slotIndex: number) => {
        playSfx("upgrade-buy");
        update((draft) => {
            if (slotIndex < draft.stickers.length) {
                // Replace existing sticker at this position
                draft.stickers[slotIndex] = sticker;
            } else {
                // Empty slot — append
                draft.stickers.push(sticker);
            }
        });
        setStickerPack(null);
    }, [update]);

    const handleSkipPack = useCallback(() => {
        setStickerPack(null);
    }, []);

    const handleSlotClick = useCallback(
        (slot: MachineSlot) => {
            if (run.phase !== "prep") return;
            if (!slot.unlocked) return;

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
                    prev && prev.row === slot.position.row && prev.col === slot.position.col
                        ? null
                        : slot.position,
                );
                setSelectedCatalogueItem(null);
                return;
            }

            // Click empty slot with nothing selected — deselect
            setSelectedSlotPos(null);
        },
        [run.phase, run.coins, selectedCatalogueItem, update, setSelectedCatalogueItem],
    );

    const handlePriceChange = useCallback(
        (row: number, col: number, delta: number) => {
            update((draft) => {
                const s = getSlot(draft.machine, row, col);
                if (!s?.item) return;
                s.item.price = Math.max(1, s.item.price + delta);
            });
        },
        [update],
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

    const handleFeature = useCallback(
        (row: number, col: number) => {
            update((draft) => {
                for (const s of draft.machine.slots) {
                    s.featured = s.position.row === row && s.position.col === col
                        ? !s.featured
                        : false;
                }
            });
        },
        [update],
    );

    const currentRent = rentForRound(run.round, run.rent);

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

    const handleHover = useCallback((e: React.PointerEvent) => {
        ensureAudio();
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest(".vm-catalogue__item")) {
            playSfx("button-hover", { volume: 0.3 });
        }
    }, [ensureAudio]);

    // ── Render by phase ──────────────────────────────────

    if (run.phase === "menu") {
        return (
            <div className="GameContainer">
                <AudioControls />
                <div className="GameSurface" onPointerOver={handleHover}>
                    <MenuScreen onStart={handleStartGame} />
                </div>
            </div>
        );
    }

    return (
        <div className="GameContainer">
            <AudioControls onQuit={handleNewGame} />
            <div className="GameContainer__row">
            {/* Sticker tray — vertical left of machine */}
            <StickerTray
                stickers={run.stickers}
                maxSlots={run.maxStickerSlots}
                onSell={run.phase === "prep" ? handleSellSticker : undefined}
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
                                style={{ animationDelay: `${(Math.sin(i * 2.3) * 1000 + 500) % 1800}ms` }}
                            >
                                {ch}
                            </span>
                        ))}
                    </span>
                </div>
                {(run.phase === "prep" || run.phase === "serve") && run.roundEvent && (
                    <div className="vm-event-banner-wrap">
                        <div className="vm-event-banner">
                            <span className="vm-event-banner__icon">📢</span>
                            <span className="vm-event-banner__name">{run.roundEvent.name}</span>
                            <span className="vm-event-banner__desc">{run.roundEvent.description}</span>
                        </div>
                    </div>
                )}
                <VendingMachine
                    slots={run.machine.slots}
                    coins={run.coins}
                    round={run.round}
                    rent={currentRent}
                    gameMode={run.gameMode}
                    profitTarget={run.gameMode === "profiteer" ? profiteerTarget(run.round) : null}
                    machineHp={run.machineHp}
                    maxMachineHp={run.maxMachineHp}
                    selectedSlotPos={run.phase === "prep" ? selectedSlotPos : null}
                    highlightNextLocked={highlightNextLocked}
                    floaters={fx.floaters}
                    shaking={shaking}
                    headerExtra={null}
                    onSlotClick={handleSlotClick}
                    onPriceChange={handlePriceChange}
                    onTrash={handleTrash}
                    onFeature={run.phase === "prep" ? handleFeature : undefined}
                    onRepair={run.phase === "prep" ? handleRepair : undefined}
                />

                <div className="vm-below-machine">
                    {/* Start round button — always in stable position during prep */}
                    {run.phase === "prep" && (
                        <>
                            {run.gameMode === "retirement" && (
                                <p className="vm-mode-info vm-mode-info--retirement">
                                    🏦 {run.coins}/{RETIREMENT_GOAL}¢ — {Math.min(100, Math.round(run.coins / RETIREMENT_GOAL * 100))}% to retirement
                                </p>
                            )}
                            <div className="vm-prep-actions vm-prep-actions--start">
                                <button
                                    type="button"
                                    className="vm-start-round"
                                    onClick={handleStartRound}
                                >
                                    Start Round {run.round}
                                </button>
                            </div>
                            <div className="vm-prep-actions">
                                <button
                                    type="button"
                                    className={`vm-upgrade-toggle ${upgradeOpen ? "vm-upgrade-toggle--open" : ""}`}
                                    onClick={() => setUpgradeOpen((o) => !o)}
                                >
                                    Machine Upgrades
                                </button>
                                <button
                                    type="button"
                                    className={`vm-catalogue__blind-box ${run.coins < BLIND_BOX_COST ? "vm-catalogue__blind-box--disabled" : ""}`}
                                    disabled={run.coins < BLIND_BOX_COST}
                                    onClick={handleBlindBox}
                                >
                                    Sticker Pack {BLIND_BOX_COST}¢
                                </button>
                                <button
                                    type="button"
                                    className={`vm-catalogue__reroll ${run.coins < currentRerollCost ? "vm-catalogue__reroll--disabled" : ""}`}
                                    disabled={run.coins < currentRerollCost}
                                    onClick={handleReroll}
                                >
                                    Reroll {currentRerollCost}¢
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
                            rerollPrice={currentRerollCost}
                            selectedItem={selectedCatalogueItem}
                            onSelectItem={setSelectedCatalogueItem}
                            onReroll={handleReroll}
                            blindBoxCost={BLIND_BOX_COST}
                            canBuyBlindBox={canAddSticker(run.stickers)}
                            onBlindBox={handleBlindBox}
                        />
                    </div>

                    {/* Serve phase narration */}
                    {run.phase === "serve" && (
                        <>
                            {!narrationDone && (
                                <button
                                    type="button"
                                    className="vm-narration__skip"
                                    onClick={skipNarration}
                                >
                                    Skip ⏭
                                </button>
                            )}
                            <div className="vm-narration">
                                {visibleLines.map((line, i) => (
                                    <p
                                        key={`${i}-${line.text.length}`}
                                        className={`vm-narration__line ${line.className ?? ""}`}
                                    >
                                        {line.text}
                                        {i === visibleLines.length - 1 && (
                                            <span className="vm-narration__cursor">▌</span>
                                        )}
                                    </p>
                                ))}
                                <div ref={narrationEndRef} />
                            </div>
                        </>
                    )}
                </div>

                {/* Upgrade popover overlay */}
                {upgradeOpen && (
                    <div className="vm-upgrade-popover" onClick={() => setUpgradeOpen(false)}>
                        <div className="vm-upgrade-popover__card" onClick={(e) => e.stopPropagation()}>
                            <h4 className="vm-upgrades__title">Upgrades</h4>
                            {UPGRADE_DEFS.map((def) => {
                                const count = run.upgradeCounts[def.id];
                                const maxed = count >= def.maxPurchases;
                                const cost = maxed ? 0 : def.cost(count);
                                const canAfford = run.coins >= cost;
                                return (
                                    <button
                                        type="button"
                                        key={def.id}
                                        className={`vm-upgrades__btn ${maxed ? "vm-upgrades__btn--maxed" : ""}`}
                                        disabled={maxed || !canAfford}
                                        onClick={() => handleUpgrade(def.id)}
                                        onPointerEnter={() => handleUpgradeHover(def.id)}
                                        onPointerLeave={() => handleUpgradeHover(null)}
                                    >
                                        <span className="vm-upgrades__name">{def.name}</span>
                                        <span className="vm-upgrades__desc">{def.description}</span>
                                        <span className="vm-upgrades__cost">
                                            {maxed ? "MAXED" : `${cost}¢`}
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
                        {run.machineHp <= 0 && <p>Your machine was destroyed!</p>}
                        {run.coins < 0 && <p>Can’t pay rent!</p>}
                        {run.gameMode === "profiteer" && run.coins >= 0 && run.machineHp > 0 && (
                            <p>Missed the target! Needed +{profiteerTarget(run.round)}¢ net profit.</p>
                        )}
                        <p className="vm-game-over__stats">Round {run.round} · {run.coins}¢ earned</p>
                        <button type="button" onClick={handleNewGame}>
                            Back to Menu
                        </button>
                    </div>
                )}

                {/* Win screen */}
                {run.phase === "win" && (
                    <div className="vm-game-over vm-game-over--win">
                        <h3>🎉 You Retired Rich!</h3>
                        <p>{run.coins}¢ in the bank after {run.round} rounds.</p>
                        <p className="vm-game-over__stats">{run.stickers.length} stickers collected</p>
                        <button type="button" onClick={handleNewGame}>
                            Back to Menu
                        </button>
                    </div>
                )}

                {/* Sticker pack selection popover */}
                {stickerPack && (
                    <StickerPackPopover
                        options={stickerPack}
                        currentStickers={run.stickers}
                        maxSlots={run.maxStickerSlots}
                        onPick={handlePickSticker}
                        onSkip={handleSkipPack}
                    />
                )}
            </div>
            </div>{/* /GameContainer__row */}
        </div>
    );
}
