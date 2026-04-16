import { describe, expect, it } from "vitest";
import {
    parseTextMatrix,
    validateTileGrid,
    validateOverlayGrid,
    buildRoomTemplate,
    validateRoomTemplate,
} from "@/logic/tileMatrix/parser";
import { DEFAULT_TILE_LEGEND, DEFAULT_ENTITY_LEGEND } from "@/logic/tileMatrix/defaultLegend";
import { ROOM_TEMPLATE_VERSION } from "@/logic/tileMatrix/types";

describe("parseTextMatrix", () => {
    it("parses a simple 3x3 grid", () => {
        const text = "w  w  w\nw  .  w\nw  w  w";
        const result = parseTextMatrix(text);
        expect(result.width).toBe(3);
        expect(result.height).toBe(3);
        expect(result.grid).toEqual([
            ["w", "w", "w"],
            ["w", ".", "w"],
            ["w", "w", "w"],
        ]);
    });

    it("trims leading and trailing blank lines", () => {
        const text = "\n\nw w\n. .\n\n";
        const result = parseTextMatrix(text);
        expect(result.height).toBe(2);
        expect(result.width).toBe(2);
    });

    it("returns empty grid for empty input", () => {
        const result = parseTextMatrix("");
        expect(result.grid).toEqual([]);
        expect(result.width).toBe(0);
        expect(result.height).toBe(0);
    });

    it("handles multi-char codes", () => {
        const text = "tl te tr\nle .  re\nbl be br";
        const result = parseTextMatrix(text);
        expect(result.grid[0]).toEqual(["tl", "te", "tr"]);
        expect(result.grid[1]).toEqual(["le", ".", "re"]);
        expect(result.grid[2]).toEqual(["bl", "be", "br"]);
    });

    it("handles variable whitespace", () => {
        const text = "w   .    w\nw .  w";
        const result = parseTextMatrix(text);
        expect(result.grid[0]).toEqual(["w", ".", "w"]);
        expect(result.grid[1]).toEqual(["w", ".", "w"]);
    });
});

describe("validateTileGrid", () => {
    it("accepts a valid grid with default legend", () => {
        const grid = [
            ["w", "w", "w"],
            ["w", ".", "w"],
            ["w", "w", "w"],
        ];
        const result = validateTileGrid(grid, 3, DEFAULT_TILE_LEGEND);
        expect(result.ok).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("reports unknown codes", () => {
        const grid = [["w", "zz", "w"]];
        const result = validateTileGrid(grid, 3, DEFAULT_TILE_LEGEND);
        expect(result.ok).toBe(false);
        expect(result.errors.some((e) => e.includes('"zz"'))).toBe(true);
    });

    it("reports non-rectangular rows", () => {
        const grid = [
            ["w", "w"],
            ["w", "w", "w"],
        ];
        const result = validateTileGrid(grid, 2, DEFAULT_TILE_LEGEND);
        expect(result.ok).toBe(false);
        expect(result.errors.some((e) => e.includes("Row 1"))).toBe(true);
    });
});

describe("validateOverlayGrid", () => {
    it("accepts a valid overlay with default entity legend", () => {
        const grid = [
            [".", "E", "."],
            ["P", ".", "I"],
        ];
        const result = validateOverlayGrid(grid, 3, DEFAULT_ENTITY_LEGEND);
        expect(result.ok).toBe(true);
    });

    it("reports unknown entity codes", () => {
        const grid = [["P", "Z"]];
        const result = validateOverlayGrid(grid, 2, DEFAULT_ENTITY_LEGEND);
        expect(result.ok).toBe(false);
        expect(result.errors.some((e) => e.includes('"Z"'))).toBe(true);
    });
});

describe("buildRoomTemplate", () => {
    it("builds a valid room template from text", () => {
        const { template, validation } = buildRoomTemplate({
            id: "test-room",
            name: "Test Room",
            tileText: "w w w\nw . w\nw w w",
        });
        expect(validation.ok).toBe(true);
        expect(template.version).toBe(ROOM_TEMPLATE_VERSION);
        expect(template.id).toBe("test-room");
        expect(template.width).toBe(3);
        expect(template.height).toBe(3);
    });

    it("builds with overlay", () => {
        const { template, validation } = buildRoomTemplate({
            id: "overlay-room",
            name: "Overlay Room",
            tileText: "w . w\nw . w",
            overlayText: ". P .\n. . E",
        });
        expect(validation.ok).toBe(true);
        expect(template.overlayMatrix).toBeDefined();
        expect(template.entityLegend).toBeDefined();
    });

    it("reports dimension mismatch between tile and overlay", () => {
        const { validation } = buildRoomTemplate({
            id: "mismatch",
            name: "Mismatch",
            tileText: "w w w\nw . w",
            overlayText: ". P\n. .",
        });
        expect(validation.ok).toBe(false);
        expect(
            validation.errors.some((e) => e.includes("dimensions")),
        ).toBe(true);
    });

    it("reports empty tile matrix", () => {
        const { validation } = buildRoomTemplate({
            id: "empty",
            name: "Empty",
            tileText: "",
        });
        expect(validation.ok).toBe(false);
    });

    it("merges custom tile legend with defaults", () => {
        const { template, validation } = buildRoomTemplate({
            id: "custom-legend",
            name: "Custom",
            tileText: "w zz w",
            tileLegend: {
                entries: [
                    { code: "zz", tileId: 100, label: "Custom Tile", category: "custom" },
                ],
            },
        });
        expect(validation.ok).toBe(true);
        expect(
            template.tileLegend.entries.some((e) => e.code === "zz"),
        ).toBe(true);
        // Defaults still present
        expect(
            template.tileLegend.entries.some((e) => e.code === "w"),
        ).toBe(true);
    });

    it("applies tags and metadata", () => {
        const { template } = buildRoomTemplate({
            id: "tagged",
            name: "Tagged",
            tileText: "w w\nw w",
            tags: ["boss", "dungeon"],
            metadata: { difficulty: 3 },
        });
        expect(template.tags).toEqual(["boss", "dungeon"]);
        expect(template.metadata).toEqual({ difficulty: 3 });
    });
});

describe("validateRoomTemplate", () => {
    it("validates a well-formed template", () => {
        const { template } = buildRoomTemplate({
            id: "valid",
            name: "Valid Room",
            tileText: "tl te tr\nle .  re\nbl be br",
            overlayText: ".  .  .\n.  P  .\n.  .  .",
        });
        const result = validateRoomTemplate(template);
        expect(result.ok).toBe(true);
    });

    it("rejects wrong version", () => {
        const { template } = buildRoomTemplate({
            id: "v",
            name: "V",
            tileText: "w w",
        });
        const bad = { ...template, version: "um-room-template-v99" as never };
        const result = validateRoomTemplate(bad);
        expect(result.ok).toBe(false);
        expect(result.errors.some((e) => e.includes("version"))).toBe(true);
    });

    it("rejects missing id", () => {
        const { template } = buildRoomTemplate({
            id: "x",
            name: "X",
            tileText: "w w",
        });
        const bad = { ...template, id: "" };
        const result = validateRoomTemplate(bad);
        expect(result.ok).toBe(false);
    });

    it("rejects dimension mismatch", () => {
        const { template } = buildRoomTemplate({
            id: "x",
            name: "X",
            tileText: "w w",
        });
        const bad = { ...template, width: 5 };
        const result = validateRoomTemplate(bad);
        expect(result.ok).toBe(false);
    });
});
