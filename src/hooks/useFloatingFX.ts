import { useState, useCallback, useRef } from "react";
import { playSfx } from "@/services/sfx";

export type FloaterKind = "coin" | "damage" | "combo" | "effect";

export type Floater = {
    id: number;
    slotIndex: number;
    text: string;
    kind: FloaterKind;
    createdAt: number;
    /** Random horizontal offset in px for visual spread. */
    offsetX: number;
    /** Random animation delay for stagger. */
    delayMs: number;
};

const FLOATER_LIFETIME_MS = 1600;

/**
 * Manages a list of short-lived floating text elements anchored to slot indices.
 * Each floater auto-expires after FLOATER_LIFETIME_MS.
 */
export function useFloatingFX() {
    const [floaters, setFloaters] = useState<Floater[]>([]);
    const nextId = useRef(0);

    const spawn = useCallback(
        (slotIndex: number, text: string, kind: FloaterKind) => {
            const id = nextId.current++;
            const now = Date.now();
            // Random spread: ±20px horizontal, 0-80ms stagger
            const offsetX = (Math.random() - 0.5) * 40;
            const delayMs = Math.random() * 80;
            setFloaters((prev) => [
                ...prev,
                { id, slotIndex, text, kind, createdAt: now, offsetX, delayMs },
            ]);
            setTimeout(() => {
                setFloaters((prev) => prev.filter((f) => f.id !== id));
            }, FLOATER_LIFETIME_MS + delayMs);
        },
        [],
    );

    const spawnCoin = useCallback(
        (slotIndex: number, amount: number) => {
            playSfx("coin");
            spawn(slotIndex, `+${amount}¢`, "coin");
        },
        [spawn],
    );

    const spawnDamage = useCallback(
        (amount: number) => spawn(-1, `-${amount} HP`, "damage"),
        [spawn],
    );

    const spawnCombo = useCallback(
        (slotIndex: number, name: string, bonus: number) =>
            spawn(slotIndex, `${name} +${bonus}¢`, "combo"),
        [spawn],
    );

    const spawnEffect = useCallback(
        (slotIndex: number, text: string) => spawn(slotIndex, text, "effect"),
        [spawn],
    );

    return { floaters, spawn, spawnCoin, spawnDamage, spawnCombo, spawnEffect };
}
