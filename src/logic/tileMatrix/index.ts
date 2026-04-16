// Tile Matrix Editor — public API barrel export
export { ROOM_TEMPLATE_VERSION } from "./types";
export type {
    TileLegendEntry,
    TileLegend,
    EntityMarker,
    EntityLegend,
    RoomTemplate,
    RoomTemplateRegistry,
    TileMatrixValidationResult,
} from "./types";

export {
    DEFAULT_TILE_LEGEND,
    DEFAULT_ENTITY_LEGEND,
    DEFAULT_SOLID_CATEGORIES,
    buildTileLookup,
    buildEntityLookup,
} from "./defaultLegend";

export {
    parseTextMatrix,
    validateTileGrid,
    validateOverlayGrid,
    buildRoomTemplate,
    validateRoomTemplate,
} from "./parser";
export type { ParsedGrid, BuildRoomTemplateOptions } from "./parser";

export {
    roomTemplateToTileMapPayload,
    roomTemplateToWorldgenInput,
} from "./converters";
export type { ToTileMapPayloadOptions, WorldgenInput } from "./converters";

export { createRoomTemplateRegistry } from "./registry";
export type { RoomTemplateRegistryService } from "./registry";
