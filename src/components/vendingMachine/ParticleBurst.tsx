import { useMemo } from "react";
import "./ParticleBurst.css";

export type ParticleBurstProps = {
    /** Number of particles to emit. */
    count?: number;
    /** Base color of particles. */
    color?: string;
    /** Max spread radius in px. */
    radius?: number;
    /** Lifetime in ms. */
    lifetime?: number;
};

type Particle = {
    id: number;
    angle: number;
    distance: number;
    size: number;
    delay: number;
    /** Extra rotation for sparkle feel. */
    spin: number;
};

/**
 * A burst of small particles that shoot outward from the center and fade.
 * Purely CSS-driven — no JS animation loop.
 */
export function ParticleBurst({
    count = 10,
    color = "#39ff14",
    radius = 32,
    lifetime = 600,
}: ParticleBurstProps) {
    // Generate stable particles once per mount
    const particles = useMemo<Particle[]>(() => {
        const arr: Particle[] = [];
        for (let i = 0; i < count; i++) {
            // Golden-angle distribution for even spread, with small randomness
            const baseAngle = (i * 137.508) % 360;
            const angle = baseAngle + (Math.random() - 0.5) * 30;
            arr.push({
                id: i,
                angle,
                distance: radius * (0.5 + Math.random() * 0.5),
                size: 2 + Math.random() * 3,
                delay: Math.random() * 60,
                spin: (Math.random() - 0.5) * 180,
            });
        }
        return arr;
    }, [count, radius]);

    return (
        <span className="particle-burst" aria-hidden>
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="particle"
                    style={{
                        "--p-angle": `${p.angle}deg`,
                        "--p-dist": `${p.distance}px`,
                        "--p-size": `${p.size}px`,
                        "--p-delay": `${p.delay}ms`,
                        "--p-spin": `${p.spin}deg`,
                        "--p-life": `${lifetime}ms`,
                        "--p-color": color,
                    } as React.CSSProperties}
                />
            ))}
        </span>
    );
}
