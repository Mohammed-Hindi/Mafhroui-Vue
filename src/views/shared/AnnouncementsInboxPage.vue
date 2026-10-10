<template>
  <!-- صندوق الإعلانات (قناة المنصة) لكل الأدوار: إعلانات وملفات الإدارة العامة وإعلانات المشرف لفريقه، مع تنزيل المرفقات -->
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <h3 class="font-cairo font-bold text-h4 text-text-900 flex items-center gap-2.5">
        الإعلانات والملفات
        <span class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600"><Megaphone :size="16" /></span>
      </h3>
      <div class="flex gap-1 p-1 rounded-md bg-border-soft" role="tablist" aria-label="النوع">
        <button
          v-for="t in tabs.filter((x) => !x.value || x.value === tab || count(x.value))" :key="t.value" type="button" role="tab" :aria-selected="tab === t.value"
          :class="['h-8 px-3 rounded-sm text-caption font-bold transition-colors duration-fast', tab === t.value ? 'bg-surface text-text-900 shadow-card' : 'text-text-600 hover:text-text-900']"
          @click="tab = t.value"
        >
          {{ t.label }} <span class="text-text-400">{{ count(t.value) }}</span>
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="!shown.length" :title="tab === 'file' ? 'لا توجد ملفات' : 'لا توجد إعلانات'" description="ما يرسله لك المشرف أو الإدارة العامة يظهر هنا." />
    <ul v-else class="flex flex-col gap-3">
      <li v-for="a in shown" :key="a.id" class="bg-surface rounded-lg border border-border shadow-card p-4 flex gap-3">
        <span :class="['grid place-items-center w-10 h-10 rounded-pill shrink-0', a.type === 'file' ? 'bg-success-bg text-success' : a.type === 'rating' ? 'bg-warning-bg text-warning' : 'bg-primary-50 text-primary-600']">
          <FileText v-if="a.type === 'file'" :size="18" />
          <Star v-else-if="a.type === 'rating' || a.rating" :size="18" />
          <Megaphone v-else :size="18" />
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="font-cairo font-bold text-body-sm text-text-900">{{ a.title || (a.type === 'file' ? 'ملف' : 'إعلان') }}</h4>
            <span class="text-label text-text-400">{{ formatDateTime(a.created_at) }}</span>
          </div>
          <p class="text-label text-text-400 mt-0.5">
            من {{ a.author?.name || '—' }}<template v-if="a.author?.role"> · {{ ROLE_LABELS[a.author.role] }}</template>
            <template v-if="a.team"> · {{ a.team.section ? `شعبة ${a.team.section}` : a.team.name }}</template>
          </p>
          <div v-if="a.rating" class="flex items-center gap-0.5 mt-2 text-warning" :aria-label="`${a.rating} من 5`">
            <Star v-for="n in 5" :key="n" :size="18" :fill="n <= a.rating ? 'currentColor' : 'none'" :class="n > a.rating && 'text-border'" />
            <span class="ms-2 text-caption font-bold text-text-700">{{ a.rating }} من 5</span>
          </div>
          <p v-if="a.body" class="text-body-sm text-text-700 mt-2 whitespace-pre-line leading-relaxed">{{ a.body }}</p>
          <div v-if="a.attachments?.length" class="flex flex-wrap gap-2 mt-3">
            <button
              v-for="f in a.attachments" :key="f.id" type="button"
              class="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-primary-100 text-caption font-bold text-primary-600 hover:bg-primary-50 transition-colors duration-fast"
              :title="`تنزيل ${f.name}`" @click="download(f)"
            >
              <Download :size="14" /> {{ f.name }} <span class="text-text-400 font-normal">{{ formatFileSize(f.size) }}</span>
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { Download, FileText, Megaphone, Star } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import api from '@/services/api'
import { downloadAttachment } from '@/services/announcements'
import { ROLE_LABELS } from '@/utils/constants'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

export default {
  name: 'AnnouncementsInboxPage',

  components: { Download, FileText, Megaphone, Star, EmptyState, LoadingSpinner },

  data() {
    return {
      ROLE_LABELS,
      tabs: [{ value: '', label: 'الكل' }, { value: 'announcement', label: 'الإعلانات' }, { value: 'file', label: 'الملفات' }, { value: 'rating', label: 'التقييمات' }],
      tab: '',
      items: [],
      loading: true
    }
  },

  computed: {
    shown() {
      return this.tab ? this.items.filter((a) => (a.type || 'announcement') === this.tab) : this.items
    }
  },

  // GET /announcements — ما وُجّه للمستخدم أو لفرقه (الإرسال الواحد يظهر مرة واحدة)
  async created() {
    try {
      const { data } = await api.get('/announcements')
      this.items = data.data || data
    } catch (err) {
      this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الإعلانات')
    } finally {
      this.loading = false
    }
  },

  methods: {
    formatDateTime,
    formatFileSize,

    count(type) {
      return type ? this.items.filter((a) => (a.type || 'announcement') === type).length : this.items.length
    },

    async download(f) {
      try {
        await downloadAttachment(f)
      } catch {
        this.$toast?.error('تعذّر تنزيل الملف')
      }
    }
  }
}
</script>
