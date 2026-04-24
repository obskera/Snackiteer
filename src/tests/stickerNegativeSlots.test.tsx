import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StickerTray } from "@/components/StickerTray";
import { StickerShopScreen } from "@/components/StickerShopScreen";
import type { StickerEdition, StickerInstance } from "@/logic/snack";

function makeSticker(
    instanceId: string,
    name: string,
    edition: StickerEdition = "normal",
): StickerInstance {
    return {
        instanceId: instanceId as StickerInstance["instanceId"],
        defId: "top-shelf",
        name,
        description: "test sticker",
        rarity: "common",
        edition,
        baseSellValue: 3,
        roundsHeld: 0,
    };
}

describe("negative sticker slots", () => {
    it("renders negative stickers in extra slots after normal capacity", () => {
        const normal = Array.from({ length: 5 }, (_, i) =>
            makeSticker(`normal-${i}`, `Normal ${i + 1}`),
        );
        const negative = makeSticker("negative-1", "Negative One", "negative");

        render(
            <StickerTray
                stickers={[...normal, negative]}
                maxSlots={5}
                onSell={() => undefined}
            />,
        );

        expect(screen.getByText("5/5")).toBeInTheDocument();
        expect(screen.getByText("Slot 6")).toBeInTheDocument();

        const negativeCard = screen
            .getByText("Negative One")
            .closest(".sticker");
        expect(negativeCard).toHaveClass("sticker--extra-slot");
    });

    it("removes the extra slot when a negative sticker is sold", async () => {
        const user = userEvent.setup();

        function TrayHarness() {
            const [stickers, setStickers] = useState<StickerInstance[]>([
                makeSticker("normal-a", "Normal A"),
                makeSticker("negative-a", "Negative A", "negative"),
            ]);

            return (
                <StickerTray
                    stickers={stickers}
                    maxSlots={5}
                    onSell={(instanceId) => {
                        setStickers((prev) =>
                            prev.filter((s) => s.instanceId !== instanceId),
                        );
                    }}
                />
            );
        }

        render(<TrayHarness />);

        expect(screen.getByText("Slot 6")).toBeInTheDocument();

        await user.click(screen.getByText("Negative A"));
        await user.click(screen.getByRole("button", { name: /sell/i }));

        expect(screen.queryByText("Slot 6")).toBeNull();
    });

    it("buys negative stickers without entering replacement flow", async () => {
        const user = userEvent.setup();
        const onBuy = vi.fn();
        const normal = Array.from({ length: 5 }, (_, i) =>
            makeSticker(`normal-full-${i}`, `Normal Full ${i + 1}`),
        );
        const negativeOption = makeSticker(
            "negative-buy",
            "Negative Buy",
            "negative",
        );

        render(
            <StickerShopScreen
                options={[negativeOption]}
                currentStickers={normal}
                maxSlots={5}
                coins={99}
                rerollCount={0}
                lockedDefId={null}
                onBuy={onBuy}
                onSkip={() => undefined}
                onReroll={() => undefined}
                onLock={() => undefined}
            />,
        );

        await user.click(screen.getByRole("button", { name: /buy 4c/i }));

        expect(onBuy).toHaveBeenCalledTimes(1);
        expect(onBuy).toHaveBeenCalledWith(negativeOption, 5);
        expect(screen.queryByText("Place Sticker")).toBeNull();
    });
});
