import { useState, useCallback, useRef } from "react";
import { playSfx } from "@/services/sfx";

export type FloaterKind = "coin" | "damage" | "combo" | "effect" | "upsell";

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
    /** Combo escalation level (1–4). Higher = bigger, flashier. */
    level?: number;
    /** Optional color override (overrides kind default). */
    color?: string;
};

const FLOATER_LIFETIME_MS = 1600;

// Combo level: label prefix, color, lifetime scale
const COMBO_LEVEL_COLORS = [
    "#ff69b4",
    "#ff69b4",
    "#ff9500",
    "#ffd700",
    "#ff2df7",
];
const COMBO_LEVEL_PREFIXES = ["", "", "NICE! ", "HOT! ", "🔥 FRENZY! "];

/**
 * Manages a list of short-lived floating text elements anchored to slot indices.
 * Each floater auto-expires after FLOATER_LIFETIME_MS.
 */
export function useFloatingFX() {
    const [floaters, setFloaters] = useState<Floater[]>([]);
    const nextId = useRef(0);

    const spawn = useCallback(
        (
            slotIndex: number,
            text: string,
            kind: FloaterKind,
            level?: number,
            color?: string,
        ) => {
            const id = nextId.current++;
            const now = Date.now();
            const offsetX = (Math.random() - 0.5) * 40;
            const delayMs = Math.random() * 80;
            // Higher level combos linger longer
            const lifetime =
                kind === "combo" && level
                    ? FLOATER_LIFETIME_MS + (level - 1) * 300
                    : FLOATER_LIFETIME_MS;
            setFloaters((prev) => [
                ...prev,
                {
                    id,
                    slotIndex,
                    text,
                    kind,
                    createdAt: now,
                    offsetX,
                    delayMs,
                    level,
                    color,
                },
            ]);
            setTimeout(() => {
                setFloaters((prev) => prev.filter((f) => f.id !== id));
            }, lifetime + delayMs);
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
        (slotIndex: number, _name: string, bonus: number, level = 1) => {
            const clampedLevel = Math.min(level, 4);
            const prefix = COMBO_LEVEL_PREFIXES[clampedLevel];
            const color = COMBO_LEVEL_COLORS[clampedLevel];
            spawn(
                slotIndex,
                `${prefix}+${bonus}¢`,
                "combo",
                clampedLevel,
                color,
            );
        },
        [spawn],
    );

    const spawnUpsell = useCallback(
        (slotIndex: number, amount: number) => {
            playSfx("upgrade-buy");
            spawn(
                slotIndex,
                `UPSELL! +${amount}¢`,
                "upsell",
                undefined,
                "#00ffff",
            );
        },
        [spawn],
    );

    const spawnEffect = useCallback(
        (slotIndex: number, text: string) => spawn(slotIndex, text, "effect"),
        [spawn],
    );

    return {
        floaters,
        spawn,
        spawnCoin,
        spawnDamage,
        spawnCombo,
        spawnUpsell,
        spawnEffect,
    };
}
