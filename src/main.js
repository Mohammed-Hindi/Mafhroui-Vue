import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import toast from './plugins/toast'
import './styles/main.css'
import { initRevealObserver } from '@/directives/reveal'
import { initParallax } from '@/directives/parallax'
import tilt from '@/directives/tilt'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(toast)
app.directive('tilt', tilt)

app.mount('#app')
initRevealObserver()
initParallax()

// القوائم المنسدلة الأصلية (select) تنسدل للأسفل: الحقل القريب من أسفل الشاشة يُرفع لمنتصفها قبل أن يفتح المتصفح قائمته
document.addEventListener('mousedown', (e) => {
  const select = e.target.closest?.('select')
  if (select && !select.multiple && window.innerHeight - select.getBoundingClientRect().bottom < 260) select.scrollIntoView({ block: 'center' })
}, true)