<template>
  <div>
    <div class="flex items-start gap-3 mb-6 p-4 rounded-lg bg-warning-bg border border-warning-border">
      <AlertTriangle :size="18" class="text-warning shrink-0 mt-0.5" />
      <p class="text-caption text-warning-text leading-relaxed">
        الباك إند يدعم إنشاء موعد وعرض القائمة وتصديرها فقط — لا يوجد تعديل أو حذف لموعد بعد إنشائه، ولا سجل متعدد الطلاب
        (رقم واتساب واحد فقط لكل موعد).
      </p>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <BaseButton :icon="Plus" @click="openCreate">تسجيل موعد مناقشة جديد</BaseButton>
      <BaseButton variant="outline" :icon="Download" :loading="exporting" @click="exportFile">تصدير Excel</BaseButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <BaseSelect v-model="filterDept" class="min-w-[200px]" placeholder="جميع الأقسام" include-placeholder-option :options="departmentOptions" @change="loadDiscussions" />
      <BaseSelect v-model="filterSpec" class="min-w-[200px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" @change="loadDiscussions" />
    </div>

    <DataTable
      :columns="columns" :rows="discussions" row-key="id"
      :loading="discussionsLoading" :error="discussionsError" empty-title="لا توجد مواعيد مسجّلة"
      @retry="loadDiscussions"
    >
      <template #cell-project="{ row }"><span class="font-bold text-text-900">{{ row.project?.name }}</span></template>
      <template #cell-supervisor="{ row }">{{ row.supervisor?.name }}</template>
      <template #cell-discussion_date="{ row }"><span class="mono">{{ formatDate(row.discussion_date) }}</span></template>
      <template #cell-discussion_time="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-status="{ value }"><BaseBadge :variant="value === 'pending' ? 'warning' : 'info'" dot>{{ value }}</BaseBadge></template>
      <template #cell-actions="{ row }">
        <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" title="واتساب" :disabled="!row.whatsapp" @click="sendWhats(row)"><MessageCircle :size="14" /></button>
      </template>
    </DataTable>

    <BaseModal v-model="createModal.open" title="تسجيل موعد مناقشة" size="lg" description="اختاري الفريق ثم أكملي بيانات الموعد">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseSelect v-model="form.team_id" label="الفريق" placeholder="اختاري الفريق" :options="teamOptions" class="sm:col-span-2" @update:model-value="onTeamChange" />
        <BaseInput v-model="form.place" label="مكان المناقشة" placeholder="مثال: قاعة المناقشات 1" />
        <BaseInput v-model="form.discussion_date" type="date" label="تاريخ المناقشة" />
        <BaseInput v-model="form.discussion_time" type="time" label="موعد المناقشة" />
        <BaseInput v-model="form.committee" label="لجنة المناقشة" placeholder="مثال: د. سارة، د. يوسف" />
        <BaseInput v-model="form.whatsapp" label="رقم واتس للتواصل" placeholder="مثال: 970599123456" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton block :loading="createModal.saving" :icon="Send" @click="submit">حفظ الموعد</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Plus, Download, MessageCircle, AlertTriangle, Send } from 'lucide-vue-next'
import { useCommitteeStore } from '@/stores/committee.store'
import { formatDate } from '@/utils/formatters'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'

const EMPTY_FORM = { team_id: '', place: '', discussion_date: '', discussion_time: '', committee: '', whatsapp: '' }

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'AppointmentsPage',

  components: { BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, DataTable, MessageCircle, AlertTriangle },

  data() {
    return {
      Plus, Download, Send,
      filterDept: '',
      filterSpec: '',
      exporting: false,
      createModal: { open: false, saving: false },
      form: { ...EMPTY_FORM },
      columns: [
        { key: 'project', label: 'المشروع' },
        { key: 'supervisor', label: 'المشرف' },
        { key: 'place', label: 'المكان' },
        { key: 'discussion_date', label: 'التاريخ' },
        { key: 'discussion_time', label: 'الوقت' },
        { key: 'status', label: 'الحالة' },
        { key: 'actions', label: 'إجراءات' }
      ]
    }
  },

  computed: {
    ...mapState(useCommitteeStore, ['discussions', 'discussionsLoading', 'discussionsError', 'departments', 'specializations', 'teams']),

    departmentOptions() {
      return this.departments.map((d) => ({ value: d.id, label: d.name }))
    },
    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },
    teamOptions() {
      return this.teams.filter((t) => t.project).map((t) => ({ value: t.id, label: `${t.name} — ${t.project.name}` }))
    }
  },

  created() {
    this.fetchRefData()
    this.fetchTeams().catch(() => {})
    this.loadDiscussions()
  },

  methods: {
    ...mapActions(useCommitteeStore, ['fetchDiscussions', 'fetchRefData', 'fetchTeams', 'createDiscussion', 'exportDiscussions']),
    formatDate,

    loadDiscussions() {
      const params = {}
      if (this.filterDept) params.department_id = this.filterDept
      if (this.filterSpec) params.specialization_id = this.filterSpec
      return this.fetchDiscussions(params).catch(() => {})
    },

    openCreate() {
      this.form = { ...EMPTY_FORM }
      this.createModal = { open: true, saving: false }
    },
    onTeamChange(teamId) {
      const team = this.teams.find((t) => String(t.id) === String(teamId))
      if (team?.supervisor?.whatsapp) this.form.whatsapp = team.supervisor.whatsapp
    },

    async submit() {
      const f = this.form
      if (!f.team_id || !f.place || !f.discussion_date || !f.discussion_time || !f.committee || !f.whatsapp) {
        this.$toast.error('يرجى تعبئة جميع الحقول قبل الحفظ')
        return
      }
      const team = this.teams.find((t) => String(t.id) === String(f.team_id))
      if (!team?.project?.id) {
        this.$toast.error('هذا الفريق لا يملك مشروعًا مرتبطًا بعد')
        return
      }
      this.createModal.saving = true
      try {
        await this.createDiscussion({
          project_id: team.project.id,
          supervisor_id: team.supervisor?.id,
          place: f.place,
          discussion_date: f.discussion_date,
          discussion_time: f.discussion_time,
          committee: f.committee,
          whatsapp: f.whatsapp,
          status: 'pending'
        })
        this.createModal.open = false
        this.$toast.success('تم حفظ موعد المناقشة')
      } catch (err) {
        this.$toast.error(err.normalized?.message || 'تعذّر حفظ الموعد')
      } finally {
        this.createModal.saving = false
      }
    },

    sendWhats(row) {
      const num = digitsOnly(row.whatsapp)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      const text = `تم حجز موعد مناقشة مشروع «${row.project?.name}» بتاريخ ${row.discussion_date} الساعة ${row.discussion_time} في ${row.place}.`
      window.open(`https://wa.me/${full}?text=${encodeURIComponent(text)}`, '_blank')
    },

    async exportFile() {
      this.exporting = true
      try {
        const blob = await this.exportDiscussions()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'discussions.xlsx'
        link.click()
        URL.revokeObjectURL(url)
      } catch (_) {
        this.$toast.error('تعذّر تصدير الملف')
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
