import type { StickerInstance } from "@/logic/snack";
import {
    EDITION_BONUSES,
    stickerSellValue,
    stickerSlotsUsed,
} from "@/logic/snack";
import { getStickerDef } from "@/logic/snack/stickerDefs";
import { useState } from "react";
import { DetailPopover } from "./DetailPopover";
import "./StickerTray.css";

type StickerTrayProps = {
    stickers: StickerInstance[];
    maxSlots: number;
    onSell?: (instanceId: string) => void;
};

const RARITY_COLORS: Record<string, string> = {
    common: "#aaa",
    uncommon: "#4fc3f7",
    rare: "#ab47bc",
    legendary: "#ffd700",
};

const EDITION_BORDERS: Record<string, string> = {
    normal: "",
    foil: "sticker--foil",
    holographic: "sticker--holo",
    chromatix: "sticker--chromatix",
    negative: "sticker--negative",
    golden: "sticker--golden",
};

export function StickerTray({ stickers, maxSlots, onSell }: StickerTrayProps) {
    const [detailId, setDetailId] = useState<string | null>(null);
    const used = stickerSlotsUsed(stickers);
    const slottedStickers = stickers.filter(
        (sticker) => !EDITION_BONUSES[sticker.edition].freeSlot,
    );
    const bonusSlotStickers = stickers.filter(
        (sticker) => EDITION_BONUSES[sticker.edition].freeSlot,
    );

    const detailSticker = detailId
        ? stickers.find((s) => s.instanceId === detailId)
        : null;
    const detailDef = detailSticker ? getStickerDef(detailSticker.defId) : null;
    const detailEdition = detailSticker
        ? EDITION_BONUSES[detailSticker.edition]
        : null;
    const detailSellVal = detailSticker
        ? stickerSellValue(detailSticker, stickers)
        : 0;

    return (
        <div className="sticker-tray">
            <div className="sticker-tray__header">
                <span className="sticker-tray__title">Stickers</span>
                <span className="sticker-tray__count">
                    {used}/{maxSlots}
                </span>
            </div>
            <div className="sticker-tray__slots">
                {slottedStickers.map((sticker, i) => {
                    const edition = EDITION_BONUSES[sticker.edition];
                    const editionClass = EDITION_BORDERS[sticker.edition] ?? "";

                    return (
                        <div
                            key={sticker.instanceId}
                            className={`sticker ${editionClass}`}
                            style={{
                                borderColor: RARITY_COLORS[sticker.rarity],
                            }}
                            onClick={() => setDetailId(sticker.instanceId)}
                        >
                            <div className="sticker__slot-index">Slot {i + 1}</div>
                            <div className="sticker__name">{sticker.name}</div>
                            {edition.label && (
                                <div className="sticker__edition">
                                    {edition.label}
                                </div>
                            )}
                            <div
                                className="sticker__rarity"
                                style={{ color: RARITY_COLORS[sticker.rarity] }}
                            >
                                {sticker.rarity}
                            </div>
                        </div>
                    );
                })}
                {/* Empty slot indicators */}
                {Array.from(
                    { length: Math.max(0, maxSlots - used) },
                    (_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="sticker sticker--empty"
                        >
                            <div className="sticker__slot-index">
                                Slot {slottedStickers.length + i + 1}
                            </div>
                            <span className="sticker__empty-icon">+</span>
                        </div>
                    ),
                )}
                {bonusSlotStickers.map((sticker, i) => {
                    const edition = EDITION_BONUSES[sticker.edition];
                    const editionClass = EDITION_BORDERS[sticker.edition] ?? "";
                    return (
                        <div
                            key={sticker.instanceId}
                            className={`sticker sticker--extra-slot ${editionClass}`}
                            style={{
                                borderColor: RARITY_COLORS[sticker.rarity],
                            }}
                            onClick={() => setDetailId(sticker.instanceId)}
                        >
                            <div className="sticker__slot-index">
                                Slot {maxSlots + i + 1}
                            </div>
                            <div className="sticker__name">{sticker.name}</div>
                            {edition.label && (
                                <div className="sticker__edition">
                                    {edition.label}
                                </div>
                            )}
                            <div
                                className="sticker__rarity"
                                style={{ color: RARITY_COLORS[sticker.rarity] }}
                            >
                                {sticker.rarity}
                            </div>
                        </div>
                    );
                })}
            </div>
            {detailSticker && detailDef && detailEdition && (
                <DetailPopover
                    name={detailSticker.name}
                    rarity={detailSticker.rarity}
                    rarityColor={RARITY_COLORS[detailSticker.rarity]}
                    edition={detailEdition.label || undefined}
                    description={detailDef.description}
                    perks={[
                        ...(detailEdition.freeSlot ? ["No slot used"] : []),
                        ...(detailEdition.passiveCoins > 0
                            ? [`+${detailEdition.passiveCoins}¢/round`]
                            : []),
                        ...(detailEdition.effectMult > 1
                            ? [`×${detailEdition.effectMult} effect`]
                            : []),
                    ]}
                    extra={`Held: ${detailSticker.roundsHeld} rounds`}
                    sellLabel={onSell ? `Sell ${detailSellVal}¢` : undefined}
                    onSell={
                        onSell
                            ? () => onSell(detailSticker.instanceId)
                            : undefined
                    }
                    onClose={() => setDetailId(null)}
                />
            )}
        </div>
    );
}
