<template>
  <!-- الإدارة العامة: صندوق مراجعة (قائمة + تفاصيل) — اللجنة تبقى على التصميم الأصلي -->
  <ProposalsReview v-if="isSuperAdmin" />

  <section v-else class="gr gr-card pv">
    <header class="gr-card-head">
      <div class="gr-card-title">
        <span class="dash-chip">{{ semesterName }}</span>
        <span class="dash-chip">{{ filteredProposals.length }} مقترح</span>
      </div>
      <div class="gr-card-actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="gr-filters" aria-label="تصفية المقترحات">
      <label class="gr-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث باسم المشروع أو الفريق…">
      </label>
      <BaseSelect v-model="f.spec" class="min-w-[170px]" aria-label="التخصص" placeholder="كل التخصصات" include-placeholder-option :options="specSelectOptions" />
      <BaseSelect v-model="f.status" class="min-w-[140px]" aria-label="الحالة" placeholder="كل الحالات" include-placeholder-option :options="statusSelectOptions" />
      <BaseSelect v-model="pageSize" class="min-w-[110px]" aria-label="عدد الصفوف" :options="pageSizeOptions" />
    </div>

    <SlideTable :rows="filteredProposals" :size="pageSize" label="المقترحات">
      <template #default="{ rows: pageRows }">
        <div class="gr-table-wrap">
          <table class="gr-table pv-table">
            <thead>
              <tr>
                <th>المشروع</th>
                <th>الفريق</th>
                <th class="gr-hide-md">التخصص</th>
                <th>الحالة</th>
                <th>المرفقات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody v-if="!pageRows.length">
              <SkeletonLoader v-if="!teamsLoaded" variant="table" :cols="6" :rows="6" />
              <tr v-else><td colspan="6" class="gr-empty">لا توجد مقترحات مطابقة للفلاتر</td></tr>
            </tbody>
            <tbody v-else>
              <tr v-for="p in pageRows" :key="p.id">
                <td class="gr-name-cell">
                  <span class="gr-name">{{ p.title }}</span>
                  <span v-if="p.supervisor" class="gr-types">المشرف: {{ p.supervisor }}</span>
                  <span v-if="p.statusKey === 'rejected' && p.rejectReason" class="pv-reason">
                    <XCircle :size="13" />
                    <span><b>ملاحظات الرفض: </b>{{ p.rejectReason }}</span>
                  </span>
                </td>
                <td><span class="gr-name">{{ p.team }}</span></td>
                <td class="gr-hide-md"><span class="gr-spec">{{ p.sub }}</span></td>
                <td><span :class="['gm-chip', STATUS_CLASS[p.statusKey]]">{{ p.status }}</span></td>
                <td>
                  <button type="button" class="pv-file" @click="openFile(p)">
                    <FileText :size="14" /> عرض المقترح
                  </button>
                </td>
                <td>
                  <div class="pv-acts">
                    <button type="button" class="pv-act is-reject" :disabled="p.statusKey !== 'pending'" title="رفض" @click="openReject(p)"><X :size="15" /></button>
                    <button type="button" class="pv-act is-approve" :disabled="p.statusKey !== 'pending'" title="موافقة" @click="approve(p)"><Check :size="15" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </SlideTable>

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
  </section>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Search, FileText, X, Check, XCircle } from 'lucide-vue-next'
import ProposalsReview from '@/views/super-admin/ProposalsReview.vue'
import { useAuthStore } from '@/stores/auth.store'
import { PORTAL_ROLES } from '@/utils/constants'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import SlideTable from '@/components/ui/SlideTable.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { activeSemesterName } from '@/services/adminData'

const STATUS_LABELS = { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' }
/** الحالة كشارة ملوّنة: معلّق (أزرق) · معتمد (أخضر) · مرفوض (أحمر) */
const STATUS_CLASS = { pending: 'is-active', approved: 'is-done', rejected: 'is-rejected' }
const EMPTY_FILTERS = { spec: '', status: '' }

export default {
  name: 'CommitteeProposalsPage',

  components: { Search, FileText, X, Check, XCircle, ProposalsReview, BaseButton, BaseModal, BaseSelect, SlideTable, SkeletonLoader },

  data() {
    return {
      X,
      STATUS_CLASS,
      q: '',
      f: { ...EMPTY_FILTERS },
      pageSize: 25,
      pageSizeOptions: [
        { value: 25, label: 'عرض 25' },
        { value: 50, label: 'عرض 50' },
        { value: 100, label: 'عرض 100' }
      ],
      rejectModal: false,
      rejectTarget: null,
      rejectReason: '',
      rejecting: false
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'teamsLoaded', 'specializationName', 'specializations']),
    ...mapState(useAuthStore, ['userRole']),

    /** قوالب البوابة (هوية UCAS) للإدارة العامة ولجنة الإشراف */
    isSuperAdmin() {
      return PORTAL_ROLES.includes(this.userRole)
    },

    semesterName() {
      return activeSemesterName()
    },

    proposals() {
      return this.teams
        .filter((t) => t.project?.proposal)
        .map((t) => {
          const p = t.project.proposal
          return {
            id: p.id,
            title: p.name,
            sub: this.specializationName(t.specialization_id),
            specId: t.specialization_id,
            team: t.name,
            statusKey: p.status,
            status: STATUS_LABELS[p.status] || p.status,
            rejectReason: p.rejection_reason,
            ext: p.pdf_path?.split('.').pop() || 'pdf',
            supervisor: t.supervisor?.name || ''
          }
        })
    },

    /** المصدر الخام لكل قوائم الفلاتر المتداخلة */
    baseProposals() {
      return this.proposals
    },

    specSelectOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },

    statusSelectOptions() {
      return Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
    },

    filteredProposals() {
      const q = this.q.trim()
      return this.baseProposals.filter((p) => {
        const matchSpec = !this.f.spec || p.specId === this.f.spec
        const matchStatus = !this.f.status || p.statusKey === this.f.status
        const matchQ = !q || `${p.title}${p.team}${p.sub}${p.supervisor}`.includes(q)
        return matchSpec && matchStatus && matchQ
      })
    }
  },

  async created() {
    await Promise.all([this.fetchTeams(), this.fetchSpecializations()])
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'approveProposal', 'rejectProposal', 'openProtectedFile']),

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
