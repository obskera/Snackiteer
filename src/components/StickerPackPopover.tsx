import type { StickerInstance } from "@/logic/snack";
import { EDITION_BONUSES, stickerSlotsUsed } from "@/logic/snack";
import { getStickerDef } from "@/logic/snack/stickerDefs";
import { useState } from "react";
import "./StickerPackPopover.css";

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
    onPick: (sticker: StickerInstance, slotIndex: number) => void;
    onSkip: () => void;
};

export function StickerPackPopover({ options, currentStickers, maxSlots, onPick, onSkip }: Props) {
    const [picked, setPicked] = useState<StickerInstance | null>(null);
    const used = stickerSlotsUsed(currentStickers);

    // Build slot list: existing stickers + empty slots
    const slots: (StickerInstance | null)[] = [];
    for (let i = 0; i < maxSlots; i++) {
        slots.push(currentStickers[i] ?? null);
    }

    if (picked) {
        // Step 2: choose a slot
        return (
            <div className="sp-popover" onClick={onSkip}>
                <div className="sp-popover__card" onClick={(e) => e.stopPropagation()}>
                    <h3 className="sp-popover__title">Place Sticker</h3>
                    <div className="sp-popover__picked">
                        <span className="sp-popover__picked-name" style={{ color: RARITY_COLORS[picked.rarity] }}>
                            {picked.name}
                        </span>
                        <span className="sp-popover__picked-rarity">{picked.rarity}</span>
                    </div>
                    <p className="sp-popover__hint">Choose a slot</p>
                    <div className="sp-popover__slots">
                        {slots.map((existing, i) => {
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={`sp-popover__slot ${existing ? "sp-popover__slot--occupied" : "sp-popover__slot--empty"}`}
                                    onClick={() => onPick(picked, i)}
                                >
                                    {existing ? (
                                        <>
                                            <span className="sp-popover__slot-name">{existing.name}</span>
                                            <span className="sp-popover__slot-replace">Replace</span>
                                        </>
                                    ) : (
                                        <span className="sp-popover__slot-empty">Empty</span>
                                    )}
                                    <span className="sp-popover__slot-num">Slot {i + 1}</span>
                                </button>
                            );
                        })}
                    </div>
                    <button type="button" className="sp-popover__back" onClick={() => setPicked(null)}>
                        ← Back
                    </button>
                </div>
            </div>
        );
    }

    // Step 1: pick a sticker
    return (
        <div className="sp-popover" onClick={onSkip}>
            <div className="sp-popover__card" onClick={(e) => e.stopPropagation()}>
                <h3 className="sp-popover__title">Sticker Pack</h3>
                <p className="sp-popover__hint">Choose a sticker ({used}/{maxSlots} slots used)</p>
                <div className="sp-popover__options">
                    {options.map((sticker) => {
                        const def = getStickerDef(sticker.defId);
                        const edition = EDITION_BONUSES[sticker.edition];
                        return (
                            <button
                                key={sticker.instanceId}
                                type="button"
                                className="sp-popover__option"
                                style={{ borderColor: RARITY_COLORS[sticker.rarity] }}
                                onClick={() => setPicked(sticker)}
                            >
                                <span className="sp-popover__opt-name">{sticker.name}</span>
                                <span className="sp-popover__opt-rarity" style={{ color: RARITY_COLORS[sticker.rarity] }}>
                                    {sticker.rarity}
                                </span>
                                {edition.label && (
                                    <span className="sp-popover__opt-edition">{edition.label}</span>
                                )}
                                <p className="sp-popover__opt-desc">{def?.description ?? sticker.description}</p>
                                {edition.freeSlot && <span className="sp-popover__opt-perk">No slot used</span>}
                                {edition.passiveCoins > 0 && <span className="sp-popover__opt-perk">+{edition.passiveCoins}¢/round</span>}
                            </button>
                        );
                    })}
                </div>
                <button type="button" className="sp-popover__skip" onClick={onSkip}>
                    Skip
                </button>
            </div>
        </div>
    );
}
