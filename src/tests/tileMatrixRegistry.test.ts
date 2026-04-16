import { describe, expect, it, beforeEach } from "vitest";
import { createRoomTemplateRegistry } from "@/logic/tileMatrix/registry";
import { buildRoomTemplate } from "@/logic/tileMatrix/parser";
import { ROOM_TEMPLATE_VERSION } from "@/logic/tileMatrix/types";
import type { RoomTemplateRegistryService } from "@/logic/tileMatrix/registry";

function makeValid(id: string) {
    return buildRoomTemplate({
        id,
        name: `Room ${id}`,
        tileText: "w w\nw .",
    }).template;
}

describe("createRoomTemplateRegistry", () => {
    let reg: RoomTemplateRegistryService;

    beforeEach(() => {
        reg = createRoomTemplateRegistry();
    });

    it("registers and retrieves a template", () => {
        const t = makeValid("a");
        const result = reg.register(t);
        expect(result.ok).toBe(true);
        expect(reg.get("a")).toBe(t);
    });

    it("rejects duplicate ids", () => {
        reg.register(makeValid("dup"));
        const result = reg.register(makeValid("dup"));
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toContain("already registered");
    });

    it("lists all registered templates", () => {
        reg.register(makeValid("x"));
        reg.register(makeValid("y"));
        expect(reg.list()).toHaveLength(2);
    });

    it("removes a template", () => {
        reg.register(makeValid("r"));
        expect(reg.remove("r")).toBe(true);
        expect(reg.get("r")).toBeUndefined();
    });

    it("has() checks existence", () => {
        reg.register(makeValid("h"));
        expect(reg.has("h")).toBe(true);
        expect(reg.has("missing")).toBe(false);
    });

    it("clear() removes all", () => {
        reg.register(makeValid("c1"));
        reg.register(makeValid("c2"));
        reg.clear();
        expect(reg.list()).toHaveLength(0);
    });

    describe("export/import", () => {
        it("round-trips through JSON", () => {
            reg.register(makeValid("rt1"));
            reg.register(makeValid("rt2"));
            const json = reg.exportAll({ pretty: true });

            const reg2 = createRoomTemplateRegistry();
            const result = reg2.importAll(json);
            expect(result.ok).toBe(true);
            expect(reg2.list()).toHaveLength(2);
            expect(reg2.get("rt1")).toBeDefined();
            expect(reg2.get("rt2")).toBeDefined();
        });

        it("rejects invalid JSON", () => {
            const result = reg.importAll("{bad json");
            expect(result.ok).toBe(false);
            expect(result.errors[0]).toContain("Invalid JSON");
        });

        it("rejects missing fields", () => {
            const result = reg.importAll(JSON.stringify({ foo: 1 }));
            expect(result.ok).toBe(false);
        });

        it("rejects wrong version", () => {
            const json = JSON.stringify({
                version: "um-room-template-v99",
                templates: [],
            });
            const result = reg.importAll(json);
            expect(result.ok).toBe(false);
            expect(result.errors.some((e) => e.includes("version"))).toBe(true);
        });

        it("export includes version", () => {
            const json = reg.exportAll();
            const parsed = JSON.parse(json);
            expect(parsed.version).toBe(ROOM_TEMPLATE_VERSION);
        });
    });
});
