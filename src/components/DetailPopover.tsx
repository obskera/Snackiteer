import "./DetailPopover.css";

type DetailPopoverProps = {
    name: string;
    rarity: string;
    rarityColor?: string;
    edition?: string;
    description: string;
    perks?: string[];
    extra?: string;
    sellLabel?: string;
    onSell?: () => void;
    onClose: () => void;
};

export function DetailPopover({
    name,
    rarity,
    rarityColor,
    edition,
    description,
    perks,
    extra,
    sellLabel,
    onSell,
    onClose,
}: DetailPopoverProps) {
    return (
        <div className="detail-popover" onClick={onClose}>
            <div className="detail-popover__card" onClick={(e) => e.stopPropagation()}>
                <div className="detail-popover__name">{name}</div>
                <div className="detail-popover__meta">
                    <span
                        className="detail-popover__rarity"
                        style={rarityColor ? { color: rarityColor } : undefined}
                    >
                        {rarity}
                    </span>
                    {edition && edition !== "normal" && (
                        <span className="detail-popover__edition">{edition}</span>
                    )}
                </div>
                <p className="detail-popover__desc">{description}</p>
                {perks && perks.length > 0 && (
                    <ul className="detail-popover__perks">
                        {perks.map((p, i) => (
                            <li key={i}>{p}</li>
                        ))}
                    </ul>
                )}
                {extra && <p className="detail-popover__extra">{extra}</p>}
                <div className="detail-popover__actions">
                    {onSell && (
                        <button
                            type="button"
                            className="detail-popover__sell"
                            onClick={() => { onSell(); onClose(); }}
                        >
                            {sellLabel ?? "Sell"}
                        </button>
                    )}
                    <button
                        type="button"
                        className="detail-popover__close"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
