<template>
  <div>
    <router-link :to="{ name: 'committee-members' }" class="inline-flex items-center gap-2 text-body-sm font-semibold text-text-600 hover:text-primary-700 transition-colors duration-fast mb-6">
      <ArrowRight :size="16" /> رجوع إلى الأعضاء
    </router-link>

    <div class="flex items-center gap-3 mb-6">
      <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white bg-error"><Archive :size="18" /></span>
      <div>
        <h3 class="text-h3 font-bold text-text-900">الأعضاء المحذوفون</h3>
        <p class="text-caption text-text-600">سجلّ كل من تم حذفهم من المنصة مع سبب الحذف</p>
      </div>
    </div>

    <!-- ===================== الطلاب المحذوفون ===================== -->
    <div class="flex items-center gap-3 mb-4">
      <GraduationCap :size="16" class="text-text-400" />
      <h4 class="text-h4 font-bold text-text-900">الطلاب المحذوفون</h4>
      <BaseBadge>{{ filteredStudents.length }}</BaseBadge>
    </div>
    <div class="relative mb-4 max-w-sm">
      <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
      <input v-model.trim="studentSearch" type="search" placeholder="ابحث بالاسم أو الرقم الجامعي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
    </div>
    <DataTable
      :columns="studentColumns" :rows="studentPageRows" row-key="id" :primary-keys="['name', 'deletedAt']"
      :meta="{ current_page: studentPage, last_page: studentTotalPages, total: filteredStudents.length }"
      empty-title="لا يوجد طلاب محذوفون"
      @page-change="studentPage = $event"
    >
      <template #cell-grp="{ value }"><span class="chip gray inline-block px-2.5 py-1 rounded-pill bg-border-soft text-text-600 text-caption font-semibold">{{ value }}</span></template>
      <template #cell-name="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
      <template #cell-uid="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
      <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value }}</span></template>
      <template #cell-pw="{ value }"><span class="mono text-caption tracking-wider">{{ value ? '•'.repeat(value.length) : '—' }}</span></template>
      <template #cell-deletedAt="{ value }"><span class="text-caption text-text-600">{{ value }}</span></template>
      <template #row-extra="{ row }">
        <div v-if="row.deleteReason" class="flex items-start gap-2 px-5 py-3 bg-error-bg border-t border-error-border/50">
          <AlertTriangle :size="14" class="text-error shrink-0 mt-0.5" />
          <p class="text-caption text-error leading-relaxed"><span class="font-bold">سبب الحذف: </span>{{ row.deleteReason }}</p>
        </div>
      </template>
    </DataTable>

    <div class="mb-10" />

    <!-- ===================== المشرفون المحذوفون ===================== -->
    <div class="flex items-center gap-3 mb-4">
      <Users :size="16" class="text-text-400" />
      <h4 class="text-h4 font-bold text-text-900">المشرفون المحذوفون</h4>
      <BaseBadge>{{ filteredSupervisors.length }}</BaseBadge>
    </div>
    <div class="relative mb-4 max-w-sm">
      <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
      <input v-model.trim="supervisorSearch" type="search" placeholder="ابحث بالاسم أو الرقم الوظيفي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
    </div>
    <DataTable
      :columns="supervisorColumns" :rows="supervisorPageRows" row-key="id" :primary-keys="['name', 'deletedAt']"
      :meta="{ current_page: supervisorPage, last_page: supervisorTotalPages, total: filteredSupervisors.length }"
      empty-title="لا يوجد مشرفون محذوفون"
      @page-change="supervisorPage = $event"
    >
      <template #cell-name="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
      <template #cell-empId="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
      <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value }}</span></template>
      <template #cell-pw="{ value }"><span class="mono text-caption tracking-wider">{{ value ? '•'.repeat(value.length) : '—' }}</span></template>
      <template #cell-deletedAt="{ value }"><span class="text-caption text-text-600">{{ value }}</span></template>
      <template #row-extra="{ row }">
        <div v-if="row.deleteReason" class="flex items-start gap-2 px-5 py-3 bg-error-bg border-t border-error-border/50">
          <AlertTriangle :size="14" class="text-error shrink-0 mt-0.5" />
          <p class="text-caption text-error leading-relaxed"><span class="font-bold">سبب الحذف: </span>{{ row.deleteReason }}</p>
        </div>
      </template>
    </DataTable>

    <div class="mb-10" />

    <!-- ===================== أعضاء لجنة الإشراف المحذوفون ===================== -->
    <div class="flex items-center gap-3 mb-4">
      <ShieldCheck :size="16" class="text-text-400" />
      <h4 class="text-h4 font-bold text-text-900">أعضاء لجنة الإشراف المحذوفون</h4>
      <BaseBadge>{{ filteredCommittee.length }}</BaseBadge>
    </div>
    <div class="relative mb-4 max-w-sm">
      <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
      <input v-model.trim="committeeSearch" type="search" placeholder="ابحث بالاسم أو الرقم الوظيفي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
    </div>
    <DataTable
      :columns="committeeColumns" :rows="committeePageRows" row-key="id" :primary-keys="['name', 'deletedAt']"
      :meta="{ current_page: committeePage, last_page: committeeTotalPages, total: filteredCommittee.length }"
      empty-title="لا يوجد أعضاء لجنة إشراف محذوفون"
      @page-change="committeePage = $event"
    >
      <template #cell-name="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
      <template #cell-empId="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
      <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value }}</span></template>
      <template #cell-pw="{ value }"><span class="mono text-caption tracking-wider">{{ value ? '•'.repeat(value.length) : '—' }}</span></template>
      <template #cell-deletedAt="{ value }"><span class="text-caption text-text-600">{{ value }}</span></template>
      <template #row-extra="{ row }">
        <div v-if="row.deleteReason" class="flex items-start gap-2 px-5 py-3 bg-error-bg border-t border-error-border/50">
          <AlertTriangle :size="14" class="text-error shrink-0 mt-0.5" />
          <p class="text-caption text-error leading-relaxed"><span class="font-bold">سبب الحذف: </span>{{ row.deleteReason }}</p>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ArrowRight, Archive, GraduationCap, Users, ShieldCheck, Search, AlertTriangle } from 'lucide-vue-next'
import { useDeletedMembersStore } from '@/stores/deletedMembers.store'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'

const PAGE_SIZE = 4

export default {
  name: 'CommitteeDeletedMembersPage',

  components: { ArrowRight, Archive, GraduationCap, Users, ShieldCheck, Search, AlertTriangle, BaseBadge, DataTable },

  data() {
    return {
      studentSearch: '',
      supervisorSearch: '',
      committeeSearch: '',
      studentPage: 1,
      supervisorPage: 1,
      committeePage: 1,
      studentColumns: [
        { key: 'grp', label: 'رقم المجموعة' },
        { key: 'name', label: 'اسم العضو' },
        { key: 'uid', label: 'الرقم الجامعي' },
        { key: 'whats', label: 'رقم الواتس' },
        { key: 'mail', label: 'البريد الإلكتروني' },
        { key: 'pw', label: 'كلمة السر' },
        { key: 'deletedAt', label: 'تاريخ الحذف' }
      ],
      supervisorColumns: [
        { key: 'name', label: 'اسم الموظف' },
        { key: 'empId', label: 'الرقم الوظيفي' },
        { key: 'whats', label: 'رقم الواتس' },
        { key: 'mail', label: 'البريد الإلكتروني' },
        { key: 'pw', label: 'كلمة السر' },
        { key: 'deletedAt', label: 'تاريخ الحذف' }
      ],
      committeeColumns: [
        { key: 'name', label: 'اسم العضو' },
        { key: 'empId', label: 'الرقم الوظيفي' },
        { key: 'whats', label: 'واتساب' },
        { key: 'mail', label: 'البريد الإلكتروني' },
        { key: 'pw', label: 'كلمة السر' },
        { key: 'deletedAt', label: 'تاريخ الحذف' }
      ]
    }
  },

  computed: {
    ...mapState(useDeletedMembersStore, ['students', 'supervisors', 'committee']),

    filteredStudents() {
      const q = this.studentSearch.trim()
      return this.students.filter((s) => !q || `${s.name}${s.uid}`.includes(q))
    },
    filteredSupervisors() {
      const q = this.supervisorSearch.trim()
      return this.supervisors.filter((s) => !q || `${s.name}${s.empId}`.includes(q))
    },
    filteredCommittee() {
      const q = this.committeeSearch.trim()
      return this.committee.filter((s) => !q || `${s.name}${s.empId}`.includes(q))
    },

    studentTotalPages() {
      return Math.max(1, Math.ceil(this.filteredStudents.length / PAGE_SIZE))
    },
    studentPageRows() {
      const start = (this.studentPage - 1) * PAGE_SIZE
      return this.filteredStudents.slice(start, start + PAGE_SIZE)
    },
    supervisorTotalPages() {
      return Math.max(1, Math.ceil(this.filteredSupervisors.length / PAGE_SIZE))
    },
    supervisorPageRows() {
      const start = (this.supervisorPage - 1) * PAGE_SIZE
      return this.filteredSupervisors.slice(start, start + PAGE_SIZE)
    },
    committeeTotalPages() {
      return Math.max(1, Math.ceil(this.filteredCommittee.length / PAGE_SIZE))
    },
    committeePageRows() {
      const start = (this.committeePage - 1) * PAGE_SIZE
      return this.filteredCommittee.slice(start, start + PAGE_SIZE)
    }
  },

  watch: {
    filteredStudents() {
      this.studentPage = 1
    },
    filteredSupervisors() {
      this.supervisorPage = 1
    },
    filteredCommittee() {
      this.committeePage = 1
    }
  }
}
</script>
