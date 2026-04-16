import type { TileLegend, EntityLegend } from "./types";

/**
 * Default tile legend — ~24 built-in codes usable out of the box.
 * Templates can override or extend this set via their own `tileLegend`.
 */
export const DEFAULT_TILE_LEGEND: TileLegend = {
    entries: [
        { code: ".", tileId: 0, label: "Empty / Floor", category: "floor" },
        { code: "w", tileId: 1, label: "Wall", category: "wall" },
        { code: "re", tileId: 2, label: "Right Edge", category: "edge" },
        { code: "le", tileId: 3, label: "Left Edge", category: "edge" },
        { code: "te", tileId: 4, label: "Top Edge", category: "edge" },
        { code: "be", tileId: 5, label: "Bottom Edge", category: "edge" },
        { code: "tl", tileId: 6, label: "Top-Left Corner", category: "edge" },
        { code: "tr", tileId: 7, label: "Top-Right Corner", category: "edge" },
        { code: "bl", tileId: 8, label: "Bottom-Left Corner", category: "edge" },
        { code: "br", tileId: 9, label: "Bottom-Right Corner", category: "edge" },
        { code: "f", tileId: 10, label: "Floor (alt)", category: "floor" },
        { code: "d", tileId: 11, label: "Door", category: "special" },
        { code: "s", tileId: 12, label: "Stairs", category: "special" },
        { code: "p", tileId: 13, label: "Pit / Hole", category: "special" },
        { code: "wa", tileId: 14, label: "Water", category: "terrain" },
        { code: "la", tileId: 15, label: "Lava", category: "terrain" },
        { code: "g", tileId: 16, label: "Grass", category: "terrain" },
        { code: "sn", tileId: 17, label: "Sand", category: "terrain" },
        { code: "ic", tileId: 18, label: "Ice", category: "terrain" },
        { code: "sp", tileId: 19, label: "Spikes", category: "hazard" },
        { code: "pr", tileId: 20, label: "Pressure Plate", category: "special" },
        { code: "ch", tileId: 21, label: "Chest Spot", category: "special" },
        { code: "sw", tileId: 22, label: "Switch", category: "special" },
        { code: "x", tileId: 99, label: "Blocker (impassable)", category: "wall" },
    ],
};

/**
 * Default entity legend — 4 markers for the overlay matrix.
 * "." is reserved as the empty/no-entity marker and is not listed here.
 */
export const DEFAULT_ENTITY_LEGEND: EntityLegend = {
    markers: [
        { code: "P", type: "player", tag: "player-start", label: "Player Start" },
        { code: "E", type: "enemy", tag: "enemy", label: "Enemy Spawn" },
        { code: "I", type: "object", tag: "item", label: "Item Spawn" },
        { code: "O", type: "object", tag: "objective", label: "Objective" },
    ],
};

/** Tile codes that represent solid/blocking tiles by default. */
export const DEFAULT_SOLID_CATEGORIES = new Set(["wall", "edge"]);

/** Build a code→entry lookup map from a TileLegend. */
export function buildTileLookup(
    legend: TileLegend,
): Map<string, (typeof legend.entries)[number]> {
    const map = new Map<string, (typeof legend.entries)[number]>();
    for (const entry of legend.entries) {
        map.set(entry.code, entry);
    }
    return map;
}

/** Build a code→marker lookup map from an EntityLegend. */
export function buildEntityLookup(
    legend: EntityLegend,
): Map<string, (typeof legend.markers)[number]> {
    const map = new Map<string, (typeof legend.markers)[number]>();
    for (const marker of legend.markers) {
        map.set(marker.code, marker);
    }
    return map;
}
