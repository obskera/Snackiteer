# Tile Matrix Room Template Spec

JSON schema reference for the `um-room-template-v1` payload format used by the tile matrix editor.

## Full Example

```json
{
  "version": "um-room-template-v1",
  "id": "treasure-room-5x5",
  "name": "Treasure Room",
  "description": "A walled room with a central chest, enemy, and player start.",
  "width": 5,
  "height": 5,
  "tileMatrix": [
    ["tl", "te", "te", "te", "tr"],
    ["le", ".",  ".",  ".",  "re"],
    ["le", ".",  "ch", ".",  "re"],
    ["le", ".",  ".",  ".",  "re"],
    ["bl", "be", "be", "be", "br"]
  ],
  "overlayMatrix": [
    [".",  ".",  ".",  ".",  "."],
    [".",  "E",  ".",  ".",  "."],
    [".",  ".",  ".",  ".",  "."],
    [".",  ".",  ".",  "I",  "."],
    [".",  "P",  ".",  ".",  "."]
  ],
  "tileLegend": {
    "entries": [
      { "code": ".",  "tileId": 0,  "label": "Empty / Floor", "category": "floor" },
      { "code": "tl", "tileId": 6,  "label": "Top-Left Corner", "category": "edge" },
      { "code": "te", "tileId": 4,  "label": "Top Edge", "category": "edge" },
      { "code": "tr", "tileId": 7,  "label": "Top-Right Corner", "category": "edge" },
      { "code": "le", "tileId": 3,  "label": "Left Edge", "category": "edge" },
      { "code": "re", "tileId": 2,  "label": "Right Edge", "category": "edge" },
      { "code": "bl", "tileId": 8,  "label": "Bottom-Left Corner", "category": "edge" },
      { "code": "be", "tileId": 5,  "label": "Bottom Edge", "category": "edge" },
      { "code": "br", "tileId": 9,  "label": "Bottom-Right Corner", "category": "edge" },
      { "code": "ch", "tileId": 21, "label": "Chest Spot", "category": "special" }
    ]
  },
  "entityLegend": {
    "markers": [
      { "code": "P", "type": "player", "tag": "player-start", "label": "Player Start" },
      { "code": "E", "type": "enemy",  "tag": "enemy",        "label": "Enemy Spawn" },
      { "code": "I", "type": "object", "tag": "item",         "label": "Item Spawn" }
    ]
  },
  "tags": ["treasure", "5x5", "dungeon"],
  "metadata": { "difficulty": 2 }
}
```

## Field Reference

### version

- **Type:** `"um-room-template-v1"` (literal string)
- **Required:** yes
- Must match the exact version constant. Templates with a different version are rejected by validation.

### id

- **Type:** `string`
- **Required:** yes
- Unique identifier for the template. Used as the registry key and as a prefix for generated entity IDs.
- Convention: `kebab-case`, e.g. `"treasure-room-5x5"`, `"boss-arena-7x7"`.

### name

- **Type:** `string`
- **Required:** yes
- Human-readable display name.

### description

- **Type:** `string`
- **Required:** no
- Optional prose description of the room's purpose or layout.

### width

- **Type:** `number`
- **Required:** yes
- Number of columns in the tile matrix. Must match the actual column count of every row.

### height

- **Type:** `number`
- **Required:** yes
- Number of rows in the tile matrix. Must match `tileMatrix.length`.

### tileMatrix

- **Type:** `string[][]`
- **Required:** yes
- 2D array of tile code strings. Outer array = rows (top to bottom), inner array = columns (left to right).
- Each code must appear in the `tileLegend`.
- All rows must have the same number of columns matching `width`.

### overlayMatrix

- **Type:** `string[][]`
- **Required:** no
- Same dimensions as `tileMatrix`. Each cell is either `"."` (empty) or an entity marker code from `entityLegend`.
- When absent, the room has no authored entity placement.

### tileLegend

- **Type:** `{ entries: TileLegendEntry[] }`
- **Required:** yes
- Maps each code used in `tileMatrix` to a numeric tile ID and metadata.

#### TileLegendEntry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | yes | 1–2 character code used in the matrix |
| `tileId` | `number` | yes | Numeric tile ID for tilemap payload output |
| `label` | `string` | yes | Human-readable tile name |
| `category` | `string` | no | Grouping hint: `"floor"`, `"wall"`, `"edge"`, `"special"`, `"terrain"`, `"hazard"` |

### entityLegend

- **Type:** `{ markers: EntityMarker[] }`
- **Required:** only when `overlayMatrix` is present
- Maps each entity code to a type/tag pair.

#### EntityMarker

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | yes | Single character used in the overlay matrix |
| `type` | `EntityType` | yes | `"player"`, `"enemy"`, or `"object"` |
| `tag` | `SpawnEntityTag` | yes | `"player-start"`, `"objective"`, `"enemy"`, or `"item"` |
| `label` | `string` | yes | Human-readable marker name |
| `name` | `string` | no | Override name for the generated overlay entity record |

### tags

- **Type:** `string[]`
- **Required:** no
- Searchable tags for template discovery. Convention: lowercase, e.g. `["boss", "dungeon", "7x7"]`.

### metadata

- **Type:** `Record<string, unknown>`
- **Required:** no
- Arbitrary key-value pairs for project-specific metadata (difficulty, biome, encounter type, etc.).

## Coordinate Conventions

- **Origin:** top-left corner is `(0, 0)`.
- **X axis:** columns, increasing left to right.
- **Y axis:** rows, increasing top to bottom.
- `tileMatrix[y][x]` and `overlayMatrix[y][x]` follow this convention.
- Linear index (for tilemap payload): `index = y * width + x`.

## Text Matrix Format

When authoring in the tile matrix editor tool, matrices are written as **space-delimited text**:

```
tl te te te tr
le .  .  .  re
le .  ch .  re
le .  .  .  re
bl be be be br
```

Rules:

- One row per line.
- Codes separated by one or more whitespace characters.
- Multi-character codes (e.g. `tl`, `re`, `ch`) are first-class — no special escaping.
- Leading/trailing blank lines are trimmed.
- All rows must have the same number of codes.

## Default Tile Legend

These codes are built-in and available in every template without configuration:

| Code | TileId | Label | Category |
|------|--------|-------|----------|
| `.` | 0 | Empty / Floor | floor |
| `w` | 1 | Wall | wall |
| `re` | 2 | Right Edge | edge |
| `le` | 3 | Left Edge | edge |
| `te` | 4 | Top Edge | edge |
| `be` | 5 | Bottom Edge | edge |
| `tl` | 6 | Top-Left Corner | edge |
| `tr` | 7 | Top-Right Corner | edge |
| `bl` | 8 | Bottom-Left Corner | edge |
| `br` | 9 | Bottom-Right Corner | edge |
| `f` | 10 | Floor (alt) | floor |
| `d` | 11 | Door | special |
| `s` | 12 | Stairs | special |
| `p` | 13 | Pit / Hole | special |
| `wa` | 14 | Water | terrain |
| `la` | 15 | Lava | terrain |
| `g` | 16 | Grass | terrain |
| `sn` | 17 | Sand | terrain |
| `ic` | 18 | Ice | terrain |
| `sp` | 19 | Spikes | hazard |
| `pr` | 20 | Pressure Plate | special |
| `ch` | 21 | Chest Spot | special |
| `sw` | 22 | Switch | special |
| `x` | 99 | Blocker (impassable) | wall |

Templates can extend or override these by including additional entries with the same or new codes in their `tileLegend`.

## Default Entity Legend

| Code | Type | Tag | Label |
|------|------|-----|-------|
| `P` | player | player-start | Player Start |
| `E` | enemy | enemy | Enemy Spawn |
| `I` | object | item | Item Spawn |
| `O` | object | objective | Objective |
| `.` | — | — | Empty (no entity) |

`.` is always treated as empty and does not need to be listed in the entity legend.

## Conversion to TileMapPlacementPayload (um-tilemap-v1)

The converter `roomTemplateToTileMapPayload()` produces a payload compatible with the existing tilemap placement service:

1. A single layer `"base"` is created.
2. Each tile code is resolved via `tileLegend` to its `tileId`. Unknown codes become `0`.
3. The tiles array is flattened to linear order: `index = y * width + x`.
4. Overlay markers are converted to `overlays[]` records with `x`, `y`, `type`, `tag`.
5. Collision profile extracts solid tile IDs from entries with `category` in `["wall", "edge"]`.
6. Entity IDs follow the pattern `"{templateId}-entity-{index}"`.

## Conversion to Worldgen Input

The converter `roomTemplateToWorldgenInput()` produces:

1. A 2D `tiles[y][x]` grid of numeric tile IDs.
2. A single `SeededRoom` spanning the full template dimensions.
3. Overlay markers are mapped to `GenerateSpawnAnchorsResult` fields:
   - `"player-start"` → `playerStart`
   - `"objective"` → `objective`
   - `"enemy"` → `enemySpawns[]`
   - `"item"` → `itemSpawns[]`

## Template Registry

Multiple templates can be stored in a registry:

```json
{
  "version": "um-room-template-v1",
  "templates": [ /* ...RoomTemplate objects... */ ]
}
```

The registry enforces unique `id` values and validates each template on registration.

## Determinism Rules

- `tileMatrix` and `overlayMatrix` row/column order is authoritative.
- Legend entries are merged with defaults; on code collision, the template-provided entry wins.
- Conversion output is fully deterministic for the same input template.
- Export JSON uses stable key order matching the type definition field order.

## Starter Templates

### 3×3 Walled Room

```
w  w  w
w  .  w
w  w  w
```

### 5×5 Room with Edges

```
tl te te te tr
le .  .  .  re
le .  .  .  re
le .  .  .  re
bl be be be br
```

### 3×7 Corridor

```
w  .  w
w  .  w
w  .  w
w  d  w
w  .  w
w  .  w
w  .  w
```

## See also

- [Tile Matrix Editor Operator Guide](./TILE_MATRIX_EDITOR.md)
- [Tile Map Placement Tool](./TILEMAP_TOOL.md)
- [Tool Builder Guide](./TOOL_BUILDER_GUIDE.md)
- [Tool Starter Template](./TOOL_STARTER_TEMPLATE.md)
