import { createPinia } from 'pinia'
import { createApp } from 'vue'
import '@jsxgraph.css'
import App from './App.vue'
import './style.css'

createApp(App).use(createPinia()).mount('#app')
