<script setup>
defineProps({
  kind: { type: String, required: true },
})
</script>

<template>
  <svg class="shape-icon" viewBox="0 0 48 36" aria-hidden="true">
    <polygon v-if="kind === 'rectangle'" points="4,8 44,8 44,28 4,28" />
    <polygon v-else-if="kind === 'square'" points="12,4 36,4 36,28 12,28" />
    <polygon v-else-if="kind === 'right_triangle'" points="6,30 42,30 6,6" />
    <polygon v-else-if="kind === 'l_shape'" points="4,4 44,4 44,16 28,16 28,32 4,32" />
    <polygon v-else-if="kind === 't_shape'" points="4,4 44,4 44,14 30,14 30,32 18,32 18,14 4,14" />
    <polygon v-else-if="kind === 't_uneven'" points="4,4 44,4 44,14 22,14 22,32 12,32 12,14 4,14" />
    <polygon v-else-if="kind === 'u_shape'" points="4,4 14,4 14,22 34,22 34,4 44,4 44,32 4,32" />
    <polygon v-else-if="kind === 'u_uneven'" points="4,4 10,4 10,22 32,22 32,4 44,4 44,32 4,32" />
    <polygon v-else-if="kind === 'h_shape'" points="4,4 14,4 14,14 34,14 34,4 44,4 44,32 34,32 34,22 14,22 14,32 4,32" />
    <polygon v-else-if="kind === 'h_uneven'" points="4,4 10,4 10,14 30,14 30,4 44,4 44,32 30,32 30,22 10,22 10,32 4,32" />
    <polygon v-else points="4,28 20,28 20,16 44,16 44,4 28,4 28,16 4,16" />
  </svg>
</template>
