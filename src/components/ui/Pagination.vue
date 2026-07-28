<template>
  <nav v-if="lastPage > 1" class="flex flex-wrap items-center justify-between gap-3" aria-label="ترقيم الصفحات">
    <p class="text-caption text-text-400">
      صفحة {{ currentPage }} من {{ lastPage }}
      <span v-if="total"> · {{ total }} سجل</span>
    </p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:text-primary-600 hover:border-primary-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-fast"
        :disabled="currentPage <= 1"
        aria-label="الصفحة السابقة"
        @click="$emit('change', currentPage - 1)"
      >
        <ChevronRight :size="17" />
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        type="button"
        :disabled="page === '…'"
        :class="[
          'min-w-9 h-9 px-2 rounded-sm text-body-sm font-medium transition-colors duration-fast',
          page === currentPage
            ? 'bg-primary-600 text-white'
            : page === '…'
              ? 'text-text-400 cursor-default'
              : 'text-text-600 hover:bg-primary-50 hover:text-primary-600'
        ]"
        @click="page !== '…' && $emit('change', page)"
      >
        {{ page }}
      </button>

      <button
        type="button"
        class="grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:text-primary-600 hover:border-primary-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-fast"
        :disabled="currentPage >= lastPage"
        aria-label="الصفحة التالية"
        @click="$emit('change', currentPage + 1)"
      >
        <ChevronLeft :size="17" />
      </button>
    </div>
  </nav>
</template>

<script>
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'

export default {
  name: 'Pagination',

  components: { ChevronRight, ChevronLeft },

  props: {
    currentPage: { type: Number, default: 1 },
    lastPage: { type: Number, default: 1 },
    total: { type: Number, default: 0 }
  },

  emits: ['change'],

  computed: {
    visiblePages() {
      const pages = []
      const { currentPage: current, lastPage: last } = this
      const delta = 1

      for (let page = 1; page <= last; page += 1) {
        const isEdge = page === 1 || page === last
        const isNear = Math.abs(page - current) <= delta
        if (isEdge || isNear) {
          pages.push(page)
        } else if (pages[pages.length - 1] !== '…') {
          pages.push('…')
        }
      }
      return pages
    }
  }
}
</script>
