<script setup>
import { ref, watch } from 'vue'
import { UNITS } from '../geometry/shapes.js'
import { downloadText, slugify } from '../persistence/storage.js'
import { useDiagramStore } from '../stores/diagram.js'

const store = useDiagramStore()
const emit = defineEmits(['export-svg', 'export-png', 'fit', 'zoom-in', 'zoom-out'])
const fileInput = ref(null)
const name = ref(store.doc.name)

watch(() => store.doc.name, (value) => {
  name.value = value
})

function commitName() {
  store.setName(name.value)
  name.value = store.doc.name
}

function openFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      store.loadDocument(parsed)
    } catch {
      store.loadError = 'This file is not valid JSON.'
    }
  }
  reader.readAsText(file)
}

function downloadJson() {
  downloadText(
    `${slugify(store.doc.name)}.json`,
    JSON.stringify(store.doc, null, 2),
    'application/json',
  )
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="mark" aria-hidden="true" />
      <div>
        <p class="wordmark">Figure Board</p>
        <p class="tagline">Compound shapes for maths questions</p>
      </div>
    </div>

    <label class="name-field">
      <span>Name</span>
      <input v-model="name" type="text" maxlength="80" @change="commitName" @keydown.enter="$event.target.blur()" />
    </label>

    <label class="units-field">
      <span>Units</span>
      <select :value="store.doc.units" @change="store.setUnits($event.target.value)">
        <option v-for="unit in UNITS" :key="unit" :value="unit">{{ unit }}</option>
      </select>
    </label>

    <label class="label-size">
      <span>Label size {{ store.doc.labelSize || 15 }}</span>
      <input
        :value="store.doc.labelSize || 15"
        type="range"
        min="12"
        max="48"
        step="1"
        aria-label="Label size"
        @input="store.setLabelSize(Number($event.target.value), { live: true })"
        @change="store.setLabelSize(Number($event.target.value))"
      />
    </label>

    <div class="tool-cluster">
      <button type="button" :disabled="!store.canUndo" @click="store.undo">Undo</button>
      <button type="button" :disabled="!store.canRedo" @click="store.redo">Redo</button>
      <button type="button" @click="emit('zoom-out')">Zoom out</button>
      <button type="button" @click="emit('zoom-in')">Zoom in</button>
      <button type="button" @click="emit('fit')">Fit</button>
      <button type="button" :aria-pressed="store.doc.viewport.grid" @click="store.setGrid(!store.doc.viewport.grid)">
        {{ store.doc.viewport.grid ? 'Grid on' : 'Grid' }}
      </button>
      <button type="button" class="preview-toggle" :aria-pressed="store.preview" @click="store.togglePreview">
        {{ store.preview ? 'Editing view' : 'Student view' }}
      </button>
      <button type="button" @click="fileInput.click()">Open JSON</button>
      <button type="button" @click="downloadJson">Download JSON</button>
      <button type="button" @click="emit('export-svg')">Export SVG</button>
      <button type="button" @click="emit('export-png')">Save PNG</button>
      <input ref="fileInput" class="file-input" type="file" accept="application/json,.json" @change="openFile" />
    </div>
  </header>
</template>
