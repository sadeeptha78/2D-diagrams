<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { drawDocument, mountBoard, patchDocument, pick } from '../board/scene.js'
import { exportFrame } from '../geometry/exportFrame.js'
import { diagramBounds, toLocal } from '../geometry/shapes.js'
import { JSXGraph } from 'jsxgraph'
import { chooseSaveFile, downloadBlob, downloadText, slugify, writeBlob } from '../persistence/storage.js'
import { useDiagramStore } from '../stores/diagram.js'

const store = useDiagramStore()
const boardEl = ref(null)
const frameEl = ref(null)
let board = null
let drag = null
let applyingBox = false
let observer = null

function viewState(mode = store.preview ? 'preview' : 'editor') {
  return { mode, selection: mode === 'editor' ? store.selection : null }
}

function drawAll() {
  if (!board) return
  applyingBox = true
  drawDocument(board, store.doc, viewState())
  applyingBox = false
}

function onBox() {
  if (applyingBox || !board) return
  store.setViewport(board.getBoundingBox())
}

function fit() {
  const box = diagramBounds(store.doc)
  if (!box || !board) return
  const rect = board.containerObj.getBoundingClientRect()
  const contentWidth = box[2] - box[0]
  const contentHeight = box[1] - box[3]
  const viewRatio = rect.width / Math.max(rect.height, 1)
  let [minX, maxY, maxX, minY] = box
  if (contentWidth / contentHeight < viewRatio) {
    const extra = (contentHeight * viewRatio - contentWidth) / 2
    minX -= extra
    maxX += extra
  } else {
    const extra = (contentWidth / viewRatio - contentHeight) / 2
    maxY += extra
    minY -= extra
  }
  applyingBox = true
  board.setBoundingBox([minX, maxY, maxX, minY], true, 'update')
  applyingBox = false
  store.setViewport(board.getBoundingBox())
}

function zoom(direction) {
  if (!board) return
  if (direction > 0) board.zoomIn()
  else board.zoomOut()
  store.setViewport(board.getBoundingBox())
}

function onPointerDown(event) {
  if (!board || event.button !== 0) return
  const point = board.getUsrCoordsOfMouse(event)
  if (store.preview) {
    drag = { kind: 'pan', startX: event.clientX, startY: event.clientY, box: board.getBoundingBox(), started: false }
    boardEl.value.setPointerCapture(event.pointerId)
    return
  }
  const hit = pick(board, event)
  if (hit?.role === 'handle') {
    const shape = store.doc.objects.find((item) => item.id === hit.id)
    drag = {
      kind: 'handle',
      id: hit.id,
      handle: hit.handle,
      snapshot: JSON.parse(JSON.stringify(shape)),
      startX: event.clientX,
      startY: event.clientY,
      started: false,
    }
  } else if (hit?.role === 'dimension') {
    store.selectDimension(hit.id)
    return
  } else if (hit?.role === 'shape') {
    store.selectShape(hit.id)
    const shape = store.doc.objects.find((item) => item.id === hit.id)
    drag = {
      kind: 'move',
      id: hit.id,
      startOrigin: [...shape.params.origin],
      startWorld: point,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
    }
  } else {
    store.clearSelection()
    drag = { kind: 'pan', startX: event.clientX, startY: event.clientY, box: board.getBoundingBox(), started: false }
  }
  boardEl.value.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function onPointerMove(event) {
  if (!drag || !board) return
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
  if (!drag.started && distance < 4) return
  if (!drag.started) {
    drag.started = true
    if (drag.kind !== 'pan') store.beginGesture()
  }
  if (drag.kind === 'pan') {
    const [minX, maxY, maxX, minY] = drag.box
    const rect = board.containerObj.getBoundingClientRect()
    const width = maxX - minX
    const height = maxY - minY
    const dx = ((event.clientX - drag.startX) / rect.width) * width
    const dy = ((event.clientY - drag.startY) / rect.height) * height
    applyingBox = true
    board.setBoundingBox([minX - dx, maxY + dy, maxX - dx, minY + dy], true, 'update')
    applyingBox = false
    store.setViewport(board.getBoundingBox())
    return
  }
  const world = board.getUsrCoordsOfMouse(event)
  if (drag.kind === 'move') {
    store.dragOrigin(drag.id, [
      drag.startOrigin[0] + world[0] - drag.startWorld[0],
      drag.startOrigin[1] + world[1] - drag.startWorld[1],
    ])
  } else if (drag.kind === 'handle') {
    store.dragHandle(drag.id, drag.handle, toLocal(drag.snapshot, world), drag.snapshot)
  }
}

function onPointerUp() {
  if (drag?.kind === 'pan' && drag.started) store.setViewport(board.getBoundingBox())
  drag = null
}

function svgMarkup(source, pixelWidth, pixelHeight) {
  source.renderer.svgRoot.setAttribute('width', String(pixelWidth))
  source.renderer.svgRoot.setAttribute('height', String(pixelHeight))
  const uri = source.renderer.dumpToDataURI(false)
  const encoded = uri.split(',')[1]
  const markup = new TextDecoder().decode(Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0)))
  return markup
    .replace(/<foreignObject\b[^>]*\/>/g, '')
    .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/g, '')
}

function renderExportMarkup(drawMode) {
  const rect = board.containerObj.getBoundingClientRect()
  const frame = exportFrame(store.doc, rect, { preview: drawMode === 'preview' })
  if (!frame) return null
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.position = 'fixed'
  host.style.left = '-12000px'
  host.style.top = '0'
  host.style.width = `${frame.pixelWidth}px`
  host.style.height = `${frame.pixelHeight}px`
  host.style.pointerEvents = 'none'
  document.body.appendChild(host)
  const exportBoard = mountBoard(host)
  try {
    exportBoard.resizeContainer(frame.pixelWidth, frame.pixelHeight)
    drawDocument(exportBoard, {
      ...store.doc,
      viewport: { ...store.doc.viewport, boundingBox: frame.box },
    }, { mode: drawMode, selection: null })
    return svgMarkup(exportBoard, frame.pixelWidth, frame.pixelHeight)
  } finally {
    JSXGraph.freeBoard(exportBoard)
    host.remove()
  }
}

async function exportSvg() {
  if (!store.doc.objects.length) {
    store.loadError = 'Add a shape before saving a picture.'
    return
  }
  const drawMode = store.preview ? 'preview' : 'clean'
  try {
    const markup = renderExportMarkup(drawMode)
    if (!markup) {
      store.loadError = 'Add a shape before saving a picture.'
      return
    }
    downloadText(`${slugify(store.doc.name)}.svg`, markup, 'image/svg+xml')
    store.loadError = ''
  } catch {
    store.loadError = 'Could not save the picture.'
  }
}

async function renderPng(drawMode) {
  const markup = renderExportMarkup(drawMode)
  if (!markup) return null
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const image = await loadImage(url)
    const rect = board.containerObj.getBoundingClientRect()
    const width = image.naturalWidth || Math.round(rect.width)
    const height = image.naturalHeight || Math.round(rect.height)
    if (!width || !height) throw new Error('Could not draw the export.')
    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const context = canvas.getContext('2d')
    context.fillStyle = '#fffdf8'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!png) throw new Error('Could not draw the export.')
    return png
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function exportPng() {
  if (!store.doc.objects.length) {
    store.loadError = 'Add a shape before saving a picture.'
    return false
  }
  const filename = `${slugify(store.doc.name)}.png`
  const chosen = await chooseSaveFile(filename, {
    description: 'PNG image',
    mime: 'image/png',
    extension: '.png',
  })
  if (chosen === 'cancelled') return false
  const drawMode = store.preview ? 'preview' : 'clean'
  try {
    const png = await renderPng(drawMode)
    if (!png) {
      store.loadError = 'Add a shape before saving a picture.'
      return false
    }
    if (chosen) await writeBlob(chosen, png)
    else downloadBlob(filename, png)
    store.loadError = ''
    return true
  } catch {
    store.loadError = 'Could not save the PNG.'
    return false
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not draw the export.'))
    image.src = url
  })
}

defineExpose({ exportSvg, exportPng, fit, zoom })

onMounted(() => {
  board = mountBoard(boardEl.value)
  const resize = () => {
    const rect = frameEl.value?.getBoundingClientRect()
    if (!rect || rect.width < 20 || rect.height < 20) return
    board.resizeContainer(rect.width, rect.height)
  }
  resize()
  drawAll()
  if (store.doc.objects.length) fit()
  board.on('boundingbox', onBox)
  observer = new ResizeObserver(resize)
  observer.observe(frameEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (board) JSXGraph.freeBoard(board)
})

watch(() => store.revision, () => {
  if (!board) return
  if (store.revisionReason === 'drag') {
    try {
      const patched = patchDocument(board, store.doc, viewState())
      if (!patched) drawAll()
    } catch {
      drawAll()
    }
    return
  }
  drawAll()
}, { flush: 'sync' })

watch(() => store.fitRequest, () => fit())
</script>

<template>
  <div ref="frameEl" class="canvas-frame">
    <div
      id="figure-board"
      ref="boardEl"
      class="board"
      role="application"
      aria-label="Diagram canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
    <p v-if="store.doc.objects.length === 0" class="empty-board">
      Choose a rectangle, L, H, or another template. The first measurements are added for you.
    </p>
    <p v-if="store.preview" class="preview-banner">Student view. Hidden and answer measurements show as ?.</p>
    <p v-if="store.loadError" class="load-error" role="alert">
      {{ store.loadError }}
      <button type="button" @click="store.loadError = ''">Dismiss</button>
    </p>
  </div>
</template>
