import type { StickerDef } from "./stickerTypes";

// Helper: check if entire row sold (all unlocked slots in row are empty)
const rowSold = (ctx: { machine: { slots: { position: { row: number }; unlocked: boolean; item: unknown | null }[] } }, row: number) =>
    ctx.machine.slots.filter(s => s.position.row === row && s.unlocked).every(s => !s.item);

const colSold = (ctx: { machine: { slots: { position: { col: number }; unlocked: boolean; item: unknown | null }[] } }, col: number) =>
    ctx.machine.slots.filter(s => s.position.col === col && s.unlocked).every(s => !s.item);

const diagSold = (ctx: { machine: { slots: { position: { row: number; col: number }; unlocked: boolean; item: unknown | null }[] } }, diag: [number, number][]) =>
    diag.every(([r, c]) => {
        const s = ctx.machine.slots.find(sl => sl.position.row === r && sl.position.col === c);
        return s && s.unlocked && !s.item;
    });

const countType = (ctx: { typeSales: Partial<Record<string, number>> }, type: string) =>
    (ctx.typeSales as Record<string, number>)[type] ?? 0;

// ══════════════════════════════════════════════════════════
//  ALL STICKER DEFINITIONS — 100 machine stickers
// ══════════════════════════════════════════════════════════

export const STICKER_DEFS: StickerDef[] = [
    // ── POSITION-BASED (1-12) ─────────────────────────────
    {
        id: "top-shelf",
        name: "Top Shelf",
        description: "Slot 1-3 sales +2¢ each",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldSlotRow === 0 ? 2 : 0 }),
    },
    {
        id: "bottom-feeder",
        name: "Bottom Feeder",
        description: "Slot 7-9 sales ×1.3",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ mult: ctx.soldSlotRow === 2 ? 1.3 : 1 }),
    },
    {
        id: "left-hook",
        name: "Left Hook",
        description: "Slot 1, 4, 7 sales +3¢",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldSlotCol === 0 ? 3 : 0 }),
    },
    {
        id: "right-deal",
        name: "Right Deal",
        description: "Slot 3, 6, 9 sales +3¢",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldSlotCol === 2 ? 3 : 0 }),
    },
    {
        id: "center-stage",
        name: "Center Stage",
        description: "Slot 5 sales ×1.5",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ mult: (ctx.soldSlotRow === 1 && ctx.soldSlotCol === 1) ? 1.5 : 1 }),
    },
    {
        id: "corner-pocket",
        name: "Corner Pocket",
        description: "Slot 1, 3, 7, 9 sales +4¢",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => {
            const r = ctx.soldSlotRow, c = ctx.soldSlotCol;
            const isCorner = (r === 0 || r === 2) && (c === 0 || c === 2);
            return { addCoins: isCorner ? 4 : 0 };
        },
    },
    {
        id: "full-house",
        name: "Full House",
        description: "If ALL slots sell this round, +20¢",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => {
            const unlocked = ctx.machine.slots.filter(s => s.unlocked).length;
            return { addCoins: ctx.totalSold >= unlocked && unlocked > 0 ? 20 : 0 };
        },
    },
    {
        id: "row-royale",
        name: "Row Royale",
        description: "When an entire row sells, that row ×1.5",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => {
            if (ctx.soldSlotRow == null) return {};
            return { mult: rowSold(ctx, ctx.soldSlotRow) ? 1.5 : 1 };
        },
    },
    {
        id: "column-captain",
        name: "Column Captain",
        description: "When entire column sells, +8¢",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => {
            if (ctx.soldSlotCol == null) return {};
            return { addCoins: colSold(ctx, ctx.soldSlotCol) ? 8 : 0 };
        },
    },
    {
        id: "edge-runner",
        name: "Edge Runner",
        description: "All slots except Slot 5 +1¢",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => {
            const isCenter = ctx.soldSlotRow === 1 && ctx.soldSlotCol === 1;
            return { addCoins: isCenter ? 0 : 1 };
        },
    },
    {
        id: "diagonal-ace",
        name: "Diagonal Ace",
        description: "If Slot 1-5-9 or 3-5-7 all sell, +15¢",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => {
            const d1: [number, number][] = [[0, 0], [1, 1], [2, 2]];
            const d2: [number, number][] = [[0, 2], [1, 1], [2, 0]];
            let bonus = 0;
            if (diagSold(ctx, d1)) bonus += 15;
            if (diagSold(ctx, d2)) bonus += 15;
            return { addCoins: bonus };
        },
    },
    {
        id: "slot-machine",
        name: "Slot Machine",
        description: "3 same-type in a row = ×1.5",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => {
            let mult = 1;
            for (let r = 0; r < 3; r++) {
                const rowSlots = ctx.machine.slots.filter(s => s.position.row === r && s.unlocked);
                if (rowSlots.length === 3 && rowSlots.every(s => !s.item) && rowSold(ctx, r)) {
                    mult *= 1.5;
                }
            }
            return { mult };
        },
    },

    // ── SNACK-TYPE (13-24) ────────────────────────────────
    {
        id: "sweet-tooth",
        name: "Sweet Tooth",
        description: "Candy sales +3¢",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldItemType === "candy" ? 3 : 0 }),
    },
    {
        id: "fizz-master",
        name: "Fizz Master",
        description: "Drink sales +3¢",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldItemType === "drink" ? 3 : 0 }),
    },
    {
        id: "chip-lover",
        name: "Chip Lover",
        description: "Snack sales +3¢",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldItemType === "snack" ? 3 : 0 }),
    },
    {
        id: "energy-guru",
        name: "Energy Guru",
        description: "Drink sales ×1.3",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ mult: ctx.soldItemType === "drink" ? 1.3 : 1 }),
    },
    {
        id: "gourmet",
        name: "Gourmet",
        description: "Candy sales +5¢",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldItemType === "candy" ? 5 : 0 }),
    },
    {
        id: "variety-pack",
        name: "Variety Pack",
        description: "+3¢ per unique type sold this round",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => {
            const types = Object.keys(ctx.typeSales).filter(k => (ctx.typeSales as Record<string, number>)[k] > 0);
            return { addCoins: types.length * 3 };
        },
    },
    {
        id: "specialist",
        name: "Specialist",
        description: "Only one item type sold? ×2",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => {
            const types = Object.keys(ctx.typeSales).filter(k => (ctx.typeSales as Record<string, number>)[k] > 0);
            return { mult: types.length === 1 && ctx.totalSold > 0 ? 2 : 1 };
        },
    },
    {
        id: "snack-streak",
        name: "Snack Streak",
        description: "Each consecutive same-type sale: +2¢ cumulative",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => {
            const typeCount = countType(ctx, ctx.soldItemType ?? "");
            return { addCoins: typeCount > 1 ? typeCount * 2 : 0 };
        },
    },
    {
        id: "diet-plan",
        name: "Diet Plan",
        description: "+10¢ if no candy sold this round",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: countType(ctx, "candy") === 0 ? 10 : 0 }),
    },
    {
        id: "sugar-rush",
        name: "Sugar Rush",
        description: "After 3+ candy sales, remaining sales ×1.5",
        rarity: "rare",
        trigger: "on-sale",
        resolve: (ctx) => ({ mult: countType(ctx, "candy") >= 3 ? 1.5 : 1 }),
    },
    {
        id: "spice-lord",
        name: "Spice Lord",
        description: "Spicy items +3¢ and ×1.2",
        rarity: "rare",
        trigger: "on-sale",
        resolve: (ctx) => ctx.soldItemVibe === "spicy" ? { addCoins: 3, mult: 1.2 } : {},
    },
    {
        id: "refresh-wave",
        name: "Refresh Wave",
        description: "Refreshing items heal 2 HP per sale",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ hpHeal: ctx.soldItemVibe === "refreshing" ? 2 : 0 }),
    },

    // ── SCALING (25-36) ───────────────────────────────────
    {
        id: "compound-interest",
        name: "Compound Interest",
        description: "+1¢ per round held",
        rarity: "common",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.roundsHeld }),
    },
    {
        id: "snowball",
        name: "Snowball",
        description: "+2¢ per round held, increasing",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.roundsHeld * 2 }),
    },
    {
        id: "investor",
        name: "Investor",
        description: "Earn 5% of your coins at round end (max 15¢)",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: Math.min(15, Math.floor(ctx.coins * 0.05)) }),
    },
    {
        id: "momentum",
        name: "Momentum",
        description: "Each sale this round adds +1¢ to the next",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.salesThisRound }),
    },
    {
        id: "rising-star",
        name: "Rising Star",
        description: "×1.1 per round held (caps ×2)",
        rarity: "rare",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: Math.min(2, 1 + ctx.roundsHeld * 0.1) }),
    },
    {
        id: "patience",
        name: "Patience",
        description: "+3¢ per empty slot at round end",
        rarity: "common",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.emptySlots * 3 }),
    },
    {
        id: "stockpile",
        name: "Stockpile",
        description: "+2¢ per unsold item at round end",
        rarity: "common",
        trigger: "round-end",
        resolve: (ctx) => {
            const unsold = ctx.totalStocked - ctx.totalSold;
            return { addCoins: Math.max(0, unsold) * 2 };
        },
    },
    {
        id: "growth-fund",
        name: "Growth Fund",
        description: "Sell value +2¢ each round held",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({}), // Handled by sell value calculation
    },
    {
        id: "lucky-streak",
        name: "Lucky Streak",
        description: "+0.15× per consecutive profitable round (caps ×2)",
        rarity: "rare",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: Math.min(2, 1 + ctx.profitStreak * 0.15) }),
    },
    {
        id: "fast-burn",
        name: "Fast Burn",
        description: "+20¢ first round, loses 3¢ each round held",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: Math.max(0, 20 - ctx.roundsHeld * 3) }),
    },
    {
        id: "exponential",
        name: "Exponential",
        description: "×1.0 first round, doubles each round (caps ×8)",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: Math.min(8, Math.pow(2, ctx.roundsHeld)) }),
    },
    {
        id: "ticking-clock",
        name: "Ticking Clock",
        description: "+5¢ per round, but destroys itself after 5 rounds",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.roundsHeld <= 5 ? 5 : 0 }),
    },

    // ── TRIGGER (37-48) ───────────────────────────────────
    {
        id: "insurance",
        name: "Insurance",
        description: "+8¢ when kicked",
        rarity: "common",
        trigger: "on-kick",
        resolve: () => ({ addCoins: 8 }),
    },
    {
        id: "comeback-kid",
        name: "Comeback Kid",
        description: "After a loss round, next round ×2",
        rarity: "rare",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: ctx.profitStreak === 0 ? 2 : 1 }),
    },
    {
        id: "last-call",
        name: "Last Call",
        description: "Last item sold each round ×2",
        rarity: "rare",
        trigger: "on-sale",
        resolve: (ctx) => {
            const remaining = ctx.totalStocked - ctx.totalSold;
            return { mult: remaining <= 1 ? 2 : 1 };
        },
    },
    {
        id: "impulse-buy",
        name: "Impulse Buy",
        description: "First sale each round +8¢",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.salesThisRound === 0 ? 8 : 0 }),
    },
    {
        id: "rush-hour",
        name: "Rush Hour",
        description: "5+ sales in a round: +15¢",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.totalSold >= 5 ? 15 : 0 }),
    },
    {
        id: "clean-sweep",
        name: "Clean Sweep",
        description: "All items sell: +15¢ and ×1.5",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => {
            const unlocked = ctx.machine.slots.filter(s => s.unlocked).length;
            const allSold = ctx.totalSold >= unlocked && unlocked > 0;
            return allSold ? { addCoins: 15, mult: 1.5 } : {};
        },
    },
    {
        id: "leftovers",
        name: "Leftovers",
        description: "+3¢ per unsold item",
        rarity: "common",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: Math.max(0, ctx.totalStocked - ctx.totalSold) * 3 }),
    },
    {
        id: "damage-control",
        name: "Damage Control",
        description: "+5¢ per kick this round",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.kicks * 5 }),
    },
    {
        id: "lucky-break",
        name: "Lucky Break",
        description: "20% chance any sale ×2",
        rarity: "rare",
        trigger: "on-sale",
        resolve: () => ({ mult: Math.random() < 0.20 ? 2 : 1 }),
    },
    {
        id: "closing-time",
        name: "Closing Time",
        description: "Last 2 sales each round ×1.5",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => {
            const remaining = ctx.totalStocked - ctx.totalSold;
            return { mult: remaining <= 2 ? 1.5 : 1 };
        },
    },
    {
        id: "hot-start",
        name: "Hot Start",
        description: "First 3 sales ×1.3",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ mult: ctx.salesThisRound < 3 ? 1.3 : 1 }),
    },
    {
        id: "berserker",
        name: "Berserker",
        description: "×0.05 per HP lost (huge when damaged!)",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => {
            const hpLost = ctx.run.maxMachineHp - ctx.run.machineHp;
            return { mult: 1 + hpLost * 0.05 };
        },
    },

    // ── ECONOMY (49-60) ───────────────────────────────────
    {
        id: "penny-pincher",
        name: "Penny Pincher",
        description: "Stock costs -2¢ (min 1)",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({ stockCostReduction: 2 }),
    },
    {
        id: "price-gouger",
        name: "Price Gouger",
        description: "All prices +3¢, but -1 customer",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({ addCoins: 0, addCustomers: -1 }),
    },
    {
        id: "tax-collector",
        name: "Tax Collector",
        description: "+1¢ per visiting customer (buy or not)",
        rarity: "common",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.totalSold + 2 }), // Approximate: assume ~2 non-buyers
    },
    {
        id: "coupon-clipper",
        name: "Coupon Clipper",
        description: "Catalogue items 20% cheaper",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({ stockCostReduction: 0 }), // Handled in catalogue pricing
    },
    {
        id: "markup-master",
        name: "Markup Master",
        description: "Featured item sales ×1.5",
        rarity: "rare",
        trigger: "on-sale",
        resolve: (ctx) => {
            const featuredSlot = ctx.machine.slots.find(s => s.featured);
            const isFeatured = featuredSlot && featuredSlot.position.row === ctx.soldSlotRow && featuredSlot.position.col === ctx.soldSlotCol;
            return { mult: isFeatured ? 1.5 : 1 };
        },
    },
    {
        id: "bulk-buyer",
        name: "Bulk Buyer",
        description: "Stock 4+ items: refund 5¢",
        rarity: "common",
        trigger: "round-start",
        resolve: (ctx) => ({ addCoins: ctx.totalStocked >= 4 ? 5 : 0 }),
    },
    {
        id: "silver-tongue",
        name: "Silver Tongue",
        description: "+15% buy chance for all customers",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({ addBuyChance: 0.15 }),
    },
    {
        id: "black-market",
        name: "Black Market",
        description: "Price cap raised to 20¢",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({ priceCapOverride: 20 }),
    },
    {
        id: "discount-rack",
        name: "Discount Rack",
        description: "Unsold items +2¢ value next round",
        rarity: "common",
        trigger: "passive",
        resolve: () => ({}), // Handled in restock logic
    },
    {
        id: "golden-touch",
        name: "Golden Touch",
        description: "All sales +1¢ flat",
        rarity: "common",
        trigger: "on-sale",
        resolve: () => ({ addCoins: 1 }),
    },

    // ── RESTOCK (61-68) ───────────────────────────────────
    {
        id: "auto-restock",
        name: "Auto-Restock",
        description: "Cheapest sold item restocks free once/round",
        rarity: "rare",
        trigger: "round-end",
        resolve: () => ({}), // Handled in restock phase
    },
    {
        id: "fresh-delivery",
        name: "Fresh Delivery",
        description: "Round start: free common item in random empty slot",
        rarity: "uncommon",
        trigger: "round-start",
        resolve: () => ({}), // Handled in prep phase
    },
    {
        id: "recycler",
        name: "Recycler",
        description: "30% chance sold item restocks",
        rarity: "rare",
        trigger: "on-sale",
        resolve: (ctx) => {
            if (Math.random() < 0.3 && ctx.soldSlotRow != null && ctx.soldSlotCol != null) {
                return { restocks: [{ row: ctx.soldSlotRow, col: ctx.soldSlotCol }] };
            }
            return {};
        },
    },
    {
        id: "shelf-life",
        name: "Shelf Life",
        description: "Unsold items gain +2¢ price next round",
        rarity: "common",
        trigger: "passive",
        resolve: () => ({}), // Handled in round transition
    },
    {
        id: "overstock",
        name: "Overstock",
        description: "Start round with 1 extra random item",
        rarity: "uncommon",
        trigger: "round-start",
        resolve: () => ({}), // Handled in prep phase
    },
    {
        id: "express-delivery",
        name: "Express Delivery",
        description: "Restock effects trigger twice",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({}), // Handled by restock resolution
    },
    {
        id: "clearance-sale",
        name: "Clearance Sale",
        description: "Empty slots generate 2¢ each at round end",
        rarity: "common",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.emptySlots * 2 }),
    },
    {
        id: "phoenix-restock",
        name: "Phoenix Restock",
        description: "Featured item always restocks after selling",
        rarity: "legendary",
        trigger: "on-sale",
        resolve: (ctx) => {
            const feat = ctx.machine.slots.find(s => s.featured);
            if (feat && feat.position.row === ctx.soldSlotRow && feat.position.col === ctx.soldSlotCol) {
                return { restocks: [{ row: ctx.soldSlotRow!, col: ctx.soldSlotCol! }] };
            }
            return {};
        },
    },

    // ── CUSTOMER (69-78) ──────────────────────────────────
    {
        id: "welcome-mat",
        name: "Welcome Mat",
        description: "+1 customer per round",
        rarity: "common",
        trigger: "passive",
        resolve: () => ({ addCustomers: 1 }),
    },
    {
        id: "vip-lounge",
        name: "VIP Lounge",
        description: "+1 premium customer (buys anything)",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({ addCustomers: 1, addBuyChance: 0.05 }),
    },
    {
        id: "regular-customer",
        name: "Regular",
        description: "1 customer always buys featured item",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({}), // Handled in customer AI
    },
    {
        id: "crowd-pleaser",
        name: "Crowd Pleaser",
        description: "Each sale +10% chance of bonus customer",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: () => ({ addCustomers: Math.random() < 0.10 ? 1 : 0 }),
    },
    {
        id: "word-of-mouth",
        name: "Word of Mouth",
        description: "+1 customer per 3 sales",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCustomers: ctx.salesThisRound > 0 && ctx.salesThisRound % 3 === 0 ? 1 : 0 }),
    },
    {
        id: "influencer",
        name: "Influencer",
        description: "Featured item sales ×2",
        rarity: "rare",
        trigger: "on-sale",
        resolve: (ctx) => {
            const feat = ctx.machine.slots.find(s => s.featured);
            const isFeatured = feat && feat.position.row === ctx.soldSlotRow && feat.position.col === ctx.soldSlotCol;
            return { mult: isFeatured ? 2 : 1 };
        },
    },
    {
        id: "window-display",
        name: "Window Display",
        description: "Row 1 items +25% buy chance",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({ addBuyChance: 0.05 }), // Simplified global bonus
    },
    {
        id: "happy-hour",
        name: "Happy Hour",
        description: "First 3 customers +50% buy chance",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => ({ addBuyChance: ctx.salesThisRound < 3 ? 0.5 : 0 }),
    },
    {
        id: "bouncer",
        name: "Bouncer",
        description: "Kicks do 2 less damage",
        rarity: "common",
        trigger: "passive",
        resolve: () => ({ damageReduction: 2 }),
    },
    {
        id: "tip-jar",
        name: "Tip Jar",
        description: "+2¢ per sale (tips!)",
        rarity: "common",
        trigger: "on-sale",
        resolve: () => ({ addCoins: 2 }),
    },

    // ── MACHINE (79-88) ───────────────────────────────────
    {
        id: "armor-plating",
        name: "Armor Plating",
        description: "+3 max HP",
        rarity: "common",
        trigger: "passive",
        resolve: () => ({ maxHpBonus: 3 }),
    },
    {
        id: "self-repair",
        name: "Self-Repair",
        description: "Heal 2 HP per round",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: () => ({ hpHeal: 2 }),
    },
    {
        id: "reinforced",
        name: "Reinforced",
        description: "30% chance to ignore a kick",
        rarity: "uncommon",
        trigger: "on-kick",
        resolve: () => ({ kickChanceMult: Math.random() < 0.3 ? 0 : 1 }),
    },
    {
        id: "lucky-machine",
        name: "Lucky Machine",
        description: "10% chance any sale → double coins",
        rarity: "rare",
        trigger: "on-sale",
        resolve: () => ({ mult: Math.random() < 0.10 ? 2 : 1 }),
    },
    {
        id: "neon-sign",
        name: "Neon Sign",
        description: "+2 customers per round",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({ addCustomers: 2 }),
    },
    {
        id: "temperature-control",
        name: "Temperature Control",
        description: "Drinks +3¢",
        rarity: "common",
        trigger: "on-sale",
        resolve: (ctx) => ({ addCoins: ctx.soldItemType === "drink" ? 3 : 0 }),
    },
    {
        id: "alarm-system",
        name: "Alarm System",
        description: "After a kick, next sale ×1.5",
        rarity: "rare",
        trigger: "on-sale",
        resolve: (ctx) => ({ mult: ctx.kicks > 0 && ctx.salesThisRound === 0 ? 1.5 : 1 }),
    },
    {
        id: "turbo-dispense",
        name: "Turbo Dispense",
        description: "+3 customers per round",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({ addCustomers: 3 }),
    },
    {
        id: "extended-warranty",
        name: "Extended Warranty",
        description: "Repair costs halved",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({}), // Handled in repair logic
    },
    {
        id: "shock-absorber",
        name: "Shock Absorber",
        description: "All kick damage -3",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({ damageReduction: 3 }),
    },

    // ── COMBO (89-98) ─────────────────────────────────────
    {
        id: "combo-king",
        name: "Combo King",
        description: "All combos +5¢",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.combosTriggered * 5 }),
    },
    {
        id: "chain-reaction",
        name: "Chain Reaction",
        description: "+1 customer per combo",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCustomers: ctx.combosTriggered }),
    },
    {
        id: "double-down",
        name: "Double Down",
        description: "25% chance combo triggers twice",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.combosTriggered > 0 && Math.random() < 0.25 ? ctx.combosTriggered * 5 : 0 }),
    },
    {
        id: "synergy",
        name: "Synergy",
        description: "Neighboring same-type slots +2¢ each sale",
        rarity: "uncommon",
        trigger: "on-sale",
        resolve: (ctx) => {
            if (ctx.soldSlotRow == null || ctx.soldSlotCol == null || !ctx.soldItemType) return {};
            const adj = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            let bonus = 0;
            for (const [dr, dc] of adj) {
                const s = ctx.machine.slots.find(sl => sl.position.row === ctx.soldSlotRow! + dr && sl.position.col === ctx.soldSlotCol! + dc);
                if (s?.item?.tags.includes(ctx.soldItemType)) bonus += 2;
            }
            return { addCoins: bonus };
        },
    },
    {
        id: "pattern-master",
        name: "Pattern Master",
        description: "Row of same type ×2",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => {
            let mult = 1;
            for (let r = 0; r < 3; r++) {
                const rowSlots = ctx.machine.slots.filter(s => s.position.row === r && s.unlocked && s.item);
                if (rowSlots.length === 3) {
                    const type = rowSlots[0].item!.tags[0];
                    if (rowSlots.every(s => s.item!.tags[0] === type)) mult *= 2;
                }
            }
            return { mult };
        },
    },
    {
        id: "mix-master",
        name: "Mix Master",
        description: "Row of all different types ×1.5",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => {
            let mult = 1;
            for (let r = 0; r < 3; r++) {
                const rowSlots = ctx.machine.slots.filter(s => s.position.row === r && s.unlocked && s.item);
                if (rowSlots.length === 3) {
                    const types = new Set(rowSlots.map(s => s.item!.tags[0]));
                    if (types.size === 3) mult *= 1.5;
                }
            }
            return { mult };
        },
    },
    {
        id: "cascade",
        name: "Cascade",
        description: "+5¢ per combo triggered",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.combosTriggered * 5 }),
    },
    {
        id: "perfectionist",
        name: "Perfectionist",
        description: "3+ combos in a round: +15¢",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.combosTriggered >= 3 ? 15 : 0 }),
    },
    {
        id: "streak-breaker",
        name: "Streak Breaker",
        description: "3+ sales without combo → next combo ×4",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => {
            if (ctx.totalSold >= 3 && ctx.combosTriggered > 0) {
                return { mult: 1 + (ctx.totalSold / Math.max(1, ctx.combosTriggered)) * 0.5 };
            }
            return {};
        },
    },
    {
        id: "bonus-round",
        name: "Bonus Round",
        description: "Every 3rd combo gives +10¢",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: Math.floor(ctx.combosTriggered / 3) * 10 }),
    },

    // ── META (99-110) ─────────────────────────────────────
    {
        id: "copy-cat",
        name: "Copy Cat",
        description: "Copies the first sticker's effect",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => {
            const first = ctx.stickers.find(s => s.defId !== "copy-cat");
            if (!first) return {};
            const def = STICKER_DEFS.find(d => d.id === first.defId);
            return def ? def.resolve(ctx) : {};
        },
    },
    {
        id: "amplifier",
        name: "Amplifier",
        description: "All flat ¢ bonuses from stickers +50%",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({}), // Handled by the scoring engine
    },
    {
        id: "catalyst",
        name: "Catalyst",
        description: "All ×mult from stickers +0.2",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({}), // Handled by the scoring engine
    },
    {
        id: "collector",
        name: "Collector",
        description: "+3¢ per sticker owned",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.stickerCount * 3 }),
    },
    {
        id: "minimalist",
        name: "Minimalist",
        description: "Only 1 sticker? All effects ×3",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: ctx.stickerCount === 1 ? 3 : 1 }),
    },
    {
        id: "junkyard",
        name: "Junkyard",
        description: "Sticker sell values +8¢",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({}), // Handled by sell value calc
    },
    {
        id: "recycle-bin",
        name: "Recycle Bin",
        description: "Selling a sticker gives a free blind box",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({}), // Handled by sell logic
    },
    {
        id: "haunted-machine",
        name: "Haunted Machine",
        description: "Random item vanishes each round, but ×1.3 all sales",
        rarity: "legendary",
        trigger: "scoring",
        resolve: () => ({ mult: 1.3 }),
    },
    {
        id: "chaos-theory",
        name: "Chaos Theory",
        description: "Randomize prices ±3¢, +25% buy chance",
        rarity: "rare",
        trigger: "passive",
        resolve: () => ({ addBuyChance: 0.25 }),
    },
    {
        id: "jackpot",
        name: "Jackpot",
        description: "2% chance per sale: +25¢",
        rarity: "legendary",
        trigger: "on-sale",
        resolve: () => ({ addCoins: Math.random() < 0.02 ? 25 : 0 }),
    },
    {
        id: "infinite-loop",
        name: "Infinite Loop",
        description: "Each sticker ×1.05 to all mults (stacks!)",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: Math.pow(1.05, ctx.stickerCount) }),
    },
    {
        id: "dumpster-diver",
        name: "Dumpster Diver",
        description: "Trashing items gives 50% refund instead of 10%",
        rarity: "uncommon",
        trigger: "passive",
        resolve: () => ({}), // Handled by trash logic
    },

    // ── ABUSABLE / LEGENDARY (111-120) ────────────────────
    {
        id: "midas-touch",
        name: "Midas Touch",
        description: "Every sale ×1.1 (stacks with everything)",
        rarity: "legendary",
        trigger: "on-sale",
        resolve: () => ({ mult: 1.1 }),
    },
    {
        id: "black-hole",
        name: "Black Hole",
        description: "Empty slots generate ×0.3 per empty slot",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: 1 + ctx.emptySlots * 0.3 }),
    },
    {
        id: "singularity",
        name: "Singularity",
        description: "If you have 50+ coins: ×1.5. 100+: ×2. 200+: ×3",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => {
            if (ctx.coins >= 200) return { mult: 3 };
            if (ctx.coins >= 100) return { mult: 2 };
            if (ctx.coins >= 50) return { mult: 1.5 };
            return {};
        },
    },
    {
        id: "ouroboros",
        name: "Ouroboros",
        description: "Gains +3¢ bonus permanently each round held",
        rarity: "legendary",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.roundsHeld * 3 }),
    },
    {
        id: "glass-cannon",
        name: "Glass Cannon",
        description: "×3 all sales, but kicks do double damage",
        rarity: "legendary",
        trigger: "scoring",
        resolve: () => ({ mult: 3, damageReduction: -10 }),
    },
    {
        id: "rubber-band",
        name: "Rubber Band",
        description: "The fewer coins you have, the bigger the mult. ×(30/coins) caps ×6",
        rarity: "legendary",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: Math.max(1, Math.min(6, 30 / Math.max(1, ctx.coins))) }),
    },
    {
        id: "perpetual-motion",
        name: "Perpetual Motion",
        description: "All sold items have 40% restock chance",
        rarity: "legendary",
        trigger: "on-sale",
        resolve: (ctx) => {
            if (Math.random() < 0.4 && ctx.soldSlotRow != null && ctx.soldSlotCol != null) {
                return { restocks: [{ row: ctx.soldSlotRow, col: ctx.soldSlotCol }] };
            }
            return {};
        },
    },
    {
        id: "supernova",
        name: "Supernova",
        description: "If 7+ items sell: ×5. Destroys itself after.",
        rarity: "legendary",
        trigger: "round-end",
        resolve: (ctx) => ({ mult: ctx.totalSold >= 7 ? 5 : 1 }),
    },
    {
        id: "antimatter",
        name: "Antimatter",
        description: "Negative editions get ×2 bonus on top of their effect",
        rarity: "legendary",
        trigger: "passive",
        resolve: () => ({}), // Handled by edition resolution
    },

    // ── SCALING ECONOMY (121-128) ─────────────────────────
    {
        id: "savings-account",
        name: "Savings Account",
        description: "+1¢ end of round, +1¢ more each round held",
        rarity: "common",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: 1 + ctx.roundsHeld }),
    },
    {
        id: "dividend",
        name: "Dividend",
        description: "+2¢ end of round, +2¢ more each round held",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: 2 + ctx.roundsHeld * 2 }),
    },
    {
        id: "trust-fund",
        name: "Trust Fund",
        description: "+3¢ end of round, +3¢ more each round held",
        rarity: "rare",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: 3 + ctx.roundsHeld * 3 }),
    },
    {
        id: "wealth-tax",
        name: "Wealth Tax",
        description: "+1¢ per 15¢ you own at end of round",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: Math.floor(ctx.coins / 15) }),
    },
    {
        id: "synergy-engine",
        name: "Synergy Engine",
        description: "×1.1 mult per sticker you own",
        rarity: "rare",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: 1 + ctx.stickerCount * 0.1 }),
    },
    {
        id: "profit-margin",
        name: "Profit Margin",
        description: "×1.1 mult for every 3 items sold this round",
        rarity: "uncommon",
        trigger: "scoring",
        resolve: (ctx) => ({ mult: 1 + Math.floor(ctx.totalSold / 3) * 0.1 }),
    },
    {
        id: "hedge-fund",
        name: "Hedge Fund",
        description: "+5¢ per round held × profit streak (max streak 5)",
        rarity: "legendary",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: 5 * ctx.roundsHeld * Math.min(ctx.profitStreak, 5) }),
    },
    {
        id: "market-cap",
        name: "Market Cap",
        description: "+1¢ per sticker owned per round held",
        rarity: "uncommon",
        trigger: "round-end",
        resolve: (ctx) => ({ addCoins: ctx.stickerCount * ctx.roundsHeld }),
    },
];

export const getStickerDef = (id: string): StickerDef | undefined =>
    STICKER_DEFS.find(d => d.id === id);
