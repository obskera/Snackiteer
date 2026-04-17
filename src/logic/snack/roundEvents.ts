import type { RoundEventDef } from "./snackTypes";

/** Pool of possible round events. Each round, one is picked at random (or none). */
export const ROUND_EVENT_POOL: RoundEventDef[] = [
    {
        name: "Sweet Tooth Surge",
        description: "+1 customer · +15% buy rate · Sweets boosted",
        boostedMood: "sweet",
        customerDelta: 1,
        sellChanceMult: 1.15,
    },
    {
        name: "Salt Craving Wave",
        description: "+20% buy rate · −15% prices · Salty boosted",
        boostedMood: "salty",
        sellChanceMult: 1.2,
        priceMult: 0.85,
    },
    {
        name: "Energy Rush Hour",
        description: "+1 customer · +25% prices · Energy boosted",
        boostedMood: "energy",
        customerDelta: 1,
        priceMult: 1.25,
    },
    {
        name: "Thirsty Thursday",
        description: "+1 customer · +20% buy rate · Drinks boosted",
        boostedMood: "drink",
        customerDelta: 1,
        sellChanceMult: 1.2,
    },
    {
        name: "Luxury Shoppers",
        description: "+40% prices · Premium boosted",
        boostedMood: "premium",
        priceMult: 1.4,
    },
    {
        name: "Bargain Hunters",
        description: "+3 customers · −40% prices · Cheap boosted",
        boostedMood: "cheap",
        customerDelta: 3,
        priceMult: 0.6,
    },
    {
        name: "Lunch Rush",
        description: "+3 customers · +10% buy rate",
        customerDelta: 3,
        sellChanceMult: 1.1,
    },
    {
        name: "Quiet Morning",
        description: "−2 customers · −70% anger · −5 kick damage",
        customerDelta: -2,
        angerMult: 0.3,
        damageReduction: 5,
    },
    {
        name: "Road Rage Day",
        description: "2× anger · +10% prices",
        angerMult: 2.0,
        priceMult: 1.1,
    },
    {
        name: "Payday",
        description: "+2 customers · −50% anger · +30% prices",
        customerDelta: 2,
        angerMult: 0.5,
        priceMult: 1.3,
    },
    {
        name: "Heat Wave",
        description: "+2 customers · +50% prices · +25% buy rate · Drinks boosted",
        boostedMood: "drink",
        customerDelta: 2,
        priceMult: 1.5,
        sellChanceMult: 1.25,
    },
    {
        name: "Late Night Munchies",
        description: "+2 customers · +25% buy rate",
        customerDelta: 2,
        sellChanceMult: 1.25,
    },
    {
        name: "Health Kick",
        description: "−1 customer · −30% buy rate · −50% anger",
        customerDelta: -1,
        sellChanceMult: 0.7,
        angerMult: 0.5,
    },
    {
        name: "Vending Machine Review Blog",
        description: "+1 customer · +20% prices · +50% anger",
        angerMult: 1.5,
        customerDelta: 1,
        priceMult: 1.2,
    },
    {
        name: "Free Sample Day Nearby",
        description: "−2 customers · −25% buy rate",
        customerDelta: -2,
        sellChanceMult: 0.75,
    },
    {
        name: "Maintenance Day",
        description: "−1 customer · +20 HP restored",
        customerDelta: -1,
        hpRegen: 20,
    },
    {
        name: "Double or Nothing",
        description: "1.8× anger · 2× prices",
        angerMult: 1.8,
        priceMult: 2.0,
    },
    {
        name: "Armored Casing",
        description: "−4 kick damage · +10% buy rate",
        damageReduction: 4,
        sellChanceMult: 1.1,
    },
];

/** No-event chance: ~25%. Otherwise pick a random event. */
export const rollRoundEvent = (round: number): RoundEventDef | null => {
    // No events round 1 so players get a baseline
    if (round <= 1) return null;
    // 25% chance of no event
    if (Math.random() < 0.25) return null;
    return ROUND_EVENT_POOL[Math.floor(Math.random() * ROUND_EVENT_POOL.length)];
};
