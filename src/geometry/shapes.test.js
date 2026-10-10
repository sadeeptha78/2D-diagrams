import { describe, expect, it } from 'vitest'
import {
  SHAPE_KINDS,
  annotationDisplay,
  applyHandle,
  area,
  createDimension,
  createShape,
  dimensionPresets,
  edgesAreOrthogonal,
  localVertices,
  normalizeRotation,
  validateParams,
} from './shapes.js'

describe('shape geometry', () => {
  it('gives every template a width and a height measurement', () => {
    for (const item of SHAPE_KINDS) {
      const shape = createShape(item.kind)
      const width = dimensionPresets(shape).find((entry) => entry.preset === 'width')
      const height = dimensionPresets(shape).find((entry) => entry.preset === 'height')
      expect(width?.length).toBeGreaterThan(0)
      expect(height?.length).toBeGreaterThan(0)
      expect(validateParams(shape.kind, shape.params)).toEqual([])
    }
  })

  it('keeps compound outlines on right angles', () => {
    for (const kind of ['rectangle', 'square', 'l_shape', 't_shape', 't_uneven', 'u_shape', 'u_uneven', 'h_shape', 'h_uneven', 'step']) {
      expect(edgesAreOrthogonal(localVertices(createShape(kind)))).toBe(true)
    }
  })

  it('calculates area from the measurements', () => {
    expect(area(createShape('rectangle'))).toBe(40)
    expect(area(createShape('square'))).toBe(25)
    expect(area(createShape('right_triangle'))).toBe(12)
    const lShape = createShape('l_shape')
    expect(area(lShape)).toBe(8 * 6 - 3 * 2)
  })

  it('snaps a turn onto the allowed angles', () => {
    expect(normalizeRotation(44)).toBe(45)
    expect(normalizeRotation(360)).toBe(0)
    expect(normalizeRotation(-90)).toBe(270)
  })

  it('puts the lengths needed for perimeter and area on the top of an H, U, and L', () => {
    const h = createShape('h_shape')
    const upright = dimensionPresets(h).find((entry) => entry.preset === 'upright')
    const width = dimensionPresets(h).find((entry) => entry.preset === 'width')
    expect(upright.from[1]).toBe(h.params.height)
    expect(width.from[1]).toBe(h.params.height)
    expect(dimensionPresets(h).some((entry) => entry.preset === 'crossbar')).toBe(true)

    const u = createShape('u_shape')
    const opening = dimensionPresets(u).find((entry) => entry.preset === 'opening')
    const wall = dimensionPresets(u).find((entry) => entry.preset === 'wall')
    expect(opening.from[1]).toBe(u.params.height)
    expect(wall.from[1]).toBe(u.params.height)
    expect(opening.length).toBe(u.params.width - 2 * u.params.wall)

    const l = createShape('l_shape')
    const lWidth = dimensionPresets(l).find((entry) => entry.preset === 'width')
    expect(lWidth.from[1]).toBe(l.params.height)
    expect(dimensionPresets(l).some((entry) => entry.preset === 'cutWidth')).toBe(true)
    expect(dimensionPresets(l).some((entry) => entry.preset === 'cutHeight')).toBe(true)
  })

  it('changes one side of an uneven T, U, or H without moving the other', () => {
    const t = createShape('t_uneven')
    const movedT = applyHandle(t, { key: 'stemLeft' }, [3, 2])
    expect(movedT.stemRight).toBe(t.params.stemRight)
    expect(movedT.stemLeft).toBe(3)

    const u = createShape('u_uneven')
    const movedU = applyHandle(u, { key: 'left' }, [2.5, 3])
    expect(movedU.rightWall).toBe(u.params.rightWall)
    expect(movedU.leftWall).toBe(2.5)

    const h = createShape('h_uneven')
    const movedH = applyHandle(h, { key: 'right' }, [7, 2])
    expect(movedH.leftUpright).toBe(h.params.leftUpright)
    expect(movedH.rightUpright).toBe(h.params.width - 7)

    expect(area(t)).toBe(8 * 2 + (8 - 1.5 - 3.5) * (6 - 2))
    expect(area(u)).toBe(8 * 6 - (8 - 1.2 - 2.4) * (6 - 1.5))
    expect(area(h)).toBe((1.5 + 3) * 8 + (10 - 1.5 - 3) * 2)
    const bottom = h.params.gapBottom
    const raised = applyHandle(h, { key: 'gapTop' }, [2, 6])
    expect(raised.gapBottom).toBe(bottom)
    expect(raised.gapTop).toBe(2)
    expect(raised.height).toBe(2 + h.params.crossbar + bottom)
    expect(dimensionPresets(h).find((entry) => entry.preset === 'gapTop').length).toBe(h.params.gapTop)
    expect(dimensionPresets(h).find((entry) => entry.preset === 'gapBottom').length).toBe(h.params.gapBottom)
    expect(edgesAreOrthogonal(localVertices(t))).toBe(true)
  })

  it('hides answer labels in student view and keeps the real length in the file', () => {
    const shape = createShape('rectangle')
    const dimension = createDimension(shape, 'width')
    dimension.label.role = 'answer'
    expect(annotationDisplay(dimension, 'cm', { preview: false })).toBe('8 cm')
    expect(annotationDisplay(dimension, 'cm', { preview: true })).toBe('?')
  })
})
