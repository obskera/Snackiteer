import type {
    MachineSlot,
    SlotPosition,
    SnackItemInstance,
} from "@/logic/snack";
import {
    AGE_DISPLAY,
    defaultPrice,
    PRICE_DIAL_MIN,
    PRICE_DIAL_MAX,
} from "@/logic/snack";
import type { Floater } from "@/hooks/useFloatingFX";
import type { ReactNode } from "react";
import { FloatingFX } from "./FloatingFX";
import "./VendingMachine.css";

// ── Slot ──────────────────────────────────────────────────

type SlotProps = {
    slot: MachineSlot;
    slotNumber: number;
    selected: boolean;
    unlockPreview?: boolean;
    serveMatch?: boolean;
    comboGlow?: boolean;
    onSlotClick: (slot: MachineSlot) => void;
    onTrash?: () => void;
    onPriceAdjust?: (delta: number) => void;
};

/** Placeholder color per item type tag until real sprites arrive. */
const ITEM_TYPE_COLORS: Record<string, string> = {
    drink: "#4fc3f7",
    snack: "#ffb74d",
    candy: "#f06292",
};

/** Overlay tint per quality tier. */
const QUALITY_OVERLAY: Record<string, string> = {
    common: "",
    good: "brightness(1.25) saturate(1.3)",
    fancy: "brightness(1.5) saturate(1.5) sepia(0.2)",
};

const itemColor = (item: SnackItemInstance): string =>
    ITEM_TYPE_COLORS[item.tags[0]] ?? "#888";

function SlotItem({ item }: { item: SnackItemInstance }) {
    const age = AGE_DISPLAY[item.evoLevel ?? 0] ?? AGE_DISPLAY[0];
    return (
        <div className={`vm-item vm-item--${item.quality}`}>
            <div
                className="vm-item__icon"
                style={{
                    background: itemColor(item),
                    filter: QUALITY_OVERLAY[item.quality],
                }}
                title={`${item.tags.join(", ")} • ${item.quality}`}
            />
            <span className="vm-item__age-badge" style={{ color: age.color }}>
                {age.letter}
            </span>
            <span className="vm-item__name">{item.baseName ?? item.name}</span>
            <span className="vm-item__price">{item.price}¢</span>
        </div>
    );
}

function Slot({
    slot,
    slotNumber,
    selected,
    unlockPreview,
    onSlotClick,
    onTrash,
    onPriceAdjust,
}: SlotProps) {
    if (!slot.unlocked) {
        return (
            <div
                className={`vm-slot vm-slot--locked${unlockPreview ? " vm-slot--unlock-preview" : ""}`}
            />
        );
    }

    const stateClass = slot.item ? "" : "vm-slot--empty";
    const selectedClass = selected ? "vm-slot--selected" : "";
    const featuredClass = slot.featured ? "vm-slot--featured" : "";

    return (
        <div
            className={`vm-slot ${stateClass} ${selectedClass} ${featuredClass}`}
            onClick={() => onSlotClick(slot)}
        >
            <span className="vm-slot__number">{slotNumber}</span>
            {slot.featured && <div className="vm-slot__featured-particles" />}
            {slot.item && <SlotItem item={slot.item} />}
            {selected && slot.item && onTrash && (
                <div
                    className="vm-slot__popout"
                    onClick={(e) => e.stopPropagation()}
                >
                    {(() => {
                        const age =
                            AGE_DISPLAY[slot.item!.evoLevel ?? 0] ??
                            AGE_DISPLAY[0];
                        return (
                            <div
                                className="vm-slot__age-info"
                                style={{ color: age.color }}
                            >
                                <span className="vm-slot__age-label">
                                    {age.label}
                                </span>
                                <span className="vm-slot__age-desc">
                                    {age.description}
                                </span>
                            </div>
                        );
                    })()}
                    {onPriceAdjust &&
                        slot.item &&
                        (() => {
                            const base = defaultPrice(slot.item!);
                            const adj = slot.item!.price - base;
                            const canDown =
                                adj > PRICE_DIAL_MIN && slot.item!.price > 1;
                            const canUp = adj < PRICE_DIAL_MAX;
                            return (
                                <div className="vm-slot__price-dial">
                                    <button
                                        type="button"
                                        className="vm-slot__btn vm-slot__btn--price"
                                        disabled={!canDown}
                                        onClick={() => onPriceAdjust(-1)}
                                    >
                                        -
                                    </button>
                                    <span
                                        className={`vm-slot__price-label${adj > 0 ? " vm-slot__price-label--up" : ""}${adj < 0 ? " vm-slot__price-label--down" : ""}`}
                                    >
                                        {slot.item!.price}c
                                        {adj !== 0 && (
                                            <span className="vm-slot__price-adj">
                                                ({adj > 0 ? "+" : ""}
                                                {adj})
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        className="vm-slot__btn vm-slot__btn--price"
                                        disabled={!canUp}
                                        onClick={() => onPriceAdjust(+1)}
                                    >
                                        +
                                    </button>
                                </div>
                            );
                        })()}
                    <div className="vm-slot__action-row">
                        <button
                            type="button"
                            className="vm-slot__btn vm-slot__btn--trash"
                            onClick={onTrash}
                        >
                            X
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Machine ──────────────────────────────────────────────

export type VendingMachineProps = {
    slots: MachineSlot[];
    coins: number;
    round: number;
    rent: number;
    machineHp: number;
    maxMachineHp: number;
    gameMode?: "retirement" | "profiteer";
    profitTarget?: number | null;
    selectedSlotPos: SlotPosition | null;
    highlightNextLocked?: boolean;
    floaters?: Floater[];
    shaking?: boolean;
    headerExtra?: ReactNode;
    /** Slot indices that match the current customer's mood (serve phase glow). */
    serveMatchSlots?: Set<number>;
    /** Slot indices that are part of an active combo (prep phase glow). */
    comboSlots?: Set<number>;
    /** Content rendered between the slot grid and the info bar. */
    actionSlot?: ReactNode;
    onSlotClick: (slot: MachineSlot) => void;
    onTrash?: (row: number, col: number) => void;
    onPriceAdjust?: (row: number, col: number, delta: number) => void;
    onRepair?: () => void;
};

export function VendingMachine({
    slots,
    coins,
    round,
    rent,
    machineHp,
    maxMachineHp,
    gameMode,
    profitTarget,
    selectedSlotPos,
    highlightNextLocked,
    floaters,
    shaking,
    headerExtra,
    serveMatchSlots,
    comboSlots,
    actionSlot,
    onSlotClick,
    onTrash,
    onPriceAdjust,
    onRepair,
}: VendingMachineProps) {
    const hpPct = Math.round((machineHp / maxMachineHp) * 100);
    const hpColor =
        hpPct > 50 ? "var(--neon)" : hpPct > 25 ? "#ffb74d" : "#ff4040";
    const repairCost = (maxMachineHp - machineHp) * 2;
    const needsRepair = machineHp < maxMachineHp;

    return (
        <div className={`vm-machine ${shaking ? "vm-machine--shake" : ""}`}>
            <div className="vm-header">
                {headerExtra}
                <span className="vm-coins">Coins: {coins}¢</span>
            </div>

            {/* HP bar + coins */}
            <div className="vm-hp-bar">
                <div className="vm-hp-bar__label">
                    HP {machineHp}/{maxMachineHp}
                </div>
                <div className="vm-hp-bar__track">
                    <div
                        className="vm-hp-bar__fill"
                        style={{ width: `${hpPct}%`, background: hpColor }}
                    />
                </div>
                <span className="vm-coins">🪙 {coins}¢</span>
                {needsRepair && onRepair && (
                    <button
                        type="button"
                        className="vm-hp-bar__repair"
                        onClick={onRepair}
                        disabled={coins < repairCost}
                        title={`Repair to full: ${repairCost}¢`}
                    >
                        [R] {repairCost}¢
                    </button>
                )}
            </div>

            <div className="vm-grid-wrapper">
                <div className="vm-grid">
                    {slots.map((slot, idx) => {
                        const { row, col } = slot.position;
                        const isSelected =
                            selectedSlotPos != null &&
                            selectedSlotPos.row === row &&
                            selectedSlotPos.col === col;
                        const flatIdx = row * 3 + col;
                        const isNextLocked =
                            highlightNextLocked &&
                            !slot.unlocked &&
                            idx === slots.findIndex((s) => !s.unlocked);
                        return (
                            <Slot
                                key={`${row}-${col}`}
                                slot={slot}
                                slotNumber={flatIdx + 1}
                                selected={isSelected}
                                unlockPreview={isNextLocked}
                                serveMatch={serveMatchSlots?.has(flatIdx)}
                                comboGlow={comboSlots?.has(flatIdx)}
                                onSlotClick={onSlotClick}
                                onTrash={
                                    isSelected && onTrash
                                        ? () => onTrash(row, col)
                                        : undefined
                                }
                                onPriceAdjust={
                                    isSelected && onPriceAdjust
                                        ? (delta: number) =>
                                              onPriceAdjust(row, col, delta)
                                        : undefined
                                }
                            />
                        );
                    })}
                </div>
                {floaters && <FloatingFX floaters={floaters} gridCols={3} />}
            </div>

            <div className="vm-info-bar">
                <span className="vm-info-bar__round">Round {round}</span>
                {profitTarget != null && (
                    <span className="vm-info-bar__target">
                        Profit Target: +{profitTarget}¢
                    </span>
                )}
                {gameMode !== "profiteer" && (
                    <span className="vm-info-bar__rent">Rent: {rent}¢</span>
                )}
            </div>

            {actionSlot}
        </div>
    );
}
