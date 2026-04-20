import { useState } from "react";
import {
    getSfxVolume,
    getBgmVolume,
    isSfxMuted,
    setSfxVolume,
    setBgmVolume,
    setSfxMuted,
    startBgm,
    shuffleBgm,
    playSfx,
} from "@/services/sfx";
import { HowToPlayButton } from "@/components/HowToPlay";
import "./AudioControls.css";

export function AudioControls({ onQuit }: { onQuit?: () => void }) {
    const [open, setOpen] = useState(false);
    const [sfxVol, setSfxVol] = useState(getSfxVolume);
    const [bgmVol, setBgmVol] = useState(getBgmVolume);
    const [allMuted, setAllMuted] = useState(isSfxMuted);

    const handleSfxChange = (v: number) => {
        setSfxVol(v);
        setSfxVolume(v);
    };

    const handleBgmChange = (v: number) => {
        setBgmVol(v);
        setBgmVolume(v);
    };

    const handleToggleMute = () => {
        const next = !allMuted;
        setAllMuted(next);
        setSfxMuted(next);
        if (!next) startBgm();
    };

    return (
        <div className="audio-controls">
            <button
                type="button"
                className="audio-controls__toggle"
                onClick={() => {
                    playSfx("button-hover", { volume: 0.3 });
                    setOpen((o) => !o);
                }}
                aria-label="Settings"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="3" stroke="#39ff14" strokeWidth="1.5"/>
                    <path d="M9 1h2v2.07a7 7 0 0 1 2.42.99l1.46-1.46 1.42 1.42-1.46 1.46A7 7 0 0 1 15.93 8H18v2h-2.07a7 7 0 0 1-.99 2.42l1.46 1.46-1.42 1.42-1.46-1.46a7 7 0 0 1-2.42.99V18H9v-2.07a7 7 0 0 1-2.42-.99l-1.46 1.46-1.42-1.42 1.46-1.46A7 7 0 0 1 4.07 11H2V9h2.07a7 7 0 0 1 .99-2.42L3.6 5.12 5.02 3.7l1.46 1.46A7 7 0 0 1 9 4.07V1z" stroke="#39ff14" strokeWidth="1" fill="none"/>
                </svg>
            </button>

            {open && (
                <div className="audio-controls__panel">
                    <label className="audio-controls__row">
                        <span>SFX</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={sfxVol}
                            onChange={(e) => handleSfxChange(Number(e.target.value))}
                        />
                    </label>
                    <label className="audio-controls__row">
                        <span>BGM</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={bgmVol}
                            onChange={(e) => handleBgmChange(Number(e.target.value))}
                        />
                    </label>
                    <button
                        type="button"
                        className="audio-controls__mute"
                        onClick={handleToggleMute}
                    >
                        {allMuted ? "Unmute All" : "Mute All"}
                    </button>
                    <button
                        type="button"
                        className="audio-controls__mute"
                        onClick={() => shuffleBgm()}
                    >
                        ⏭ Shuffle BGM
                    </button>
                    <HowToPlayButton />
                    {onQuit && (
                        <button
                            type="button"
                            className="audio-controls__quit"
                            onClick={() => { setOpen(false); onQuit(); }}
                        >
                            ✕ Quit to Menu
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
