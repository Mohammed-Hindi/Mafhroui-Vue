<template>
  <div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center lg:flex-col lg:items-start gap-4 lg:gap-0 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-error-bg text-error shrink-0 lg:mb-4"><XCircle :size="20" /></span>
        <div class="flex items-baseline gap-2 lg:block">
          <div class="font-cairo font-extrabold text-h1 text-text-900 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="stats.rejected" /></div>
          <div class="text-body-sm font-bold text-text-600 lg:mt-1.5">طلبات مرفوضة</div>
        </div>
      </div>
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center lg:flex-col lg:items-start gap-4 lg:gap-0 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-success-bg text-success shrink-0 lg:mb-4"><CheckCircle2 :size="20" /></span>
        <div class="flex items-baseline gap-2 lg:block">
          <div class="font-cairo font-extrabold text-h1 text-text-900 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="stats.approved" /></div>
          <div class="text-body-sm font-bold text-text-600 lg:mt-1.5">طلبات معتمدة</div>
        </div>
      </div>
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center lg:flex-col lg:items-start gap-4 lg:gap-0 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-warning-bg text-warning-text shrink-0 lg:mb-4"><Clock :size="20" /></span>
        <div class="flex items-baseline gap-2 lg:block">
          <div class="font-cairo font-extrabold text-h1 text-text-900 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="stats.pending" /></div>
          <div class="text-body-sm font-bold text-text-600 lg:mt-1.5">قيد المراجعة</div>
        </div>
      </div>
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center lg:flex-col lg:items-start gap-4 lg:gap-0 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0 lg:mb-4"><FileCheck :size="20" /></span>
        <div class="flex items-baseline gap-2 lg:block">
          <div class="font-cairo font-extrabold text-h1 text-text-900 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="proposals.length" /></div>
          <div class="text-body-sm font-bold text-text-600 lg:mt-1.5">إجمالي الطلبات</div>
        </div>
      </div>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-4 p-5 pb-4">
        <h3 class="font-cairo font-bold text-h4 text-text-900">قائمة المقترحات</h3>
        <div class="flex items-center gap-1 bg-bg border border-border rounded-md p-1">
          <button
            v-for="tab in tabs" :key="tab.value" type="button"
            class="h-8 px-4 rounded-sm text-caption font-bold transition-colors duration-fast"
            :class="activeTab === tab.value ? 'bg-primary-600 text-white shadow-card' : 'text-text-600 hover:text-primary-700'"
            @click="activeTab = tab.value; page = 1"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="px-5 pb-4">
        <div class="relative">
          <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
          <input v-model.trim="search" type="search" placeholder="ابحث عن مشروع أو فريق..." class="w-full h-icon-btn ps-10 pe-3 rounded-pill border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
        </div>
      </div>

      <DataTable
        :columns="columns" :rows="pageRows" row-key="id"
        :meta="{ current_page: page, last_page: totalPages, total: filteredProposals.length }"
        empty-title="لا توجد مقترحات مطابقة"
        @page-change="page = $event"
      >
        <template #cell-spec="{ row }">
          <div class="font-bold text-text-900">{{ row.title }}</div>
          <div v-if="row.sub" class="text-label text-text-400 mt-0.5">{{ row.sub }}</div>
        </template>
        <template #cell-team="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
        <template #cell-file="{ row }">
          <button type="button" class="inline-flex items-center gap-2 text-caption font-semibold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-sm hover:bg-primary-100 transition-colors duration-fast" @click="openFile(row)">
            <FileText :size="14" /> عرض المقترح
          </button>
        </template>
        <template #cell-status="{ row }"><BaseBadge :variant="statusVariant(row.status)" dot>{{ row.status }}</BaseBadge></template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <button type="button" class="grid place-items-center w-9 h-9 rounded-pill bg-error-bg text-error hover:brightness-95 transition-all duration-fast disabled:opacity-40" :disabled="row.status !== 'قيد المراجعة'" title="رفض" @click="openReject(row)"><X :size="15" /></button>
            <button type="button" class="grid place-items-center w-9 h-9 rounded-pill bg-success-bg text-success hover:brightness-95 transition-all duration-fast disabled:opacity-40" :disabled="row.status !== 'قيد المراجعة'" title="موافقة" @click="approve(row)"><Check :size="15" /></button>
          </div>
        </template>
        <template #row-extra="{ row }">
          <div v-if="row.status === 'مرفوض' && row.rejectReason" class="flex items-start gap-2 p-3 rounded-sm bg-error-bg md:rounded-none md:px-5 md:py-3 md:border-t md:border-error-border/50">
            <XCircle :size="14" class="text-error shrink-0 mt-0.5" />
            <p class="text-caption text-error leading-relaxed"><span class="font-bold">ملاحظات الرفض: </span>{{ row.rejectReason }}</p>
          </div>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="rejectModal" title="سبب الرفض" :description="rejectTarget ? `سبب رفض مقترح ${rejectTarget.team}` : ''" size="sm">
      <div class="flex flex-col gap-2">
        <label class="text-label font-semibold text-text-600">سبب الرفض</label>
        <textarea v-model.trim="rejectReason" rows="4" placeholder="اكتبي سبب الرفض ليتم إرساله للفريق..." class="w-full rounded-sm border border-border bg-bg text-body text-text-900 px-3 py-2.5 focus:border-primary-600 transition-colors duration-fast resize-y" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="rejectModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="X" :loading="rejecting" @click="confirmReject">تأكيد الرفض</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { XCircle, CheckCircle2, Clock, FileCheck, Search, FileText, X, Check } from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import CountUp from '@/components/ui/CountUp.vue'
import { useTeamsStore } from '@/stores/teams.store'

const PAGE_SIZE = 5
const STATUS_LABELS = { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' }

export default {
  name: 'CommitteeProposalsPage',

  components: { XCircle, CheckCircle2, Clock, FileCheck, Search, FileText, X, Check, BaseBadge, BaseButton, BaseModal, DataTable, CountUp },

  data() {
    return {
      X,
      search: '',
      activeTab: 'all',
      page: 1,
      tabs: [
        { value: 'all', label: 'الكل' },
        { value: 'قيد المراجعة', label: 'المعلّقة' },
        { value: 'معتمد', label: 'المعتمدة' }
      ],
      columns: [
        { key: 'spec', label: 'تفاصيل المشروع والتخصص' },
        { key: 'team', label: 'الفريق' },
        { key: 'file', label: 'المرفقات' },
        { key: 'status', label: 'الحالة' },
        { key: 'actions', label: 'الإجراءات' }
      ],

      rejectModal: false,
      rejectTarget: null,
      rejectReason: '',
      rejecting: false,
      approvingId: null
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'specializationName']),

    proposals() {
      return this.teams
        .filter((t) => t.project?.proposal)
        .map((t) => {
          const p = t.project.proposal
          return {
            id: p.id,
            title: p.name,
            sub: this.specializationName(t.specialization_id),
            team: t.name,
            status: STATUS_LABELS[p.status] || p.status,
            rejectReason: p.rejection_reason,
            ext: p.pdf_path?.split('.').pop() || 'pdf'
          }
        })
    },

    stats() {
      const rejected = this.proposals.filter((p) => p.status === 'مرفوض').length
      const approved = this.proposals.filter((p) => p.status === 'معتمد').length
      const pending = this.proposals.filter((p) => p.status === 'قيد المراجعة').length
      return { rejected, approved, pending }
    },

    filteredProposals() {
      const q = this.search.trim()
      return this.proposals.filter((p) => {
        const matchTab = this.activeTab === 'all' || p.status === this.activeTab
        const matchQ = !q || `${p.title}${p.team}`.includes(q)
        return matchTab && matchQ
      })
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredProposals.length / PAGE_SIZE))
    },

    pageRows() {
      const start = (this.page - 1) * PAGE_SIZE
      return this.filteredProposals.slice(start, start + PAGE_SIZE)
    }
  },

  async created() {
    await Promise.all([this.fetchTeams(), this.fetchSpecializations()])
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'approveProposal', 'rejectProposal', 'openProtectedFile']),

    statusVariant(status) {
      return { 'معتمد': 'success', 'مرفوض': 'error', 'قيد المراجعة': 'warning' }[status] || 'neutral'
    },

    async openFile(row) {
      try {
        await this.openProtectedFile(`/proposals/${row.id}/download`, `مقترح-${row.title}.${row.ext}`)
      } catch {
        // الرسالة انعرضت أصلاً كـ toast
      }
    },

    async approve(row) {
      try {
        await this.approveProposal(row.id)
        await this.fetchTeams()
        this.$toast?.success(`تمت الموافقة على مقترح ${row.team}`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّرت الموافقة')
      }
    },

    openReject(row) {
      this.rejectTarget = row
      this.rejectReason = ''
      this.rejectModal = true
    },

    async confirmReject() {
      if (!this.rejectReason) {
        this.$toast?.error('يرجى كتابة سبب الرفض')
        return
      }
      this.rejecting = true
      try {
        await this.rejectProposal(this.rejectTarget.id, this.rejectReason)
        await this.fetchTeams()
        this.rejectModal = false
        this.$toast?.success(`تم رفض مقترح ${this.rejectTarget.team} — السبب: ${this.rejectReason}`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر الرفض')
      } finally {
        this.rejecting = false
      }
    }
  }
}
</script>
