import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import toast from './plugins/toast'
import './styles/main.css'
import { initRevealObserver } from '@/directives/reveal'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(toast)

app.mount('#app')
initRevealObserver()