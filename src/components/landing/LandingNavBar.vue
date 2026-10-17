<template>
  <!-- هيدر موقع الكلية (195704، 200241): شريط تدرج علوي، الشعار والاسم يمينًا، الروابط، ثم الأدوات يسارًا -->
  <header class="us-header">
    <div class="us-wrap us-header-in">
      <router-link to="/" class="us-brand" @click="open = false">
        <UcasLogo :size="56" />
        <span>
          <strong>الكلية الجامعية للعلوم التطبيقية</strong>
          <small>{{ APP_NAME }}<span class="us-brand-desc"> — {{ APP_DESCRIPTION }}</span></small>
        </span>
      </router-link>

      <nav :class="['us-nav', open && 'is-open']" aria-label="روابط الصفحة">
        <router-link v-for="l in links" :key="l.label" :to="l.to" :class="['us-nav-link', isActive(l) && 'is-active']" @click="open = false">{{ l.label }}</router-link>
        <!-- الجوال والآيباد: الدخول/الخروج داخل القائمة المنسدلة -->
        <router-link :to="isAuthenticated ? authStore.homeRoute : { name: 'login' }" class="us-btn is-solid us-nav-auth" @click="open = false">
          {{ isAuthenticated ? 'لوحة التحكم' : 'تسجيل الدخول' }}
        </router-link>
      </nav>

      <div class="us-tools">
        <button type="button" class="us-icon-btn" :aria-label="isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'" @click="uiStore.toggleTheme()">
          <Sun v-if="isDark" :size="18" /><Moon v-else :size="18" />
        </button>
        <router-link :to="isAuthenticated ? authStore.homeRoute : { name: 'login' }" class="us-btn is-sm us-auth is-solid">
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
import { useRoute } from 'vue-router'
import { Menu, Moon, Sun } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { APP_NAME, APP_DESCRIPTION, LANDING_LINKS } from '@/utils/constants'

const uiStore = useUiStore()
const authStore = useAuthStore()
const open = ref(false)
const isDark = computed(() => uiStore.isDark)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const links = LANDING_LINKS

// الرابط النشط: نفس الصفحة ونفس القسم (#) — router-link يتجاهل الـ hash فيُظهر روابط الرئيسية كلها نشطة
const route = useRoute()
const isActive = (l) => route.name === l.to.name && (l.to.hash || '') === route.hash
</script>
