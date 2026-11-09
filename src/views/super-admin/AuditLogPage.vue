<template>
  <!-- سجلّ حركات المنصّة (ملاحظة #29) — للإدارة العامة فقط: كل حركة بفاعلها ووقتها وهدفها، مع فلترة وبحث -->
  <div class="dash hd-page al-page">
    <div class="gr-filters al-filters">
      <label class="rv-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث بالاسم أو الهدف…" @keydown.enter="applyFilters">
      </label>
      <select v-model="action" class="gr-select" aria-label="نوع الحركة" @change="applyFilters">
        <option value="">كل الحركات</option>
        <option v-for="(label, key) in ACTION_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="entity" class="gr-select" aria-label="نوع العنصر" @change="applyFilters">
        <option value="">كل العناصر</option>
        <option v-for="(label, key) in ENTITY_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <label class="al-date">من <input v-model="from" type="date" @change="applyFilters"></label>
      <label class="al-date">إلى <input v-model="to" type="date" @change="applyFilters"></label>
      <button v-if="hasActiveFilters" type="button" class="pbtn is-outline is-sm" @click="resetFilters"><X :size="15" /> مسح</button>
    </div>

    <section class="hd-card al-card">
      <header class="al-head">
        <h3 class="portal-title"><ScrollText :size="18" /> سجلّ حركات المنصّة</h3>
        <span class="hd-card-sub">{{ total }} حركة</span>
      </header>

      <SkeletonLoader v-if="loading" variant="list" :rows="6" />
      <EmptyState
        v-else-if="!rows.length"
        :icon="ScrollText"
        title="لا توجد حركات مطابقة"
        description="لم تُسجَّل أي حركة ضمن هذه الفلاتر بعد."
      />
      <div v-else class="gr-table-wrap">
        <table class="gr-table al-table">
          <thead>
            <tr>
              <th>الوقت</th>
              <th>المُنفِّذ</th>
              <th>الحركة</th>
              <th>العنصر</th>
              <th>الهدف</th>
              <th>تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in rows" :key="log.id">
              <td class="ad-nowrap" :title="formatDateTime(log.created_at)">{{ formatDateTime(log.created_at) }}</td>
              <td>
                <span class="al-actor">
                  <span class="al-av" aria-hidden="true">{{ initial(log.user?.name) }}</span>
                  <span class="al-actor-body">
                    <b>{{ log.user?.name || 'مستخدم محذوف' }}</b>
                    <small>{{ ROLE_LABELS[log.user?.role] || '—' }}</small>
                  </span>
                </span>
              </td>
              <td><span :class="['al-badge', actionTone(log.action)]">{{ ACTION_LABELS[log.action] || log.action }}</span></td>
              <td>{{ ENTITY_LABELS[log.entity] || log.entity }}</td>
              <td class="al-target">{{ targetOf(log) }}</td>
              <td class="al-meta">{{ detailsOf(log) || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="lastPage > 1"
        class="al-pager"
        :current-page="page"
        :last-page="lastPage"
        :total="total"
        @change="goPage"
      />
    </section>
  </div>
</template>

<script>
import { Search, ScrollText, X } from 'lucide-vue-next'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import api from '@/services/api'
import { ROLE_LABELS } from '@/utils/constants'
import { formatDateTime } from '@/utils/formatters'

// تسميات عربية لكل حركة/عنصر — ما لا يُعرَف يُعرض بقيمته الخام (توافق مستقبلي مع حركات جديدة)
const ACTION_LABELS = {
  create: 'إنشاء',
  delete: 'حذف',
  force_delete: 'حذف نهائي',
  restore: 'استرجاع',
  set_password: 'تعيين كلمة مرور',
  restrict: 'تقييد',
  unrestrict: 'إلغاء تقييد',
  status_change: 'تغيير حالة',
  submit: 'تقديم',
  resubmit: 'إعادة تقديم',
  reject: 'رفض',
  approve: 'اعتماد',
  bulk_send: 'إرسال جماعي'
}

const ENTITY_LABELS = {
  academic_term: 'فصل دراسي',
  department: 'قسم',
  specialization: 'تخصص',
  discussion: 'مناقشة',
  meeting: 'اجتماع',
  message_delivery: 'رسالة',
  proposal: 'مقترح',
  task: 'مهمة',
  team: 'مجموعة',
  user: 'مستخدم'
}

// نبرة لون الشارة حسب أثر الحركة
const DANGER = new Set(['delete', 'force_delete', 'reject', 'restrict'])
const POSITIVE = new Set(['create', 'approve', 'restore', 'unrestrict', 'submit'])

export default {
  name: 'AuditLogPage',

  components: { Search, ScrollText, X, SkeletonLoader, EmptyState, Pagination },

  data() {
    return {
      ROLE_LABELS,
      ACTION_LABELS,
      ENTITY_LABELS,
      rows: [],
      loading: true,
      page: 1,
      lastPage: 1,
      total: 0,
      q: '',
      action: '',
      entity: '',
      from: '',
      to: ''
    }
  },

  computed: {
    hasActiveFilters() {
      return !!(this.q || this.action || this.entity || this.from || this.to)
    }
  },

  created() {
    this.fetch()
  },

  methods: {
    formatDateTime,

    async fetch() {
      this.loading = true
      try {
        const params = { page: this.page }
        if (this.q) params.q = this.q
        if (this.action) params.action = this.action
        if (this.entity) params.entity = this.entity
        if (this.from) params.from = this.from
        if (this.to) params.to = this.to
        const { data } = await api.get('/audit-logs', { params })
        this.rows = data.data || []
        this.page = data.current_page || 1
        this.lastPage = data.last_page || 1
        this.total = data.total || 0
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل سجلّ الحركات')
      } finally {
        this.loading = false
      }
    },

    applyFilters() {
      this.page = 1
      this.fetch()
    },

    resetFilters() {
      this.q = ''
      this.action = ''
      this.entity = ''
      this.from = ''
      this.to = ''
      this.applyFilters()
    },

    goPage(p) {
      this.page = p
      this.fetch()
    },

    actionTone(action) {
      if (DANGER.has(action)) return 'is-danger'
      if (POSITIVE.has(action)) return 'is-positive'
      return 'is-neutral'
    },

    initial(name) {
      return (name || '؟').charAt(0)
    },

    // هدف الحركة: اسم العنصر أو عنوانه، وإلا رقمه
    targetOf(log) {
      const m = log.meta || {}
      return m.name || m.title || (log.entity_id ? `#${log.entity_id}` : '—')
    },

    // تفاصيل إضافية من meta (سبب، مكان، حالة) بصيغة مختصرة
    detailsOf(log) {
      const m = log.meta || {}
      const parts = []
      if (m.reason) parts.push(`السبب: ${m.reason}`)
      if (m.place) parts.push(`المكان: ${m.place}`)
      if (m.status) parts.push(`الحالة: ${m.status}`)
      return parts.join(' · ')
    }
  }
}
</script>

<style scoped>
.al-filters { flex-wrap: wrap; gap: 10px; }
.al-date { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-600); }
.al-date input { border: 1px solid var(--color-border); border-radius: 6px; padding: 7px 9px; font-family: inherit; font-size: 13px; color: var(--color-text-900); background: var(--color-surface); }

.al-card { padding: 0; overflow: hidden; }
.al-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--color-border-soft); }
.al-head .portal-title { display: inline-flex; align-items: center; gap: 8px; margin: 0; }

.al-table td { vertical-align: middle; }
.al-actor { display: inline-flex; align-items: center; gap: 9px; }
.al-av { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700)); }
.al-actor-body { display: flex; flex-direction: column; line-height: 1.3; }
.al-actor-body small { color: var(--color-text-400); font-size: 12px; }
.al-target { font-weight: 600; color: var(--color-text-900); }
.al-meta { color: var(--color-text-600); font-size: 13px; }

.al-badge { display: inline-block; padding: 3px 11px; border-radius: var(--radius-pill); font-size: 12.5px; font-weight: 700; }
.al-badge.is-danger { color: var(--color-error); background: var(--color-error-bg); box-shadow: inset 0 0 0 1px var(--color-error-border); }
.al-badge.is-positive { color: var(--color-success); background: var(--color-success-bg); box-shadow: inset 0 0 0 1px var(--color-success-border); }
.al-badge.is-neutral { color: var(--color-primary-700); background: var(--color-primary-50); box-shadow: inset 0 0 0 1px var(--color-primary-100); }

.al-pager { padding: 14px 18px; }
</style>
