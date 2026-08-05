<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><ShieldCheck :size="18" /></span>
        <div>
          <h3 class="text-h3 font-bold text-text-900">إضافة وإدارة لجنة الإشراف</h3>
          <p class="text-caption text-text-600">إنشاء حسابات أعضاء لجنة الإشراف والتحكم في صلاحياتها</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <router-link :to="{ name: 'committee-deleted-members' }" class="inline-flex items-center gap-2 h-10 px-4 rounded-sm border border-border bg-surface text-text-600 text-caption font-bold hover:bg-border-soft hover:text-error transition-colors duration-fast">
          <Archive :size="15" /> المشرفون المحذوفون
        </router-link>
        <BaseButton :icon="UserPlus" @click="openForm">إضافة عضو جديد</BaseButton>
      </div>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex items-center justify-between gap-3 p-5 pb-4">
        <h4 class="text-h4 font-bold text-text-900">أعضاء لجنة الإشراف</h4>
        <BaseBadge>{{ members.length }} {{ members.length === 1 ? 'عضو' : 'أعضاء' }}</BaseBadge>
      </div>

      <DataTable
        :columns="columns" :rows="pageMembers" row-key="id" :primary-keys="['name', 'actions']"
        :meta="{ current_page: page, last_page: totalPages, total: members.length }"
        empty-title="لا يوجد أعضاء بعد"
        @page-change="page = $event"
      >
        <template #cell-name="{ row }">
          <span class="font-bold text-text-900">{{ row.name }}</span>
          <span v-if="row.restrictLevel !== 'none'" class="ms-1.5 text-label font-bold text-error bg-error-bg px-2 py-0.5 rounded-pill">{{ restrictLabel(row.restrictLevel) }}</span>
        </template>
        <template #cell-empId="{ value }"><span class="mono">{{ value }}</span></template>
        <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value }}</span></template>
        <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-pw="{ row }">
          <div class="flex items-center gap-2">
            <button type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="توليد كلمة سر" @click="generatePw(row)">
              <RefreshCw :size="13" />
            </button>
            <span class="mono text-caption tracking-wider min-w-[70px] inline-block">{{ row.pw ? (visiblePw.includes(row.id) ? row.pw : maskPw(row.pw)) : '—' }}</span>
            <button v-if="row.pw" type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="إظهار/إخفاء كلمة السر" @click="togglePw(row.id)">
              <Eye :size="13" />
            </button>
          </div>
        </template>
        <template #cell-addedAt="{ value }"><span class="text-caption text-text-600">{{ value }}</span></template>
        <template #cell-restrict="{ row }">
          <BaseSelect
            :model-value="row.restrictLevel"
            class="min-w-[170px]"
            :options="restrictOptions"
            @update:model-value="setRestrict(row, $event)"
          />
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row)"><Pencil :size="14" /></button>
            <button v-if="!row.isSelf" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row)"><Trash2 :size="14" /></button>
          </div>
        </template>
        <template #row-extra="{ row }">
          <div v-if="row.restrictLevel !== 'none' && row.restrictReason" class="flex items-start gap-2 px-5 py-3 bg-error-bg border-t border-error-border/50">
            <AlertTriangle :size="14" class="text-error shrink-0 mt-0.5" />
            <p class="text-caption text-error leading-relaxed"><span class="font-bold">سبب التقييد: </span>{{ row.restrictReason }}</p>
          </div>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="formOpen" title="إضافة عضو جديد">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="form.name" label="اسم الموظف" placeholder="مثال: د. نورة العتيبي" class="sm:col-span-2" />
        <BaseInput v-model="form.empId" label="الرقم الوظيفي" placeholder="مثال: COM2005" />
        <BaseInput v-model="form.mail" type="email" label="البريد الإلكتروني" placeholder="name@academy.edu.jo" />
        <BaseInput v-model="form.whats" label="رقم الواتساب" placeholder="مثال: 962790000000" />
        <div>
          <label class="block mb-2 text-label font-semibold text-text-700">كلمة السر</label>
          <div class="flex items-center gap-2">
            <button type="button" class="flex items-center gap-1.5 h-icon-btn px-3 rounded-sm border border-border text-text-600 hover:text-primary-700 hover:bg-primary-50 shrink-0 text-caption font-semibold transition-colors duration-fast" @click="form.pw = genPass()">
              <RefreshCw :size="14" /> توليد
            </button>
            <BaseInput v-model="form.pw" class="flex-1 mono" placeholder="اضغطي «توليد» لإنشاء كلمة سر" readonly />
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton block :icon="Send" @click="submit">إضافة وإرسال البيانات (واتس + بريد)</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="editModalOpen" title="تعديل بيانات العضو">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="editForm.name" label="اسم الموظف" class="sm:col-span-2" />
        <BaseInput v-model="editForm.empId" label="الرقم الوظيفي" />
        <BaseInput v-model="editForm.mail" type="email" label="البريد الإلكتروني" />
        <BaseInput v-model="editForm.whats" label="رقم الواتساب" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="saveEdit">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="restrictModal" title="سبب التقييد" :description="restrictTarget ? `سبب تقييد ‏${restrictTarget.name}` : ''" size="sm">
      <div class="flex flex-col gap-2">
        <label class="text-label font-semibold text-text-600">السبب</label>
        <textarea v-model.trim="restrictReason" rows="4" placeholder="اكتبي سبب التقييد..." class="w-full rounded-sm border border-border bg-bg text-body text-text-900 px-3 py-2.5 focus:border-primary-600 transition-colors duration-fast resize-y" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="restrictModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Lock" @click="confirmRestrict">تأكيد التقييد</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="deleteModal" title="سبب الحذف" :description="deleteTarget ? `حذف ‏${deleteTarget.name} من لجنة الإشراف` : ''" size="sm">
      <div class="flex flex-col gap-2">
        <label class="text-label font-semibold text-text-600">السبب</label>
        <textarea v-model.trim="deleteReason" rows="4" placeholder="اكتبي سبب الحذف..." class="w-full rounded-sm border border-border bg-bg text-body text-text-900 px-3 py-2.5 focus:border-primary-600 transition-colors duration-fast resize-y" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { ShieldCheck, UserPlus, RefreshCw, MessageCircle, Mail, Pencil, Trash2, Send, Check, Eye, Lock, AlertTriangle, Archive } from 'lucide-vue-next'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { genPass } from '@/utils/password'
import { useDeletedMembersStore } from '@/stores/deletedMembers.store'
import { mapActions } from 'pinia'

const PAGE_SIZE = 4
let seq = 100

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

function today() {
  return new Date().toLocaleDateString('en-CA')
}

const emptyForm = () => ({ name: '', empId: '', mail: '', whats: '', pw: '' })

const RESTRICT_OPTIONS = [
  { value: 'none', label: 'بدون تقييد' },
  { value: 'view', label: 'تقييد رؤية البيانات' },
  { value: 'control', label: 'تقييد التحكم' }
]
const RESTRICT_LABELS = Object.fromEntries(RESTRICT_OPTIONS.map((o) => [o.value, o.label]))

export default {
  name: 'CommitteeAddMemberPage',

  components: { ShieldCheck, UserPlus, RefreshCw, MessageCircle, Mail, Pencil, Trash2, Check, Eye, Lock, AlertTriangle, Archive, BaseInput, BaseSelect, BaseButton, BaseBadge, BaseModal, DataTable },

  data() {
    return {
      UserPlus, Send, Check, Trash2, Lock,
      pageSize: PAGE_SIZE,
      restrictOptions: RESTRICT_OPTIONS,
      formOpen: false,
      form: emptyForm(),
      page: 1,

      columns: [
        { key: 'name', label: 'الاسم' },
        { key: 'empId', label: 'الرقم الوظيفي' },
        { key: 'mail', label: 'البريد' },
        { key: 'whats', label: 'واتساب' },
        { key: 'pw', label: 'كلمة السر' },
        { key: 'addedAt', label: 'تاريخ الإضافة' },
        { key: 'restrict', label: 'التقييد' },
        { key: 'actions', label: 'إجراءات' }
      ],
      visiblePw: [],
      editModalOpen: false,
      editTargetId: null,
      editForm: emptyForm(),
      restrictModal: false,
      restrictTarget: null,
      restrictPendingLevel: '',
      restrictReason: '',
      deleteModal: false,
      deleteTarget: null,
      deleteReason: '',

      /* بيانات ثابتة — بانتظار GET/POST /committee/members?role=committee */
      members: [
        { id: 1, name: 'لجنة الإشراف', empId: 'COM2000', mail: 'admin@mashroui.local', whats: '', pw: '', addedAt: '2026-07-18', restrictLevel: 'none', isSelf: true },
        { id: 2, name: 'د. طلال الحربي', empId: 'COM2001', mail: 'committee2@academy.edu.jo', whats: '', pw: '', addedAt: '2026-07-18', restrictLevel: 'none', isSelf: false },
        { id: 3, name: 'د. حسن الدوسري', empId: 'COM2002', mail: 'committee3@academy.edu.jo', whats: '', pw: '', addedAt: '2026-07-18', restrictLevel: 'none', isSelf: false },
        { id: 4, name: 'د. فاطمة الجهني', empId: 'COM2003', mail: 'committee4@academy.edu.jo', whats: '', pw: '', addedAt: '2026-07-18', restrictLevel: 'none', isSelf: false },
        { id: 5, name: 'د. سارة الحربي', empId: 'COM2004', mail: 'committee5@academy.edu.jo', whats: '', pw: '', addedAt: '2026-07-18', restrictLevel: 'none', isSelf: false }
      ]
    }
  },

  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.members.length / PAGE_SIZE))
    },
    pageMembers() {
      const start = (this.page - 1) * PAGE_SIZE
      return this.members.slice(start, start + PAGE_SIZE)
    }
  },

  methods: {
    genPass,
    ...mapActions(useDeletedMembersStore, ['deleteCommitteeMember']),

    openForm() {
      this.form = emptyForm()
      this.formOpen = true
    },

    credentialsMessage() {
      return `مرحبًا ${this.form.name || ''}،\nتم إنشاء حسابك في لجنة الإشراف — منصة مسار.\nالبريد: ${this.form.mail}\nكلمة المرور: ${this.form.pw}`
    },

    submit() {
      if (!this.form.name || !this.form.empId || !this.form.mail) {
        this.$toast?.error('يرجى تعبئة اسم الموظف، الرقم الوظيفي والبريد الإلكتروني على الأقل')
        return
      }
      if (!this.form.pw) {
        this.$toast?.error('يرجى توليد كلمة السر قبل الإضافة')
        return
      }
      if (this.members.some((m) => m.mail === this.form.mail)) {
        this.$toast?.error('هذا البريد مضاف مسبقًا')
        return
      }
      seq += 1
      this.members.push({ id: seq, name: this.form.name, empId: this.form.empId, mail: this.form.mail, whats: this.form.whats, pw: this.form.pw, addedAt: today(), restrictLevel: 'none', isSelf: false })

      if (this.form.whats) {
        const num = digitsOnly(this.form.whats)
        const full = num.startsWith('962') || num.startsWith('970') ? num : `962${num}`
        window.open(`https://wa.me/${full}?text=${encodeURIComponent(this.credentialsMessage())}`, '_blank')
      }
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(this.form.mail)}&su=${encodeURIComponent('بيانات حساب لجنة الإشراف')}&body=${encodeURIComponent(this.credentialsMessage())}`, '_blank')

      this.formOpen = false
      this.$toast?.success('تمت إضافة العضو وإرسال بياناته')
    },

    restrictLabel(level) {
      return RESTRICT_LABELS[level] || level
    },
    setRestrict(row, value) {
      if (value === 'none') {
        row.restrictLevel = 'none'
        row.restrictReason = ''
        return
      }
      this.restrictTarget = row
      this.restrictPendingLevel = value
      this.restrictReason = ''
      this.restrictModal = true
    },
    confirmRestrict() {
      if (!this.restrictReason) {
        this.$toast?.error('يرجى كتابة سبب التقييد')
        return
      }
      this.restrictTarget.restrictLevel = this.restrictPendingLevel
      this.restrictTarget.restrictReason = this.restrictReason
      this.restrictModal = false
      this.$toast?.success('تم تقييد العضو')
    },

    maskPw(pw) {
      return '•'.repeat(pw.length)
    },
    togglePw(id) {
      this.visiblePw = this.visiblePw.includes(id) ? this.visiblePw.filter((x) => x !== id) : [...this.visiblePw, id]
    },
    generatePw(row) {
      row.pw = genPass()
      if (!this.visiblePw.includes(row.id)) this.visiblePw.push(row.id)
    },

    openEdit(row) {
      this.editTargetId = row.id
      this.editForm = { name: row.name, empId: row.empId, mail: row.mail, whats: row.whats, pw: row.pw }
      this.editModalOpen = true
    },
    saveEdit() {
      if (!this.editForm.name || !this.editForm.empId || !this.editForm.mail) {
        this.$toast?.error('يرجى تعبئة اسم الموظف، الرقم الوظيفي والبريد الإلكتروني على الأقل')
        return
      }
      const member = this.members.find((m) => m.id === this.editTargetId)
      if (member) {
        member.name = this.editForm.name
        member.empId = this.editForm.empId
        member.mail = this.editForm.mail
        member.whats = this.editForm.whats
      }
      this.editModalOpen = false
      this.$toast?.success('تم حفظ التعديلات')
    },

    openDelete(row) {
      this.deleteTarget = row
      this.deleteReason = ''
      this.deleteModal = true
    },
    confirmDelete() {
      if (!this.deleteReason) {
        this.$toast?.error('يرجى كتابة سبب الحذف')
        return
      }
      this.deleteCommitteeMember(this.deleteTarget, this.deleteReason)
      this.members = this.members.filter((m) => m.id !== this.deleteTarget.id)
      this.deleteModal = false
      this.$toast?.success('تم حذف العضو')
    },

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('962') || num.startsWith('970') ? num : `962${num}`
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
