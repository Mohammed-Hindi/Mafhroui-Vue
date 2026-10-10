import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // بلا تعليقات HTML في القوالب (كالبناء النهائي): تعليق قبل جذر الصفحة يجعلها Fragment فيعلق انتقال <transition mode="out-in"> عند مغادرتها
  plugins: [vue({ template: { compilerOptions: { comments: false } } })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
