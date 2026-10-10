<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DiagramCanvas from './components/DiagramCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import ShapePalette from './components/ShapePalette.vue'
import Toolbar from './components/Toolbar.vue'
import { useDiagramStore } from './stores/diagram.js'

const store = useDiagramStore()
const canvas = ref(null)

async function saveThenNew() {
  const saved = await canvas.value?.exportPng()
  if (saved) store.newDiagram()
}

function onKey(event) {
  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  const key = event.key.toLowerCase()
  if ((event.metaKey || event.ctrlKey) && key === 'z') {
    event.preventDefault()
    if (event.shiftKey) store.redo()
    else store.undo()
    return
  }
  if ((event.metaKey || event.ctrlKey) && key === 'y') {
    event.preventDefault()
    store.redo()
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') store.deleteSelection()
  if (event.key === 'Escape') store.clearSelection()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app">
    <Toolbar
      @export-svg="canvas?.exportSvg()"
      @export-png="canvas?.exportPng()"
      @save-and-new="saveThenNew"
      @fit="canvas?.fit()"
      @zoom-in="canvas?.zoom(1)"
      @zoom-out="canvas?.zoom(-1)"
    />
    <div class="workspace">
      <ShapePalette />
      <DiagramCanvas ref="canvas" />
      <PropertiesPanel />
    </div>
  </div>
</template>
