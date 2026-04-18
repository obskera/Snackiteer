import { useState, useEffect, useRef, useCallback } from "react";
import { playTextBlip } from "@/services/sfx";

export type TypewriterLine = {
    text: string;
    /** Per-character delay in ms. Default 30. */
    charDelay?: number;
    /** How long the completed line lingers before next starts, ms. Default 800. */
    lingerMs?: number;
    /** CSS class to apply to this line. */
    className?: string;
};

export type TypewriterState = {
    /** Lines fully typed so far (including current partial). */
    visibleLines: { text: string; className?: string }[];
    /** True when all lines have finished typing. */
    done: boolean;
    /** Immediately finish all lines. */
    skip: () => void;
};

/**
 * Drives a typewriter effect through an array of lines.
 * Change `runId` to restart from scratch. Pass 0 to idle.
 * `skipLines` pre-reveals that many lines instantly (for restock continuation).
 */
export function useTypewriter(
    lines: TypewriterLine[],
    runId: number,
    skipLines = 0,
): TypewriterState {
    const [visibleLines, setVisibleLines] = useState<
        { text: string; className?: string }[]
    >([]);
    const [done, setDone] = useState(false);
    const linesRef = useRef(lines);
    linesRef.current = lines;

    const cancelRef = useRef(false);

    const skip = useCallback(() => {
        cancelRef.current = true;
        const all = linesRef.current.map((l) => ({
            text: l.text,
            className: l.className,
        }));
        setVisibleLines(all);
        setDone(true);
    }, []);

    useEffect(() => {
        if (runId === 0 || lines.length === 0) {
            setVisibleLines([]);
            setDone(false);
            return;
        }

        cancelRef.current = false;

        // Pre-reveal skipped lines instantly
        const preRevealed = lines.slice(0, skipLines).map((l) => ({
            text: l.text,
            className: l.className,
        }));
        setVisibleLines(preRevealed);
        setDone(false);

        let cancelled = false;

        const run = async () => {
            for (let li = skipLines; li < lines.length; li++) {
                if (cancelled || cancelRef.current) return;
                const line = lines[li];
                const charDelay = line.charDelay ?? 30;
                const lingerMs = line.lingerMs ?? 800;

                for (let ci = 0; ci <= line.text.length; ci++) {
                    if (cancelled || cancelRef.current) return;
                    const partial = line.text.slice(0, ci);
                    setVisibleLines((prev) => {
                        const next = prev.slice(0, li);
                        next.push({ text: partial, className: line.className });
                        return next;
                    });
                    if (ci < line.text.length) {
                        // Play blip on non-space characters for that RPG text feel
                        if (line.text[ci] !== " ") playTextBlip();
                        await delay(charDelay);
                    }
                }

                if (li < lines.length - 1) {
                    await delay(lingerMs);
                }
            }
            if (!cancelled) setDone(true);
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [runId]); // only runId — lines/skipLines are captured at call time

    return { visibleLines, done, skip };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
