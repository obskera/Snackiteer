import type { StickerInstance } from "@/logic/snack";
import {
    EDITION_BONUSES,
    STICKER_BUY_COSTS,
    REROLL_BASE_COST,
    stickerSlotsUsed,
} from "@/logic/snack";
import { getStickerDef } from "@/logic/snack/stickerDefs";
import { useState } from "react";
import "./StickerShopScreen.css";

const RARITY_COLORS: Record<string, string> = {
    common: "#aaa",
    uncommon: "#4fc3f7",
    rare: "#ab47bc",
    legendary: "#ffd700",
};

type Props = {
    options: StickerInstance[];
    currentStickers: StickerInstance[];
    maxSlots: number;
    coins: number;
    rerollCount: number;
    lockedDefId: string | null;
    onBuy: (sticker: StickerInstance, slotIndex: number) => void;
    onSkip: () => void;
    onReroll: () => void;
    onLock: (defId: string) => void;
};

export function StickerShopScreen({
    options,
    currentStickers,
    maxSlots,
    coins,
    rerollCount,
    lockedDefId,
    onBuy,
    onSkip,
    onReroll,
    onLock,
}: Props) {
    const [picked, setPicked] = useState<StickerInstance | null>(null);
    const used = stickerSlotsUsed(currentStickers);
    const rerollCost = REROLL_BASE_COST * (rerollCount + 1);

    // Build slot list for placement step
    const slots: (StickerInstance | null)[] = [];
    for (let i = 0; i < maxSlots; i++) {
        slots.push(currentStickers[i] ?? null);
    }

    if (picked) {
        const cost = STICKER_BUY_COSTS[picked.rarity];
        // Step 2: choose a slot to place the sticker
        return (
            <div className="sticker-shop">
                <h3 className="sticker-shop__title">Place Sticker</h3>
                <div className="sticker-shop__picked">
                    <span
                        className="sticker-shop__picked-name"
                        style={{ color: RARITY_COLORS[picked.rarity] }}
                    >
                        {picked.name}
                    </span>
                    <span className="sticker-shop__picked-cost">{cost}c</span>
                </div>
                <p className="sticker-shop__hint">Choose a slot</p>
                <div className="sticker-shop__slots">
                    {slots.map((existing, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`sticker-shop__slot ${existing ? "sticker-shop__slot--occupied" : "sticker-shop__slot--empty"}`}
                            onClick={() => onBuy(picked, i)}
                        >
                            {existing ? (
                                <>
                                    <span className="sticker-shop__slot-name">
                                        {existing.name}
                                    </span>
                                    <span className="sticker-shop__slot-replace">
                                        Replace
                                    </span>
                                </>
                            ) : (
                                <span className="sticker-shop__slot-empty">
                                    Empty
                                </span>
                            )}
                            <span className="sticker-shop__slot-num">
                                Slot {i + 1}
                            </span>
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="sticker-shop__back"
                    onClick={() => setPicked(null)}
                >
                    {"<"}- Back
                </button>
            </div>
        );
    }

    // Step 1: browse stickers
    return (
        <div className="sticker-shop">
            <h3 className="sticker-shop__title">Sticker Shop</h3>
            <p className="sticker-shop__hint">
                End of round reward -- buy a sticker? ({used}/{maxSlots} slots
                used)
            </p>

            <div className="sticker-shop__options">
                {options.map((sticker) => {
                    const def = getStickerDef(sticker.defId);
                    const edition = EDITION_BONUSES[sticker.edition];
                    const cost = STICKER_BUY_COSTS[sticker.rarity];
                    const canAfford = coins >= cost;
                    const isLocked = lockedDefId === sticker.defId;

                    return (
                        <div
                            key={sticker.instanceId}
                            className="sticker-shop__card"
                            style={{
                                borderColor: RARITY_COLORS[sticker.rarity],
                            }}
                        >
                            <span className="sticker-shop__card-name">
                                {sticker.name}
                            </span>
                            <span
                                className="sticker-shop__card-rarity"
                                style={{
                                    color: RARITY_COLORS[sticker.rarity],
                                }}
                            >
                                {sticker.rarity}
                            </span>
                            {edition.label && (
                                <span className="sticker-shop__card-edition">
                                    {edition.label}
                                </span>
                            )}
                            <p className="sticker-shop__card-desc">
                                {def?.description ?? sticker.description}
                            </p>
                            {edition.freeSlot && (
                                <span className="sticker-shop__card-perk">
                                    No slot used
                                </span>
                            )}
                            {edition.passiveCoins > 0 && (
                                <span className="sticker-shop__card-perk">
                                    +{edition.passiveCoins}c/round
                                </span>
                            )}
                            <div className="sticker-shop__card-actions">
                                <button
                                    type="button"
                                    className={`sticker-shop__buy ${!canAfford ? "sticker-shop__buy--disabled" : ""}`}
                                    disabled={!canAfford}
                                    onClick={() => setPicked(sticker)}
                                >
                                    Buy {cost}c
                                </button>
                                <button
                                    type="button"
                                    className={`sticker-shop__lock ${isLocked ? "sticker-shop__lock--active" : ""}`}
                                    onClick={() => onLock(sticker.defId)}
                                    title={
                                        isLocked
                                            ? "Unlock -- will not be guaranteed next round"
                                            : "Lock -- guaranteed to appear next round"
                                    }
                                >
                                    {isLocked ? "[LOCKED]" : "[Lock]"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="sticker-shop__footer">
                <button
                    type="button"
                    className={`sticker-shop__reroll ${coins < rerollCost ? "sticker-shop__reroll--disabled" : ""}`}
                    disabled={coins < rerollCost}
                    onClick={onReroll}
                >
                    Reroll ({rerollCost}c)
                </button>
                <span className="sticker-shop__coins">{coins}c</span>
                <button
                    type="button"
                    className="sticker-shop__skip"
                    onClick={onSkip}
                >
                    Skip {">>"}
                </button>
            </div>
        </div>
    );
}
