<template>
  <div ref="clickOutsideRoot" class="relative">
    <button
      type="button"
      class="relative grid place-items-center w-icon-btn h-icon-btn rounded-sm border border-border text-text-700 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 transition-colors duration-fast"
      :aria-expanded="isOpen"
      aria-label="الإشعارات"
      @click="toggleOpen"
    >
      <Bell :size="20" />
      <span
        v-if="unreadCount"
        class="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-pill bg-error text-white text-[10px] font-bold"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <transition
      enter-active-class="transition duration-base"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-fast"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-md bg-surface border border-border shadow-dropdown z-dropdown overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border-soft">
          <h2 class="font-cairo font-bold text-h4 text-text-900">الإشعارات</h2>
          <button
            v-if="hasUnread"
            type="button"
            class="text-caption text-primary-600 hover:text-primary-700 font-medium"
            @click="handleMarkAll"
          >
            تعليم الكل كمقروء
          </button>
        </div>

        <div class="max-h-[360px] overflow-y-auto scrollbar-thin">
          <LoadingSpinner v-if="isLoading" class="py-8" />

          <p v-else-if="error" class="px-4 py-6 text-center text-body-sm text-error">
            {{ error }}
          </p>

          <p v-else-if="!items.length" class="px-4 py-8 text-center text-body-sm text-text-400">
            لا توجد إشعارات بعد
          </p>

          <ul v-else class="divide-y divide-border-soft">
            <li
              v-for="item in items"
              :key="item.id"
              :class="['px-4 py-3 cursor-pointer transition-colors duration-fast hover:bg-border-soft', !item.is_read && 'bg-primary-50/60']"
              @click="handleRead(item)"
            >
              <p class="text-body-sm font-semibold text-text-900">{{ item.title }}</p>
              <p class="text-caption text-text-600 mt-0.5 line-clamp-2">{{ item.body }}</p>
              <p class="text-label text-text-400 mt-1">{{ formatRelativeTime(item.created_at) }}</p>
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import { useClickOutside } from '@/composables/useClickOutside'
import { useNotificationsStore } from '@/stores/notifications.store'
import { formatRelativeTime } from '@/utils/formatters'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const router = useRouter()
const notificationsStore = useNotificationsStore()

const isOpen = ref(false)
const { clickOutsideRoot } = useClickOutside(() => {
  isOpen.value = false
})

const { items, unreadCount, isLoading, error, hasUnread } = notificationsStore

watch(isOpen, (open) => {
  if (open && !items.length) notificationsStore.fetchNotifications().catch(() => {})
})

onMounted(() => {
  notificationsStore.fetchUnreadCount()
})

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleRead = async (item) => {
  if (!item.is_read) await notificationsStore.markAsRead(item.id)
  if (item.link) router.push(item.link)
  closeDropdown()
}

const handleMarkAll = async () => {
  try {
    await notificationsStore.markAllAsRead()
    // TODO: Add toast notification
  } catch (err) {
    // TODO: Add error toast notification
  }
}
</script>
