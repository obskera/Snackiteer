# Tile Matrix Editor

Operator guide for the text-based tile matrix room template editor.

## Launch

Open the app in dev mode. The tile matrix editor appears in the prefab examples panel.

## Core Workflow

1. **Set metadata.** Enter template ID, name, optional description and tags.
2. **Write tile matrix.** Type space-delimited tile codes in the tile matrix textarea. One row per line.
3. **Write overlay matrix.** (Optional) Type entity markers in the overlay textarea. Same dimensions as the tile matrix. Use `.` for empty cells.
4. **Review preview.** The live grid renders each cell with a colour based on the tile category. Overlay badges appear on cells with entity markers.
5. **Check validation.** The validation panel shows real-time errors and warnings. Fix any issues before exporting.
6. **Export.** Choose a format and click `Export to text area` or `Export JSON file`.

## Tile Legend Quick Reference

These codes are built-in and work in every template without configuration:

| Code | Label | Category |
|------|-------|----------|
| `.` | Empty / Floor | floor |
| `w` | Wall | wall |
| `re` | Right Edge | edge |
| `le` | Left Edge | edge |
| `te` | Top Edge | edge |
| `be` | Bottom Edge | edge |
| `tl` | Top-Left Corner | edge |
| `tr` | Top-Right Corner | edge |
| `bl` | Bottom-Left Corner | edge |
| `br` | Bottom-Right Corner | edge |
| `f` | Floor (alt) | floor |
| `d` | Door | special |
| `s` | Stairs | special |
| `p` | Pit / Hole | special |
| `wa` | Water | terrain |
| `la` | Lava | terrain |
| `g` | Grass | terrain |
| `sn` | Sand | terrain |
| `ic` | Ice | terrain |
| `sp` | Spikes | hazard |
| `pr` | Pressure Plate | special |
| `ch` | Chest Spot | special |
| `sw` | Switch | special |
| `x` | Blocker (impassable) | wall |

The in-tool legend reference panel shows these with tile IDs in a collapsible table.

## Entity Markers Quick Reference

Used in the overlay matrix:

| Code | Type | Tag | Label |
|------|------|-----|-------|
| `P` | player | player-start | Player Start |
| `E` | enemy | enemy | Enemy Spawn |
| `I` | object | item | Item Spawn |
| `O` | object | objective | Objective |
| `.` | — | — | Empty (no entity) |

## Writing a Tile Matrix

Space-delimited codes, one row per line. Multi-character codes are supported.

Example — a 5×5 room with edges and a central chest:

```
tl te te te tr
le .  .  .  re
le .  ch .  re
le .  .  .  re
bl be be be br
```

Rules:

- All rows must have the same number of codes.
- Every code must exist in the tile legend (built-in or custom).
- Leading/trailing blank lines are ignored.

## Writing an Overlay Matrix

Same dimensions as the tile matrix. Use entity marker codes or `.` for empty:

```
.  .  .  .  .
.  E  .  .  .
.  .  .  .  .
.  .  .  I  .
.  P  .  .  .
```

Rules:

- Dimensions must exactly match the tile matrix.
- Every non-`.` code must exist in the entity legend.
- Multiple entities of the same type are allowed (e.g. multiple `E` markers).

## Custom Legend Entries

Templates can extend the default legend. When building via code:

```ts
buildRoomTemplate({
    id: "custom-room",
    name: "Custom Room",
    tileText: "w  my w\nw  .  w",
    tileLegend: {
        entries: [
            { code: "my", tileId: 100, label: "My Custom Tile", category: "special" },
        ],
    },
});
```

Custom entries are merged with defaults. On code collision, the custom entry wins.

## Export Formats

Three export targets are available:

### RoomTemplate (um-room-template-v1)

The canonical intermediate format. Contains the full template definition including matrices, legends, and metadata. Suitable for storage, sharing, and re-import.

### TileMapPlacementPayload (um-tilemap-v1)

Direct output compatible with the tile map placement service and runtime bootstrap. Produces:
- Single `"base"` layer with tile IDs from the legend
- `overlays[]` array from entity markers
- `collisionProfile` with solid tile IDs extracted from wall/edge categories

### Worldgen Input

Structured for the worldgen system. Produces:
- 2D `tiles[y][x]` grid of numeric tile IDs
- Single `SeededRoom` spanning the template
- Spawn anchor points extracted from entity markers

## Import

Paste or load a `um-room-template-v1` JSON payload. The importer validates the template before applying it to the editor state. Non-RoomTemplate formats are rejected.

## Template Library

Save templates to the in-memory registry and load them back:

1. **Save current to library** — validates and stores the current template (overwrites on duplicate ID).
2. **Load** — click "Load" next to any library entry to populate the editor.
3. **Export library** — exports all templates as a registry JSON payload.
4. **Import library** — imports a registry JSON payload into the library.

The registry is in-memory and resets on page reload. Export to file for persistence.

## Troubleshooting

- **"Unknown tile code" error**: The code in your tile matrix is not in the default legend and no custom legend entry was provided. Check spelling or add a custom entry.
- **"Overlay dimensions do not match" error**: The overlay matrix has a different number of rows or columns than the tile matrix. Ensure both textareas have matching dimensions.
- **"Unknown entity code" error**: The overlay matrix contains a character not in the entity legend. Default markers are `P`, `E`, `I`, `O`, `.`.
- **"Cannot export" error**: Fix all validation errors before exporting.
- **Import says "expected a RoomTemplate"**: Only `um-room-template-v1` format can be imported into the editor. TileMapPlacementPayload or worldgen input cannot be imported directly.

## Accessibility and Keyboard Workflow

- All controls are keyboard-operable via `Tab` / `Shift+Tab` and `Enter` / `Space`.
- Textareas support standard keyboard editing.
- The legend reference panels are collapsible `<details>` elements, keyboard-openable.
- Validation and status messages are visible as text for screen reader compatibility.
- File import/export use standard browser file dialogs.

## Runtime Integration Notes

- Exported `um-tilemap-v1` payloads are directly compatible with `TileMapPlacementService.importPayload()`.
- Exported worldgen input is suitable for use with `createWorldgenScenario()` after wrapping in appropriate options.
- Room templates are designed to feed into future dungeon composition workflows.
- The collision profile auto-generated from wall/edge categories matches the runtime bootstrap's solid-tile extraction logic.

## See also

- [Tile Matrix JSON Spec](./TILE_MATRIX_SPEC.md)
- [Tile Map Placement Tool](./TILEMAP_TOOL.md)
- [Tool Builder Guide](./TOOL_BUILDER_GUIDE.md)
- [AI Quickstart](../ai/TILE_MATRIX_AI_QUICKSTART.md)
- [AI Prompt Cheatsheet](../ai/TILE_MATRIX_PROMPT_CHEATSHEET.md)
