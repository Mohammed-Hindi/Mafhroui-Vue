<template>
  <div>
    <div class="flex items-start gap-3 mb-6 p-4 rounded-lg bg-info-bg border border-primary-100">
      <Info :size="18" class="text-primary-600 shrink-0 mt-0.5" />
      <p class="text-caption text-primary-700 leading-relaxed">
        هذه القائمة مُشتقّة من بيانات الفرق (لا يوجد endpoint مستقل لكل الطلاب/المشرفين). كلمات المرور لا تُرسل أبدًا عبر الباك إند —
        الطريقة الوحيدة لتزويد عضو بحساب هي إرسال رابط دعوة صالح لمرة واحدة (3 أيام).
      </p>
    </div>

    <SkeletonLoader v-if="teamsLoading" :rows="6" height="24px" class="mb-10" />
    <ErrorState v-else-if="teamsError" :message="teamsError" @retry="loadTeams" />

    <template v-else>
      <!-- ===== الطلاب ===== -->
      <div class="flex items-center gap-3 mb-5">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><GraduationCap :size="18" /></span>
        <div><h3 class="text-h3 font-bold text-text-900">أعضاء الطلاب</h3><p class="text-caption text-text-600">{{ filteredStudents.length }} من أصل {{ studentsFromTeams.length }} طالبًا</p></div>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <button type="button" class="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-secondary-50 text-secondary-700 text-body-sm font-bold hover:-translate-y-px transition-transform duration-fast" @click="sendWhatsAll(filteredStudents)"><MessageCircle :size="16" /> إرسال واتساب للجميع</button>
        <button type="button" class="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-body-sm font-bold hover:-translate-y-px transition-transform duration-fast" @click="sendMailAll(filteredStudents.map((s) => s.email))"><Mail :size="16" /> إرسال بريد للجميع (Gmail)</button>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
        <div class="relative flex-1 min-w-[220px]">
          <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
          <input v-model.trim="studentSearch" type="search" placeholder="ابحث عن طالب أو رقم جامعي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
        </div>
      </div>

      <DataTable class="mb-12" :columns="studentColumns" :rows="filteredStudents" row-key="id" empty-title="لا توجد نتائج مطابقة">
        <template #cell-teamName="{ row }">
          <router-link :to="{ name: 'committee-teams', query: { team: row.teamId } }" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-border-soft text-text-600 text-caption font-semibold hover:bg-primary-100 hover:text-primary-700 transition-colors duration-fast">
            {{ row.teamName }} <ExternalLink :size="11" class="opacity-65" />
          </router-link>
        </template>
        <template #cell-name="{ row }">
          <span class="font-bold text-text-900">{{ row.name }}</span>
          <span v-if="row.isLeader" class="ms-1.5 text-label font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-pill">قائد</span>
        </template>
        <template #cell-university_number="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-whatsapp="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-email="{ value }"><span class="mono whitespace-nowrap">{{ value || '—' }}</span></template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" title="واتساب" :disabled="!row.whatsapp" @click="sendWhats(row.whatsapp)"><MessageCircle :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:pointer-events-none" title="بريد" :disabled="!row.email" @click="sendMail(row.email)"><Mail :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-40 disabled:pointer-events-none" title="إعادة إرسال رابط الدعوة" :disabled="inviting === row.id" @click="resendInvite(row)"><Send :size="14" /></button>
          </div>
        </template>
      </DataTable>

      <!-- ===== المشرفون ===== -->
      <div class="flex items-center gap-3 mb-5">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><Users :size="18" /></span>
        <div><h3 class="text-h3 font-bold text-text-900">المشرفون</h3><p class="text-caption text-text-600">{{ filteredSupervisors.length }} من أصل {{ supervisorsFromTeams.length }} مشرفًا</p></div>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <button type="button" class="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-secondary-50 text-secondary-700 text-body-sm font-bold hover:-translate-y-px transition-transform duration-fast" @click="sendWhatsAll(filteredSupervisors)"><MessageCircle :size="16" /> إرسال واتساب للجميع</button>
        <button type="button" class="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-body-sm font-bold hover:-translate-y-px transition-transform duration-fast" @click="sendMailAll(filteredSupervisors.map((s) => s.email))"><Mail :size="16" /> إرسال بريد للجميع (Gmail)</button>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
        <div class="relative flex-1 min-w-[220px]">
          <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
          <input v-model.trim="supervisorSearch" type="search" placeholder="ابحث عن مشرف بالاسم..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
        </div>
      </div>

      <DataTable :columns="supervisorColumns" :rows="filteredSupervisors" row-key="id" empty-title="لا توجد نتائج مطابقة">
        <template #cell-name="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
        <template #cell-email="{ value }"><span class="mono whitespace-nowrap">{{ value || '—' }}</span></template>
        <template #cell-whatsapp="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-teamCount="{ value }"><BaseBadge>{{ value }} {{ value === 1 ? 'فريق' : 'فرق' }}</BaseBadge></template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" title="واتساب" :disabled="!row.whatsapp" @click="sendWhats(row.whatsapp)"><MessageCircle :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:pointer-events-none" title="بريد" :disabled="!row.email" @click="sendMail(row.email)"><Mail :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-40 disabled:pointer-events-none" title="إعادة إرسال رابط الدعوة" :disabled="inviting === row.id" @click="resendInvite(row)"><Send :size="14" /></button>
          </div>
        </template>
      </DataTable>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Send, Info } from 'lucide-vue-next'
import { useCommitteeStore } from '@/stores/committee.store'
import api from '@/services/api'
import DataTable from '@/components/ui/DataTable.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorState from '@/components/ui/ErrorState.vue'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'MembersPage',

  components: { DataTable, BaseBadge, SkeletonLoader, ErrorState, GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Info, Send },

  data() {
    return {
      studentSearch: '',
      supervisorSearch: '',
      inviting: null,
      studentColumns: [
        { key: 'teamName', label: 'الفريق' },
        { key: 'name', label: 'اسم الطالب' },
        { key: 'university_number', label: 'الرقم الجامعي' },
        { key: 'whatsapp', label: 'رقم الواتس' },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'actions', label: 'إجراءات' }
      ],
      supervisorColumns: [
        { key: 'name', label: 'اسم المشرف' },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'whatsapp', label: 'رقم الواتس' },
        { key: 'teamCount', label: 'عدد الفرق' },
        { key: 'actions', label: 'إجراءات' }
      ]
    }
  },

  computed: {
    ...mapState(useCommitteeStore, ['teams', 'teamsLoading', 'teamsError', 'studentsFromTeams', 'supervisorsFromTeams']),

    filteredStudents() {
      const q = this.studentSearch.trim()
      return this.studentsFromTeams.filter((s) => !q || `${s.name}${s.university_number || ''}`.includes(q))
    },
    filteredSupervisors() {
      const q = this.supervisorSearch.trim()
      return this.supervisorsFromTeams.filter((s) => !q || s.name.includes(q))
    }
  },

  created() {
    this.loadTeams()
  },

  methods: {
    ...mapActions(useCommitteeStore, ['fetchTeams']),

    loadTeams() {
      return this.fetchTeams().catch(() => {})
    },

    async resendInvite(row) {
      this.inviting = row.id
      try {
        await api.post(`/users/${row.id}/invite`)
        this.$toast.success(`تم إرسال رابط دعوة جديد إلى ${row.name}`)
      } catch (_) {
        this.$toast.error('تعذّر إرسال رابط الدعوة')
      } finally {
        this.inviting = null
      }
    },

    sendWhats(whats) {
      if (!whats) return
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      if (mail) window.location.href = `mailto:${mail}`
    },
    sendWhatsAll(list) {
      const withWhats = list.filter((r) => r.whatsapp)
      // eslint-disable-next-line no-alert
      if (!withWhats.length || !window.confirm(`سيتم فتح ${withWhats.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      withWhats.forEach((r, i) => setTimeout(() => this.sendWhats(r.whatsapp), i * 300))
    },
    sendMailAll(emails) {
      const bcc = emails.filter(Boolean).join(',')
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bcc)}&su=${encodeURIComponent('تعميم من لجنة الإشراف')}`, '_blank')
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
