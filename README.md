# Snackiteer

Snackiteer is a vending machine roguelike game built for a game jam. Stock your machine, serve demanding customers, and chase combos to stay in business.

## How It Works

The game runs in rounds, each with two phases:

**Prep Phase** -- Open the shop via "Stock Machine" to buy snacks and place them in your 3x3 vending machine grid. Stash extras in the cooler for emergency restocks mid-round. Spend coins on upgrades (more slots, better stock, reinforced machine) before you start serving.

**Serve Phase** -- Customers arrive with visible preferences (sweet, salty, cheap, etc.). Your machine sells matching items automatically. Unsold items age between rounds: Fresh to Vintage (+2c) to Legendary (+4c), but Legendary items risk going Rotten (40% value). Combos trigger based on item arrangement in the grid, awarding bonus coins.

After each round you collect earnings, pay rent (it escalates), and optionally pick stickers -- passive modifiers with edition rarities (Foil, Holo, Chromatix, Negative, Golden) that affect your strategy.

## Game Modes

- **Retirement Fund** -- Accumulate 300c total to win. Take your time and build up.
- **Profiteer** -- Hit an escalating profit target every round for 10 rounds. Miss one and it is game over.

## Losing

- Coins drop below zero (rent is due every round).
- Machine HP hits zero from random events or angry customers.
- Profiteer mode: fail to meet the round's profit target.

## Built With

Ursa Manus Micro Engine using: React 19, TypeScript, Vite.

## Development

```
npm install
npm run dev       # local dev server
npm run test:run  # run tests
```

## Play Online

Deployed automatically to GitHub Pages on push to main:

https://obskera.github.io/Snackiteer/

All Rights Reserved.

Usage is allowed with attribution and a free license from the project owner.
