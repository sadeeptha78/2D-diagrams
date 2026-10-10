import { JSXGraph } from 'jsxgraph'
import { labelSizeOf } from '../geometry/document.js'
import {
  annotationDisplay,
  dimensionGeometry,
  handlesFor,
  handleToken,
  localVertices,
  syncAnnotation,
  toWorld,
} from '../geometry/shapes.js'

const ACCENT = '#0e6e6b'
const INK = '#1b2421'

export function mountBoard(element) {
  return JSXGraph.initBoard(element, {
    boundingbox: [-3, 16, 18, -5],
    axis: false,
    grid: false,
    keepaspectratio: true,
    showCopyright: false,
    showNavigation: false,
    showInfobox: false,
    pan: { enabled: false },
    zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.1, factorY: 1.1 },
    keyboard: { enabled: false },
  })
}

function tag(element, meta) {
  element.fig = meta
}

function clearBoard(board) {
  const objects = board.objectsList.slice()
  for (const object of objects) board.removeObject(object)
}

function movePoint(point, coords) {
  point.moveTo(coords, 0)
}

function moveText(text, coords) {
  text.setCoords(coords[0], coords[1])
}

export function drawDocument(board, doc, { mode, selection }) {
  board.suspendUpdate()
  clearBoard(board)
  board.setBoundingBox(doc.viewport.boundingBox, false)
  if (doc.viewport.grid) {
    board.create('grid', [], {
      id: 'grid',
      majorStep: 1,
      minorElements: 0,
      strokeColor: '#e7e0d2',
      strokeOpacity: 0.9,
      highlight: false,
      fixed: true,
    })
  }
  for (const shape of doc.objects) {
    drawShape(board, shape, {
      selected: mode === 'editor' && selection?.type === 'shape' && selection.id === shape.id,
      showHandles: mode === 'editor' && selection?.type === 'shape' && selection.id === shape.id,
    })
  }
  for (const annotation of doc.annotations) {
    const shape = doc.objects.find((item) => item.id === annotation.anchorId)
    if (!shape) continue
    drawDimension(board, shape, annotation, doc.units, {
      preview: mode === 'preview',
      selected: mode === 'editor' && selection?.type === 'dimension' && selection.id === annotation.id,
      labelSize: labelSizeOf(doc),
    })
  }
  board.unsuspendUpdate()
}

function drawShape(board, shape, { selected, showHandles }) {
  const vertices = localVertices(shape).map((point) => toWorld(shape, point))
  const points = vertices.map((coords, index) => board.create('point', coords, {
    id: `pt_${shape.id}_${index}`,
    name: '',
    size: 0,
    visible: false,
    fixed: true,
    withLabel: false,
    showInfobox: false,
  }))
  const polygon = board.create('polygon', points, {
    id: `poly_${shape.id}`,
    fillColor: shape.style.fill,
    fillOpacity: 0.94,
    highlightFillColor: shape.style.fill,
    highlightFillOpacity: 0.94,
    highlight: false,
    hasInnerPoints: true,
    fixed: true,
    vertices: { visible: false, fixed: true, withLabel: false },
    borders: {
      strokeColor: selected ? ACCENT : shape.style.stroke,
      strokeWidth: selected ? Number(shape.style.strokeWidth) + 0.8 : shape.style.strokeWidth,
      highlight: false,
      highlightStrokeColor: selected ? ACCENT : shape.style.stroke,
      fixed: true,
    },
  })
  tag(polygon, { role: 'shape', id: shape.id })

  if (!showHandles) return
  for (const handle of handlesFor(shape)) {
    const point = board.create('point', toWorld(shape, handle.at), {
      id: `handle_${shape.id}_${handleToken(handle).replace(':', '_')}`,
      name: '',
      size: 3.4,
      face: 'square',
      fillColor: '#fffdf8',
      strokeColor: ACCENT,
      strokeWidth: 2,
      fixed: true,
      highlight: false,
      showInfobox: false,
      withLabel: false,
      layer: 9,
    })
    tag(point, { role: 'handle', id: shape.id, handle })
  }
}

function drawDimension(board, shape, annotation, units, { preview, selected, labelSize }) {
  const resolved = syncAnnotation(shape, annotation)
  const geometry = dimensionGeometry(shape, resolved)
  const start = board.create('point', geometry.from, hiddenPoint(`dim_${annotation.id}_a`))
  const end = board.create('point', geometry.to, hiddenPoint(`dim_${annotation.id}_b`))
  const segment = board.create('segment', [start, end], {
    id: `dim_${annotation.id}_seg`,
    strokeColor: selected ? ACCENT : INK,
    strokeWidth: selected ? 2 : 1.45,
    highlight: false,
    fixed: true,
    firstArrow: true,
    lastArrow: true,
    layer: 6,
  })
  const text = board.create('text', [
    geometry.labelAt[0],
    geometry.labelAt[1],
    annotationDisplay(resolved, units, { preview }),
  ], {
    id: `dim_${annotation.id}_txt`,
    anchorX: 'middle',
    anchorY: 'middle',
    fontSize: labelSize,
    display: 'internal',
    strokeColor: INK,
    highlight: false,
    fixed: true,
    parse: false,
    useMathJax: false,
    layer: 7,
  })
  const meta = { role: 'dimension', id: annotation.id }
  tag(segment, meta)
  tag(text, meta)
}

function hiddenPoint(id) {
  return {
    id,
    name: '',
    size: 0,
    visible: false,
    fixed: true,
    withLabel: false,
    showInfobox: false,
  }
}

export function patchDocument(board, doc, { mode, selection }) {
  board.suspendUpdate()
  try {
    for (const shape of doc.objects) {
      const vertices = localVertices(shape).map((point) => toWorld(shape, point))
      for (let index = 0; index < vertices.length; index += 1) {
        const point = board.objects[`pt_${shape.id}_${index}`]
        if (!point) return false
        movePoint(point, vertices[index])
      }
      const polygon = board.objects[`poly_${shape.id}`]
      if (!polygon) return false
      const selected = mode === 'editor' && selection?.type === 'shape' && selection.id === shape.id
      const stroke = selected ? ACCENT : shape.style.stroke
      const width = selected ? Number(shape.style.strokeWidth) + 0.8 : shape.style.strokeWidth
      polygon.setAttribute({ fillColor: shape.style.fill })
      for (const border of polygon.borders || []) {
        border.setAttribute({ strokeColor: stroke, strokeWidth: width })
      }
      if (selected) {
        for (const handle of handlesFor(shape)) {
          const point = board.objects[`handle_${shape.id}_${handleToken(handle).replace(':', '_')}`]
          if (!point) return false
          movePoint(point, toWorld(shape, handle.at))
        }
      }
    }
    for (const annotation of doc.annotations) {
      const shape = doc.objects.find((item) => item.id === annotation.anchorId)
      if (!shape) return false
      const resolved = syncAnnotation(shape, annotation)
      const geometry = dimensionGeometry(shape, resolved)
      const start = board.objects[`dim_${annotation.id}_a`]
      const end = board.objects[`dim_${annotation.id}_b`]
      const text = board.objects[`dim_${annotation.id}_txt`]
      if (!start || !end || !text) return false
      movePoint(start, geometry.from)
      movePoint(end, geometry.to)
      moveText(text, geometry.labelAt)
      text.setText(annotationDisplay(resolved, doc.units, { preview: mode === 'preview' }))
    }
    return true
  } finally {
    board.unsuspendUpdate()
  }
}

export function pick(board, event) {
  const hits = board.getAllObjectsUnderMouse(event) || []
  for (const role of ['handle', 'dimension', 'shape']) {
    for (let index = hits.length - 1; index >= 0; index -= 1) {
      if (hits[index].fig?.role === role) return hits[index].fig
    }
  }
  return null
}
