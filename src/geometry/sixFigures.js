import { emptyDocument } from './document.js'
import { boxSize, createDimension, createShape, defaultMeasurementPresets, diagramBounds } from './shapes.js'

const FIGURES = [
  {
    kind: 'rectangle',
    params: { width: 8, height: 5 },
    style: { fill: '#d7e6f5', stroke: '#1e3a5f' },
  },
  {
    kind: 'right_triangle',
    params: { base: 7, height: 5 },
    style: { fill: '#fde8c8', stroke: '#8a5a12' },
  },
  {
    kind: 'l_shape',
    params: { width: 9, height: 7, cutWidth: 4, cutHeight: 3, cutCorner: 'bottom-right' },
    style: { fill: '#d9f0e3', stroke: '#0e6e6b' },
  },
  {
    kind: 't_shape',
    params: { width: 9, height: 7, barThickness: 2, stemWidth: 3 },
    style: { fill: '#f6d6de', stroke: '#8d3428' },
  },
  {
    kind: 'u_shape',
    params: { width: 8, height: 7, wall: 1.8, openSide: 'top' },
    style: { fill: '#e7e0f5', stroke: '#3d2a6b' },
  },
  {
    kind: 'h_shape',
    params: { width: 10, height: 8, upright: 2, crossbar: 2 },
    style: { fill: '#d7e6f5', stroke: '#1e3a5f' },
  },
]

export function sixFigures() {
  const doc = emptyDocument()
  doc.name = 'Six figures'
  let cursor = 0
  for (const spec of FIGURES) {
    const shape = createShape(spec.kind, [cursor, 0])
    Object.assign(shape.params, spec.params, { origin: [cursor, 0], rotation: 0 })
    shape.style = { ...shape.style, ...spec.style, strokeWidth: 2 }
    doc.objects.push(shape)
    for (const preset of defaultMeasurementPresets(shape)) doc.annotations.push(createDimension(shape, preset))
    cursor += boxSize(shape).width + 3
  }
  const bounds = diagramBounds(doc, 1.8)
  if (bounds) doc.viewport.boundingBox = bounds
  return doc
}
