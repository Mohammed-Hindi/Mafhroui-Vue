<template>
  <div class="nf">
    <div class="nf-in">
      <MasarWordmark class="nf-word" />
      <p class="nf-code" aria-hidden="true">404</p>
      <h1 class="nf-title">الصفحة غير موجودة</h1>
      <p class="nf-sub">الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت.</p>
      <div class="nf-actions">
        <router-link :to="home" class="nf-btn is-solid"><Home :size="18" /> العودة للرئيسية</router-link>
        <button type="button" class="nf-btn" @click="$router.back()"><ArrowRight :size="18" /> الصفحة السابقة</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, Home } from 'lucide-vue-next'
import MasarWordmark from '@/components/landing/MasarWordmark.vue'
import { useAuthStore } from '@/stores/auth.store'
import '@/styles/ucas-site.css'

const auth = useAuthStore()
const home = computed(() => (auth.isAuthenticated && auth.user ? auth.homeRoute : { name: 'landing' }))
</script>

<style scoped>
.nf {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100vh;
  overflow: hidden;
  padding: 48px 20px;
  color: #FFFFFF;
  background: var(--us-grad, linear-gradient(270deg, #62BB46 0%, #50A16E 30%, #0E699C 65%, #025DA9 100%));
  background-size: 200% 100%;
  animation: nfDrift 14s ease-in-out infinite alternate;
}
.nf::before { content: ''; position: absolute; inset: 0; opacity: .14; background-image: radial-gradient(#FFFFFF 1.2px, transparent 1.2px); background-size: 26px 26px; pointer-events: none; }
.nf-in { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; max-width: 560px; text-align: center; }
.nf-word { width: clamp(220px, 28vw, 380px); }
.nf-code { margin: 6px 0 0; font-family: Cairo, sans-serif; font-size: clamp(72px, 12vw, 132px); font-weight: 900; line-height: 1; letter-spacing: 4px; color: transparent; -webkit-text-stroke: 2px rgba(255, 255, 255, .85); text-shadow: 0 10px 40px rgba(0, 0, 0, .15); opacity: 0; animation: nfUp .8s ease 2.2s forwards; }
.nf-title { margin: 10px 0 6px; font-size: clamp(22px, 2.4vw, 30px); font-weight: 800; opacity: 0; animation: nfUp .8s ease 2.4s forwards; }
.nf-sub { margin: 0; font-size: 15px; line-height: 1.9; color: rgba(255, 255, 255, .88); opacity: 0; animation: nfUp .8s ease 2.55s forwards; }
.nf-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 26px; opacity: 0; animation: nfUp .8s ease 2.7s forwards; }
.nf-btn { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 22px; border: 1.5px solid rgba(255, 255, 255, .7); border-radius: 999px; font-size: 15px; font-weight: 700; color: #FFFFFF; background: rgba(255, 255, 255, .08); backdrop-filter: blur(4px); transition: background-color .3s ease, color .3s ease; }
.nf-btn:hover { background: rgba(255, 255, 255, .18); }
.nf-btn.is-solid { border-color: #FFFFFF; color: var(--ucas-blue, #005BAA); background: #FFFFFF; box-shadow: 0 10px 26px rgba(0, 0, 0, .15); }
.nf-btn.is-solid:hover { color: #FFFFFF; background: linear-gradient(270deg, #62BB46, #0E699C 55%, #025DA9); border-color: transparent; }
@keyframes nfUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes nfDrift { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }
@media (prefers-reduced-motion: reduce) {
  .nf { animation: none; }
  .nf-code, .nf-title, .nf-sub, .nf-actions { opacity: 1; animation: none; }
}
</style>
