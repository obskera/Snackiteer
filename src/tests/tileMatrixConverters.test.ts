import { describe, expect, it } from "vitest";
import { buildRoomTemplate } from "@/logic/tileMatrix/parser";
import {
    roomTemplateToTileMapPayload,
    roomTemplateToWorldgenInput,
} from "@/logic/tileMatrix/converters";
import { TILE_MAP_PLACEMENT_PAYLOAD_VERSION } from "@/services/tileMapPlacement";

const TILE_TEXT = "tl te tr\nle .  re\nbl be br";
const OVERLAY_TEXT = ".  .  .\n.  P  .\n.  .  E";

function makeTemplate(opts?: { overlay?: boolean }) {
    const { template } = buildRoomTemplate({
        id: "conv-test",
        name: "Converter Test",
        tileText: TILE_TEXT,
        ...(opts?.overlay && { overlayText: OVERLAY_TEXT }),
    });
    return template;
}

describe("roomTemplateToTileMapPayload", () => {
    it("produces a valid um-tilemap-v1 payload", () => {
        const payload = roomTemplateToTileMapPayload(makeTemplate());
        expect(payload.version).toBe(TILE_MAP_PLACEMENT_PAYLOAD_VERSION);
        expect(payload.map).toEqual({ width: 3, height: 3 });
        expect(payload.layers).toHaveLength(1);
        expect(payload.layers[0].tiles).toHaveLength(9);
    });

    it("maps tile codes to correct numeric IDs", () => {
        const payload = roomTemplateToTileMapPayload(makeTemplate());
        const tiles = payload.layers[0].tiles;
        // tl=6, te=4, tr=7, le=3, .=0, re=2, bl=8, be=5, br=9
        expect(tiles[0]).toBe(6); // tl
        expect(tiles[1]).toBe(4); // te
        expect(tiles[2]).toBe(7); // tr
        expect(tiles[3]).toBe(3); // le
        expect(tiles[4]).toBe(0); // .
        expect(tiles[5]).toBe(2); // re
        expect(tiles[6]).toBe(8); // bl
        expect(tiles[7]).toBe(5); // be
        expect(tiles[8]).toBe(9); // br
    });

    it("includes solid tile IDs in collision profile", () => {
        const payload = roomTemplateToTileMapPayload(makeTemplate());
        // Edge tiles (2-9) and wall (1) categories are solid by default
        expect(payload.collisionProfile.solidTileIds.length).toBeGreaterThan(0);
    });

    it("generates overlay entities from overlay matrix", () => {
        const payload = roomTemplateToTileMapPayload(
            makeTemplate({ overlay: true }),
        );
        expect(payload.overlays).toHaveLength(2); // P and E
        const player = payload.overlays.find((o) => o.tag === "player-start");
        expect(player).toBeDefined();
        expect(player!.x).toBe(1);
        expect(player!.y).toBe(1);
        const enemy = payload.overlays.find((o) => o.tag === "enemy");
        expect(enemy).toBeDefined();
        expect(enemy!.x).toBe(2);
        expect(enemy!.y).toBe(2);
    });

    it("produces empty overlays when no overlay matrix", () => {
        const payload = roomTemplateToTileMapPayload(makeTemplate());
        expect(payload.overlays).toEqual([]);
    });

    it("uses custom layer id/name when provided", () => {
        const payload = roomTemplateToTileMapPayload(makeTemplate(), {
            layerId: "floor",
            layerName: "Floor Layer",
        });
        expect(payload.layers[0].id).toBe("floor");
        expect(payload.layers[0].name).toBe("Floor Layer");
        expect(payload.selectedLayerId).toBe("floor");
    });
});

describe("roomTemplateToWorldgenInput", () => {
    it("produces a 2D tile grid", () => {
        const input = roomTemplateToWorldgenInput(makeTemplate());
        expect(input.tiles).toHaveLength(3);
        expect(input.tiles[0]).toHaveLength(3);
        // tiles[y][x] — tl=6 at [0][0]
        expect(input.tiles[0][0]).toBe(6);
        expect(input.tiles[1][1]).toBe(0); // center floor
    });

    it("produces a single room spanning the template", () => {
        const input = roomTemplateToWorldgenInput(makeTemplate());
        expect(input.rooms).toHaveLength(1);
        expect(input.rooms[0]).toEqual({
            x: 0,
            y: 0,
            width: 3,
            height: 3,
            centerX: 1,
            centerY: 1,
        });
    });

    it("extracts spawn anchors from overlay", () => {
        const input = roomTemplateToWorldgenInput(
            makeTemplate({ overlay: true }),
        );
        expect(input.anchors.playerStart).toEqual({
            x: 1,
            y: 1,
            roomIndex: 0,
        });
        expect(input.anchors.enemySpawns).toHaveLength(1);
        expect(input.anchors.enemySpawns![0]).toEqual({
            x: 2,
            y: 2,
            roomIndex: 0,
        });
    });

    it("returns empty anchors when no overlay", () => {
        const input = roomTemplateToWorldgenInput(makeTemplate());
        expect(input.anchors).toEqual({});
    });
});
