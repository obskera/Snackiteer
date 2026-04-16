import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TileMatrixEditorTool from "@/components/examples/TileMatrixEditorTool";

describe("TileMatrixEditorTool", () => {
    it("renders with default title and starter content", () => {
        render(<TileMatrixEditorTool />);
        expect(screen.getByText("Tile matrix editor")).toBeInTheDocument();
        expect(screen.getByLabelText("Tile matrix text")).toBeInTheDocument();
        expect(screen.getByLabelText("Overlay matrix text")).toBeInTheDocument();
    });

    it("shows validation as valid for starter content", () => {
        render(<TileMatrixEditorTool />);
        expect(screen.getByText("Valid.")).toBeInTheDocument();
    });

    it("shows validation error when unknown code is entered", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        const tileArea = screen.getByLabelText("Tile matrix text");
        await user.clear(tileArea);
        await user.type(tileArea, "zz zz");

        expect(screen.getByText(/Unknown tile code/)).toBeInTheDocument();
    });

    it("exports to JSON text area on export click", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        await user.click(
            screen.getByRole("button", { name: "Export to text area" }),
        );

        const output = screen.getByLabelText("Export JSON output");
        expect((output as HTMLTextAreaElement).value).toContain(
            "um-room-template-v1",
        );
    });

    it("switches export format to tilemap payload", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        await user.selectOptions(
            screen.getByRole("combobox"),
            "tilemap-payload",
        );
        await user.click(
            screen.getByRole("button", { name: "Export to text area" }),
        );

        const output = screen.getByLabelText("Export JSON output");
        expect((output as HTMLTextAreaElement).value).toContain("um-tilemap-v1");
    });

    it("switches export format to worldgen input", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        await user.selectOptions(
            screen.getByRole("combobox"),
            "worldgen-input",
        );
        await user.click(
            screen.getByRole("button", { name: "Export to text area" }),
        );

        const output = screen.getByLabelText("Export JSON output");
        const parsed = JSON.parse((output as HTMLTextAreaElement).value);
        expect(parsed.tiles).toBeDefined();
        expect(parsed.rooms).toBeDefined();
    });

    it("saves template to library and loads it back", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        await user.click(
            screen.getByRole("button", { name: "Save current to library" }),
        );

        expect(screen.getByText(/Saved/)).toBeInTheDocument();
        expect(
            screen.getByText("1 templates", { exact: false }),
        ).toBeInTheDocument();

        // Change the ID to something else
        const idInput = screen.getByDisplayValue("my-room");
        await user.clear(idInput);
        await user.type(idInput, "other-room");

        // Load back from library
        await user.click(screen.getByRole("button", { name: "Load" }));

        // ID should be restored
        expect(screen.getByDisplayValue("my-room")).toBeInTheDocument();
    });

    it("renders tile legend reference", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        const legendSummary = screen.getByText(/built-in tile codes/);
        expect(legendSummary).toBeInTheDocument();

        await user.click(legendSummary);
        expect(screen.getByText("Wall")).toBeInTheDocument();
        expect(screen.getByText("Right Edge")).toBeInTheDocument();
    });

    it("renders entity legend reference", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        const entitySummary = screen.getByText(/built-in entity markers/);
        await user.click(entitySummary);
        expect(screen.getByText("Player Start")).toBeInTheDocument();
        expect(screen.getByText("Enemy Spawn")).toBeInTheDocument();
    });

    it("renders the grid preview with correct dimensions", () => {
        render(<TileMatrixEditorTool />);
        // Starter is a 5x5 grid → 25 cells
        const cells = document.querySelectorAll(".TileMatrixEditor__cell");
        expect(cells.length).toBe(25);
    });

    it("shows overlay badges in preview", () => {
        render(<TileMatrixEditorTool />);
        const badges = document.querySelectorAll(
            ".TileMatrixEditor__overlay-badge",
        );
        // Starter overlay has P, E, I → 3 badges
        expect(badges.length).toBe(3);
    });

    it("imports a valid RoomTemplate JSON", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        const importArea = screen.getByLabelText("Import JSON input");
        const template = {
            version: "um-room-template-v1",
            id: "imported-room",
            name: "Imported Room",
            width: 2,
            height: 2,
            tileMatrix: [
                ["w", "w"],
                ["w", "."],
            ],
            tileLegend: {
                entries: [
                    { code: ".", tileId: 0, label: "Floor", category: "floor" },
                    { code: "w", tileId: 1, label: "Wall", category: "wall" },
                ],
            },
        };

        await user.click(importArea);
        await user.paste(JSON.stringify(template));
        await user.click(screen.getByRole("button", { name: "Import JSON" }));

        expect(screen.getByText(/Imported room template/)).toBeInTheDocument();
        expect(screen.getByDisplayValue("imported-room")).toBeInTheDocument();
    });

    it("rejects invalid import JSON", async () => {
        const user = userEvent.setup();
        render(<TileMatrixEditorTool />);

        const importArea = screen.getByLabelText("Import JSON input");
        await user.click(importArea);
        await user.paste("{invalid json");
        await user.click(screen.getByRole("button", { name: "Import JSON" }));

        expect(screen.getByText(/Import failed/)).toBeInTheDocument();
    });

    it("accepts custom title prop", () => {
        render(<TileMatrixEditorTool title="Custom Title" />);
        expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });
});
