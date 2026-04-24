// Lightweight SFX player — Web Audio API, supports overlapping playback.

import { resolvePublicAssetPath } from "@/utils/assetPaths";

export type SfxId =
    | "coin"
    | "combo"
    | "damage"
    | "slot-place"
    | "slot-select"
    | "round-start"
    | "round-end"
    | "upgrade-buy"
    | "upgrade-fail"
    | "restock"
    | "game-over"
    | "game-start"
    | "button-hover"
    | "event-banner"
    | "repair"
    | "scrolling-text";

const SFX_FILES: Record<SfxId, string> = {
    coin: "/sfx/coin.wav",
    combo: "/sfx/combo.wav",
    damage: "/sfx/upgrade-fail.wav",
    "slot-place": "/sfx/slot-place.wav",
    "slot-select": "/sfx/slot-select.wav",
    "round-start": "/sfx/round-start.wav",
    "round-end": "/sfx/round-end.wav",
    "upgrade-buy": "/sfx/upgrade-buy.wav",
    "upgrade-fail": "/sfx/upgrade-fail.wav",
    restock: "/sfx/restock.wav",
    "game-over": "/sfx/game-over.wav",
    "game-start": "/sfx/game-start.wav",
    "button-hover": "/sfx/button-hover.wav",
    "event-banner": "/sfx/event-banner.wav",
    repair: "/sfx/repair.wav",
    "scrolling-text": "/sfx/scrolling-text.wav",
};

let ctx: AudioContext | null = null;
const buffers = new Map<SfxId, AudioBuffer>();
let masterGain: GainNode | null = null;

// ── Persisted state ──
const STORAGE_KEY = "snackiteer-audio";
type AudioSettings = { sfxVol: number; bgmVol: number; muted: boolean };

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function loadSettings(): AudioSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as AudioSettings;
    } catch {
        /* ignore */
    }
    return { sfxVol: 1.0, bgmVol: 0.55, muted: false };
}

function saveSettings(): void {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ sfxVol: volume, bgmVol: bgmVolume, muted }),
        );
    } catch {
        /* ignore */
    }
}

const saved = loadSettings();
let muted = saved.muted;
let volume = saved.sfxVol;
let bgmVolume = saved.bgmVol;

// ── BGM state ──
const BGM_FILES = [
    "/bgm/bgm.wav",
    "/bgm/8bMzMKR-export.wav",
    "/bgm/8bMzMKR-export (1).wav",
    "/bgm/8bMzMKR-export (2).wav",
    "/bgm/8bMzMKR-export (3).wav",
    "/bgm/8bMzMKR-export (4).wav",
    "/bgm/8bMzMKR-export (5).wav",
    "/bgm/8bMzMKR-export (6).wav",
    "/bgm/8bMzMKR-export (7).wav",
    "/bgm/8bMzMKR-export (8).wav",
];
const bgmBuffers: AudioBuffer[] = [];
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGain: GainNode | null = null;

function getCtx(): AudioContext | null {
    if (!ctx) return null;
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

/** Create context without attempting to resume (safe outside user gesture). */
function createCtxRaw(): AudioContext {
    if (!ctx) {
        ctx = new AudioContext();
        masterGain = ctx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(ctx.destination);
    }
    return ctx;
}

function createCtx(): AudioContext {
    const c = createCtxRaw();
    if (c.state === "suspended") c.resume();
    return c;
}

/**
 * Ensure AudioContext is created and resumed inside a user gesture.
 * Call this synchronously from a pointerdown/click handler.
 */
export function ensureAudioContext(): void {
    createCtx();
}

/**
 * Resume AudioContext synchronously inside a user gesture and return a
 * promise that resolves once the context is actually running. iOS Safari
 * requires this resume() call to originate inside the gesture; awaiting
 * the returned promise is safe and the gesture trust persists.
 */
export function unlockAudio(): Promise<void> {
    const c = createCtxRaw();
    if (c.state === "running") return Promise.resolve();
    try {
        const p = c.resume();
        return p instanceof Promise ? p : Promise.resolve();
    } catch {
        return Promise.resolve();
    }
}

let initPromise: Promise<void> | null = null;

/** Preload all SFX buffers + BGM. Call once after first user interaction. */
export async function initSfx(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = doInitSfx();
    return initPromise;
}

async function doInitSfx(): Promise<void> {
    // Create context if needed. On iOS this stays "suspended" until a user
    // gesture resumes it, but decodeAudioData works fine on a suspended ctx,
    // so we can fetch + decode all buffers eagerly without waiting.
    const ac = ctx ?? createCtxRaw();
    const entries = Object.entries(SFX_FILES) as [SfxId, string][];
    await Promise.all(
        entries.map(async ([id, src]) => {
            try {
                const res = await fetch(resolvePublicAssetPath(src));
                const arrayBuf = await res.arrayBuffer();
                const audioBuf = await ac.decodeAudioData(arrayBuf);
                buffers.set(id, audioBuf);
            } catch {
                // missing sfx asset — silent fail
            }
        }),
    );

    // Load BGM tracks
    await Promise.all(
        BGM_FILES.map(async (src) => {
            try {
                const res = await fetch(resolvePublicAssetPath(src));
                const arrayBuf = await res.arrayBuffer();
                const audioBuf = await ac.decodeAudioData(arrayBuf);
                bgmBuffers.push(audioBuf);
            } catch {
                // missing bgm asset — silent fail
            }
        }),
    );
}

/** Play a sound. Multiple calls overlap — each creates a new source node. */
export function playSfx(id: SfxId, opts?: { volume?: number }): void {
    if (muted) return;
    const ac = getCtx();
    if (!ac) return;
    const buf = buffers.get(id);
    if (!buf) return;

    const source = ac.createBufferSource();
    source.buffer = buf;

    if (opts?.volume != null && opts.volume !== 1) {
        const g = ac.createGain();
        g.gain.value = opts.volume;
        g.connect(masterGain!);
        source.connect(g);
    } else {
        source.connect(masterGain!);
    }

    source.start();
}

/**
 * Play a short blip of the scrolling-text sound — one per character.
 * Call on every char; internally throttles to avoid buzzing.
 */
let blipCounter = 0;
export function playTextBlip(): void {
    if (muted) return;
    if (blipCounter++ % 2 !== 0) return;
    const ac = getCtx();
    if (!ac) return;
    const buf = buffers.get("scrolling-text");
    if (!buf) return;

    const source = ac.createBufferSource();
    source.buffer = buf;
    source.playbackRate.value = 0.95 + Math.random() * 0.1;

    const g = ac.createGain();
    g.gain.value = 0.6;
    g.connect(masterGain!);
    source.connect(g);

    source.start();
}

export function setSfxVolume(v: number): void {
    volume = clamp01(v);
    if (masterGain) masterGain.gain.value = volume;
    saveSettings();
}

export function setSfxMuted(m: boolean): void {
    muted = m;
    if (m) {
        stopBgm();
        if (masterGain) masterGain.gain.value = 0;
    } else {
        // Resume context (browser may have suspended it while silent)
        const ac = getCtx();
        if (ac && ac.state === "suspended") ac.resume();
        if (masterGain) masterGain.gain.value = volume;
    }
    saveSettings();
}

export function isSfxMuted(): boolean {
    return muted;
}

/**
 * Re-reads persisted audio settings and applies them to the active runtime.
 * Useful when entering gameplay from menu to guarantee current preferences.
 */
export function applyPersistedAudioSettings(): void {
    const persisted = loadSettings();
    volume = clamp01(persisted.sfxVol);
    bgmVolume = clamp01(persisted.bgmVol);
    muted = Boolean(persisted.muted);

    if (masterGain) {
        masterGain.gain.value = muted ? 0 : volume;
    }
    if (bgmGain) {
        bgmGain.gain.value = bgmVolume;
    }
    if (muted) {
        stopBgm();
    }
}

/** Start BGM with a random track. When it ends, pick another random one. */
export function startBgm(): void {
    if (bgmSource || muted) return;
    if (bgmBuffers.length === 0) {
        // Buffers may still be loading — retry once they're ready
        initPromise?.then(() => {
            if (!bgmSource && !muted && bgmBuffers.length > 0) playRandomBgm();
        });
        return;
    }
    playRandomBgm();
}

function playRandomBgm(): void {
    if (muted || bgmBuffers.length === 0) return;
    const ac = createCtx();
    // Ensure context is running (may have been suspended by mobile browser)
    if (ac.state === "suspended") ac.resume();
    const buf = bgmBuffers[Math.floor(Math.random() * bgmBuffers.length)];

    bgmGain = ac.createGain();
    bgmGain.gain.value = bgmVolume;
    bgmGain.connect(ac.destination);

    bgmSource = ac.createBufferSource();
    bgmSource.buffer = buf;
    bgmSource.loop = true;
    bgmSource.connect(bgmGain);
    bgmSource.start();
}

export function stopBgm(): void {
    if (bgmSource) {
        bgmSource.onended = null; // prevent re-trigger from onended
        bgmSource.stop();
        bgmSource.disconnect();
        bgmSource = null;
    }
    if (bgmGain) {
        bgmGain.disconnect();
        bgmGain = null;
    }
}

/** Skip to a new random BGM track. */
export function shuffleBgm(): void {
    stopBgm();
    if (!muted && bgmBuffers.length > 0) playRandomBgm();
}

export function setBgmVolume(v: number): void {
    bgmVolume = clamp01(v);
    if (bgmGain) bgmGain.gain.value = bgmVolume;
    saveSettings();
}

export function getBgmVolume(): number {
    return bgmVolume;
}

export function getSfxVolume(): number {
    return volume;
}
