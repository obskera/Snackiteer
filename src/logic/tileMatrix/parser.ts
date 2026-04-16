import type {
    TileLegend,
    EntityLegend,
    RoomTemplate,
    TileMatrixValidationResult,
} from "./types";
import { ROOM_TEMPLATE_VERSION } from "./types";
import {
    DEFAULT_TILE_LEGEND,
    DEFAULT_ENTITY_LEGEND,
    buildTileLookup,
    buildEntityLookup,
} from "./defaultLegend";

// ---------------------------------------------------------------------------
// Text matrix parsing
// ---------------------------------------------------------------------------

export type ParsedGrid = {
    grid: string[][];
    width: number;
    height: number;
};

/**
 * Parse a multi-line text block into a 2-D grid of code strings.
 * Each line becomes a row; codes within a line are split on whitespace.
 * Blank leading/trailing lines are trimmed.
 */
export function parseTextMatrix(text: string): ParsedGrid {
    const lines = text
        .split("\n")
        .map((l) => l.trimEnd())
        .filter((_, i, a) => {
            // Trim leading blank lines
            let start = 0;
            while (start < a.length && a[start].trim() === "") start++;
            let end = a.length - 1;
            while (end > start && a[end].trim() === "") end--;
            return i >= start && i <= end;
        });

    if (lines.length === 0) {
        return { grid: [], width: 0, height: 0 };
    }

    const grid = lines.map((line) => line.trim().split(/\s+/));
    const width = grid[0].length;
    const height = grid.length;

    return { grid, width, height };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a parsed grid against a tile legend.
 * Returns errors for unknown codes and non-rectangular rows.
 */
export function validateTileGrid(
    grid: string[][],
    width: number,
    legend: TileLegend,
): TileMatrixValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lookup = buildTileLookup(legend);

    for (let row = 0; row < grid.length; row++) {
        if (grid[row].length !== width) {
            errors.push(
                `Row ${row} has ${grid[row].length} columns, expected ${width}.`,
            );
        }
        for (let col = 0; col < grid[row].length; col++) {
            const code = grid[row][col];
            if (!lookup.has(code)) {
                errors.push(
                    `Unknown tile code "${code}" at row ${row}, col ${col}.`,
                );
            }
        }
    }

    return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validate a parsed overlay grid against an entity legend.
 * "." is always accepted as empty/no-entity.
 */
export function validateOverlayGrid(
    grid: string[][],
    width: number,
    legend: EntityLegend,
): TileMatrixValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lookup = buildEntityLookup(legend);

    for (let row = 0; row < grid.length; row++) {
        if (grid[row].length !== width) {
            errors.push(
                `Overlay row ${row} has ${grid[row].length} columns, expected ${width}.`,
            );
        }
        for (let col = 0; col < grid[row].length; col++) {
            const code = grid[row][col];
            if (code !== "." && !lookup.has(code)) {
                errors.push(
                    `Unknown entity code "${code}" at overlay row ${row}, col ${col}.`,
                );
            }
        }
    }

    return { ok: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// RoomTemplate builder
// ---------------------------------------------------------------------------

export type BuildRoomTemplateOptions = {
    id: string;
    name: string;
    description?: string;
    tileText: string;
    overlayText?: string;
    tileLegend?: TileLegend;
    entityLegend?: EntityLegend;
    tags?: string[];
    metadata?: Record<string, unknown>;
};

/**
 * Build a RoomTemplate from text matrices.
 * Merges the provided legends with the defaults (provided entries win on
 * code collision).
 */
export function buildRoomTemplate(
    options: BuildRoomTemplateOptions,
): { template: RoomTemplate; validation: TileMatrixValidationResult } {
    const tileLegend = mergeTileLegend(
        DEFAULT_TILE_LEGEND,
        options.tileLegend,
    );
    const entityLegend = mergeEntityLegend(
        DEFAULT_ENTITY_LEGEND,
        options.entityLegend,
    );

    const tile = parseTextMatrix(options.tileText);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (tile.height === 0) {
        errors.push("Tile matrix is empty.");
    }

    const tileValidation = validateTileGrid(tile.grid, tile.width, tileLegend);
    errors.push(...tileValidation.errors);
    warnings.push(...tileValidation.warnings);

    let overlayGrid: string[][] | undefined;
    if (options.overlayText) {
        const overlay = parseTextMatrix(options.overlayText);
        const overlayValidation = validateOverlayGrid(
            overlay.grid,
            overlay.width,
            entityLegend,
        );
        errors.push(...overlayValidation.errors);
        warnings.push(...overlayValidation.warnings);

        if (overlay.width !== tile.width || overlay.height !== tile.height) {
            errors.push(
                `Overlay dimensions (${overlay.width}×${overlay.height}) do not match tile matrix (${tile.width}×${tile.height}).`,
            );
        }
        overlayGrid = overlay.grid;
    }

    const template: RoomTemplate = {
        version: ROOM_TEMPLATE_VERSION,
        id: options.id,
        name: options.name,
        ...(options.description != null && { description: options.description }),
        width: tile.width,
        height: tile.height,
        tileMatrix: tile.grid,
        ...(overlayGrid != null && { overlayMatrix: overlayGrid }),
        tileLegend,
        ...(options.overlayText != null && { entityLegend }),
        ...(options.tags && { tags: options.tags }),
        ...(options.metadata && { metadata: options.metadata }),
    };

    return {
        template,
        validation: { ok: errors.length === 0, errors, warnings },
    };
}

// ---------------------------------------------------------------------------
// Full RoomTemplate validation (for imported JSON)
// ---------------------------------------------------------------------------

export function validateRoomTemplate(
    template: RoomTemplate,
): TileMatrixValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (template.version !== ROOM_TEMPLATE_VERSION) {
        errors.push(
            `Expected version "${ROOM_TEMPLATE_VERSION}", got "${template.version}".`,
        );
    }
    if (!template.id) errors.push("Missing template id.");
    if (!template.name) errors.push("Missing template name.");
    if (!template.tileMatrix || template.tileMatrix.length === 0) {
        errors.push("Tile matrix is empty.");
        return { ok: false, errors, warnings };
    }
    if (template.height !== template.tileMatrix.length) {
        errors.push(
            `Declared height ${template.height} does not match tile matrix row count ${template.tileMatrix.length}.`,
        );
    }
    if (template.width !== template.tileMatrix[0].length) {
        errors.push(
            `Declared width ${template.width} does not match tile matrix column count ${template.tileMatrix[0].length}.`,
        );
    }

    const tileResult = validateTileGrid(
        template.tileMatrix,
        template.width,
        template.tileLegend,
    );
    errors.push(...tileResult.errors);
    warnings.push(...tileResult.warnings);

    if (template.overlayMatrix) {
        if (
            template.overlayMatrix.length !== template.height ||
            template.overlayMatrix[0]?.length !== template.width
        ) {
            errors.push(
                "Overlay matrix dimensions do not match tile matrix dimensions.",
            );
        }
        const entityLegend = template.entityLegend ?? DEFAULT_ENTITY_LEGEND;
        const overlayResult = validateOverlayGrid(
            template.overlayMatrix,
            template.width,
            entityLegend,
        );
        errors.push(...overlayResult.errors);
        warnings.push(...overlayResult.warnings);
    }

    return { ok: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Legend merging helpers
// ---------------------------------------------------------------------------

function mergeTileLegend(
    base: TileLegend,
    overrides?: TileLegend,
): TileLegend {
    if (!overrides) return base;
    const map = new Map(base.entries.map((e) => [e.code, e]));
    for (const entry of overrides.entries) {
        map.set(entry.code, entry);
    }
    return { entries: Array.from(map.values()) };
}

function mergeEntityLegend(
    base: EntityLegend,
    overrides?: EntityLegend,
): EntityLegend {
    if (!overrides) return base;
    const map = new Map(base.markers.map((m) => [m.code, m]));
    for (const marker of overrides.markers) {
        map.set(marker.code, marker);
    }
    return { markers: Array.from(map.values()) };
}
