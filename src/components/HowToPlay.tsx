import { useState } from "react";
import "./HowToPlay.css";

export function HowToPlayButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                className="htp-btn"
                onClick={() => setOpen(true)}
            >
                ? How to Play
            </button>
            {open && <HowToPlayModal onClose={() => setOpen(false)} />}
        </>
    );
}

function HowToPlayModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="htp-overlay" onClick={onClose}>
            <div className="htp-card" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="htp-close" onClick={onClose}>
                    ✕
                </button>
                <h2 className="htp-title">How to Play</h2>

                <section className="htp-section">
                    <h3>Game Flow</h3>
                    <ol>
                        <li>
                            <strong>Prep Phase</strong> — Tap{" "}
                            <strong>Stock Machine</strong> to open the Shop and
                            buy snacks. Place them into your 3×3 vending
                            machine grid or stash them in the Cooler for
                            later. When you're ready, hit{" "}
                            <strong>Start Round</strong> at the bottom of the
                            Shop.
                        </li>
                        <li>
                            <strong>Serve Phase</strong> — Customers arrive with
                            preferences (sweet, salty, cheap, etc.). Your
                            machine sells matching items automatically.
                        </li>
                        <li>
                            <strong>Summary</strong> — See your earnings, combo
                            bonuses, and item evolution results. Then it's back
                            to Prep for the next round.
                        </li>
                    </ol>
                </section>

                <section className="htp-section">
                    <h3>Game Modes</h3>
                    <ul>
                        <li>
                            <strong>🏦 Retirement Fund</strong> — Accumulate
                            300¢ total to win. Take your time and build up.
                        </li>
                        <li>
                            <strong>📈 Profiteer</strong> — Hit an escalating
                            profit target every round. Miss one and it's game
                            over.
                        </li>
                    </ul>
                </section>

                <section className="htp-section">
                    <h3>How You Lose</h3>
                    <ul>
                        <li>
                            <strong>Broke</strong> — Your coins drop below 0
                            (rent is due each round and it escalates!).
                        </li>
                        <li>
                            <strong>Machine Destroyed</strong> — Machine HP hits
                            0 from random events or angry customers.
                        </li>
                        <li>
                            <strong>Profiteer only</strong> — Fail to meet the
                            round's profit target.
                        </li>
                    </ul>
                </section>

                <section className="htp-section">
                    <h3>The Shop</h3>
                    <ul>
                        <li>
                            Tap <strong>Stock Machine</strong> on the vending
                            machine to open the Shop.
                        </li>
                        <li>
                            4 base items are always available and can be bought
                            multiple times.
                        </li>
                        <li>
                            2 special "aged" items re-roll each round — they may
                            be Fresh, Vintage (+value), Legendary (+more value),
                            or Rotten (cheap but sells poorly).
                        </li>
                        <li>
                            Use Reroll to get a fresh shop selection (costs
                            escalate).
                        </li>
                    </ul>
                </section>

                <section className="htp-section">
                    <h3>Item Aging</h3>
                    <p>
                        Unsold items in your machine age between rounds: Fresh →
                        Vintage (+2¢) → Legendary (+4¢). Legendary items risk
                        going Rotten each round (sells at 40% price).
                    </p>
                </section>

                <section className="htp-section">
                    <h3>Tips</h3>
                    <ul>
                        <li>
                            Match items to customer preferences for guaranteed
                            sales.
                        </li>
                        <li>
                            Use the Cooler to stockpile items for emergency
                            restocks mid-round.
                        </li>
                        <li>
                            Upgrade your machine — unlock slots, expand the
                            cooler, and reinforce HP.
                        </li>
                        <li>
                            Watch your rent — it goes up every round. Don't
                            overspend in the shop.
                        </li>
                        <li>
                            Aged items are a gamble: Vintage/Legendary sell
                            high, but Rotten items are dead weight.
                        </li>
                        <li>
                            Leaving items unsold lets them age into higher
                            value — but risk rotting.
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
