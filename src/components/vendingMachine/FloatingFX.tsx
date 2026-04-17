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
};

const KIND_PARTICLES: Record<string, number> = {
    coin: 12,
    damage: 8,
    combo: 10,
    effect: 8,
};

/**
 * Renders floating text with particle bursts, anchored to slot positions.
 *
 * Structure per floater (for butter-smooth layered animation):
 *   .vm-floater          — grid positioning + drift upward
 *     .vm-floater__inner  — scale pop + wiggle
 *       ParticleBurst     — firework particles (fires immediately)
 *       .vm-floater__text — the actual text with outline highlight
 */
export function FloatingFX({ floaters, gridCols }: FloatingFXProps) {
    if (floaters.length === 0) return null;

    return (
        <div className="vm-fx-layer" aria-hidden>
            {floaters.map((f) => {
                const col = f.slotIndex >= 0 ? f.slotIndex % gridCols : Math.floor(gridCols / 2);
                const row = f.slotIndex >= 0 ? Math.floor(f.slotIndex / gridCols) : 0;
                const color = KIND_COLORS[f.kind] ?? "#fff";
                const particleCount = KIND_PARTICLES[f.kind] ?? 10;

                return (
                    <div
                        key={f.id}
                        className={`vm-floater vm-floater--${f.kind}`}
                        style={{
                            "--fx-col": col,
                            "--fx-row": row,
                            "--fx-offset-x": `${f.offsetX}px`,
                            "--fx-delay": `${f.delayMs}ms`,
                            "--fx-color": color,
                        } as React.CSSProperties}
                    >
                        <div className="vm-floater__inner">
                            <ParticleBurst
                                count={particleCount}
                                color={color}
                                radius={44}
                                lifetime={700}
                            />
                            <span className="vm-floater__text">{f.text}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
