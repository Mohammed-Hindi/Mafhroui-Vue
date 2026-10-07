<template>
  <nav
    :class="[
      'sticky top-0 z-sticky-header backdrop-blur-md border-b transition-all duration-base',
      isScrolled
        ? 'bg-surface/90 border-border shadow-[0_4px_20px_-12px_rgba(15,23,42,.15)]'
        : 'bg-bg/85 border-transparent'
    ]"
  >
    <div class="max-w-content mx-auto flex items-center justify-between gap-4 px-6 py-4">
      <router-link to="/" class="flex items-center gap-2.5 font-cairo font-extrabold text-[15px] text-text-900">
        <span class="grid place-items-center w-[34px] h-[34px] rounded-sm bg-gradient-to-bl from-ucas-green to-ucas-blue text-white shrink-0">
          <AppIcon name="graduation" :size="17" :stroke-width="2.2" />
        </span>
        <span class="hidden sm:block">{{ APP_NAME }}</span>
      </router-link>

      <div class="hidden md:flex items-center gap-1">
        <a v-for="link in navLinks" :key="link.href" :href="link.href" class="nav-link px-3.5 py-2 text-body-sm font-bold text-text-600 hover:text-ucas-blue transition-colors duration-fast">
          {{ link.label }}
        </a>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="grid place-items-center w-[38px] h-[38px] rounded-pill border border-border bg-surface text-text-600 hover:-translate-y-px hover:text-ucas-blue transition-transform duration-fast"
          :aria-label="isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'"
          @click="toggleTheme"
        >
          <AppIcon :name="isDark ? 'sun' : 'moon'" :size="16" />
        </button>

        <button
          v-if="isAuthenticated"
          type="button"
          class="grid place-items-center w-[38px] h-[38px] rounded-pill border border-border bg-surface text-text-600 hover:-translate-y-px hover:text-error hover:border-error-bg transition-all duration-fast"
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
          @click="handleLogout"
        >
          <LogOut :size="16" />
        </button>

        <router-link
          :to="loginTarget"
          class="flex items-center gap-2 h-10 px-5 rounded-pill bg-ucas-blue text-white font-bold text-caption shadow-[0_8px_18px_-8px_rgba(28,63,140,.5)] hover:-translate-y-px transition-transform duration-fast"
        >
          <AppIcon name="login" :size="14" :stroke-width="2.4" />
          {{ isAuthenticated ? 'لوحة التحكم' : 'تسجيل الدخول' }}
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LogOut } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { APP_NAME } from '@/utils/constants'
import AppIcon from '@/components/icons/AppIcon.vue'

const uiStore = useUiStore()
const authStore = useAuthStore()

const navLinks = [
  { label: 'المشاريع', href: '#projects' },
  { label: 'الميزات', href: '#features' },
  { label: 'الأقسام', href: '#departments' }
]

const isScrolled = ref(false)
const isDark = computed(() => uiStore.isDark)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const homeRoute = computed(() => authStore.homeRoute)

const loginTarget = computed(() => {
  return isAuthenticated.value ? homeRoute.value : { name: 'login' }
})

const toggleTheme = () => {
  uiStore.toggleTheme()
}

const handleLogout = () => {
  authStore.logout()
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* الخط تحت رابط التنقل عند hover — قطعتين لون منفصلتين (أخضر+أزرق)، مو تدرّج ناعم،
   مطابقة لما ظهر بصور closeup لعناوين UCAS (راجع docs/brand/BRAND_IDENTITY.md §2) */
.nav-link{ position:relative; }
.nav-link::after{
  content:''; position:absolute; right:14px; left:14px; bottom:2px; height:2px;
  background:linear-gradient(90deg, var(--ucas-green) 50%, var(--ucas-blue) 50%);
  transform:scaleX(0); transition:transform .15s var(--ease-standard);
}
.nav-link:hover::after{ transform:scaleX(1); }
</style>
