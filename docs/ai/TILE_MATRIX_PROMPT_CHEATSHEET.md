# Tile Matrix Prompt Cheatsheet

Copy/paste prompts for common room-template authoring goals.

## Starter prompts

### Simple walled room

```txt
Create a [W]x[H] walled room template.
Use `w` for walls, `.` for floor.
Add a `P` player start and one `E` enemy in the overlay.
Format: um-room-template-v1 JSON.
Constraints:
- Use only default legend codes.
- Overlay dimensions must match tile dimensions.
- Return JSON only.
```

### Room with edges and corners

```txt
Create a [W]x[H] room template using edge codes.
Use `tl/te/tr/le/re/bl/be/br` for edges and `.` for interior floor.
Include overlay with `P` at bottom-left and `O` at center.
Format: um-room-template-v1 JSON.
Constraints:
- Use only default legend codes.
- Match declared width/height to actual matrix dimensions.
```

### Corridor / hallway

```txt
Create a [W]x[H] vertical corridor template.
Walls on left and right columns, floor in the center, doors at both ends.
No overlay entities.
Format: um-room-template-v1 JSON.
```

### Treasure room

```txt
Create a [W]x[H] treasure room template.
Walls/edges around the perimeter, floor interior.
Place `ch` (chest spots) in the center area.
Overlay: `P` at entrance, `I` at each chest, `E` guarding.
Format: um-room-template-v1 JSON.
```

## Genre-specific prompts

### Dungeon room with traps

```txt
Create a 7x7 dungeon room template.
Features:
- Edge perimeter (tl/te/tr/le/re/bl/be/br)
- Spike tiles (sp) forming a pattern on the floor
- Pressure plates (pr) near the spikes
- Door (d) on the south wall center
Overlay: P at north center, E at south-east, I at south-west.
Format: um-room-template-v1 JSON.
Use only default legend codes.
```

### Open field encounter

```txt
Create an 8x6 outdoor encounter area.
Features:
- All grass (g) floor tiles
- A few water (wa) tiles forming a small pond
- Sand (sn) border along the south edge
Overlay: P at west, three E markers scattered, O at east center.
Format: um-room-template-v1 JSON.
```

### Puzzle room with switches

```txt
Create a 5x5 puzzle room template.
Features:
- Walled perimeter with a door (d) on the east wall
- Two switches (sw) and two pressure plates (pr) on the floor
- A pit (p) blocking direct path to the exit
Overlay: P at south-west, I near the switches.
Format: um-room-template-v1 JSON.
```

### Boss arena

```txt
Create a 9x9 boss arena template.
Features:
- Edge perimeter with doors on north and south center
- Open floor interior
- Four pillar walls (w) placed symmetrically for cover
Overlay: P at south door, single E at center (boss), I in two corners.
Format: um-room-template-v1 JSON.
```

### Ice sliding puzzle

```txt
Create a 7x7 ice puzzle room.
Features:
- Wall perimeter
- Most floor is ice (ic) — characters slide across
- A few normal floor (.) tiles as stopping points
- Blocker (x) tiles as obstacles
Overlay: P at entrance, O at far corner.
Format: um-room-template-v1 JSON.
```

## Repair prompts

### Fix unknown tile codes

```txt
The template failed validation with these errors:
[paste errors]
Fix only the unknown tile codes by replacing them with valid default legend codes.
Do not change dimensions, overlay, or unrelated fields.
Return corrected JSON only.
```

### Fix dimension mismatch

```txt
The template failed validation:
"Declared width X does not match tile matrix column count Y."
Fix the width/height fields to match the actual matrix dimensions.
Do not alter the matrix content.
Return corrected JSON only.
```

### Fix overlay alignment

```txt
The template failed validation:
"Overlay dimensions do not match tile matrix dimensions."
Fix the overlay matrix to have exactly [W] columns and [H] rows.
Use "." for any new cells.
Do not change the tile matrix.
Return corrected JSON only.
```

### Fix missing legend entries

```txt
The template uses custom tile codes not in the default legend.
Add the missing entries to tileLegend.entries with appropriate tileId, label, and category values.
Do not change existing entries or the matrix content.
Return corrected JSON only.
```

## Mandatory validation footer

Append this to every generation prompt:

```txt
Validation:
1) Verify all tile codes exist in the legend
2) Verify width/height match actual matrix dimensions
3) Verify overlay dimensions match tile dimensions
4) Import into tile matrix editor and confirm "Valid."
```

## See also

- [AI Quickstart](./TILE_MATRIX_AI_QUICKSTART.md)
- [AI Prompt Recipes](./TILE_MATRIX_PROMPT_RECIPES.md)
- [Tile Matrix JSON Spec](../tools/TILE_MATRIX_SPEC.md)
