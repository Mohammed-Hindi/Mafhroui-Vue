<template>
  <!-- هيدر موقع الكلية (195704، 200241): شريط تدرج علوي، الشعار والاسم يمينًا، الروابط، ثم الأدوات يسارًا -->
  <header class="us-header">
    <div class="us-wrap us-header-in">
      <router-link to="/" class="us-brand" @click="open = false">
        <UcasLogo :size="56" />
        <span>
          <strong>الكلية الجامعية للعلوم التطبيقية</strong>
          <small>{{ APP_NAME }} — {{ APP_DESCRIPTION }}</small>
        </span>
      </router-link>

      <nav :class="['us-nav', open && 'is-open']" aria-label="روابط الصفحة">
        <router-link v-for="l in links" :key="l.label" :to="l.to" @click="open = false">{{ l.label }}</router-link>
      </nav>

      <div class="us-tools">
        <button type="button" class="us-icon-btn" :aria-label="isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'" @click="uiStore.toggleTheme()">
          <Sun v-if="isDark" :size="18" /><Moon v-else :size="18" />
        </button>
        <button v-if="isAuthenticated" type="button" class="us-icon-btn" aria-label="تسجيل الخروج" title="تسجيل الخروج" @click="authStore.logout()">
          <LogOut :size="18" />
        </button>
        <router-link :to="isAuthenticated ? authStore.homeRoute : { name: 'login' }" class="us-btn is-solid is-sm">
          {{ isAuthenticated ? 'لوحة التحكم' : 'تسجيل الدخول' }}
        </router-link>
        <button type="button" class="us-icon-btn us-menu-btn" :aria-expanded="open" aria-label="القائمة" @click="open = !open">
          <Menu :size="20" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { LogOut, Menu, Moon, Sun } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { APP_NAME, APP_DESCRIPTION } from '@/utils/constants'

const uiStore = useUiStore()
const authStore = useAuthStore()
const open = ref(false)
const isDark = computed(() => uiStore.isDark)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const links = [
  { label: 'الرئيسية', to: { name: 'landing' } },
  { label: 'أفضل المشاريع', to: { name: 'landing', hash: '#projects' } },
  { label: 'ميزات المنصة', to: { name: 'landing', hash: '#features' } },
  { label: 'كيف تعمل', to: { name: 'landing', hash: '#how' } },
  { label: 'الأقسام', to: { name: 'landing', hash: '#departments' } },
  { label: 'أرشيف المشاريع', to: { name: 'projects-archive' } }
]
</script>
