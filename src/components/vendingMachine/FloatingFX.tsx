import type { Floater } from "@/hooks/useFloatingFX";
import { ParticleBurst } from "./ParticleBurst";
import "./FloatingFX.css";

type FloatingFXProps = {
    floaters: Floater[];
    /** Number of columns in the slot grid (for positioning). */
    gridCols: number;
};

const KIND_COLORS: Record<string, string> = {
    coin: "#39ff14",
    damage: "#ff4040",
    combo: "#ff69b4",
    effect: "#b388ff",
    upsell: "#00ffff",
};

const KIND_BASE_PARTICLES: Record<string, number> = {
    coin: 12,
    damage: 8,
    combo: 10,
    effect: 8,
    upsell: 20,
};

/**
 * Renders floating text with particle bursts, anchored to slot positions.
 * Combos escalate: level 1→4 gets bigger text, more particles, longer lifetime.
 */
export function FloatingFX({ floaters, gridCols }: FloatingFXProps) {
    if (floaters.length === 0) return null;

    return (
        <div className="vm-fx-layer" aria-hidden>
            {floaters.map((f) => {
                const col =
                    f.slotIndex >= 0
                        ? f.slotIndex % gridCols
                        : Math.floor(gridCols / 2);
                const row =
                    f.slotIndex >= 0 ? Math.floor(f.slotIndex / gridCols) : 0;
                // Use color override if set, else kind default
                const color = f.color ?? KIND_COLORS[f.kind] ?? "#fff";
                // Combo particles scale with level
                const level = f.level ?? 1;
                const particleCount =
                    f.kind === "combo"
                        ? Math.min(
                              KIND_BASE_PARTICLES.combo + (level - 1) * 8,
                              36,
                          )
                        : f.kind === "upsell"
                          ? 22
                          : (KIND_BASE_PARTICLES[f.kind] ?? 10);
                const particleRadius =
                    f.kind === "combo"
                        ? 32 + (level - 1) * 12
                        : f.kind === "upsell"
                          ? 48
                          : 44;

                return (
                    <div
                        key={f.id}
                        className={`vm-floater vm-floater--${f.kind}`}
                        style={
                            {
                                "--fx-col": col,
                                "--fx-row": row,
                                "--fx-offset-x": `${f.offsetX}px`,
                                "--fx-delay": `${f.delayMs}ms`,
                                "--fx-color": color,
                                "--fx-level": level,
                            } as React.CSSProperties
                        }
                    >
                        <div className="vm-floater__inner">
                            <ParticleBurst
                                count={particleCount}
                                color={color}
                                radius={particleRadius}
                                lifetime={600 + (level - 1) * 150}
                            />
                            <span className="vm-floater__text">{f.text}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
