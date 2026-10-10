import { labelSizeOf } from './document.js'
import {
  annotationDisplay,
  dimensionGeometry,
  syncAnnotation,
  worldVertices,
} from './shapes.js'

const UNITS_THAT_FILL_THE_SCREEN = 14

export function exportFrame(doc, panel, { preview = false } = {}) {
  const points = []
  const labels = []
  for (const shape of doc.objects || []) {
    for (const point of worldVertices(shape)) points.push(point)
    for (const annotation of doc.annotations || []) {
      if (annotation.anchorId !== shape.id) continue
      const resolved = syncAnnotation(shape, annotation)
      const geometry = dimensionGeometry(shape, resolved)
      points.push(geometry.from, geometry.to, geometry.labelAt)
      labels.push({
        at: geometry.labelAt,
        text: annotationDisplay(resolved, doc.units, { preview }),
      })
    }
  }
  if (!points.length) return null

  const pxPerUnit = Math.min(Math.max(panel.width, 1), Math.max(panel.height, 1)) / UNITS_THAT_FILL_THE_SCREEN
  const font = labelSizeOf(doc)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const include = (x, y) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  for (const [x, y] of points) include(x, y)
  for (const label of labels) {
    const halfW = (Math.max(String(label.text).length, 1) * font * 0.56) / pxPerUnit
    const halfH = (font * 0.8) / pxPerUnit
    include(label.at[0] - halfW, label.at[1] - halfH)
    include(label.at[0] + halfW, label.at[1] + halfH)
  }
  const margin = 16 / pxPerUnit
  minX -= margin
  maxX += margin
  minY -= margin
  maxY += margin

  return {
    box: [minX, maxY, maxX, minY],
    pixelWidth: Math.max(1, Math.round((maxX - minX) * pxPerUnit)),
    pixelHeight: Math.max(1, Math.round((maxY - minY) * pxPerUnit)),
  }
}
