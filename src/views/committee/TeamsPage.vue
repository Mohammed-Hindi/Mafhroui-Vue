<template>
  <div>
    <div class="flex items-start gap-3 mb-6 p-4 rounded-lg bg-warning-bg border border-warning-border">
      <AlertTriangle :size="18" class="text-warning shrink-0 mt-0.5" />
      <p class="text-caption text-warning-text leading-relaxed">
        الباك إند الحالي لا يدعم إضافة مشرف جديد، ولا تعديل/حذف فريق أو عضو بعد إنشائه — فقط استيراد طلاب وتكوين فريق جديد منهم.
        المشرفون المتاحون بالقائمة أدناه هم فقط من لديهم فريق مسجّل بالفعل.
      </p>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <BaseButton :icon="Plus" @click="openCreateTeam">إنشاء فريق جديد</BaseButton>
      <BaseButton variant="outline" :icon="Upload" @click="openImport">استيراد طلاب من Excel</BaseButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن طالب، مشرف أو اسم فريق..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <BaseSelect v-model="filterSup" class="min-w-[180px]" placeholder="جميع المشرفين" include-placeholder-option :options="supervisorOptions" />
      <BaseSelect v-model="filterSpec" class="min-w-[180px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
    </div>

    <SkeletonLoader v-if="teamsLoading" :rows="6" height="60px" />
    <ErrorState v-else-if="teamsError" :message="teamsError" @retry="loadTeams" />
    <EmptyState v-else-if="!filteredTeams.length" title="لا توجد فرق مطابقة" description="جرّبي تعديل البحث أو الفلاتر، أو أنشئي فريقًا جديدًا." />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="team in filteredTeams" :id="`team-${team.id}`" :key="team.id"
        class="bg-surface border border-border rounded-lg shadow-card overflow-hidden transition-shadow duration-base"
        :class="{ 'ring-2 ring-primary-500/40': highlightId === team.id }"
      >
        <div class="flex items-center gap-4 p-4 flex-wrap">
          <button
            type="button" class="grid place-items-center w-9 h-9 rounded-sm bg-border-soft text-text-600 transition-all duration-base shrink-0"
            :class="{ '!bg-primary-600 !text-white rotate-90': isOpen(team.id) }"
            @click="toggleTeam(team.id)"
          >
            <ChevronLeft :size="16" />
          </button>

          <div class="w-10 h-10 rounded-md shrink-0 grid place-items-center font-cairo font-extrabold text-body-sm text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            {{ team.name?.charAt(0) || '#' }}
          </div>

          <div class="flex-1 min-w-0 flex items-center gap-6 flex-wrap">
            <div>
              <div class="text-body-sm font-extrabold text-text-900">{{ team.name }}</div>
              <div v-if="team.project" class="text-label text-text-400">{{ team.project.name }}</div>
            </div>
            <div class="text-caption"><span class="text-text-400">المشرف </span><span class="font-bold text-text-900">{{ team.supervisor?.name || '—' }}</span></div>
            <BaseBadge v-if="team.project?.status">{{ statusLabel(team.project.status) }}</BaseBadge>
            <BaseBadge>{{ (team.members || []).length }} {{ (team.members || []).length === 1 ? 'عضو' : 'أعضاء' }}</BaseBadge>
          </div>
        </div>

        <div v-show="isOpen(team.id)" class="border-t border-border-soft overflow-x-auto scrollbar-thin">
          <table class="w-full border-collapse min-w-[600px]">
            <thead>
              <tr class="bg-bg">
                <th class="px-5 py-3 text-start text-label font-bold text-text-600">اسم العضو</th>
                <th class="px-5 py-3 text-start text-label font-bold text-text-600">الرقم الجامعي</th>
                <th class="px-5 py-3 text-start text-label font-bold text-text-600">الواتس</th>
                <th class="px-5 py-3 text-start text-label font-bold text-text-600">البريد</th>
                <th class="px-5 py-3 text-start text-label font-bold text-text-600">إجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-soft">
              <tr v-for="member in team.members" :key="member.id">
                <td class="px-5 py-3 font-bold text-text-900">
                  {{ member.student?.name }}
                  <span v-if="member.is_leader" class="ms-1.5 text-label font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-pill">قائد</span>
                </td>
                <td class="px-5 py-3 mono">{{ member.student?.university_number || '—' }}</td>
                <td class="px-5 py-3 mono">{{ member.student?.whatsapp || '—' }}</td>
                <td class="px-5 py-3 mono whitespace-nowrap">{{ member.student?.email || '—' }}</td>
                <td class="px-5 py-3">
                  <div class="flex gap-2">
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" title="واتساب" :disabled="!member.student?.whatsapp" @click="sendWhats(member.student.whatsapp)"><MessageCircle :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:pointer-events-none" title="بريد" :disabled="!member.student?.email" @click="sendMail(member.student.email)"><Mail :size="14" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- استيراد طلاب: معاينة ثم تأكيد -->
    <BaseModal v-model="importModal.open" title="استيراد طلاب من Excel" size="lg" :description="importStep === 'pick' ? 'ملف xlsx يحتوي: name, email, university_number, whatsapp' : 'راجعي الصفوف الصحيحة والخاطئة قبل الحفظ'">
      <div v-if="importStep === 'pick'">
        <FileDropzone accept=".xlsx,.xls,.csv" hint="ملف Excel — عمود لكل: الاسم، البريد، الرقم الجامعي، الواتس" @change="handleFileSelected" />
      </div>

      <div v-else-if="importStep === 'preview'">
        <div v-if="previewResult.valid?.length" class="mb-4">
          <h4 class="text-body-sm font-bold text-success mb-2">صفوف صحيحة ({{ previewResult.valid.length }})</h4>
          <ul class="max-h-40 overflow-y-auto scrollbar-thin space-y-1">
            <li v-for="(row, i) in previewResult.valid" :key="i" class="text-caption text-text-700 bg-success-bg px-3 py-1.5 rounded-sm">{{ row.name }} — {{ row.email }}</li>
          </ul>
        </div>
        <div v-if="previewResult.invalid?.length">
          <h4 class="text-body-sm font-bold text-error mb-2">صفوف بها أخطاء ({{ previewResult.invalid.length }})</h4>
          <ul class="max-h-40 overflow-y-auto scrollbar-thin space-y-1">
            <li v-for="(row, i) in previewResult.invalid" :key="i" class="text-caption text-error bg-error-bg px-3 py-1.5 rounded-sm">
              صف {{ row.row }}: {{ (row.errors || []).join('، ') }}
            </li>
          </ul>
        </div>
        <div class="mt-4">
          <BaseSelect v-model="importSpecId" label="التخصص لكل الطلاب المستوردين" placeholder="اختاري التخصص" :options="specializationOptions" />
        </div>
      </div>

      <div v-else-if="importStep === 'done'" class="text-center py-4">
        <span class="grid place-items-center w-14 h-14 rounded-pill bg-success-bg text-success mx-auto mb-3"><Check :size="26" /></span>
        <p class="text-body-sm font-bold text-text-900">تم إنشاء {{ createdResult.created?.length || 0 }} حساب طالب</p>
        <p class="text-caption text-text-600 mt-1">تقدرين الآن تختاريهم عند إنشاء فريق جديد.</p>
      </div>

      <template #footer>
        <template v-if="importStep === 'preview'">
          <BaseButton variant="ghost" @click="importModal.open = false">إلغاء</BaseButton>
          <BaseButton :loading="importModal.saving" :disabled="!importSpecId || !previewResult.valid?.length" :icon="Check" @click="confirmImport">تأكيد الاستيراد ({{ previewResult.valid?.length || 0 }})</BaseButton>
        </template>
        <BaseButton v-else-if="importStep === 'done'" block @click="importModal.open = false">إغلاق</BaseButton>
      </template>
    </BaseModal>

    <!-- إنشاء فريق جديد -->
    <BaseModal v-model="teamModal.open" title="إنشاء فريق جديد" size="lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="teamForm.name" label="اسم الفريق" class="sm:col-span-2" />
        <BaseSelect v-model="teamForm.specialization_id" label="التخصص" placeholder="اختاري التخصص" :options="specializationOptions" />
        <BaseSelect v-model="teamForm.supervisor_id" label="المشرف" placeholder="اختاري المشرف" :options="supervisorOptions" />
        <div class="sm:col-span-2">
          <label class="block mb-2 text-label font-semibold text-text-700">الأعضاء (حتى 4)</label>
          <div class="flex flex-wrap gap-2 p-3 rounded-sm border border-border bg-bg max-h-40 overflow-y-auto">
            <label v-for="candidate in memberCandidates" :key="candidate.id" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill text-caption font-semibold cursor-pointer" :class="teamForm.member_ids.includes(candidate.id) ? 'bg-primary-600 text-white' : 'bg-surface border border-border text-text-700'">
              <input type="checkbox" class="hidden" :value="candidate.id" :checked="teamForm.member_ids.includes(candidate.id)" @change="toggleMember(candidate.id)">
              {{ candidate.name }}
            </label>
          </div>
        </div>
        <BaseSelect v-model="teamForm.leader_id" label="قائد الفريق" placeholder="اختاري القائد" :options="leaderOptions" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="teamModal.open = false">إلغاء</BaseButton>
        <BaseButton :loading="teamModal.saving" :icon="Check" @click="submitTeam">إنشاء الفريق</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Plus, Upload, Search, ChevronLeft, MessageCircle, Mail, AlertTriangle, Check } from 'lucide-vue-next'
import { useCommitteeStore } from '@/stores/committee.store'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'

const STATUS_LABELS = { in_progress: 'قيد التنفيذ', completed: 'مكتمل', proposed: 'مقترح', pending: 'قيد الإعداد' }

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'TeamsPage',

  components: {
    BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, SkeletonLoader, ErrorState, EmptyState, FileDropzone,
    Search, ChevronLeft, MessageCircle, Mail, AlertTriangle, Check
  },

  data() {
    return {
      Plus, Upload,
      search: '',
      filterSup: '',
      filterSpec: '',
      openIds: [],
      highlightId: null,

      importModal: { open: false, saving: false },
      importStep: 'pick',
      previewFile: null,
      previewResult: {},
      importSpecId: '',
      createdResult: {},
      importedCandidates: [],

      teamModal: { open: false, saving: false },
      teamForm: { name: '', specialization_id: '', supervisor_id: '', member_ids: [], leader_id: '' }
    }
  },

  computed: {
    ...mapState(useCommitteeStore, [
      'teams', 'teamsLoading', 'teamsError', 'departments', 'specializations',
      'studentsFromTeams', 'supervisorsFromTeams'
    ]),

    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },
    supervisorOptions() {
      return this.supervisorsFromTeams.map((s) => ({ value: s.id, label: s.name }))
    },
    memberCandidates() {
      const known = this.studentsFromTeams.map((s) => ({ id: s.id, name: s.name }))
      const imported = this.importedCandidates.filter((c) => !known.some((k) => k.id === c.id))
      return [...imported, ...known]
    },
    leaderOptions() {
      return this.memberCandidates.filter((c) => this.teamForm.member_ids.includes(c.id)).map((c) => ({ value: c.id, label: c.name }))
    },

    filteredTeams() {
      const q = this.search.trim()
      return this.teams.filter((team) => {
        const memberNames = (team.members || []).map((m) => m.student?.name).join(' ')
        const matchQ = !q || `${team.name}${team.supervisor?.name || ''}${memberNames}`.includes(q)
        const matchSup = !this.filterSup || String(team.supervisor?.id) === String(this.filterSup)
        const matchSpec = !this.filterSpec || String(team.specialization_id) === String(this.filterSpec)
        return matchQ && matchSup && matchSpec
      })
    }
  },

  created() {
    this.fetchRefData()
    this.loadTeams().then(() => this.highlightFromQuery())
  },

  methods: {
    ...mapActions(useCommitteeStore, ['fetchTeams', 'fetchRefData', 'previewImport', 'createTeam']),
    ...mapActions(useCommitteeStore, { storeConfirmImport: 'confirmImport' }),

    loadTeams() {
      return this.fetchTeams().catch(() => {})
    },

    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },

    highlightFromQuery() {
      const id = this.$route.query.team
      if (!id) return
      const target = this.teams.find((t) => String(t.id) === String(id))
      if (!target) return
      this.openIds.push(target.id)
      this.highlightId = target.id
      this.$nextTick(() => {
        document.getElementById(`team-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => { this.highlightId = null }, 1800)
      })
    },

    isOpen(id) {
      return this.openIds.includes(id)
    },
    toggleTeam(id) {
      this.openIds = this.isOpen(id) ? this.openIds.filter((x) => x !== id) : [...this.openIds, id]
    },

    openImport() {
      this.importStep = 'pick'
      this.previewFile = null
      this.previewResult = {}
      this.importSpecId = ''
      this.importModal = { open: true, saving: false }
    },
    async handleFileSelected(file) {
      if (!file) return
      this.previewFile = file
      try {
        const formData = new FormData()
        formData.append('file', file)
        this.previewResult = await this.previewImport(formData)
        this.importStep = 'preview'
      } catch (_) {
        this.$toast.error('تعذّرت معاينة الملف')
      }
    },
    async confirmImport() {
      this.importModal.saving = true
      try {
        const payload = { specialization_id: this.importSpecId, rows: this.previewResult.valid }
        this.createdResult = await this.storeConfirmImport(payload)
        this.importedCandidates.push(...(this.createdResult.created || []).map((c) => ({ id: c.user.id, name: c.user.name })))
        this.importStep = 'done'
        this.$toast.success('تم استيراد الطلاب بنجاح')
      } catch (_) {
        this.$toast.error('تعذّر تأكيد الاستيراد')
      } finally {
        this.importModal.saving = false
      }
    },

    openCreateTeam() {
      this.teamForm = { name: '', specialization_id: '', supervisor_id: '', member_ids: [], leader_id: '' }
      this.teamModal = { open: true, saving: false }
    },
    toggleMember(id) {
      const list = this.teamForm.member_ids
      this.teamForm.member_ids = list.includes(id) ? list.filter((x) => x !== id) : [...list, id].slice(0, 4)
      if (!this.teamForm.member_ids.includes(this.teamForm.leader_id)) this.teamForm.leader_id = ''
    },
    async submitTeam() {
      const f = this.teamForm
      if (!f.name || !f.supervisor_id || !f.specialization_id || !f.member_ids.length || !f.leader_id) {
        this.$toast.error('يرجى تعبئة جميع الحقول واختيار قائد للفريق')
        return
      }
      this.teamModal.saving = true
      try {
        await this.createTeam(f)
        this.teamModal.open = false
        this.$toast.success('تم إنشاء الفريق')
      } catch (_) {
        this.$toast.error('تعذّر إنشاء الفريق')
      } finally {
        this.teamModal.saving = false
      }
    },

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      window.location.href = `mailto:${mail}`
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
