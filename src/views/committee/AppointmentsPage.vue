<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <BaseButton :icon="Plus" @click="openAddModal">تسجيل موعد مناقشة جديد</BaseButton>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" :icon="Download" :loading="exportingExcel" @click="exportExcel">تصدير Excel</BaseButton>
        <BaseButton variant="outline" :icon="FileDown" :loading="exportingPdf" @click="exportPdf">تصدير PDF</BaseButton>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن مشروع، فريق أو مشرف..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <BaseSelect v-model="deptFilter" class="min-w-[170px]" placeholder="جميع الأقسام" include-placeholder-option :options="deptOptions" />
      <BaseSelect v-model="specFilter" class="min-w-[170px]" placeholder="جميع التخصصات" include-placeholder-option :options="specOptions" />
    </div>

    <div class="flex items-center justify-between gap-4 mb-4">
      <h3 class="font-cairo font-bold text-h4 text-text-900">مواعيد المناقشات المسجلة</h3>
      <span class="text-caption text-text-600">{{ filteredDiscussions.length }} موعد</span>
    </div>

    <SkeletonLoader v-if="discussionsLoading" :rows="4" height="80px" />
    <EmptyState v-else-if="!filteredDiscussions.length" title="لا توجد مواعيد مطابقة" description="جرّبي تعديل البحث أو الفلاتر، أو سجّلي موعدًا جديدًا." />

    <div v-else class="flex flex-col gap-4">
      <div v-for="d in pageDiscussions" :key="d.id" class="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div class="flex items-center gap-4 p-4 flex-wrap">
          <div class="w-10 h-10 rounded-md shrink-0 grid place-items-center text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            <CalendarClock :size="18" />
          </div>

          <div class="flex-1 min-w-0 flex items-center gap-3 sm:gap-6 flex-wrap">
            <div>
              <div class="text-body-sm font-extrabold text-text-900">{{ d.proj }}</div>
              <div class="text-label text-text-400">{{ d.team }}</div>
            </div>
            <div class="text-caption"><span class="text-text-400">المشرف </span><span class="font-bold text-text-900">{{ d.sup }}</span></div>
            <BaseBadge variant="info">{{ formatDate(d.date) }} — {{ d.time }}</BaseBadge>
            <BaseBadge :variant="d.status === 'confirmed' ? 'success' : 'warning'" dot>{{ d.status === 'confirmed' ? 'مؤكَّد' : 'قيد الانتظار' }}</BaseBadge>
          </div>

          <div class="flex gap-1.5 shrink-0">
            <button v-if="d.whatsapp" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="تذكير واتساب" @click="sendWhats(d.whatsapp)"><MessageCircle :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(d)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(d)"><Trash2 :size="14" /></button>
          </div>
        </div>

        <div class="flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 bg-bg border-t border-border-soft text-caption">
          <div class="flex items-center gap-2 text-text-700"><MapPin :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">المكان:</span> {{ d.place }}</div>
          <div class="flex items-center gap-2 text-text-700"><Users :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">لجنة المناقشة:</span> {{ d.committee }}</div>
          <div class="flex items-center gap-2 text-text-700"><span class="text-text-400">القسم:</span> {{ d.dept }} — {{ d.spec }}</div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-4 mt-6">
      <BaseSelect v-model="pageDropdown" class="min-w-[160px]" :options="pageOptions" />
      <Pagination :current-page="page" :last-page="totalPages" :total="filteredDiscussions.length" @change="page = $event" />
    </div>

    <!-- تسجيل / تعديل موعد مناقشة -->
    <BaseModal v-model="apptModal" :title="isEditing ? 'تعديل موعد المناقشة' : 'تسجيل موعد مناقشة جديد'" description="سيصل إشعار داخل المنصة لقائد الفريق والمشرف فور الحفظ" size="lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseSelect v-if="!isEditing" v-model="apptForm.project_id" label="المشروع" placeholder="اختر مشروعًا قيد التنفيذ" :options="projectOptions" class="sm:col-span-2" />
        <BaseInput v-model="apptForm.place" label="مكان المناقشة" placeholder="مثال: قاعة المناقشات 1" />
        <BaseInput v-model="apptForm.date" type="date" label="تاريخ المناقشة" />
        <BaseInput v-model="apptForm.time" type="time" label="موعد المناقشة" />
        <BaseSelect v-model="apptForm.status" label="الحالة" :options="statusOptions" />
        <BaseInput v-model="apptForm.committee" label="لجنة المناقشة" placeholder="مثال: د. سارة الحربي، د. يوسف المحطاني" class="sm:col-span-2" />
        <BaseInput v-model="apptForm.whatsapp" label="رقم واتساب للتذكير (اختياري)" placeholder="مثال: 970591234567" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="apptModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="saveAppointment">{{ isEditing ? 'حفظ التعديلات' : 'حفظ الموعد' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد الحذف -->
    <BaseModal v-model="deleteModal" title="حذف موعد المناقشة" :description="deleteTarget ? `حذف موعد مناقشة ‏${deleteTarget.proj}` : ''" size="sm">
      <p class="text-body-sm text-text-600">لا يمكن التراجع عن هذا الإجراء بعد الحذف.</p>
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Plus, Download, FileDown, Search, MessageCircle, Pencil, Trash2, Check, MapPin, Users, CalendarClock } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { formatDate } from '@/utils/formatters'
import { exportGroupsPdf } from '@/utils/exportReport'
import { useDiscussionsStore } from '@/stores/discussions.store'
import { useTeamsStore } from '@/stores/teams.store'

const APPTS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyForm = () => ({ project_id: '', place: '', date: '', time: '', committee: '', whatsapp: '', status: 'pending' })

export default {
  name: 'CommitteeAppointmentsPage',

  components: { Search, MessageCircle, Pencil, Trash2, MapPin, Users, CalendarClock, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, SkeletonLoader, Pagination },

  data() {
    return {
      Plus, Download, FileDown, Check, Trash2,
      exportingExcel: false,
      exportingPdf: false,
      submitting: false,
      search: '',
      deptFilter: '',
      specFilter: '',

      statusOptions: [
        { value: 'pending', label: 'قيد الانتظار' },
        { value: 'confirmed', label: 'مؤكَّد' }
      ],

      apptModal: false,
      isEditing: false,
      editTargetId: null,
      apptForm: emptyForm(),

      deleteModal: false,
      deleteTarget: null,

      page: 1
    }
  },

  computed: {
    ...mapState(useDiscussionsStore, ['discussions', 'discussionsLoading']),
    ...mapState(useTeamsStore, ['teams']),

    rows() {
      return this.discussions.map((d) => ({
        id: d.id,
        project_id: d.project_id,
        proj: d.project?.name || '—',
        team: d.project?.team?.name || '—',
        sup: d.supervisor?.name || '—',
        dept: d.project?.department?.name || 'غير محدد',
        spec: d.project?.specialization?.name || 'غير محدد',
        place: d.place,
        date: d.discussion_date,
        time: (d.discussion_time || '').slice(0, 5),
        committee: d.committee,
        whatsapp: d.whatsapp,
        status: d.status
      }))
    },

    /** المشاريع قيد التنفيذ التي ما إلها موعد مناقشة مسجّل بعد */
    projectOptions() {
      const taken = new Set(this.discussions.map((d) => d.project_id))
      return this.teams
        .filter((t) => t.project?.status === 'in_progress' && !taken.has(t.project.id))
        .map((t) => ({ value: t.project.id, label: `${t.project.name} — ${t.name}` }))
    },

    deptOptions() {
      return [...new Set(this.rows.map((r) => r.dept))].map((d) => ({ value: d, label: d }))
    },
    specOptions() {
      return [...new Set(this.rows.map((r) => r.spec))].map((s) => ({ value: s, label: s }))
    },

    filteredDiscussions() {
      const q = this.search.trim()
      return this.rows.filter((r) => {
        const matchQ = !q || `${r.proj}${r.team}${r.sup}`.includes(q)
        const matchDept = !this.deptFilter || r.dept === this.deptFilter
        const matchSpec = !this.specFilter || r.spec === this.specFilter
        return matchQ && matchDept && matchSpec
      })
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredDiscussions.length / APPTS_PAGE_SIZE))
    },
    pageOptions() {
      return Array.from({ length: this.totalPages }, (_, i) => ({ value: i + 1, label: `الصفحة ${i + 1} من ${this.totalPages}` }))
    },
    pageDropdown: {
      get() { return this.page },
      set(value) { this.page = value }
    },
    pageDiscussions() {
      const start = (this.page - 1) * APPTS_PAGE_SIZE
      return this.filteredDiscussions.slice(start, start + APPTS_PAGE_SIZE)
    }
  },

  watch: {
    filteredDiscussions() {
      this.page = 1
    }
  },

  async created() {
    await Promise.all([this.fetchDiscussions(), this.fetchTeams()])
  },

  methods: {
    formatDate,
    ...mapActions(useDiscussionsStore, ['fetchDiscussions', 'createDiscussion', 'updateDiscussion', 'deleteDiscussion', 'exportDiscussionsExcel']),
    ...mapActions(useTeamsStore, ['fetchTeams']),

    openAddModal() {
      this.isEditing = false
      this.editTargetId = null
      this.apptForm = emptyForm()
      this.apptModal = true
    },
    openEdit(row) {
      this.isEditing = true
      this.editTargetId = row.id
      this.apptForm = { project_id: row.project_id, place: row.place, date: (row.date || '').slice(0, 10), time: row.time, committee: row.committee, whatsapp: row.whatsapp || '', status: row.status }
      this.apptModal = true
    },

    async saveAppointment() {
      const f = this.apptForm
      if (!f.place || !f.date || !f.time || !f.committee || (!this.isEditing && !f.project_id)) {
        this.$toast?.error('يرجى تعبئة جميع الحقول المطلوبة')
        return
      }
      this.submitting = true
      const time = f.time.slice(0, 5)
      try {
        if (this.isEditing) {
          await this.updateDiscussion(this.editTargetId, { place: f.place, discussion_date: f.date, discussion_time: time, committee: f.committee, whatsapp: f.whatsapp || null, status: f.status })
          this.$toast?.success('تم حفظ التعديلات')
        } else {
          await this.createDiscussion({ project_id: f.project_id, supervisor_id: this.teams.find((t) => t.project?.id === f.project_id)?.supervisor?.id, place: f.place, discussion_date: f.date, discussion_time: time, committee: f.committee, whatsapp: f.whatsapp || null, status: f.status })
          this.$toast?.success('تم تسجيل موعد المناقشة')
        }
        this.apptModal = false
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ الموعد')
      } finally {
        this.submitting = false
      }
    },

    openDelete(row) {
      this.deleteTarget = row
      this.deleteModal = true
    },
    async confirmDelete() {
      this.submitting = true
      try {
        await this.deleteDiscussion(this.deleteTarget.id)
        this.deleteModal = false
        this.$toast?.success('تم حذف الموعد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف الموعد')
      } finally {
        this.submitting = false
      }
    },

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },

    async exportExcel() {
      this.exportingExcel = true
      try {
        await this.exportDiscussionsExcel()
      } catch {
        this.$toast?.error('تعذّر تصدير الملف')
      } finally {
        this.exportingExcel = false
      }
    },

    async exportPdf() {
      this.exportingPdf = true
      try {
        await exportGroupsPdf({
          fileName: 'مواعيد-المناقشات.pdf',
          title: 'تقرير مواعيد المناقشات',
          subtitle: `${this.filteredDiscussions.length} موعد مسجّل`,
          sections: [{
            heading: 'مواعيد المناقشات',
            meta: [],
            tableColumns: [
              { key: 'proj', label: 'المشروع' },
              { key: 'team', label: 'الفريق' },
              { key: 'sup', label: 'المشرف' },
              { key: 'place', label: 'المكان' },
              { key: 'date', label: 'التاريخ' },
              { key: 'time', label: 'الوقت' },
              { key: 'committee', label: 'لجنة المناقشة' }
            ],
            tableRows: this.filteredDiscussions
          }]
        })
      } finally {
        this.exportingPdf = false
      }
    }
  }
}
</script>
