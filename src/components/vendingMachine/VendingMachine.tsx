import type { MachineSlot, SlotPosition, SnackItemInstance } from "@/logic/snack";
import type { Floater } from "@/hooks/useFloatingFX";
import type { ReactNode } from "react";
import { FloatingFX } from "./FloatingFX";
import "./VendingMachine.css";

// ── Slot ──────────────────────────────────────────────────

type SlotProps = {
    slot: MachineSlot;
    selected: boolean;
    unlockPreview?: boolean;
    onSlotClick: (slot: MachineSlot) => void;
    onPriceChange?: (delta: number) => void;
    onTrash?: () => void;
    onFeature?: () => void;
};

/** Placeholder color per item type tag until real sprites arrive. */
const ITEM_TYPE_COLORS: Record<string, string> = {
    drink: "#4fc3f7",
    snack: "#ffb74d",
    candy: "#f06292",
    premium: "#ffd700",
};

const itemColor = (item: SnackItemInstance): string =>
    ITEM_TYPE_COLORS[item.tags[0]] ?? "#888";

function SlotItem({ item }: { item: SnackItemInstance }) {
    return (
        <div className={`vm-item vm-item--${item.rarity}`}>
            <div
                className="vm-item__icon"
                style={{ background: itemColor(item) }}
                title={item.tags.join(", ")}
            />
            <span className="vm-item__name">{item.name}</span>
            <span className="vm-item__price">{item.price}¢</span>
            {item.effectName && (
                <span className="vm-item__effect" title={`${item.effectName}: ${item.effectDesc}`}>✦</span>
            )}
        </div>
    );
}

function Slot({ slot, selected, unlockPreview, onSlotClick, onPriceChange, onTrash, onFeature }: SlotProps) {
    if (!slot.unlocked) {
        return <div className={`vm-slot vm-slot--locked${unlockPreview ? " vm-slot--unlock-preview" : ""}`} />;
    }

    const stateClass = slot.item ? "" : "vm-slot--empty";
    const featuredClass = slot.featured ? "vm-slot--featured" : "";
    const selectedClass = selected ? "vm-slot--selected" : "";

    return (
        <div
            className={`vm-slot ${stateClass} ${featuredClass} ${selectedClass}`}
            onClick={() => onSlotClick(slot)}
        >
            {slot.item && <SlotItem item={slot.item} />}
            {selected && slot.item && onPriceChange && onTrash && onFeature && (
                <div className="vm-slot__popout" onClick={(e) => e.stopPropagation()}>
                    <div className="vm-slot__price-row">
                        <button
                            type="button"
                            className="vm-slot__btn vm-slot__btn--minus"
                            onClick={() => onPriceChange(-1)}
                        >
                            −
                        </button>
                        <span className="vm-slot__price-display">{slot.item.price}¢</span>
                        <button
                            type="button"
                            className="vm-slot__btn vm-slot__btn--plus"
                            onClick={() => onPriceChange(+1)}
                        >
                            +
                        </button>
                    </div>
                    <div className="vm-slot__action-row">
                        <button
                            type="button"
                            className={`vm-slot__btn vm-slot__btn--feature ${slot.featured ? "vm-slot__btn--feature-active" : ""}`}
                            onClick={onFeature}
                        >
                            {slot.featured ? "★" : "☆"}
                        </button>
                        <button
                            type="button"
                            className="vm-slot__btn vm-slot__btn--trash"
                            onClick={onTrash}
                        >
                            🗑
                        </button>
                    </div>
                    {slot.item.effectName && (
                        <div className="vm-slot__effect-row">
                            <span className="vm-slot__effect-name">✦ {slot.item.effectName}</span>
                            <span className="vm-slot__effect-desc">{slot.item.effectDesc}</span>
                        </div>
                    )}
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
    onSlotClick: (slot: MachineSlot) => void;
    onPriceChange?: (row: number, col: number, delta: number) => void;
    onTrash?: (row: number, col: number) => void;
    onFeature?: (row: number, col: number) => void;
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
    onSlotClick,
    onPriceChange,
    onTrash,
    onFeature,
    onRepair,
}: VendingMachineProps) {
    const hpPct = Math.round((machineHp / maxMachineHp) * 100);
    const hpColor = hpPct > 50 ? "var(--neon)" : hpPct > 25 ? "#ffb74d" : "#ff4040";
    const repairCost = (maxMachineHp - machineHp) * 2;
    const needsRepair = machineHp < maxMachineHp;

    return (
        <div className={`vm-machine ${shaking ? "vm-machine--shake" : ""}`}>
            <div className="vm-header">
                {headerExtra}
                <span className="vm-coins">Coins: {coins}¢</span>
            </div>

            {/* HP bar */}
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
                {needsRepair && onRepair && (
                    <button
                        type="button"
                        className="vm-hp-bar__repair"
                        onClick={onRepair}
                        disabled={coins < repairCost}
                        title={`Repair to full: ${repairCost}¢`}
                    >
                        🔧 {repairCost}¢
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
                        const isNextLocked = highlightNextLocked && !slot.unlocked &&
                            idx === slots.findIndex((s) => !s.unlocked);
                        return (
                            <Slot
                                key={`${row}-${col}`}
                                slot={slot}
                                selected={isSelected}
                                unlockPreview={isNextLocked}
                                onSlotClick={onSlotClick}
                                onPriceChange={
                                    isSelected && onPriceChange
                                        ? (d) => onPriceChange(row, col, d)
                                        : undefined
                                }
                                onTrash={
                                    isSelected && onTrash
                                        ? () => onTrash(row, col)
                                        : undefined
                                }
                                onFeature={
                                    isSelected && onFeature
                                        ? () => onFeature(row, col)
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
                    <span className="vm-info-bar__target">Profit Target: +{profitTarget}¢</span>
                )}
                {gameMode !== "profiteer" && (
                    <span className="vm-info-bar__rent">Rent: {rent}¢</span>
                )}
            </div>
        </div>
    );
}
