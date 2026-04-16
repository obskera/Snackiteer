# Tile Matrix AI Quickstart

Use this guide to generate valid room templates with AI assistance. The tile matrix system uses space-delimited text codes to define room layouts.

## 1) Goal-first prompt pattern

Use this baseline prompt shape:

```txt
Create a [size] room template for [purpose/genre].
Format: um-room-template-v1 JSON.
Constraints:
- Use only codes from the default tile legend.
- Include an overlay matrix with entity placements.
- All rows must have equal column counts matching the declared width.
- Overlay dimensions must match tile dimensions.
Output: RoomTemplate JSON only.
```

## 2) Default tile legend (full reference)

These codes are always available. Do NOT invent codes outside this set unless providing a custom `tileLegend`.

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

## 3) Default entity markers

Use in the `overlayMatrix`. Do NOT invent markers outside this set unless providing a custom `entityLegend`.

| Code | Type | Tag | Label |
|------|------|-----|-------|
| `P` | player | player-start | Player Start |
| `E` | enemy | enemy | Enemy Spawn |
| `I` | object | item | Item Spawn |
| `O` | object | objective | Objective |
| `.` | — | — | Empty (no entity) |

## 4) Required output structure

Every AI-generated template must be valid JSON matching this shape:

```json
{
  "version": "um-room-template-v1",
  "id": "<kebab-case-id>",
  "name": "<Display Name>",
  "width": <number>,
  "height": <number>,
  "tileMatrix": [ ["code", "code", ...], ... ],
  "overlayMatrix": [ [".", "P", ...], ... ],
  "tileLegend": { "entries": [ ... ] },
  "entityLegend": { "markers": [ ... ] },
  "tags": ["tag1", "tag2"]
}
```

## 5) Anti-hallucination constraints

Always include these constraints in your prompt:

- "Use only tile codes from the default legend listed above."
- "Use only entity markers P, E, I, O, or `.`."
- "Do not change the version from `um-room-template-v1`."
- "Ensure `tileMatrix` has exactly `height` rows, each with exactly `width` codes."
- "Ensure `overlayMatrix` has exactly the same dimensions as `tileMatrix`."
- "Return deterministic, pretty-printed JSON only."

## 6) Verification sequence

After generating a template, validate it:

```ts
import { validateRoomTemplate } from "@/logic/tileMatrix";

const result = validateRoomTemplate(template);
if (!result.ok) {
    console.error(result.errors);
}
```

Or use the tile matrix editor tool UI: paste the JSON into the import area and click "Import JSON".

## 7) Output checklist before merge

- [ ] Template validates without errors
- [ ] All tile codes exist in the legend
- [ ] All overlay codes exist in the entity legend or are `.`
- [ ] `width` and `height` match actual matrix dimensions
- [ ] Overlay dimensions match tile dimensions
- [ ] Template ID is unique in the registry

## 8) Fast recovery loop for bad AI output

When output is invalid:

1. Paste the validation error messages into the next prompt.
2. Instruct AI to fix only the specific errors.
3. Re-validate.
4. Repeat until validation passes.

## 9) Worked example

Prompt:

```txt
Create a 3x3 room template for a simple walled closet with
a player start and one item.
Use default legend codes only.
Return um-room-template-v1 JSON.
```

Expected output:

```json
{
  "version": "um-room-template-v1",
  "id": "closet-3x3",
  "name": "Small Closet",
  "width": 3,
  "height": 3,
  "tileMatrix": [
    ["w", "w", "w"],
    ["w", ".", "w"],
    ["w", "d", "w"]
  ],
  "overlayMatrix": [
    [".", ".", "."],
    [".", "P", "."],
    [".", ".", "."]
  ],
  "tileLegend": {
    "entries": [
      { "code": ".", "tileId": 0, "label": "Empty / Floor", "category": "floor" },
      { "code": "w", "tileId": 1, "label": "Wall", "category": "wall" },
      { "code": "d", "tileId": 11, "label": "Door", "category": "special" }
    ]
  },
  "entityLegend": {
    "markers": [
      { "code": "P", "type": "player", "tag": "player-start", "label": "Player Start" }
    ]
  },
  "tags": ["closet", "3x3", "starter"]
}
```

Validation: passes. Width/height match. All codes resolved. Overlay dimensions match.

## 10) Integration paths

After generating a valid template, convert it for runtime use:

```ts
import {
    roomTemplateToTileMapPayload,
    roomTemplateToWorldgenInput,
} from "@/logic/tileMatrix";

// → TileMapPlacementPayload (um-tilemap-v1) for tilemap service
const tilemapPayload = roomTemplateToTileMapPayload(template);

// → Worldgen input for worldgen scenario
const worldgenInput = roomTemplateToWorldgenInput(template);
```

## See also

- [Tile Matrix JSON Spec](../tools/TILE_MATRIX_SPEC.md)
- [Tile Matrix Editor Guide](../tools/TILE_MATRIX_EDITOR.md)
- [AI Prompt Cheatsheet](./TILE_MATRIX_PROMPT_CHEATSHEET.md)
- [AI Prompt Recipes](./TILE_MATRIX_PROMPT_RECIPES.md)
