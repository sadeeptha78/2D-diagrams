import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@jsxgraph.css': fileURLToPath(new URL('./node_modules/jsxgraph/distrib/jsxgraph.css', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4317,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4317,
  },
  test: {
    environment: 'node',
  },
})
