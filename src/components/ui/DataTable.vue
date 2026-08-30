<template>
  <div :class="flush ? 'overflow-hidden' : 'bg-surface rounded-lg border border-border shadow-card overflow-hidden'">
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
      <table class="w-full text-start border-collapse" :style="{ minWidth: tableMinWidth }">
        <thead>
          <tr class="bg-bg border-b-2 border-border divide-x divide-border-soft">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="['px-4 py-3 text-start text-label font-extrabold text-text-700 whitespace-nowrap', column.className]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-soft">
          <template v-for="(row, index) in rows" :key="rowKey ? row[rowKey] : index">
            <tr class="row-interactive divide-x divide-border-soft">
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
            <tr v-if="$slots['row-extra']">
              <td :colspan="columns.length" class="p-0">
                <slot name="row-extra" :row="row" :index="index" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- بطاقات (موبايل) -->
    <div v-if="!loading && !error && rows.length" class="md:hidden divide-y divide-border-soft">
      <div v-for="(row, index) in rows" :key="rowKey ? row[rowKey] : index" class="p-4 space-y-2">
        <div v-for="column in visibleMobileColumns" :key="column.key" class="flex items-start justify-between gap-3">
          <span class="text-label font-semibold text-text-400 shrink-0">{{ column.label }}</span>
          <span class="text-body-sm text-text-700 text-end min-w-0">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
              {{ row[column.key] ?? '—' }}
            </slot>
          </span>
        </div>

        <template v-if="primaryKeys">
          <button
            type="button"
            class="!mt-3 w-full flex items-center justify-center gap-1.5 text-caption font-bold text-primary-600 py-1.5 rounded-sm hover:bg-primary-50 transition-colors duration-fast"
            @click="toggleRow(rowKeyFor(row, index))"
          >
            {{ isRowOpen(rowKeyFor(row, index)) ? 'إخفاء التفاصيل' : 'عرض التفاصيل' }}
            <ChevronDown :size="14" :class="['transition-transform duration-fast', isRowOpen(rowKeyFor(row, index)) && 'rotate-180']" />
          </button>
          <div v-if="isRowOpen(rowKeyFor(row, index))" class="space-y-2 pt-2 border-t border-dashed border-border">
            <div v-for="column in secondaryColumns" :key="column.key" class="flex items-start justify-between gap-3">
              <span class="text-label font-semibold text-text-400 shrink-0">{{ column.label }}</span>
              <span class="text-body-sm text-text-700 text-end min-w-0">
                <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
                  {{ row[column.key] ?? '—' }}
                </slot>
              </span>
            </div>
            <slot name="row-extra" :row="row" :index="index" />
          </div>
        </template>
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
import { ChevronDown } from 'lucide-vue-next'

export default {
  name: 'DataTable',

  components: { SkeletonLoader, EmptyState, ErrorState, Pagination, ChevronDown },

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
    emptyDescription: { type: String, default: '' },
    /** مفاتيح الأعمدة المعروضة دومًا بالموبايل — الباقي يُخفى خلف زر "عرض التفاصيل" */
    primaryKeys: { type: Array, default: null },
    /** بدون خلفية/حدود/ظل خاصة به — للاستخدام متداخلًا داخل بطاقة أخرى بالفعل لها هذا التنسيق */
    flush: { type: Boolean, default: false }
  },

  emits: ['retry', 'page-change'],

  data() {
    return { openRowKeys: [] }
  },

  computed: {
    /** يمنع تكدّس الأعمدة على الشاشات المتوسطة — تمرير للسكرول الأفقي بدل الانضغاط */
    tableMinWidth() {
      return `${Math.max(640, this.columns.length * 140)}px`
    },
    visibleMobileColumns() {
      return this.primaryKeys ? this.columns.filter((c) => this.primaryKeys.includes(c.key)) : this.columns
    },
    secondaryColumns() {
      return this.primaryKeys ? this.columns.filter((c) => !this.primaryKeys.includes(c.key)) : []
    }
  },

  methods: {
    rowKeyFor(row, index) {
      return this.rowKey ? row[this.rowKey] : index
    },
    isRowOpen(key) {
      return this.openRowKeys.includes(key)
    },
    toggleRow(key) {
      this.openRowKeys = this.isRowOpen(key) ? this.openRowKeys.filter((k) => k !== key) : [...this.openRowKeys, key]
    }
  }
}
</script>
