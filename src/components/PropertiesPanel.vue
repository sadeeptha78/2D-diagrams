<script setup>
import { computed, ref } from 'vue'
import {
  CUT_CORNERS,
  OPEN_SIDES,
  area,
  cornerLabel,
  dimensionPresets,
  fieldsFor,
  formatLength,
  kindLabel,
  sideLabel,
} from '../geometry/shapes.js'
import { useDiagramStore } from '../stores/diagram.js'

const store = useDiagramStore()
const focused = ref('')
const draft = ref('')
const fieldError = ref('')

const shape = computed(() => store.selectedShape)
const dimension = computed(() => store.selectedDimension)
const anchoredShape = computed(() => {
  if (!dimension.value) return null
  return store.doc.objects.find((item) => item.id === dimension.value.anchorId) || null
})
const shapeFields = computed(() => (shape.value ? fieldsFor(shape.value.kind) : []))
const shapeArea = computed(() => (shape.value ? formatLength(area(shape.value)) : ''))
const measurements = computed(() => {
  if (!shape.value) return []
  return store.doc.annotations.filter((item) => item.anchorId === shape.value.id)
})
const availableMeasurements = computed(() => {
  if (!shape.value) return []
  const used = new Set(measurements.value.map((item) => item.preset))
  return dimensionPresets(shape.value).filter((item) => !used.has(item.preset))
})
const presetLabel = computed(() => {
  if (!dimension.value || !anchoredShape.value) return 'Measurement'
  return dimensionPresets(anchoredShape.value).find((item) => item.preset === dimension.value.preset)?.label || 'Measurement'
})

function shownValue(key) {
  if (focused.value === key) return draft.value
  return shape.value?.params[key]
}

function startEdit(key) {
  focused.value = key
  draft.value = String(shape.value.params[key])
  fieldError.value = ''
}

function onDraft(event) {
  draft.value = event.target.value
}

function commitField(key) {
  focused.value = ''
  const value = Number(draft.value)
  if (!Number.isFinite(value)) {
    fieldError.value = 'Enter a number greater than 0.'
    return
  }
  const errors = store.trySetParams(shape.value.id, { [key]: value })
  fieldError.value = errors[0] || ''
}

function chooseCorner(corner) {
  fieldError.value = ''
  const errors = store.trySetParams(shape.value.id, { cutCorner: corner })
  fieldError.value = errors[0] || ''
}

function chooseSide(openSide) {
  fieldError.value = ''
  const errors = store.trySetParams(shape.value.id, { openSide })
  fieldError.value = errors[0] || ''
}

function labelNudge(axis) {
  const value = dimension.value?.labelShift?.[axis]
  return typeof value === 'number' ? value : 0
}

function nudgeLabel(axis, raw, live) {
  const value = Math.min(1, Math.max(-1, Math.round(Number(raw) * 10) / 10))
  if (!Number.isFinite(value)) return
  store.updateDimension(dimension.value.id, (item) => {
    const current = item.labelShift || { x: 0, y: 0 }
    item.labelShift = { x: current.x || 0, y: current.y || 0, [axis]: value }
  }, { live })
}

function addMeasurement(event) {
  const preset = event.target.value
  event.target.value = ''
  if (preset) store.addDimension(shape.value.id, preset)
}
</script>

<template>
  <aside class="inspector">
    <p class="rail-label">Inspector</p>

    <section v-if="shape" class="panel-card">
      <header class="panel-head">
        <h2>{{ kindLabel(shape.kind) }}</h2>
        <p>{{ shape.params.rotation }}° clockwise</p>
      </header>

      <div class="rotate-row">
        <button type="button" @click="store.rotateBy(shape.id, 45)">Turn 45°</button>
        <button type="button" @click="store.rotateBy(shape.id, 90)">Turn 90°</button>
        <button type="button" @click="store.rotateBy(shape.id, 180)">Turn 180°</button>
      </div>

      <div class="field-grid">
        <label v-for="field in shapeFields" :key="field.key">
          <span>{{ field.label }}</span>
          <input
            :value="shownValue(field.key)"
            type="number"
            min="0.5"
            step="0.5"
            @focus="startEdit(field.key)"
            @input="onDraft"
            @blur="commitField(field.key)"
            @keydown.enter="$event.target.blur()"
          />
        </label>
      </div>
      <p v-if="fieldError" class="field-error" role="alert">{{ fieldError }}</p>
      <p class="area-readout">Area {{ shapeArea }} {{ store.doc.units }}²</p>

      <div v-if="shape.kind === 'l_shape'" class="choice-block">
        <p>Missing corner</p>
        <div class="choice-row">
          <button
            v-for="corner in CUT_CORNERS"
            :key="corner"
            type="button"
            :aria-pressed="shape.params.cutCorner === corner"
            @click="chooseCorner(corner)"
          >
            {{ cornerLabel(corner) }}
          </button>
        </div>
      </div>

      <div v-if="shape.kind === 'u_shape'" class="choice-block">
        <p>Open side</p>
        <div class="choice-row">
          <button
            v-for="side in OPEN_SIDES"
            :key="side"
            type="button"
            :aria-pressed="shape.params.openSide === side"
            @click="chooseSide(side)"
          >
            {{ sideLabel(side) }}
          </button>
        </div>
      </div>

      <div class="style-row">
        <label>
          <span>Fill</span>
          <input :value="shape.style.fill" type="color" @change="store.setStyle(shape.id, { fill: $event.target.value })" />
        </label>
        <label>
          <span>Outline</span>
          <input :value="shape.style.stroke" type="color" @change="store.setStyle(shape.id, { stroke: $event.target.value })" />
        </label>
        <label>
          <span>Weight {{ shape.style.strokeWidth }}</span>
          <input
            :value="shape.style.strokeWidth"
            type="range"
            min="1"
            max="6"
            step="0.5"
            @change="store.setStyle(shape.id, { strokeWidth: Number($event.target.value) })"
          />
        </label>
      </div>

      <div class="measure-block">
        <p>Measurements</p>
        <button
          v-for="item in measurements"
          :key="item.id"
          type="button"
          class="measure-link"
          @click="store.selectDimension(item.id)"
        >
          <span>{{ dimensionPresets(shape).find((preset) => preset.preset === item.preset)?.label }}</span>
          <small>{{ item.label.role }}</small>
        </button>
        <label v-if="availableMeasurements.length" class="add-measure">
          <span>Add measurement</span>
          <select @change="addMeasurement">
            <option value="">Choose</option>
            <option v-for="item in availableMeasurements" :key="item.preset" :value="item.preset">{{ item.label }}</option>
          </select>
        </label>
      </div>

      <div class="action-row">
        <button type="button" @click="store.duplicateShape(shape.id)">Duplicate</button>
        <button type="button" class="danger" @click="store.deleteShape(shape.id)">Delete</button>
      </div>
    </section>

    <section v-else-if="dimension && anchoredShape" class="panel-card">
      <header class="panel-head">
        <h2>{{ presetLabel }}</h2>
        <p>{{ kindLabel(anchoredShape.kind) }}</p>
      </header>

      <div class="choice-block">
        <p>Label</p>
        <div class="choice-row">
          <button type="button" :aria-pressed="dimension.label.mode === 'computed'" @click="store.updateDimension(dimension.id, (item) => { item.label.mode = 'computed' })">Calculated</button>
          <button type="button" :aria-pressed="dimension.label.mode === 'manual'" @click="store.updateDimension(dimension.id, (item) => { item.label.mode = 'manual' })">Typed</button>
        </div>
      </div>

      <label v-if="dimension.label.mode === 'manual'" class="stack-field">
        <span>Text</span>
        <input
          :value="dimension.label.text || ''"
          type="text"
          maxlength="40"
          placeholder="not to scale"
          @change="store.updateDimension(dimension.id, (item) => { item.label.text = $event.target.value })"
        />
      </label>

      <div class="choice-block">
        <p>Question role</p>
        <div class="choice-row">
          <button type="button" :aria-pressed="dimension.label.role === 'given'" @click="store.updateDimension(dimension.id, (item) => { item.label.role = 'given' })">Given</button>
          <button type="button" :aria-pressed="dimension.label.role === 'hidden'" @click="store.updateDimension(dimension.id, (item) => { item.label.role = 'hidden' })">Hidden</button>
          <button type="button" :aria-pressed="dimension.label.role === 'answer'" @click="store.updateDimension(dimension.id, (item) => { item.label.role = 'answer' })">Answer</button>
        </div>
        <small class="hint">Hidden and answer show as ? in student view. The file keeps the real length.</small>
      </div>

      <label class="stack-field">
        <span>Offset {{ dimension.offset }}</span>
        <input
          :value="dimension.offset"
          type="range"
          min="-3"
          max="3"
          step="0.1"
          @change="store.updateDimension(dimension.id, (item) => { item.offset = Number($event.target.value) })"
        />
      </label>

      <label class="stack-field">
        <span>Text across {{ labelNudge('x') }}</span>
        <input
          :value="labelNudge('x')"
          type="range"
          min="-1"
          max="1"
          step="0.1"
          aria-label="Text across"
          @input="nudgeLabel('x', $event.target.value, true)"
          @change="nudgeLabel('x', $event.target.value, false)"
        />
      </label>

      <label class="stack-field">
        <span>Text up {{ labelNudge('y') }}</span>
        <input
          :value="labelNudge('y')"
          type="range"
          min="-1"
          max="1"
          step="0.1"
          aria-label="Text up"
          @input="nudgeLabel('y', $event.target.value, true)"
          @change="nudgeLabel('y', $event.target.value, false)"
        />
      </label>

      <div class="action-row">
        <button type="button" @click="store.selectShape(anchoredShape.id)">Back to shape</button>
        <button type="button" class="danger" @click="store.deleteDimension(dimension.id)">Delete</button>
      </div>
    </section>

    <section v-else class="panel-card empty-copy">
      <h2>Nothing selected</h2>
      <p>Add a template, then drag the figure or its handles. Handles change the measurements, so an L, H, or step keeps its right angles.</p>
      <p>Drag empty board to pan. Scroll to zoom. Download the JSON when you want to keep a copy outside the browser.</p>
    </section>
  </aside>
</template>
