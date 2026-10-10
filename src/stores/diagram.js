import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { labelSizeOf, validateDocument } from '../geometry/document.js'
import { sixFigures } from '../geometry/sixFigures.js'
import {
  applyHandle,
  boxSize,
  createDimension,
  createShape,
  defaultMeasurementPresets,
  defaultParams,
  dimensionPresets,
  ensureCompoundLabels,
  settleHParams,
  normalizeRotation,
  round,
  syncAnnotation,
  validateParams,
} from '../geometry/shapes.js'
import { loadLocal, saveLocal } from '../persistence/storage.js'

const HISTORY_LIMIT = 50

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function nextOrigin(draft, width, height) {
  if (!draft.objects.length) {
    const [minX, maxY, maxX, minY] = draft.viewport.boundingBox
    return [round((minX + maxX) / 2 - width / 2), round((minY + maxY) / 2 - height / 2)]
  }
  let right = -Infinity
  let bottom = Infinity
  for (const shape of draft.objects) {
    const size = boxSize(shape)
    right = Math.max(right, shape.params.origin[0] + size.width)
    bottom = Math.min(bottom, shape.params.origin[1])
  }
  return [round(right + 2), round(bottom)]
}

function rememberedDocument() {
  const saved = loadLocal()
  if (!saved) return sixFigures()
  const result = validateDocument(saved)
  if (!result.ok) return sixFigures()
  if (ensureCompoundLabels(saved)) saveLocal(saved)
  return saved
}

export const useDiagramStore = defineStore('diagram', () => {
  const doc = ref(rememberedDocument())
  const revision = ref(0)
  const revisionReason = ref('load')
  const selection = ref(null)
  const preview = ref(false)
  const loadError = ref('')
  const past = ref([])
  const future = ref([])
  const fitRequest = ref(0)

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)
  const selectedShape = computed(() => doc.value.objects.find((shape) => shape.id === selection.value?.id && selection.value?.type === 'shape') || null)
  const selectedDimension = computed(() => doc.value.annotations.find((item) => item.id === selection.value?.id && selection.value?.type === 'dimension') || null)

  function bump(reason) {
    revisionReason.value = reason
    revision.value += 1
    saveLocal(doc.value)
  }

  function remember() {
    past.value.push(clone(doc.value))
    if (past.value.length > HISTORY_LIMIT) past.value.shift()
    future.value = []
  }

  function commit(mutator) {
    remember()
    const next = clone(doc.value)
    mutator(next)
    doc.value = next
    keepSelection()
    bump('edit')
  }

  function keepSelection() {
    const current = selection.value
    if (!current) return
    if (current.type === 'shape' && !doc.value.objects.some((shape) => shape.id === current.id)) selection.value = null
    if (current.type === 'dimension' && !doc.value.annotations.some((item) => item.id === current.id)) selection.value = null
  }

  function selectShape(id) {
    if (selection.value?.type === 'shape' && selection.value.id === id) return
    selection.value = { type: 'shape', id }
    bump('edit')
  }

  function selectDimension(id) {
    if (selection.value?.type === 'dimension' && selection.value.id === id) return
    selection.value = { type: 'dimension', id }
    bump('edit')
  }

  function clearSelection() {
    if (!selection.value) return
    selection.value = null
    bump('edit')
  }

  function shapeById(draft, id) {
    return draft.objects.find((shape) => shape.id === id)
  }

  function syncShapeAnnotations(draft, shape) {
    draft.annotations = draft.annotations.map((item) => (item.anchorId === shape.id ? syncAnnotation(shape, item) : item))
  }

  function addShape(kind) {
    let created = null
    commit((draft) => {
      const probe = { kind, params: defaultParams(kind) }
      const { width, height } = boxSize(probe)
      created = createShape(kind, nextOrigin(draft, width, height))
      draft.objects.push(created)
      for (const preset of defaultMeasurementPresets(created)) draft.annotations.push(createDimension(created, preset))
    })
    selection.value = { type: 'shape', id: created.id }
    bump('edit')
    fitRequest.value += 1
  }

  function trySetParams(id, partial) {
    const shape = doc.value.objects.find((item) => item.id === id)
    if (!shape) return ['That shape is no longer on the board.']
    const params = { ...shape.params, ...partial, origin: [...shape.params.origin] }
    if (shape.kind === 'h_shape' || shape.kind === 'h_uneven') settleHParams(params, Object.keys(partial)[0])
    const errors = validateParams(shape.kind, params)
    if (errors.length) return errors
    commit((draft) => {
      const target = shapeById(draft, id)
      target.params = params
      syncShapeAnnotations(draft, target)
    })
    return []
  }

  function rotateBy(id, delta) {
    commit((draft) => {
      const target = shapeById(draft, id)
      if (!target) return
      target.params.rotation = normalizeRotation(target.params.rotation + delta)
    })
    fitRequest.value += 1
  }

  function setStyle(id, partial) {
    commit((draft) => {
      const target = shapeById(draft, id)
      if (!target) return
      target.style = { ...target.style, ...partial }
    })
  }

  function duplicateShape(id) {
    let copyId = ''
    commit((draft) => {
      const source = shapeById(draft, id)
      if (!source) return
      const copy = clone(source)
      copy.id = createShape(source.kind).id
      copy.params.origin = [round(source.params.origin[0] + 1.5), round(source.params.origin[1] + 1.5)]
      copyId = copy.id
      draft.objects.push(copy)
      for (const annotation of draft.annotations.filter((item) => item.anchorId === source.id)) {
        const copyAnn = clone(annotation)
        copyAnn.id = createDimension(copy, annotation.preset).id
        copyAnn.anchorId = copy.id
        draft.annotations.push(syncAnnotation(copy, copyAnn))
      }
    })
    if (copyId) {
      selection.value = { type: 'shape', id: copyId }
      bump('edit')
    }
  }

  function deleteShape(id) {
    commit((draft) => {
      draft.objects = draft.objects.filter((shape) => shape.id !== id)
      draft.annotations = draft.annotations.filter((item) => item.anchorId !== id)
    })
  }

  function deleteDimension(id) {
    commit((draft) => {
      draft.annotations = draft.annotations.filter((item) => item.id !== id)
    })
  }

  function deleteSelection() {
    if (selection.value?.type === 'shape') deleteShape(selection.value.id)
    else if (selection.value?.type === 'dimension') deleteDimension(selection.value.id)
  }

  function addDimension(shapeId, preset) {
    const shape = doc.value.objects.find((item) => item.id === shapeId)
    if (!shape) return
    if (doc.value.annotations.some((item) => item.anchorId === shapeId && item.preset === preset)) return
    if (!dimensionPresets(shape).some((item) => item.preset === preset)) return
    let createdId = ''
    commit((draft) => {
      const target = shapeById(draft, shapeId)
      const annotation = createDimension(target, preset)
      createdId = annotation.id
      draft.annotations.push(annotation)
    })
    if (createdId) {
      selection.value = { type: 'dimension', id: createdId }
      bump('edit')
    }
  }

  function updateDimension(id, recipe) {
    commit((draft) => {
      const annotation = draft.annotations.find((item) => item.id === id)
      if (!annotation) return
      recipe(annotation)
    })
  }

  function beginGesture() {
    remember()
  }

  function cancelGesture() {
    past.value.pop()
  }

  function dragOrigin(id, origin) {
    const next = clone(doc.value)
    const shape = shapeById(next, id)
    if (!shape) return
    shape.params.origin = origin.map((n) => round(n))
    doc.value = next
    bump('drag')
  }

  function dragHandle(id, handle, localPoint, snapshot) {
    const next = clone(doc.value)
    const shape = shapeById(next, id)
    if (!shape) return
    shape.params = applyHandle(snapshot, handle, localPoint)
    shape.params.origin = [...snapshot.params.origin]
    shape.params.rotation = snapshot.params.rotation
    syncShapeAnnotations(next, shape)
    doc.value = next
    bump('drag')
  }

  function setName(name) {
    const trimmed = name.trim()
    if (!trimmed || trimmed === doc.value.name) return
    commit((draft) => {
      draft.name = trimmed.slice(0, 80)
    })
  }

  function setUnits(units) {
    if (units === doc.value.units) return
    commit((draft) => {
      draft.units = units
    })
  }

  let labelSizeGesture = false

  function setLabelSize(size, { live = false } = {}) {
    const next = labelSizeOf({ labelSize: size })
    if (labelSizeOf(doc.value) === next && doc.value.labelSize === next) {
      if (!live) labelSizeGesture = false
      return
    }
    if (live) {
      if (!labelSizeGesture) {
        remember()
        labelSizeGesture = true
      }
      doc.value = { ...doc.value, labelSize: next }
      bump('edit')
      return
    }
    labelSizeGesture = false
    commit((draft) => {
      draft.labelSize = next
    })
  }

  function setGrid(grid) {
    commit((draft) => {
      draft.viewport.grid = grid
    })
  }

  function setViewport(boundingBox) {
    const current = doc.value.viewport.boundingBox
    if (current.every((value, index) => Math.abs(value - boundingBox[index]) < 0.0001)) return
    doc.value = {
      ...doc.value,
      viewport: { ...doc.value.viewport, boundingBox: boundingBox.map((n) => round(n * 1000) / 1000) },
    }
    saveLocal(doc.value)
  }

  function undo() {
    const previous = past.value.pop()
    if (!previous) return
    future.value.push(clone(doc.value))
    const viewport = clone(doc.value.viewport)
    doc.value = { ...clone(previous), viewport }
    keepSelection()
    bump('edit')
  }

  function redo() {
    const next = future.value.pop()
    if (!next) return
    past.value.push(clone(doc.value))
    const viewport = clone(doc.value.viewport)
    doc.value = { ...clone(next), viewport }
    keepSelection()
    bump('edit')
  }

  function loadDocument(candidate) {
    const result = validateDocument(candidate)
    if (!result.ok) {
      loadError.value = result.errors[0]
      return false
    }
    past.value = []
    future.value = []
    selection.value = null
    preview.value = false
    loadError.value = ''
    doc.value = candidate
    bump('load')
    return true
  }

  function togglePreview() {
    preview.value = !preview.value
    bump('edit')
  }

  function requestFit() {
    fitRequest.value += 1
  }

  return {
    doc,
    revision,
    revisionReason,
    selection,
    preview,
    loadError,
    canUndo,
    canRedo,
    selectedShape,
    selectedDimension,
    fitRequest,
    selectShape,
    selectDimension,
    clearSelection,
    addShape,
    trySetParams,
    rotateBy,
    setStyle,
    duplicateShape,
    deleteShape,
    deleteDimension,
    deleteSelection,
    addDimension,
    updateDimension,
    beginGesture,
    cancelGesture,
    dragOrigin,
    dragHandle,
    setName,
    setUnits,
    setLabelSize,
    setGrid,
    setViewport,
    undo,
    redo,
    loadDocument,
    togglePreview,
    requestFit,
  }
})
