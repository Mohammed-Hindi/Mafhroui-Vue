import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import toast from './plugins/toast'
import './styles/main.css'
import { initRevealObserver } from '@/directives/reveal'
import { initParallax } from '@/directives/parallax'
import magnetic from '@/directives/magnetic'
import tilt from '@/directives/tilt'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(toast)
app.directive('magnetic', magnetic)
app.directive('tilt', tilt)

app.mount('#app')
initRevealObserver()
initParallax()