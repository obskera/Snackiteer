import type { PackDef } from "./snackTypes";

/** Themed packs — some hint at recipe combos, some are value plays. */
export const PACK_DEFS: PackDef[] = [
    // ── Combo-hinting packs ──────────────────────────────
    {
        id: "movie-night-starter",
        name: "Movie Night Starter",
        contents: ["soda-can", "chips-bag"],
        quality: null,
        costMult: 0.85,
        hint: "Popcorn not included. 🎬",
    },
    {
        id: "sugar-rush-starter",
        name: "Sugar Rush Starter",
        contents: ["candy-bar", "soda-can"],
        quality: null,
        costMult: 0.85,
        hint: "Dentists hate this deal. 🍬",
    },
    {
        id: "gamer-fuel-starter",
        name: "Gamer Fuel Starter",
        contents: ["energy-drink", "candy-bar"],
        quality: null,
        costMult: 0.85,
        hint: "For marathon sessions. 🎮",
    },
    {
        id: "high-roller-starter",
        name: "High Roller Starter",
        contents: ["gourmet-snack", "energy-drink"],
        quality: null,
        costMult: 0.85,
        hint: "Living on the edge. 🎰",
    },
    {
        id: "crunch-bundle",
        name: "Crunch Bundle",
        contents: ["chips-bag", "gourmet-snack"],
        quality: null,
        costMult: 0.8,
        hint: "Extra crunchy. 🥨",
    },
    // ── Value packs ──────────────────────────────────────
    {
        id: "sweet-sampler",
        name: "Sweet Sampler",
        contents: ["candy-bar", "mystery-box"],
        quality: null,
        costMult: 0.9,
        hint: "A little sweetness. 🍫",
    },
    {
        id: "drink-duo",
        name: "Drink Duo",
        contents: ["soda-can", "energy-drink"],
        quality: null,
        costMult: 0.85,
        hint: "Double the refreshment. 🥤",
    },
    {
        id: "mystery-bundle",
        name: "Mystery Bundle",
        contents: ["mystery-box", "mystery-box"],
        quality: null,
        costMult: 0.75,
        hint: "What could go wrong? 📦",
    },
    {
        id: "full-meal-deal",
        name: "Full Meal Deal",
        contents: ["chips-bag", "soda-can", "candy-bar"],
        quality: null,
        costMult: 0.8,
        hint: "Lunch is served. 🍽️",
    },
];

export const getPackDef = (id: string): PackDef | undefined =>
    PACK_DEFS.find((p) => p.id === id);
