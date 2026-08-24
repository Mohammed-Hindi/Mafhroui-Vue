<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <BaseButton :icon="Plus" @click="openAddModal">تسجيل موعد مناقشة جديد</BaseButton>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" :icon="Upload" @click="openImport">استيراد من Excel</BaseButton>
        <BaseButton variant="outline" :icon="Download" :loading="exportingExcel" @click="exportExcel">تصدير Excel</BaseButton>
        <BaseButton variant="outline" :icon="FileDown" :loading="exportingPdf" @click="exportPdf">تصدير PDF</BaseButton>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-6">
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast disabled:opacity-40 disabled:pointer-events-none" :disabled="!allMembersWhats.length" @click="sendWhatsAll">
        <MessageCircle :size="15" /> واتساب للجميع ({{ allMembersWhats.length }})
      </button>
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast disabled:opacity-40 disabled:pointer-events-none" :disabled="!allMembersMail.length" @click="sendMailAll">
        <Mail :size="15" /> بريد للجميع (Gmail)
      </button>
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

    <div v-else class="flex items-stretch gap-2">
      <button
        type="button" class="hidden sm:grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700 disabled:opacity-30 disabled:pointer-events-none shrink-0 self-center"
        :disabled="page <= 1" aria-label="الشريحة السابقة" @click="page -= 1"
      >
        <ChevronRightIcon :size="18" />
      </button>

      <div class="flex-1 min-w-0 flex flex-col gap-4">
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
              <button
                type="button" class="grid place-items-center w-8 h-8 rounded-sm bg-border-soft text-text-600 transition-all duration-base"
                :class="{ '!bg-primary-600 !text-white rotate-90': isDiscussionOpen(d.id) }"
                :title="isDiscussionOpen(d.id) ? 'إخفاء الأعضاء' : `عرض الأعضاء (${membersFor(d.teamId).length})`"
                @click="toggleDiscussion(d.id)"
              >
                <ChevronDown :size="16" />
              </button>
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

          <div v-if="isDiscussionOpen(d.id)" class="border-t border-border-soft divide-y divide-border-soft">
            <div v-for="m in membersFor(d.teamId)" :key="m.id" class="flex items-center justify-between gap-3 px-5 py-2.5">
              <span class="font-bold text-text-900 text-body-sm">{{ m.name }}</span>
              <div class="flex items-center gap-2">
                <span class="mono text-caption text-text-400">{{ m.uid || '—' }}</span>
                <button v-if="m.whats" type="button" class="grid place-items-center w-7 h-7 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95" title="واتساب" @click="sendWhats(m.whats)"><MessageCircle :size="13" /></button>
                <button v-if="m.mail" type="button" class="grid place-items-center w-7 h-7 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(m.mail)"><Mail :size="13" /></button>
              </div>
            </div>
            <div class="px-5 py-3">
              <button type="button" class="inline-flex items-center gap-1.5 text-caption font-bold text-primary-600 hover:underline disabled:opacity-40 disabled:pointer-events-none" :disabled="membersFor(d.teamId).length >= 4" @click="openAddStudentToGroup(d)">
                <Plus :size="14" /> {{ membersFor(d.teamId).length >= 4 ? 'الفريق مكتمل (4 أعضاء)' : 'إضافة طالب لهذه المجموعة' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button" class="hidden sm:grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700 disabled:opacity-30 disabled:pointer-events-none shrink-0 self-center"
        :disabled="page >= totalPages" aria-label="الشريحة التالية" @click="page += 1"
      >
        <ChevronLeftIcon :size="18" />
      </button>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
      <button
        v-for="p in totalPages" :key="p" type="button"
        class="rounded-pill transition-all duration-fast"
        :class="p === page ? 'w-6 h-2 bg-primary-600' : 'w-2 h-2 bg-border hover:bg-primary-200'"
        :aria-label="`الشريحة ${p}`"
        @click="page = p"
      />
    </div>

    <!-- إضافة طالب لمجموعة -->
    <BaseModal v-model="addMemberModal" title="إضافة طالب للفريق" :description="addMemberTarget ? `إضافة عضو إلى ${addMemberTarget.team}` : ''">
      <BaseSelect v-model="addMemberStudentId" label="الطالب" placeholder="اختاري طالبًا غير منضم" :options="unassignedOptions" />
      <template #footer>
        <BaseButton variant="ghost" @click="addMemberModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" :disabled="!addMemberStudentId" @click="submitAddMemberToGroup">إضافة</BaseButton>
      </template>
    </BaseModal>

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

    <!-- استيراد من Excel -->
    <BaseModal v-model="importModal" title="استيراد مواعيد مناقشات من Excel" description="الأعمدة المطلوبة بالترتيب: اسم الفريق، المكان، التاريخ (YYYY-MM-DD)، الوقت (HH:MM)، لجنة المناقشة، واتساب (اختياري)" size="lg">
      <div v-if="!importPreview">
        <input ref="fileInput" type="file" accept=".xlsx" class="block w-full text-body-sm text-text-700 file:me-3 file:h-icon-btn file:px-4 file:rounded-sm file:border-0 file:bg-primary-50 file:text-primary-700 file:font-bold" @change="onFileSelected">
      </div>
      <div v-else class="flex flex-col gap-4">
        <div v-if="importPreview.valid.length" class="text-body-sm text-success font-bold">{{ importPreview.valid.length }} سجل صالح جاهز للإضافة</div>
        <div v-if="importPreview.invalid.length" class="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          <p class="text-body-sm text-error font-bold">{{ importPreview.invalid.length }} سجل به أخطاء (لن تُستورد):</p>
          <div v-for="row in importPreview.invalid" :key="row.row" class="text-caption text-error bg-error-bg px-3 py-2 rounded-sm">
            صف {{ row.row }}: {{ row.errors.join('، ') }}
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="importModal = false">إلغاء</BaseButton>
        <BaseButton v-if="importPreview" :icon="Check" :loading="submitting" :disabled="!importPreview.valid.length" @click="submitImport">تأكيد الاستيراد ({{ importPreview?.valid.length || 0 }})</BaseButton>
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
import { Plus, Upload, Download, FileDown, Search, MessageCircle, Mail, Pencil, Trash2, Check, MapPin, Users, CalendarClock, ChevronDown, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { formatDate } from '@/utils/formatters'
import { exportGroupsPdf } from '@/utils/exportReport'
import { useDiscussionsStore } from '@/stores/discussions.store'
import { useTeamsStore } from '@/stores/teams.store'
import { useUsersStore } from '@/stores/users.store'

const APPTS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyForm = () => ({ project_id: '', place: '', date: '', time: '', committee: '', whatsapp: '', status: 'pending' })

export default {
  name: 'CommitteeAppointmentsPage',

  components: { Search, MessageCircle, Mail, Pencil, Trash2, MapPin, Users, CalendarClock, ChevronDown, ChevronRightIcon, ChevronLeftIcon, Plus, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, SkeletonLoader },

  data() {
    return {
      Plus, Upload, Download, FileDown, Check, Trash2,
      exportingExcel: false,
      exportingPdf: false,
      submitting: false,
      search: '',
      deptFilter: '',
      specFilter: '',
      openDiscussionIds: [],

      importModal: false,
      importPreview: null,
      importRows: [],

      addMemberModal: false,
      addMemberTarget: null,
      addMemberStudentId: '',
      unassignedOptions: [],

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
    ...mapState(useTeamsStore, ['teams', 'teamsForDisplay']),

    rows() {
      return this.discussions.map((d) => ({
        id: d.id,
        project_id: d.project_id,
        teamId: d.project?.team?.id ?? null,
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

    discussionMembers() {
      const teamIds = new Set(this.filteredDiscussions.map((d) => d.teamId))
      return this.teamsForDisplay.filter((t) => teamIds.has(t.id)).flatMap((t) => t.members)
    },
    allMembersWhats() {
      return this.discussionMembers.filter((m) => m.whats)
    },
    allMembersMail() {
      return this.discussionMembers.map((m) => m.mail).filter(Boolean)
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
    ...mapActions(useDiscussionsStore, ['fetchDiscussions', 'createDiscussion', 'updateDiscussion', 'deleteDiscussion', 'previewDiscussionImport', 'confirmDiscussionImport', 'exportDiscussionsExcel']),
    ...mapActions(useTeamsStore, ['fetchTeams', 'addTeamMember']),
    ...mapActions(useUsersStore, ['fetchUsers']),

    isDiscussionOpen(id) {
      return this.openDiscussionIds.includes(id)
    },
    toggleDiscussion(id) {
      this.openDiscussionIds = this.isDiscussionOpen(id) ? this.openDiscussionIds.filter((x) => x !== id) : [...this.openDiscussionIds, id]
    },
    membersFor(teamId) {
      return this.teamsForDisplay.find((t) => t.id === teamId)?.members || []
    },

    async openAddStudentToGroup(discussion) {
      this.addMemberTarget = discussion
      this.addMemberStudentId = ''
      this.addMemberModal = true
      try {
        const students = await this.fetchUsers('student', { unassigned: 1 })
        this.unassignedOptions = students.map((s) => ({ value: s.id, label: s.name }))
      } catch {
        this.$toast?.error('تعذّر تحميل الطلاب المتاحين')
      }
    },
    async submitAddMemberToGroup() {
      if (!this.addMemberStudentId || !this.addMemberTarget?.teamId) return
      this.submitting = true
      try {
        await this.addTeamMember(this.addMemberTarget.teamId, this.addMemberStudentId)
        this.addMemberModal = false
        this.$toast?.success('تم إضافة الطالب للفريق')
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة الطالب')
      } finally {
        this.submitting = false
      }
    },

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

    openImport() {
      this.importPreview = null
      this.importRows = []
      this.importModal = true
    },
    async onFileSelected(event) {
      const file = event.target.files?.[0]
      if (!file) return
      this.submitting = true
      try {
        const result = await this.previewDiscussionImport(file)
        this.importPreview = result
        this.importRows = result.valid
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر قراءة الملف')
      } finally {
        this.submitting = false
      }
    },
    async submitImport() {
      if (!this.importRows.length) return
      this.submitting = true
      try {
        const result = await this.confirmDiscussionImport(this.importRows)
        this.importModal = false
        this.$toast?.success(`تم تسجيل ${result.created?.length || this.importRows.length} موعد مناقشة`)
        await this.fetchDiscussions()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تأكيد الاستيراد')
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
    sendMail(mail) {
      if (!mail) return
      window.location.href = `mailto:${mail}`
    },
    sendWhatsAll() {
      if (!this.allMembersWhats.length) return
      if (!window.confirm(`سيتم فتح ${this.allMembersWhats.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      this.allMembersWhats.forEach((m, i) => setTimeout(() => this.sendWhats(m.whats), i * 300))
    },
    sendMailAll() {
      if (!this.allMembersMail.length) return
      const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(this.allMembersMail.join(','))}&su=${encodeURIComponent('تعميم بخصوص مواعيد المناقشات')}`
      window.open(url, '_blank')
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
