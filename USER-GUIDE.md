# Figure Board user guide

Figure Board draws compound shapes for maths questions. You pick a template, set the lengths, and save a picture of the diagram.

Open it at [http://localhost:4317/](http://localhost:4317/). In the project folder, `npm run dev` starts the page. If that says the port is already in use, the page is already running, so open the address instead of starting a second copy.

The diagram stays in this browser when you refresh. **Download JSON** keeps a copy you can open later with **Open JSON**.

## The screen

- The top bar names the diagram, sets the units, and holds the tools.
- **Templates** on the left add a shape.
- The middle is the drawing page. Drag empty space to pan. Scroll to zoom.
- **Inspector** on the right changes the shape you have selected.

## Start a blank page

The first visit shows six starter figures. To begin again:

1. Save the picture if you still need it.
2. Click **New diagram**.
3. Choose **Save PNG**, **Don't save**, or **Cancel**.

**Save PNG** asks for a folder, writes the picture, then clears the page. **Don't save** clears the page straight away. **Cancel** leaves the diagram as it is. If you close the save window without choosing a folder, the diagram stays.

**Undo** brings the cleared diagram back. The blank page is named **Untitled figure**. Your units stay as they were.

To remove one shape, click it and press Delete, or use **Delete** in the inspector.

## Add a shape

Click a template. The new shape sits to the right of the ones already on the page, with its measurements already drawn.

| Template | What it is |
| --- | --- |
| Rectangle | Width and height |
| Square | All sides equal |
| Right triangle | Base and height |
| L shape | A rectangle with one corner cut out |
| T shape | The stem stays centred. Changing one side changes the other |
| T, uneven | The left and right of the top bar each have their own length |
| U shape | Open on one side. Both walls stay the same thickness |
| U, uneven | The left wall, right wall, and base each have their own thickness |
| H shape | Both uprights stay the same width |
| H, uneven | The left upright and the right upright each have their own width |
| Step | A staircase |

Click a shape to select it. In the inspector you can type each length. The number is kept when you leave the box or press Enter. The area is shown under the lengths.

You can also drag the shape, or drag a handle. A handle changes a measurement and keeps the right angles.

**Turn 45°**, **Turn 90°**, and **Turn 180°** rotate the selected shape around its centre.

On an L, **Missing corner** chooses which corner is cut out. On a U, **Open side** chooses which side is open. The uneven U opens at the top. Turn it if you need another side.

## H shape heights

An H has three heights that add up to the overall height:

- **Top height** is the gap above the crossbar.
- **Crossbar thickness** is the bar itself.
- **Bottom height** is the gap below the crossbar.

Changing the top height leaves the bottom height as it is, and the overall height becomes the three parts added together. Changing the overall height keeps the crossbar and shares the change between the two gaps.

On **H, uneven**, **Left upright** and **Right upright** change one side only. On the equal H, both uprights change together.

## Arrows and numbers

Click a number, or its row under **Measurements**, to edit that label.

- **Offset** moves the arrow closer to the shape or further away. Negative is toward one side, positive toward the other. It does not change the length.
- **Text across** moves only the number left or right, up to 1 cm.
- **Text up** moves only the number up or down, up to 1 cm.

The arrow stays still while you move the number. Both text sliders start at 0.

**Calculated** writes the length for you, such as `8 cm`. **Typed** keeps whatever you write, even if the shape changes size.

**Given**, **Hidden**, and **Answer** are for the question. **Student view** shows hidden and answer labels as `?`. The file still stores the real length. Click **Editing view** to come back.

**Label size**, next to Units, changes every number on the page. It starts at 15 and can go up to 48. **Save PNG** uses that size. **Undo** puts the old size back.

**Add measurement** puts a length on the shape that is not shown yet. H, U, and L already include the lengths you need for the perimeter and the area, including the lengths along the top.

## Move around the page

- Drag empty page to pan.
- Scroll, **Zoom in**, and **Zoom out** change the view.
- **Fit** puts every shape on the screen.
- **Grid** shows the squares. **Grid on** means the squares are showing.

Zoom and pan are not undone. **Undo** and **Redo** put shapes, lengths, and labels back.

## Save a picture

**Save PNG** and **Export SVG** save the diagram, not the whole page.

The file includes the shapes, the arrows, and the numbers, plus a small margin. Empty space around them is left out. A small shape becomes a picture of that shape. A larger diagram becomes a larger picture. The drawing on the screen does not change.

If **Grid** is on, the file shows only the grid squares inside that margin. An empty page is not saved.

**Save PNG** asks you to choose a folder. The file is a PNG named after the diagram, such as `six-figures.png`. Closing the window without choosing a folder saves nothing.

**Export SVG** downloads the same crop as a vector file.

**Download JSON** saves the diagram so it can be opened again. **Open JSON** loads one of those files.
