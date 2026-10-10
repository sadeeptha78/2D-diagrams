# Figure Board

How to use the app is in [USER-GUIDE.md](USER-GUIDE.md).

A Vue 3 editor for compound maths figures. You pick a template, enter or drag its measurements, label the sides, and save the same JSON the drawing is built from.

JSXGraph only draws the figure. The saved document is the source of truth: opening a file or undoing rebuilds the board, and a drag patches the drawing in place.

## Templates

Rectangle, square, right triangle, L, T, U, H, and step, plus uneven T, U, and H templates so one side can change on its own. Each one stores measurements, not loose corners, so resizing keeps every right angle. A square stays square. On an H, the gap above the crossbar and the gap below it are separate heights.

Turn a selected figure clockwise by 45°, 90°, or 180°. Those steps land on 0°, 45°, 90°, 135°, 180°, 225°, 270°, and 315°. The turn is around the center of the figure.

## Labels

Each measurement is calculated from the shape, or typed by hand. A typed label stays as written when the figure changes size. Mark a label given, hidden, or answer. Student view shows hidden and answer labels as `?`. The file still stores the real length.

## Save

The board opens with six figures already drawn: a rectangle, a right triangle, an L, a T, a U, and an H. They are built by the same generators the palette uses. The diagram stays in the browser across a refresh. Download JSON or open a JSON file from the toolbar. **New diagram** asks whether to save before clearing the page. **Save PNG** and **Export SVG** write the shapes, arrows, and numbers, with a small margin, and leave out the empty page around them.

Laravel can replace `src/persistence/storage.js` later. The editor already speaks the version 1 document: `schemaVersion`, `type: "geometry"`, `units`, `viewport`, `objects`, and `annotations`.

## Run

```bash
npm install
npm run dev
```

The dev server listens on port 4317. `npm test` checks the shape geometry. `npm run build` makes a production bundle.
