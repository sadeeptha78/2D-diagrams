/** @typedef {'rectangle'|'square'|'right_triangle'|'l_shape'|'t_shape'|'t_uneven'|'u_shape'|'u_uneven'|'h_shape'|'h_uneven'|'step'} ShapeKind */
/** @typedef {'top-left'|'top-right'|'bottom-left'|'bottom-right'} CutCorner */
/** @typedef {'top'|'bottom'|'left'|'right'} OpenSide */

export const ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315]
export const UNITS = ['cm', 'mm', 'm']
export const CUT_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
export const OPEN_SIDES = ['top', 'bottom', 'left', 'right']
export const MIN_SIZE = 0.5

export const SHAPE_KINDS = [
  { kind: 'rectangle', label: 'Rectangle', blurb: 'Width and height' },
  { kind: 'square', label: 'Square', blurb: 'Equal sides' },
  { kind: 'right_triangle', label: 'Right triangle', blurb: 'Base and height' },
  { kind: 'l_shape', label: 'L shape', blurb: 'Corner cut out' },
  { kind: 't_shape', label: 'T shape', blurb: 'Centered stem' },
  { kind: 't_uneven', label: 'T, uneven', blurb: 'Left and right differ' },
  { kind: 'u_shape', label: 'U shape', blurb: 'One side open' },
  { kind: 'u_uneven', label: 'U, uneven', blurb: 'Each wall on its own' },
  { kind: 'h_shape', label: 'H shape', blurb: 'Equal uprights' },
  { kind: 'h_uneven', label: 'H, uneven', blurb: 'Each upright on its own' },
  { kind: 'step', label: 'Step', blurb: 'Staircase' },
]

const KIND_LABELS = Object.fromEntries(SHAPE_KINDS.map((item) => [item.kind, item.label]))

export function kindLabel(kind) {
  return KIND_LABELS[kind] || 'Shape'
}

export function cornerLabel(corner) {
  return {
    'top-left': 'Top left',
    'top-right': 'Top right',
    'bottom-left': 'Bottom left',
    'bottom-right': 'Bottom right',
  }[corner] || corner
}

export function sideLabel(side) {
  return { top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' }[side] || side
}

export function uid(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}

export function round(n) {
  return Math.round(n * 100) / 100
}

export function formatLength(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return ''
  const rounded = round(n)
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function normalizeRotation(deg) {
  if (typeof deg !== 'number' || !Number.isFinite(deg)) return 0
  const turned = ((deg % 360) + 360) % 360
  const snapped = Math.round(turned / 45) * 45
  return snapped === 360 ? 0 : snapped
}

export function isAllowedRotation(deg) {
  return ROTATIONS.includes(deg)
}

export function defaultParams(kind) {
  const base = { origin: [0, 0], rotation: 0 }
  switch (kind) {
    case 'rectangle':
      return { ...base, width: 8, height: 5 }
    case 'square':
      return { ...base, side: 5 }
    case 'right_triangle':
      return { ...base, base: 6, height: 4 }
    case 'l_shape':
      return { ...base, width: 8, height: 6, cutWidth: 3, cutHeight: 2, cutCorner: 'bottom-right' }
    case 't_shape':
      return { ...base, width: 8, height: 6, barThickness: 2, stemWidth: 3 }
    case 't_uneven':
      return { ...base, width: 8, height: 6, barThickness: 2, stemLeft: 1.5, stemRight: 3.5 }
    case 'u_shape':
      return { ...base, width: 8, height: 6, wall: 1.5, openSide: 'top' }
    case 'u_uneven':
      return { ...base, width: 8, height: 6, leftWall: 1.2, rightWall: 2.4, base: 1.5 }
    case 'h_shape':
      return { ...base, width: 10, height: 8, upright: 2, crossbar: 2, gapTop: 3, gapBottom: 3 }
    case 'h_uneven':
      return { ...base, width: 10, height: 8, leftUpright: 1.5, rightUpright: 3, crossbar: 2, gapTop: 3, gapBottom: 3 }
    case 'step':
      return { ...base, width: 8, height: 6, stepWidth: 3, stepHeight: 2.5 }
    default:
      throw new Error(`Unknown shape ${kind}`)
  }
}

export function createShape(kind, origin = [1, 1]) {
  const params = defaultParams(kind)
  params.origin = [origin[0], origin[1]]
  const accent = {
    t_uneven: { fill: '#f6d6de', stroke: '#8d3428' },
    u_uneven: { fill: '#e7e0f5', stroke: '#3d2a6b' },
    h_uneven: { fill: '#d9f0e3', stroke: '#0e6e6b' },
  }[kind]
  return {
    id: uid('shape'),
    kind,
    params,
    style: { fill: '#d7e6f5', stroke: '#1e3a5f', strokeWidth: 2, ...accent },
  }
}

export function boxSize(shape) {
  const params = shape.params
  if (shape.kind === 'square') return { width: params.side, height: params.side }
  if (shape.kind === 'right_triangle') return { width: params.base, height: params.height }
  return { width: params.width, height: params.height }
}

export function rotateClockwise(point, degrees) {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const [x, y] = point
  return [x * cos + y * sin, -x * sin + y * cos]
}

export function rotateCounterClockwise(point, degrees) {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const [x, y] = point
  return [x * cos - y * sin, x * sin + y * cos]
}

export function centerOf(shape) {
  const { width, height } = boxSize(shape)
  const [ox, oy] = shape.params.origin
  return [ox + width / 2, oy + height / 2]
}

export function toWorld(shape, local) {
  const { width, height } = boxSize(shape)
  const rel = [local[0] - width / 2, local[1] - height / 2]
  const turned = rotateClockwise(rel, shape.params.rotation || 0)
  const center = centerOf(shape)
  return [center[0] + turned[0], center[1] + turned[1]]
}

export function toLocal(shape, world) {
  const { width, height } = boxSize(shape)
  const center = centerOf(shape)
  const rel = [world[0] - center[0], world[1] - center[1]]
  const unturned = rotateCounterClockwise(rel, shape.params.rotation || 0)
  return [unturned[0] + width / 2, unturned[1] + height / 2]
}

function lVertices(width, height, cutWidth, cutHeight, corner) {
  const w = width
  const h = height
  const cw = cutWidth
  const ch = cutHeight
  switch (corner) {
    case 'bottom-right':
      return [[0, 0], [w - cw, 0], [w - cw, ch], [w, ch], [w, h], [0, h]]
    case 'bottom-left':
      return [[cw, 0], [w, 0], [w, h], [0, h], [0, ch], [cw, ch]]
    case 'top-right':
      return [[0, 0], [w, 0], [w, h - ch], [w - cw, h - ch], [w - cw, h], [0, h]]
    case 'top-left':
      return [[0, 0], [w, 0], [w, h], [cw, h], [cw, h - ch], [0, h - ch]]
    default:
      return []
  }
}

function uVertices(params) {
  const w = params.width
  const h = params.height
  const t = params.wall
  switch (params.openSide) {
    case 'top':
      return [[0, 0], [w, 0], [w, h], [w - t, h], [w - t, t], [t, t], [t, h], [0, h]]
    case 'bottom':
      return [[0, 0], [t, 0], [t, h - t], [w - t, h - t], [w - t, 0], [w, 0], [w, h], [0, h]]
    case 'left':
      return [[0, 0], [w, 0], [w, h], [0, h], [0, h - t], [w - t, h - t], [w - t, t], [0, t]]
    case 'right':
      return [[0, 0], [w, 0], [w, t], [t, t], [t, h - t], [w, h - t], [w, h], [0, h]]
    default:
      return []
  }
}

export function hGaps(params) {
  const top = params.gapTop
  const bottom = params.gapBottom
  if (typeof top === 'number' && top > 0 && typeof bottom === 'number' && bottom > 0) {
    return { gapTop: top, gapBottom: bottom }
  }
  const gapBottom = round((params.height - params.crossbar) / 2)
  return { gapTop: round(params.height - params.crossbar - gapBottom), gapBottom }
}

export function settleHParams(params, editedKey) {
  const min = MIN_SIZE
  const gaps = hGaps(params)
  params.gapTop = gaps.gapTop
  params.gapBottom = gaps.gapBottom
  params.crossbar = Math.max(min, params.crossbar)
  if (editedKey === 'height') {
    const nextHeight = Math.max(min * 3, params.height)
    const crossbar = Math.min(Math.max(min, params.crossbar), nextHeight - 2 * min)
    const room = nextHeight - crossbar
    const old = Math.max(params.gapTop + params.gapBottom, min)
    params.crossbar = round(crossbar)
    params.gapTop = round(room * (params.gapTop / old))
    params.gapBottom = round(room - params.gapTop)
  } else {
    params.gapTop = round(Math.max(min, params.gapTop))
    params.gapBottom = round(Math.max(min, params.gapBottom))
    params.crossbar = round(Math.max(min, params.crossbar))
  }
  params.height = round(params.gapTop + params.crossbar + params.gapBottom)
  return params
}

function hVertices(params, left = params.upright, right = params.upright) {
  const w = params.width
  const h = params.height
  const { gapBottom } = hGaps(params)
  const y0 = gapBottom
  const y1 = gapBottom + params.crossbar
  return [
    [0, 0], [left, 0], [left, y0], [w - right, y0], [w - right, 0], [w, 0],
    [w, h], [w - right, h], [w - right, y1], [left, y1], [left, h], [0, h],
  ]
}

function unevenTVertices(params) {
  const x0 = params.stemLeft
  const x1 = params.width - params.stemRight
  const y = params.height - params.barThickness
  return [[0, y], [x0, y], [x0, 0], [x1, 0], [x1, y], [params.width, y], [params.width, params.height], [0, params.height]]
}

function unevenUVertices(params) {
  const w = params.width
  const h = params.height
  const left = params.leftWall
  const right = params.rightWall
  const base = params.base
  return [[0, 0], [w, 0], [w, h], [w - right, h], [w - right, base], [left, base], [left, h], [0, h]]
}

export function localVertices(shape) {
  const params = shape.params
  switch (shape.kind) {
    case 'rectangle':
      return [[0, 0], [params.width, 0], [params.width, params.height], [0, params.height]]
    case 'square':
      return [[0, 0], [params.side, 0], [params.side, params.side], [0, params.side]]
    case 'right_triangle':
      return [[0, 0], [params.base, 0], [0, params.height]]
    case 'l_shape':
      return lVertices(params.width, params.height, params.cutWidth, params.cutHeight, params.cutCorner)
    case 'step':
      return lVertices(params.width, params.height, params.stepWidth, params.stepHeight, 'top-right')
    case 't_shape': {
      const x0 = (params.width - params.stemWidth) / 2
      const x1 = (params.width + params.stemWidth) / 2
      const y = params.height - params.barThickness
      return [[0, y], [x0, y], [x0, 0], [x1, 0], [x1, y], [params.width, y], [params.width, params.height], [0, params.height]]
    }
    case 't_uneven':
      return unevenTVertices(params)
    case 'u_shape':
      return uVertices(params)
    case 'u_uneven':
      return unevenUVertices(params)
    case 'h_shape':
      return hVertices(params)
    case 'h_uneven':
      return hVertices(params, params.leftUpright, params.rightUpright)
    default:
      return []
  }
}

export function worldVertices(shape) {
  return localVertices(shape).map((point) => toWorld(shape, point))
}

export function shoelace(points) {
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

export function area(shape) {
  const params = shape.params
  switch (shape.kind) {
    case 'rectangle':
      return params.width * params.height
    case 'square':
      return params.side * params.side
    case 'right_triangle':
      return (params.base * params.height) / 2
    case 'l_shape':
      return params.width * params.height - params.cutWidth * params.cutHeight
    case 'step':
      return params.width * params.height - params.stepWidth * params.stepHeight
    case 't_shape':
      return params.width * params.barThickness + params.stemWidth * (params.height - params.barThickness)
    case 't_uneven':
      return params.width * params.barThickness + (params.width - params.stemLeft - params.stemRight) * (params.height - params.barThickness)
    case 'u_shape':
      if (params.openSide === 'left' || params.openSide === 'right') {
        return params.width * params.height - (params.width - params.wall) * (params.height - 2 * params.wall)
      }
      return params.width * params.height - (params.width - 2 * params.wall) * (params.height - params.wall)
    case 'u_uneven':
      return params.width * params.height - (params.width - params.leftWall - params.rightWall) * (params.height - params.base)
    case 'h_shape':
      return 2 * params.upright * params.height + (params.width - 2 * params.upright) * params.crossbar
    case 'h_uneven':
      return (params.leftUpright + params.rightUpright) * params.height + (params.width - params.leftUpright - params.rightUpright) * params.crossbar
    default:
      return 0
  }
}

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function validateParams(kind, params) {
  const errors = []
  if (!params || !Array.isArray(params.origin) || params.origin.length !== 2 || params.origin.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    errors.push('Origin must be a pair of numbers.')
  }
  if (!isAllowedRotation(params?.rotation)) {
    errors.push('Rotation must be 0, 45, 90, 135, 180, 225, 270, or 315 degrees.')
  }

  switch (kind) {
    case 'rectangle':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      break
    case 'square':
      if (!positive(params.side)) errors.push('Side must be greater than 0.')
      break
    case 'right_triangle':
      if (!positive(params.base)) errors.push('Base must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      break
    case 'l_shape':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.cutWidth)) errors.push('Cut width must be greater than 0.')
      if (!positive(params.cutHeight)) errors.push('Cut height must be greater than 0.')
      if (!(params.cutWidth < params.width)) errors.push('Cut width must be less than overall width.')
      if (!(params.cutHeight < params.height)) errors.push('Cut height must be less than overall height.')
      if (!CUT_CORNERS.includes(params.cutCorner)) errors.push('Choose which corner is missing.')
      break
    case 't_shape':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.barThickness)) errors.push('Bar thickness must be greater than 0.')
      if (!positive(params.stemWidth)) errors.push('Stem width must be greater than 0.')
      if (!(params.stemWidth < params.width)) errors.push('Stem must be narrower than the overall width.')
      if (!(params.barThickness < params.height)) errors.push('Bar must be thinner than the overall height.')
      break
    case 't_uneven':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.barThickness)) errors.push('Bar thickness must be greater than 0.')
      if (!positive(params.stemLeft)) errors.push('Left side must be greater than 0.')
      if (!positive(params.stemRight)) errors.push('Right side must be greater than 0.')
      if (!(params.stemLeft + params.stemRight < params.width)) errors.push('The two sides must leave room for the stem.')
      if (!(params.barThickness < params.height)) errors.push('Bar must be thinner than the overall height.')
      break
    case 'u_shape':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.wall)) errors.push('Wall thickness must be greater than 0.')
      if (!OPEN_SIDES.includes(params.openSide)) errors.push('Choose which side is open.')
      else if (params.openSide === 'left' || params.openSide === 'right') {
        if (!(params.wall < params.width)) errors.push('Wall must be thinner than the width.')
        if (!(2 * params.wall < params.height)) errors.push('The opening needs room between the two walls.')
      } else {
        if (!(2 * params.wall < params.width)) errors.push('The opening needs room between the two walls.')
        if (!(params.wall < params.height)) errors.push('Wall must be thinner than the height.')
      }
      break
    case 'u_uneven':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.leftWall)) errors.push('Left wall must be greater than 0.')
      if (!positive(params.rightWall)) errors.push('Right wall must be greater than 0.')
      if (!positive(params.base)) errors.push('Base thickness must be greater than 0.')
      if (!(params.leftWall + params.rightWall < params.width)) errors.push('The two walls must leave an opening.')
      if (!(params.base < params.height)) errors.push('Base must be thinner than the height.')
      break
    case 'h_shape':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.upright)) errors.push('Upright thickness must be greater than 0.')
      if (!positive(params.crossbar)) errors.push('Crossbar thickness must be greater than 0.')
      if (!(2 * params.upright < params.width)) errors.push('The uprights must not meet.')
      if (!(params.crossbar < params.height)) errors.push('Crossbar must be thinner than the height.')
      if (params.gapTop != null && !positive(params.gapTop)) errors.push('Top height must be greater than 0.')
      if (params.gapBottom != null && !positive(params.gapBottom)) errors.push('Bottom height must be greater than 0.')
      break
    case 'h_uneven':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.leftUpright)) errors.push('Left upright must be greater than 0.')
      if (!positive(params.rightUpright)) errors.push('Right upright must be greater than 0.')
      if (!positive(params.crossbar)) errors.push('Crossbar thickness must be greater than 0.')
      if (!(params.leftUpright + params.rightUpright < params.width)) errors.push('The uprights must not meet.')
      if (!(params.crossbar < params.height)) errors.push('Crossbar must be thinner than the height.')
      if (params.gapTop != null && !positive(params.gapTop)) errors.push('Top height must be greater than 0.')
      if (params.gapBottom != null && !positive(params.gapBottom)) errors.push('Bottom height must be greater than 0.')
      break
    case 'step':
      if (!positive(params.width)) errors.push('Width must be greater than 0.')
      if (!positive(params.height)) errors.push('Height must be greater than 0.')
      if (!positive(params.stepWidth)) errors.push('Step width must be greater than 0.')
      if (!positive(params.stepHeight)) errors.push('Step height must be greater than 0.')
      if (!(params.stepWidth < params.width)) errors.push('Step width must be less than overall width.')
      if (!(params.stepHeight < params.height)) errors.push('Step height must be less than overall height.')
      break
    default:
      errors.push('Unknown shape.')
  }
  return errors
}

export function clampParams(kind, params) {
  const next = { ...params, origin: params.origin.map((n) => round(n)) }
  next.rotation = normalizeRotation(next.rotation)
  const min = MIN_SIZE

  switch (kind) {
    case 'rectangle':
      next.width = round(Math.max(min, next.width))
      next.height = round(Math.max(min, next.height))
      break
    case 'square':
      next.side = round(Math.max(min, next.side))
      break
    case 'right_triangle':
      next.base = round(Math.max(min, next.base))
      next.height = round(Math.max(min, next.height))
      break
    case 'l_shape':
      next.width = round(Math.max(min * 2, next.width))
      next.height = round(Math.max(min * 2, next.height))
      next.cutWidth = round(clamp(next.cutWidth, min, next.width - min))
      next.cutHeight = round(clamp(next.cutHeight, min, next.height - min))
      if (!CUT_CORNERS.includes(next.cutCorner)) next.cutCorner = 'bottom-right'
      break
    case 't_shape':
      next.width = round(Math.max(min * 2, next.width))
      next.height = round(Math.max(min * 2, next.height))
      next.stemWidth = round(clamp(next.stemWidth, min, next.width - min))
      next.barThickness = round(clamp(next.barThickness, min, next.height - min))
      break
    case 't_uneven':
      next.height = round(Math.max(min * 2, next.height))
      next.barThickness = round(clamp(next.barThickness, min, next.height - min))
      next.stemLeft = round(Math.max(min, next.stemLeft))
      next.stemRight = round(Math.max(min, next.stemRight))
      next.width = round(Math.max(next.stemLeft + next.stemRight + min, next.width))
      next.stemLeft = round(clamp(next.stemLeft, min, next.width - next.stemRight - min))
      next.stemRight = round(clamp(next.stemRight, min, next.width - next.stemLeft - min))
      break
    case 'u_shape':
      if (!OPEN_SIDES.includes(next.openSide)) next.openSide = 'top'
      if (next.openSide === 'left' || next.openSide === 'right') {
        next.width = round(Math.max(min * 2, next.width))
        next.height = round(Math.max(min * 3, next.height))
        next.wall = round(clamp(next.wall, min, Math.min(next.width - min, next.height / 2 - min)))
      } else {
        next.width = round(Math.max(min * 3, next.width))
        next.height = round(Math.max(min * 2, next.height))
        next.wall = round(clamp(next.wall, min, Math.min(next.width / 2 - min, next.height - min)))
      }
      break
    case 'u_uneven':
      next.leftWall = round(Math.max(min, next.leftWall))
      next.rightWall = round(Math.max(min, next.rightWall))
      next.height = round(Math.max(min * 2, next.height))
      next.base = round(clamp(next.base, min, next.height - min))
      next.width = round(Math.max(next.leftWall + next.rightWall + min, next.width))
      next.leftWall = round(clamp(next.leftWall, min, next.width - next.rightWall - min))
      next.rightWall = round(clamp(next.rightWall, min, next.width - next.leftWall - min))
      break
    case 'h_shape':
      next.width = round(Math.max(min * 3, next.width))
      next.upright = round(clamp(next.upright, min, next.width / 2 - min))
      settleHParams(next, 'crossbar')
      break
    case 'h_uneven':
      next.leftUpright = round(Math.max(min, next.leftUpright))
      next.rightUpright = round(Math.max(min, next.rightUpright))
      next.width = round(Math.max(next.leftUpright + next.rightUpright + min, next.width))
      next.leftUpright = round(clamp(next.leftUpright, min, next.width - next.rightUpright - min))
      next.rightUpright = round(clamp(next.rightUpright, min, next.width - next.leftUpright - min))
      settleHParams(next, 'crossbar')
      break
    case 'step':
      next.width = round(Math.max(min * 2, next.width))
      next.height = round(Math.max(min * 2, next.height))
      next.stepWidth = round(clamp(next.stepWidth, min, next.width - min))
      next.stepHeight = round(clamp(next.stepHeight, min, next.height - min))
      break
    default:
      break
  }
  return next
}

function rightEdgeMid(shape) {
  const params = shape.params
  const { width, height } = boxSize(shape)
  if (shape.kind === 'l_shape' && params.cutCorner === 'bottom-right') return [width, (params.cutHeight + height) / 2]
  if (shape.kind === 'l_shape' && params.cutCorner === 'top-right') return [width, (height - params.cutHeight) / 2]
  if (shape.kind === 'step') return [width, (height - params.stepHeight) / 2]
  if (shape.kind === 't_shape' || shape.kind === 't_uneven') return [width, height - params.barThickness / 2]
  if (shape.kind === 'u_shape' && params.openSide === 'right') return [width, height - params.wall / 2]
  if (shape.kind === 'h_shape' || shape.kind === 'h_uneven' || shape.kind === 'u_uneven') return [width, height / 2]
  return [width, height / 2]
}

function topEdgeMid(shape) {
  const params = shape.params
  const { width, height } = boxSize(shape)
  if (shape.kind === 'l_shape' && (params.cutCorner === 'top-left' || params.cutCorner === 'top-right')) {
    const cut = params.cutWidth
    return params.cutCorner === 'top-left' ? [(cut + width) / 2, height] : [(width - cut) / 2, height]
  }
  if (shape.kind === 'step') return [(width - params.stepWidth) / 2, height]
  if (shape.kind === 't_shape' || shape.kind === 't_uneven') return [width / 2, height]
  if (shape.kind === 'u_shape' && params.openSide === 'top') return [params.wall / 2, height]
  if (shape.kind === 'u_uneven') return [params.leftWall / 2, height]
  if (shape.kind === 'h_shape') return [params.upright / 2, height]
  if (shape.kind === 'h_uneven') return [params.leftUpright / 2, height]
  return [width / 2, height]
}

export function handlesFor(shape) {
  const params = shape.params
  const { width, height } = boxSize(shape)
  if (shape.kind === 'square') {
    return [
      { key: 'side', axis: 'x', at: [params.side, params.side / 2] },
      { key: 'side', axis: 'y', at: [params.side / 2, params.side] },
    ]
  }
  if (shape.kind === 'right_triangle') {
    return [
      { key: 'base', at: [params.base, Math.min(height * 0.2, 0.6)] },
      { key: 'height', at: [Math.min(width * 0.2, 0.6), params.height] },
    ]
  }

  const handles = [
    { key: 'width', at: rightEdgeMid(shape) },
    { key: 'height', at: topEdgeMid(shape) },
  ]

  if (shape.kind === 'l_shape') {
    const cut = {
      'bottom-right': [width - params.cutWidth, params.cutHeight],
      'bottom-left': [params.cutWidth, params.cutHeight],
      'top-right': [width - params.cutWidth, height - params.cutHeight],
      'top-left': [params.cutWidth, height - params.cutHeight],
    }[params.cutCorner]
    handles.push({ key: 'cut', at: cut })
  }
  if (shape.kind === 'step') {
    handles.push({ key: 'step', at: [width - params.stepWidth, height - params.stepHeight] })
  }
  if (shape.kind === 't_shape') {
    handles.push({ key: 'stem', at: [(width + params.stemWidth) / 2, (height - params.barThickness) / 2] })
    handles.push({ key: 'bar', at: [(width - params.stemWidth) / 4, height - params.barThickness] })
  }
  if (shape.kind === 't_uneven') {
    const stemTop = (height - params.barThickness) / 2
    handles.push({ key: 'stemLeft', at: [params.stemLeft, stemTop] })
    handles.push({ key: 'stemRight', at: [width - params.stemRight, stemTop] })
    handles.push({ key: 'bar', at: [params.stemLeft / 2, height - params.barThickness] })
  }
  if (shape.kind === 'u_uneven') {
    handles.push({ key: 'left', at: [params.leftWall, (height + params.base) / 2] })
    handles.push({ key: 'right', at: [width - params.rightWall, (height + params.base) / 2] })
    handles.push({ key: 'base', at: [(params.leftWall + width - params.rightWall) / 2, params.base] })
  }
  if (shape.kind === 'u_shape') {
    const wallAt = {
      top: [params.wall, (height + params.wall) / 2],
      bottom: [params.wall, (height - params.wall) / 2],
      left: [width - params.wall, height / 2],
      right: [params.wall, height / 2],
    }[params.openSide]
    handles.push({ key: 'wall', at: wallAt })
  }
  if (shape.kind === 'h_shape' || shape.kind === 'h_uneven') {
    const left = shape.kind === 'h_uneven' ? params.leftUpright : params.upright
    const right = shape.kind === 'h_uneven' ? params.rightUpright : params.upright
    const { gapBottom } = hGaps(params)
    const y0 = gapBottom
    const y1 = gapBottom + params.crossbar
    if (shape.kind === 'h_uneven') {
      handles.push({ key: 'left', at: [left, y0 / 2] })
      handles.push({ key: 'right', at: [width - right, y0 / 2] })
    } else {
      handles.push({ key: 'upright', at: [left, y0 / 2] })
    }
    handles.push({ key: 'gapBottom', at: [left + 0.45, y0] })
    handles.push({ key: 'gapTop', at: [left + 0.45, y1] })
    handles.push({ key: 'crossbar', at: [width / 2, y1] })
  }
  return handles
}

export function handleToken(handle) {
  return handle.axis ? `${handle.key}:${handle.axis}` : handle.key
}

export function applyHandle(shape, handle, local) {
  const params = { ...shape.params, origin: [...shape.params.origin] }
  const [x, y] = local

  if (shape.kind === 'square' && handle.key === 'side') {
    params.side = handle.axis === 'y' ? y : x
    return clampParams(shape.kind, params)
  }
  if (shape.kind === 'right_triangle') {
    if (handle.key === 'base') params.base = x
    if (handle.key === 'height') params.height = y
    return clampParams(shape.kind, params)
  }
  if (handle.key === 'width') params.width = x
  if (handle.key === 'height') params.height = y
  if (shape.kind === 'l_shape' && handle.key === 'cut') {
    if (params.cutCorner === 'bottom-right') {
      params.cutWidth = params.width - x
      params.cutHeight = y
    } else if (params.cutCorner === 'bottom-left') {
      params.cutWidth = x
      params.cutHeight = y
    } else if (params.cutCorner === 'top-right') {
      params.cutWidth = params.width - x
      params.cutHeight = params.height - y
    } else {
      params.cutWidth = x
      params.cutHeight = params.height - y
    }
  }
  if (shape.kind === 'step' && handle.key === 'step') {
    params.stepWidth = params.width - x
    params.stepHeight = params.height - y
  }
  if (shape.kind === 't_shape' && handle.key === 'stem') params.stemWidth = 2 * (x - params.width / 2)
  if ((shape.kind === 't_shape' || shape.kind === 't_uneven') && handle.key === 'bar') params.barThickness = params.height - y
  if (shape.kind === 't_uneven' && handle.key === 'stemLeft') params.stemLeft = x
  if (shape.kind === 't_uneven' && handle.key === 'stemRight') params.stemRight = params.width - x
  if (shape.kind === 'u_shape' && handle.key === 'wall') {
    params.wall = params.openSide === 'left' ? params.width - x : x
  }
  if (shape.kind === 'u_uneven' && handle.key === 'left') params.leftWall = x
  if (shape.kind === 'u_uneven' && handle.key === 'right') params.rightWall = params.width - x
  if (shape.kind === 'u_uneven' && handle.key === 'base') params.base = y
  if (shape.kind === 'h_shape' && handle.key === 'upright') params.upright = x
  if (shape.kind === 'h_uneven' && handle.key === 'left') params.leftUpright = x
  if (shape.kind === 'h_uneven' && handle.key === 'right') params.rightUpright = params.width - x
  if (shape.kind === 'h_shape' || shape.kind === 'h_uneven') {
    const gaps = hGaps(params)
    if (handle.key === 'gapTop') params.gapTop = shape.params.height - y
    if (handle.key === 'gapBottom') params.gapBottom = y
    if (handle.key === 'crossbar') {
      params.gapBottom = gaps.gapBottom
      params.crossbar = y - gaps.gapBottom
      params.gapTop = shape.params.height - y
    }
    if (handle.key === 'height' || handle.key === 'gapTop' || handle.key === 'gapBottom' || handle.key === 'crossbar') {
      settleHParams(params, handle.key)
    }
  }
  return clampParams(shape.kind, params)
}

function measurement(preset, label, from, to, orientation, offset) {
  const length = orientation === 'horizontal' ? Math.abs(to[0] - from[0]) : Math.abs(to[1] - from[1])
  return { preset, label, from, to, orientation, offset, length }
}

function widthOnTop(shape) {
  if (shape.kind === 'h_shape' || shape.kind === 'h_uneven' || shape.kind === 't_uneven') return true
  if (shape.kind === 'l_shape') return shape.params.cutCorner === 'bottom-left' || shape.params.cutCorner === 'bottom-right'
  if (shape.kind === 'u_shape') return shape.params.openSide === 'bottom'
  return false
}

export function dimensionPresets(shape) {
  const params = shape.params
  const { width, height } = boxSize(shape)
  const topWidth = widthOnTop(shape)
  const presets = [
    measurement(
      'width',
      shape.kind === 'square' ? 'Side' : 'Width',
      topWidth ? [0, height] : [0, 0],
      topWidth ? [width, height] : [width, 0],
      'horizontal',
      topWidth ? (shape.kind === 'h_shape' || shape.kind === 'h_uneven' || shape.kind === 't_uneven' ? 1.7 : 0.9) : -1.25,
    ),
    measurement('height', shape.kind === 'square' ? 'Side' : 'Height', [0, 0], [0, height], 'vertical', -1.25),
  ]

  if (shape.kind === 'l_shape') {
    const w = params.width
    const h = params.height
    const cw = params.cutWidth
    const ch = params.cutHeight
    const cuts = {
      'bottom-right': [
        measurement('cutWidth', 'Cut width', [w - cw, ch], [w, ch], 'horizontal', -0.75),
        measurement('cutHeight', 'Cut height', [w - cw, 0], [w - cw, ch], 'vertical', 0.75),
      ],
      'bottom-left': [
        measurement('cutWidth', 'Cut width', [0, ch], [cw, ch], 'horizontal', -0.75),
        measurement('cutHeight', 'Cut height', [cw, 0], [cw, ch], 'vertical', -0.75),
      ],
      'top-right': [
        measurement('cutWidth', 'Cut width', [w - cw, h - ch], [w, h - ch], 'horizontal', 0.75),
        measurement('cutHeight', 'Cut height', [w - cw, h - ch], [w - cw, h], 'vertical', 0.75),
      ],
      'top-left': [
        measurement('cutWidth', 'Cut width', [0, h - ch], [cw, h - ch], 'horizontal', 0.75),
        measurement('cutHeight', 'Cut height', [cw, h - ch], [cw, h], 'vertical', -0.75),
      ],
    }
    presets.push(...(cuts[params.cutCorner] || []))
  }

  if (shape.kind === 'step') {
    const w = params.width
    const h = params.height
    presets.push(
      measurement('stepWidth', 'Step width', [w - params.stepWidth, h - params.stepHeight], [w, h - params.stepHeight], 'horizontal', 0.75),
      measurement('stepHeight', 'Step height', [w - params.stepWidth, h - params.stepHeight], [w - params.stepWidth, h], 'vertical', 0.75),
    )
  }

  if (shape.kind === 't_shape') {
    const x0 = (params.width - params.stemWidth) / 2
    const x1 = (params.width + params.stemWidth) / 2
    presets.push(
      measurement('stemWidth', 'Stem width', [x0, 0], [x1, 0], 'horizontal', 0.85),
      measurement('barThickness', 'Bar thickness', [1.1, params.height - params.barThickness], [1.1, params.height], 'vertical', 0.7),
    )
  }

  if (shape.kind === 'u_shape') {
    const t = params.wall
    const w = params.width
    const h = params.height
    const walls = {
      top: measurement('wall', 'Wall', [0, h], [t, h], 'horizontal', 0.85),
      bottom: measurement('wall', 'Wall', [0, 0], [t, 0], 'horizontal', -0.85),
      left: measurement('wall', 'Wall', [0, 0], [0, t], 'vertical', -0.85),
      right: measurement('wall', 'Wall', [w, 0], [w, t], 'vertical', 0.85),
    }
    const openings = {
      top: measurement('opening', 'Opening', [t, h], [w - t, h], 'horizontal', 0.85),
      bottom: measurement('opening', 'Opening', [t, 0], [w - t, 0], 'horizontal', -0.85),
      left: measurement('opening', 'Opening', [0, t], [0, h - t], 'vertical', -0.85),
      right: measurement('opening', 'Opening', [w, t], [w, h - t], 'vertical', 0.85),
    }
    presets.push(walls[params.openSide], openings[params.openSide])
  }

  if (shape.kind === 'h_shape' || shape.kind === 'h_uneven') {
    const left = shape.kind === 'h_uneven' ? params.leftUpright : params.upright
    const { gapTop, gapBottom } = hGaps(params)
    const y0 = gapBottom
    const y1 = gapBottom + params.crossbar
    presets.push(
      measurement('gapBottom', 'Bottom height', [left, 0], [left, y0], 'vertical', 0.85),
      measurement('gapTop', 'Top height', [left, y1], [left, params.height], 'vertical', 0.85),
      measurement('crossbar', 'Crossbar', [params.width / 2, y0], [params.width / 2, y1], 'vertical', 0.85),
    )
    if (shape.kind === 'h_shape') {
      presets.push(measurement('upright', 'Upright', [0, params.height], [params.upright, params.height], 'horizontal', 0.8))
    }
  }

  if (shape.kind === 't_uneven') {
    const y = params.height - params.barThickness
    presets.push(
      measurement('stemLeft', 'Left', [0, params.height], [params.stemLeft, params.height], 'horizontal', 0.8),
      measurement('stemRight', 'Right', [params.width - params.stemRight, params.height], [params.width, params.height], 'horizontal', 0.8),
      measurement('stemWidth', 'Stem', [params.stemLeft, 0], [params.width - params.stemRight, 0], 'horizontal', 0.85),
      measurement('barThickness', 'Bar thickness', [params.stemLeft / 2, y], [params.stemLeft / 2, params.height], 'vertical', -0.7),
    )
  }

  if (shape.kind === 'u_uneven') {
    presets.push(
      measurement('leftWall', 'Left', [0, params.height], [params.leftWall, params.height], 'horizontal', 0.85),
      measurement('rightWall', 'Right', [params.width - params.rightWall, params.height], [params.width, params.height], 'horizontal', 0.85),
      measurement('opening', 'Opening', [params.leftWall, params.height], [params.width - params.rightWall, params.height], 'horizontal', 0.85),
      measurement('base', 'Base', [params.leftWall, 0], [params.leftWall, params.base], 'vertical', 0.75),
    )
  }

  if (shape.kind === 'h_uneven') {
    presets.push(
      measurement('leftUpright', 'Left', [0, params.height], [params.leftUpright, params.height], 'horizontal', 0.8),
      measurement('rightUpright', 'Right', [params.width - params.rightUpright, params.height], [params.width, params.height], 'horizontal', 0.8),
    )
  }

  return presets
}

export function fieldsFor(kind) {
  switch (kind) {
    case 'rectangle':
      return [{ key: 'width', label: 'Width' }, { key: 'height', label: 'Height' }]
    case 'square':
      return [{ key: 'side', label: 'Side' }]
    case 'right_triangle':
      return [{ key: 'base', label: 'Base' }, { key: 'height', label: 'Height' }]
    case 'l_shape':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'cutWidth', label: 'Cut width' },
        { key: 'cutHeight', label: 'Cut height' },
      ]
    case 't_shape':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'barThickness', label: 'Bar thickness' },
        { key: 'stemWidth', label: 'Stem width' },
      ]
    case 'u_shape':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'wall', label: 'Wall thickness' },
      ]
    case 't_uneven':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'barThickness', label: 'Bar thickness' },
        { key: 'stemLeft', label: 'Left side' },
        { key: 'stemRight', label: 'Right side' },
      ]
    case 'u_uneven':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'leftWall', label: 'Left wall' },
        { key: 'rightWall', label: 'Right wall' },
        { key: 'base', label: 'Base thickness' },
      ]
    case 'h_shape':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'gapTop', label: 'Top height' },
        { key: 'gapBottom', label: 'Bottom height' },
        { key: 'upright', label: 'Upright thickness' },
        { key: 'crossbar', label: 'Crossbar thickness' },
      ]
    case 'h_uneven':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'gapTop', label: 'Top height' },
        { key: 'gapBottom', label: 'Bottom height' },
        { key: 'leftUpright', label: 'Left upright' },
        { key: 'rightUpright', label: 'Right upright' },
        { key: 'crossbar', label: 'Crossbar thickness' },
      ]
    case 'step':
      return [
        { key: 'width', label: 'Overall width' },
        { key: 'height', label: 'Overall height' },
        { key: 'stepWidth', label: 'Step width' },
        { key: 'stepHeight', label: 'Step height' },
      ]
    default:
      return []
  }
}

export function defaultMeasurementPresets(shape) {
  const presets = ['width', 'height']
  if (shape.kind === 'l_shape') presets.push('cutWidth', 'cutHeight')
  if (shape.kind === 'u_shape') presets.push('wall', 'opening')
  if (shape.kind === 'h_shape') presets.push('upright', 'crossbar', 'gapTop', 'gapBottom')
  if (shape.kind === 't_uneven') presets.push('stemLeft', 'stemRight', 'stemWidth', 'barThickness')
  if (shape.kind === 'u_uneven') presets.push('leftWall', 'rightWall', 'opening', 'base')
  if (shape.kind === 'h_uneven') presets.push('leftUpright', 'rightUpright', 'crossbar', 'gapTop', 'gapBottom')
  return presets
}

export function ensureCompoundLabels(doc) {
  let changed = false
  for (const shape of doc.objects || []) {
    if (!['h_shape', 'h_uneven', 'u_shape', 'l_shape'].includes(shape.kind)) continue
    if ((shape.kind === 'h_shape' || shape.kind === 'h_uneven') && (!(shape.params.gapTop > 0) || !(shape.params.gapBottom > 0))) {
      const bottom = round((shape.params.height - shape.params.crossbar) / 2)
      shape.params.gapBottom = bottom
      shape.params.gapTop = round(shape.params.height - shape.params.crossbar - bottom)
      changed = true
    }
    const specs = dimensionPresets(shape)
    for (const preset of defaultMeasurementPresets(shape)) {
      if (!doc.annotations.some((item) => item.anchorId === shape.id && item.preset === preset)) {
        doc.annotations.push(createDimension(shape, preset))
        changed = true
      }
    }
    const height = boxSize(shape).height
    for (const annotation of doc.annotations) {
      if (annotation.anchorId !== shape.id) continue
      const spec = specs.find((item) => item.preset === annotation.preset)
      if (!spec) continue
      const sitsOnTop = spec.orientation === 'horizontal' && spec.offset > 0 && spec.from[1] >= height - 0.01
      if (sitsOnTop && annotation.offset < 0) {
        annotation.offset = spec.offset
        changed = true
      }
      if (annotation.preset === 'upright' && annotation.offset <= 0 && spec.offset > 0) {
        annotation.offset = spec.offset
        changed = true
      }
    }
  }
  return changed
}

export function createDimension(shape, preset) {
  const spec = dimensionPresets(shape).find((item) => item.preset === preset)
  if (!spec) throw new Error(`Unknown measurement ${preset}`)
  return {
    id: uid('dim'),
    kind: 'dimension',
    orientation: spec.orientation,
    anchorId: shape.id,
    preset,
    from: spec.from.map((n) => round(n)),
    to: spec.to.map((n) => round(n)),
    offset: spec.offset,
    label: { mode: 'computed', text: null, role: 'given' },
  }
}

export function syncAnnotation(shape, annotation) {
  const spec = dimensionPresets(shape).find((item) => item.preset === annotation.preset)
  if (!spec) return annotation
  return {
    ...annotation,
    orientation: spec.orientation,
    from: spec.from.map((n) => round(n)),
    to: spec.to.map((n) => round(n)),
  }
}

export function annotationDisplay(annotation, units, { preview }) {
  if (preview && (annotation.label.role === 'hidden' || annotation.label.role === 'answer')) return '?'
  if (annotation.label.mode === 'manual' && typeof annotation.label.text === 'string' && annotation.label.text.trim()) {
    return annotation.label.text.trim()
  }
  const length = annotation.orientation === 'horizontal'
    ? Math.abs(annotation.to[0] - annotation.from[0])
    : Math.abs(annotation.to[1] - annotation.from[1])
  const text = formatLength(length)
  return units ? `${text} ${units}` : text
}

export function dimensionGeometry(shape, annotation) {
  const sign = annotation.offset < 0 ? -1 : 1
  const shift = annotation.orientation === 'horizontal' ? [0, annotation.offset] : [annotation.offset, 0]
  const nudge = annotation.orientation === 'horizontal' ? [0, sign * 0.42] : [sign * 0.48, 0]
  const a = [annotation.from[0] + shift[0], annotation.from[1] + shift[1]]
  const b = [annotation.to[0] + shift[0], annotation.to[1] + shift[1]]
  const mid = [(a[0] + b[0]) / 2 + nudge[0], (a[1] + b[1]) / 2 + nudge[1]]
  return {
    from: toWorld(shape, a),
    to: toWorld(shape, b),
    labelAt: toWorld(shape, mid),
  }
}

export function edgesAreOrthogonal(points) {
  if (points.length < 3) return false
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    const dx = Math.abs(x2 - x1)
    const dy = Math.abs(y2 - y1)
    if (dx > 1e-6 && dy > 1e-6) return false
  }
  return true
}

export function diagramBounds(doc, pad = 1.5) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const shape of doc.objects || []) {
    for (const [x, y] of worldVertices(shape)) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (!Number.isFinite(minX)) return null
  return [minX - pad, maxY + pad, maxX + pad, minY - pad]
}
