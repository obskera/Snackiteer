# Tile Matrix Prompt Recipes

Genre-oriented prompt templates with expected output shapes for AI-assisted room template generation.

## Recipe 1: Simple rectangular room (variable size)

```txt
Generate a [W]x[H] rectangular room template.
Use wall (w) perimeter with floor (.) interior.
Place a door (d) on the south wall center.
Overlay: P at north center, E at room center.
Format: um-room-template-v1 JSON.
Constraints:
- Use only default legend codes.
- Deterministic JSON with matching dimensions.
```

Expected output:

- `tileMatrix` has `w` border, `.` interior, `d` at `(width/2, height-1)`.
- `overlayMatrix` has `P` at `(width/2, 1)` and `E` at center.
- `tileLegend` includes entries for `w`, `.`, and `d`.
- Width and height fields match actual matrix dimensions.

## Recipe 2: L-shaped corridor

```txt
Generate a room template for an L-shaped corridor.
The corridor goes 3 tiles wide, first heading south for 5 tiles,
then turning east for 4 tiles.
Use walls on the outer edges, floor interior.
Doors at both open ends.
Format: um-room-template-v1 JSON.
Constraints:
- Use w for all walls and . for floor.
- Use d for door tiles at the corridor endpoints.
- Fill unused space (outside the L) with x (blocker).
- Overlay: P at the north entrance, O at the east exit.
```

Expected output:

- Non-rectangular L-shape represented in a rectangular matrix using `x` for void space.
- Corridor is 3 tiles wide in both directions.
- `d` at the north and east openings.
- `P` and `O` at the respective ends.
- All dimensions declared correctly.

## Recipe 3: Boss arena with pillars

```txt
Generate a 9x9 boss arena template.
Features:
- Edge perimeter using tl/te/tr/le/re/bl/be/br codes.
- Four wall (w) pillar blocks at positions (2,2), (6,2), (2,6), (6,6).
- Door (d) at south center (4,8) replacing be.
- Floor (.) everywhere else inside.
Overlay:
- P at (4,7) — just inside the south door.
- E at (4,4) — boss at center.
- I at (1,1) and (7,7) — loot in corners.
Format: um-room-template-v1 JSON.
Constraints:
- Use only default legend codes.
- Overlay must be 9x9 matching tile matrix.
```

Expected output:

- 9×9 matrix with proper edge perimeter.
- 4 `w` tiles at symmetric positions.
- `d` replacing the bottom-center edge tile.
- Overlay has exactly 4 non-`.` markers at specified coordinates.
- Legend includes entries for all used codes.

## Recipe 4: Trap gauntlet room

```txt
Generate a 5x9 trap gauntlet room template.
Layout:
- Wall perimeter.
- Alternating rows of spikes (sp) and floor (.) inside.
- Pressure plates (pr) at the start and end of each spike row.
- Door (d) at north and south center.
Overlay:
- P at south door.
- I at north end (reward for surviving).
Format: um-room-template-v1 JSON.
Constraints:
- Use only default legend codes.
- Spike rows at y=2, y=4, y=6 (interior rows).
- Floor rows at y=1, y=3, y=5, y=7.
```

Expected output:

- 5×9 matrix with clear spike/floor alternation.
- `pr` flanking each spike row.
- `d` at (2,0) and (2,8).
- Overlay: `P` at (2,8), `I` at (2,1).
- All codes resolve against default legend.

## Recipe 5: Outdoor terrain area

```txt
Generate an 8x6 outdoor area template.
Features:
- Grass (g) base floor everywhere.
- A 2x2 water (wa) pond near the center.
- Sand (sn) tiles along the bottom row.
- A single lava (la) tile as a hazard.
- No walls — this is an open area.
Overlay:
- P at (0,0).
- Three E markers scattered in the east half.
- O at (7,5).
Format: um-room-template-v1 JSON.
Constraints:
- Use only default legend codes.
- No wall or edge tiles.
```

Expected output:

- 8×6 matrix composed entirely of terrain tiles.
- Water tiles form a 2×2 block.
- Sand along row 5.
- Single lava tile.
- Legend includes `g`, `wa`, `sn`, `la`.
- Overlay has `P`, three `E`, and `O`.

## Recipe 6: Custom tile extension

```txt
Generate a 5x5 room template that uses a custom tile for a magic portal.
Custom tile: code "mp", tileId 50, label "Magic Portal", category "special".
Layout:
- Wall perimeter.
- mp at center (2,2).
- Floor elsewhere inside.
Overlay: P at (1,3), O at center (on the portal).
Format: um-room-template-v1 JSON.
Constraints:
- Include the custom tile in tileLegend.entries alongside the default codes used.
- Do not invent other custom codes.
```

Expected output:

- `tileLegend.entries` includes `{ "code": "mp", "tileId": 50, "label": "Magic Portal", "category": "special" }` alongside `w` and `.` entries.
- `tileMatrix[2][2]` is `"mp"`.
- Template validates successfully because the legend covers all used codes.

## See also

- [AI Quickstart](./TILE_MATRIX_AI_QUICKSTART.md)
- [AI Prompt Cheatsheet](./TILE_MATRIX_PROMPT_CHEATSHEET.md)
- [Tile Matrix JSON Spec](../tools/TILE_MATRIX_SPEC.md)
- [Tile Matrix Editor Guide](../tools/TILE_MATRIX_EDITOR.md)
