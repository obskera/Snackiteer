import type { EntityType } from "@/logic/entity/Entity";
import type { SpawnEntityTag } from "@/logic/worldgen/dataBusSpawn";

export const ROOM_TEMPLATE_VERSION = "um-room-template-v1" as const;

/** Maps a short text code to a numeric tile ID. */
export type TileLegendEntry = {
    code: string;
    tileId: number;
    label: string;
    category?: string;
};

/** Collection of tile code→tileId mappings used when parsing a text matrix. */
export type TileLegend = {
    entries: TileLegendEntry[];
};

/** Maps a single character in the overlay matrix to an entity type/tag. */
export type EntityMarker = {
    code: string;
    type: EntityType;
    tag: SpawnEntityTag;
    label: string;
    name?: string;
};

/** Collection of entity code→type/tag mappings for the overlay matrix. */
export type EntityLegend = {
    markers: EntityMarker[];
};

/**
 * Canonical room template — the intermediate format produced by the
 * tile-matrix parser. Converters transform this into TileMapPlacementPayload
 * or worldgen input.
 */
export type RoomTemplate = {
    version: typeof ROOM_TEMPLATE_VERSION;
    id: string;
    name: string;
    description?: string;
    width: number;
    height: number;
    tileMatrix: string[][];
    overlayMatrix?: string[][];
    tileLegend: TileLegend;
    entityLegend?: EntityLegend;
    tags?: string[];
    metadata?: Record<string, unknown>;
};

/** Serialisable collection of room templates. */
export type RoomTemplateRegistry = {
    version: typeof ROOM_TEMPLATE_VERSION;
    templates: RoomTemplate[];
};

export type TileMatrixValidationResult = {
    ok: boolean;
    errors: string[];
    warnings: string[];
};
