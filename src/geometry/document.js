import {
  CUT_CORNERS,
  SHAPE_KINDS,
  UNITS,
  dimensionPresets,
  kindLabel,
  validateParams,
} from './shapes.js'

const KINDS = new Set(SHAPE_KINDS.map((item) => item.kind))
const COLOR = /^#[0-9a-fA-F]{6}$/
export const LABEL_SIZE = { min: 12, max: 48, fallback: 15 }

export function labelSizeOf(doc) {
  const size = doc?.labelSize
  if (typeof size !== 'number' || !Number.isFinite(size)) return LABEL_SIZE.fallback
  return Math.min(LABEL_SIZE.max, Math.max(LABEL_SIZE.min, Math.round(size)))
}

export function emptyDocument() {
  return {
    schemaVersion: 1,
    name: 'Untitled figure',
    type: 'geometry',
    units: 'cm',
    labelSize: LABEL_SIZE.fallback,
    viewport: { boundingBox: [-3, 16, 18, -5], grid: false },
    objects: [],
    annotations: [],
  }
}

export function validateDocument(doc) {
  const errors = []
  if (!doc || typeof doc !== 'object') return { ok: false, errors: ['This file is not a diagram.'] }
  if (doc.schemaVersion !== 1) errors.push('This file uses a diagram version this editor cannot open.')
  if (doc.type !== 'geometry') errors.push('Only geometry diagrams can be opened here.')
  if (!UNITS.includes(doc.units)) errors.push('Units must be cm, mm, or m.')
  if (typeof doc.name !== 'string' || !doc.name.trim()) errors.push('The diagram needs a name.')
  if (doc.name && doc.name.length > 80) errors.push('The diagram name is too long.')

  const box = doc.viewport?.boundingBox
  if (!Array.isArray(box) || box.length !== 4 || box.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    errors.push('The view is missing.')
  } else if (!(box[0] < box[2] && box[3] < box[1])) {
    errors.push('The view box is inside out.')
  }
  if (typeof doc.viewport?.grid !== 'boolean') errors.push('Grid must be on or off.')
  if (doc.labelSize != null && labelSizeOf(doc) !== doc.labelSize) {
    errors.push(`Label size must be a whole number from ${LABEL_SIZE.min} to ${LABEL_SIZE.max}.`)
  }
  if (!Array.isArray(doc.objects)) errors.push('Shapes are missing.')
  if (!Array.isArray(doc.annotations)) errors.push('Measurements are missing.')
  if (errors.length) return { ok: false, errors }

  const ids = new Set()
  for (const shape of doc.objects) {
    if (!shape || typeof shape.id !== 'string' || !shape.id) {
      errors.push('A shape is missing an id.')
      continue
    }
    if (ids.has(shape.id)) errors.push(`Two shapes share the id ${shape.id}.`)
    ids.add(shape.id)
    if (!KINDS.has(shape.kind)) {
      errors.push(`Unknown shape “${shape.kind}”.`)
      continue
    }
    const label = kindLabel(shape.kind)
    for (const message of validateParams(shape.kind, shape.params)) errors.push(`${label}: ${message}`)
    if (!shape.style || !COLOR.test(shape.style.fill || '') || !COLOR.test(shape.style.stroke || '')) {
      errors.push(`${label} needs a fill and an outline colour.`)
    }
    if (!(typeof shape.style?.strokeWidth === 'number' && shape.style.strokeWidth > 0 && shape.style.strokeWidth <= 12)) {
      errors.push(`${label} has an outline width this editor cannot use.`)
    }
  }

  const seen = new Set()
  for (const annotation of doc.annotations) {
    if (!annotation || annotation.kind !== 'dimension') {
      errors.push('A drawing contains something that is not a measurement.')
      continue
    }
    if (typeof annotation.id !== 'string' || !annotation.id) {
      errors.push('A measurement is missing an id.')
      continue
    }
    if (seen.has(annotation.id)) errors.push(`Two measurements share the id ${annotation.id}.`)
    seen.add(annotation.id)
    const shape = doc.objects.find((item) => item.id === annotation.anchorId)
    if (!shape) {
      errors.push('A measurement points at a missing shape.')
      continue
    }
    if (!dimensionPresets(shape).some((item) => item.preset === annotation.preset)) {
      errors.push('A measurement does not belong to its shape.')
    }
    if (!['horizontal', 'vertical'].includes(annotation.orientation)) errors.push('A measurement direction is invalid.')
    if (!Array.isArray(annotation.from) || !Array.isArray(annotation.to)) errors.push('A measurement is missing its ends.')
    if (typeof annotation.offset !== 'number' || !Number.isFinite(annotation.offset)) errors.push('A measurement offset is invalid.')
    const label = annotation.label
    if (!label || !['computed', 'manual'].includes(label.mode)) errors.push('A label must be calculated or typed.')
    if (!label || !['given', 'hidden', 'answer'].includes(label.role)) errors.push('A label role must be given, hidden, or answer.')
    if (label?.text != null && typeof label.text !== 'string') errors.push('A typed label must be text.')
    if (typeof label?.text === 'string' && label.text.length > 40) errors.push('A typed label is too long.')
  }

  return { ok: errors.length === 0, errors }
}

export { CUT_CORNERS }
