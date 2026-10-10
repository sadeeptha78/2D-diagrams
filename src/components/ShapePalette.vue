<script setup>
import { SHAPE_KINDS } from '../geometry/shapes.js'
import { useDiagramStore } from '../stores/diagram.js'
import ShapeIcon from './ShapeIcon.vue'

const store = useDiagramStore()
</script>

<template>
  <aside class="palette">
    <p class="rail-label">Templates</p>
    <div class="shape-grid">
      <button
        v-for="item in SHAPE_KINDS"
        :key="item.kind"
        type="button"
        class="shape-card"
        :aria-label="`Add ${item.label}`"
        @click="store.addShape(item.kind)"
      >
        <ShapeIcon :kind="item.kind" />
        <span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.blurb }}</small>
        </span>
      </button>
    </div>
  </aside>
</template>
