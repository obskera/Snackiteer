import type { RoomTemplate } from "./types";
import type {
    TileMapPlacementPayload,
    TileMapLayerRecord,
    TileMapCollisionProfile,
    TileMapOverlayEntityRecord,
} from "@/services/tileMapPlacement";
import { TILE_MAP_PLACEMENT_PAYLOAD_VERSION } from "@/services/tileMapPlacement";
import type { SeededRoom } from "@/logic/worldgen/seededRoomMap";
import type { GenerateSpawnAnchorsResult } from "@/logic/worldgen/spawnAnchors";
import {
    buildTileLookup,
    buildEntityLookup,
    DEFAULT_ENTITY_LEGEND,
    DEFAULT_SOLID_CATEGORIES,
} from "./defaultLegend";

// ---------------------------------------------------------------------------
// RoomTemplate → TileMapPlacementPayload (um-tilemap-v1)
// ---------------------------------------------------------------------------

export type ToTileMapPayloadOptions = {
    layerId?: string;
    layerName?: string;
    solidCategories?: Set<string>;
};

export function roomTemplateToTileMapPayload(
    template: RoomTemplate,
    options: ToTileMapPayloadOptions = {},
): TileMapPlacementPayload {
    const {
        layerId = "base",
        layerName = "base",
        solidCategories = DEFAULT_SOLID_CATEGORIES,
    } = options;

    const lookup = buildTileLookup(template.tileLegend);

    // Build linear tile array (y * width + x)
    const tiles: number[] = new Array(template.width * template.height).fill(0);
    const solidTileIds = new Set<number>();

    for (let y = 0; y < template.height; y++) {
        for (let x = 0; x < template.width; x++) {
            const code = template.tileMatrix[y]?.[x];
            const entry = code != null ? lookup.get(code) : undefined;
            const tileId = entry?.tileId ?? 0;
            tiles[y * template.width + x] = tileId;

            if (entry?.category && solidCategories.has(entry.category)) {
                solidTileIds.add(tileId);
            }
        }
    }

    const layer: TileMapLayerRecord = {
        id: layerId,
        name: layerName,
        visible: true,
        locked: false,
        tiles,
    };

    // Build overlays from overlay matrix
    const overlays: TileMapOverlayEntityRecord[] = [];
    if (template.overlayMatrix) {
        const entityLegend = template.entityLegend ?? DEFAULT_ENTITY_LEGEND;
        const entityLookup = buildEntityLookup(entityLegend);
        let entityIndex = 0;

        for (let y = 0; y < template.height; y++) {
            for (let x = 0; x < template.width; x++) {
                const code = template.overlayMatrix[y]?.[x];
                if (!code || code === ".") continue;
                const marker = entityLookup.get(code);
                if (!marker) continue;

                overlays.push({
                    id: `${template.id}-entity-${entityIndex++}`,
                    name: marker.name ?? marker.label,
                    type: marker.type,
                    tag: marker.tag,
                    x,
                    y,
                    roomIndex: 0,
                    ...(lookup.get(template.tileMatrix[y]?.[x] ?? "")?.tileId != null && {
                        tileId: lookup.get(template.tileMatrix[y][x])!.tileId,
                    }),
                });
            }
        }
    }

    const collisionProfile: TileMapCollisionProfile = {
        solidLayerIds: [layerId],
        solidLayerNameContains: [],
        solidTileIds: Array.from(solidTileIds),
        fallbackToVisibleNonZero: true,
    };

    return {
        version: TILE_MAP_PLACEMENT_PAYLOAD_VERSION,
        map: { width: template.width, height: template.height },
        selectedLayerId: layerId,
        layers: [layer],
        collisionProfile,
        overlays,
    };
}

// ---------------------------------------------------------------------------
// RoomTemplate → Worldgen input
// ---------------------------------------------------------------------------

export type WorldgenInput = {
    tiles: number[][];
    rooms: SeededRoom[];
    anchors: Partial<GenerateSpawnAnchorsResult>;
};

export function roomTemplateToWorldgenInput(
    template: RoomTemplate,
): WorldgenInput {
    const lookup = buildTileLookup(template.tileLegend);

    // Build 2D tile grid (tiles[y][x])
    const tiles: number[][] = [];
    for (let y = 0; y < template.height; y++) {
        const row: number[] = [];
        for (let x = 0; x < template.width; x++) {
            const code = template.tileMatrix[y]?.[x];
            const entry = code != null ? lookup.get(code) : undefined;
            row.push(entry?.tileId ?? 0);
        }
        tiles.push(row);
    }

    // Single room spanning the entire template
    const room: SeededRoom = {
        x: 0,
        y: 0,
        width: template.width,
        height: template.height,
        centerX: Math.floor(template.width / 2),
        centerY: Math.floor(template.height / 2),
    };

    // Extract entity markers as spawn anchors
    const anchors: Partial<GenerateSpawnAnchorsResult> = {};
    if (template.overlayMatrix) {
        const entityLegend = template.entityLegend ?? DEFAULT_ENTITY_LEGEND;
        const entityLookup = buildEntityLookup(entityLegend);
        const enemySpawns: GenerateSpawnAnchorsResult["enemySpawns"] = [];
        const itemSpawns: GenerateSpawnAnchorsResult["itemSpawns"] = [];

        for (let y = 0; y < template.height; y++) {
            for (let x = 0; x < template.width; x++) {
                const code = template.overlayMatrix[y]?.[x];
                if (!code || code === ".") continue;
                const marker = entityLookup.get(code);
                if (!marker) continue;

                const point = { x, y, roomIndex: 0 };

                switch (marker.tag) {
                    case "player-start":
                        anchors.playerStart = point;
                        break;
                    case "objective":
                        anchors.objective = point;
                        break;
                    case "enemy":
                        enemySpawns.push(point);
                        break;
                    case "item":
                        itemSpawns.push(point);
                        break;
                }
            }
        }

        if (enemySpawns.length > 0) anchors.enemySpawns = enemySpawns;
        if (itemSpawns.length > 0) anchors.itemSpawns = itemSpawns;
    }

    return { tiles, rooms: [room], anchors };
}
