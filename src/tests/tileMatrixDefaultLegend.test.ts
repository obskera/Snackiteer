import { describe, expect, it } from "vitest";
import {
    DEFAULT_TILE_LEGEND,
    DEFAULT_ENTITY_LEGEND,
    buildTileLookup,
    buildEntityLookup,
} from "@/logic/tileMatrix/defaultLegend";

describe("DEFAULT_TILE_LEGEND", () => {
    it("has no duplicate codes", () => {
        const codes = DEFAULT_TILE_LEGEND.entries.map((e) => e.code);
        expect(new Set(codes).size).toBe(codes.length);
    });

    it("has no duplicate tileIds", () => {
        const ids = DEFAULT_TILE_LEGEND.entries.map((e) => e.tileId);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("has at least 20 entries", () => {
        expect(DEFAULT_TILE_LEGEND.entries.length).toBeGreaterThanOrEqual(20);
    });

    it("includes floor (.) and wall (w)", () => {
        const codes = DEFAULT_TILE_LEGEND.entries.map((e) => e.code);
        expect(codes).toContain(".");
        expect(codes).toContain("w");
    });

    it("every entry has code, tileId, and label", () => {
        for (const entry of DEFAULT_TILE_LEGEND.entries) {
            expect(entry.code).toBeTruthy();
            expect(typeof entry.tileId).toBe("number");
            expect(entry.label).toBeTruthy();
        }
    });
});

describe("DEFAULT_ENTITY_LEGEND", () => {
    it("has no duplicate codes", () => {
        const codes = DEFAULT_ENTITY_LEGEND.markers.map((m) => m.code);
        expect(new Set(codes).size).toBe(codes.length);
    });

    it("includes P, E, I, O markers", () => {
        const codes = DEFAULT_ENTITY_LEGEND.markers.map((m) => m.code);
        expect(codes).toContain("P");
        expect(codes).toContain("E");
        expect(codes).toContain("I");
        expect(codes).toContain("O");
    });

    it("every marker has code, type, tag, and label", () => {
        for (const marker of DEFAULT_ENTITY_LEGEND.markers) {
            expect(marker.code).toBeTruthy();
            expect(marker.type).toBeTruthy();
            expect(marker.tag).toBeTruthy();
            expect(marker.label).toBeTruthy();
        }
    });
});

describe("buildTileLookup", () => {
    it("returns a map with all entries keyed by code", () => {
        const lookup = buildTileLookup(DEFAULT_TILE_LEGEND);
        expect(lookup.size).toBe(DEFAULT_TILE_LEGEND.entries.length);
        expect(lookup.get("w")?.tileId).toBe(1);
        expect(lookup.get(".")?.tileId).toBe(0);
    });
});

describe("buildEntityLookup", () => {
    it("returns a map with all markers keyed by code", () => {
        const lookup = buildEntityLookup(DEFAULT_ENTITY_LEGEND);
        expect(lookup.size).toBe(DEFAULT_ENTITY_LEGEND.markers.length);
        expect(lookup.get("P")?.tag).toBe("player-start");
    });
});
