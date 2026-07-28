<template>
  <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
    <!-- رأس الجدول: عنوان + أدوات -->
    <div v-if="title || $slots.toolbar" class="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border-soft">
      <h2 v-if="title" class="font-cairo font-bold text-h3 text-text-900">{{ title }}</h2>
      <div class="flex items-center gap-2 ms-auto"><slot name="toolbar" /></div>
    </div>

    <!-- تحميل -->
    <div v-if="loading" class="p-6">
      <SkeletonLoader :rows="5" height="20px" />
    </div>

    <!-- خطأ -->
    <ErrorState v-else-if="error" :message="error" @retry="$emit('retry')" />

    <!-- فارغ -->
    <slot v-else-if="!rows.length" name="empty">
      <EmptyState :title="emptyTitle" :description="emptyDescription" />
    </slot>

    <!-- الجدول (ديسكتوب) -->
    <div v-else class="hidden md:block overflow-x-auto scrollbar-thin">
      <table class="w-full text-start border-collapse">
        <thead>
          <tr class="bg-border-soft/60">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="['px-4 py-3 text-start text-label font-bold text-text-600 whitespace-nowrap', column.className]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-soft">
          <tr
            v-for="(row, index) in rows"
            :key="rowKey ? row[rowKey] : index"
            class="hover:bg-border-soft/50 transition-colors duration-fast"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="['px-4 py-3 text-body-sm text-text-700 align-middle', column.className]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
                {{ row[column.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- بطاقات (موبايل) -->
    <div v-if="!loading && !error && rows.length" class="md:hidden divide-y divide-border-soft">
      <div v-for="(row, index) in rows" :key="rowKey ? row[rowKey] : index" class="p-4 space-y-2">
        <div v-for="column in columns" :key="column.key" class="flex items-start justify-between gap-3">
          <span class="text-label font-semibold text-text-400 shrink-0">{{ column.label }}</span>
          <span class="text-body-sm text-text-700 text-end min-w-0">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
              {{ row[column.key] ?? '—' }}
            </slot>
          </span>
        </div>
      </div>
    </div>

    <!-- ترقيم الصفحات -->
    <div v-if="!loading && !error && rows.length && meta" class="px-4 sm:px-6 py-3 border-t border-border-soft">
      <Pagination
        :current-page="meta.current_page"
        :last-page="meta.last_page"
        :total="meta.total"
        @change="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script>
import SkeletonLoader from './SkeletonLoader.vue'
import EmptyState from './EmptyState.vue'
import ErrorState from './ErrorState.vue'
import Pagination from './Pagination.vue'

export default {
  name: 'DataTable',

  components: { SkeletonLoader, EmptyState, ErrorState, Pagination },

  props: {
    /** [{ key, label, className }] */
    columns: { type: Array, required: true },
    rows: { type: Array, default: () => [] },
    rowKey: { type: String, default: 'id' },
    title: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    meta: { type: Object, default: null },
    emptyTitle: { type: String, default: 'لا توجد سجلات' },
    emptyDescription: { type: String, default: '' }
  },

  emits: ['retry', 'page-change']
}
</script>
