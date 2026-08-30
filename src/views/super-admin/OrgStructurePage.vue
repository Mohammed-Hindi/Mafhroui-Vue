<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center gap-3">
      <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><Building2 :size="18" /></span>
      <div>
        <h3 class="text-h3 font-bold text-text-900">الأقسام والتخصصات والفصول الدراسية</h3>
        <p class="text-caption text-text-600">الإعدادات الأساسية للمنصة — يعتمد عليها تصنيف الفرق والمشاريع، والفصل الدراسي الحالي</p>
      </div>
    </div>

    <!-- الأقسام -->
    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div class="flex items-center gap-2">
          <h4 class="text-h4 font-bold text-text-900">الأقسام</h4>
          <BaseBadge>{{ departments.length }}</BaseBadge>
        </div>
        <BaseButton :icon="Plus" size="sm" @click="openDepartmentForm()">إضافة قسم</BaseButton>
      </div>

      <DataTable
        :columns="departmentColumns" :rows="departmentRows" row-key="id" :primary-keys="['name', 'actions']"
        :loading="departmentsLoading" empty-title="لا توجد أقسام بعد"
      >
        <template #cell-name="{ row }"><span class="font-bold text-text-900">{{ row.name }}</span></template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openDepartmentForm(row)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete('department', row)"><Trash2 :size="14" /></button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- التخصصات -->
    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div class="flex items-center gap-2">
          <h4 class="text-h4 font-bold text-text-900">التخصصات</h4>
          <BaseBadge>{{ specializations.length }}</BaseBadge>
        </div>
        <BaseButton :icon="Plus" size="sm" :disabled="!departments.length" @click="openSpecializationForm()">إضافة تخصص</BaseButton>
      </div>

      <EmptyState v-if="!departments.length && !departmentsLoading" title="أضيفي قسمًا أولًا" description="لازم يكون في قسم واحد على الأقل قبل إضافة تخصصات." />
      <DataTable
        v-else
        :columns="specializationColumns" :rows="specializationRows" row-key="id" :primary-keys="['name', 'actions']"
        :loading="specializationsLoading" empty-title="لا توجد تخصصات بعد"
      >
        <template #cell-name="{ row }"><span class="font-bold text-text-900">{{ row.name }}</span></template>
        <template #cell-degree="{ row }"><BaseBadge variant="info">{{ row.degreeLabel }}</BaseBadge></template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openSpecializationForm(row)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete('specialization', row)"><Trash2 :size="14" /></button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- الفصول الدراسية -->
    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div class="flex items-center gap-2">
          <h4 class="text-h4 font-bold text-text-900">الفصول الدراسية</h4>
          <BaseBadge>{{ semesters.length }}</BaseBadge>
        </div>
        <BaseButton :icon="Plus" size="sm" @click="openTermForm()">إضافة فصل دراسي</BaseButton>
      </div>

      <DataTable
        :columns="termColumns" :rows="termRows" row-key="id" :primary-keys="['name', 'actions']"
        :loading="semestersLoading" empty-title="لا توجد فصول دراسية بعد"
      >
        <template #cell-name="{ row }"><span class="font-bold text-text-900">{{ row.name }}</span></template>
        <template #cell-status="{ row }">
          <BaseBadge v-if="row.is_current" variant="success">الفصل الحالي</BaseBadge>
          <button v-else type="button" class="inline-flex items-center gap-1.5 text-caption font-bold text-primary-600 hover:underline" @click="setCurrentTerm(row)">
            <Star :size="13" /> تعيين كالفصل الحالي
          </button>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openTermForm(row)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete('term', row)"><Trash2 :size="14" /></button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- إضافة/تعديل قسم -->
    <BaseModal v-model="departmentModalOpen" :title="departmentEditId ? 'تعديل القسم' : 'إضافة قسم جديد'" size="sm">
      <BaseInput v-model="departmentForm.name" label="اسم القسم" placeholder="مثال: هندسة الحاسوب" />
      <template #footer>
        <BaseButton variant="ghost" @click="departmentModalOpen = false">إلغاء</BaseButton>
        <BaseButton :loading="submitting" @click="submitDepartment">حفظ</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة/تعديل تخصص -->
    <BaseModal v-model="specializationModalOpen" :title="specializationEditId ? 'تعديل التخصص' : 'إضافة تخصص جديد'" size="sm">
      <div class="flex flex-col gap-4">
        <BaseSelect v-model="specializationForm.department_id" label="القسم" placeholder="اختاري القسم" :options="departmentOptions" />
        <BaseInput v-model="specializationForm.name" label="اسم التخصص" placeholder="مثال: هندسة البرمجيات" />
        <BaseSelect v-model="specializationForm.degree" label="الدرجة العلمية" :options="degreeOptions" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="specializationModalOpen = false">إلغاء</BaseButton>
        <BaseButton :loading="submitting" @click="submitSpecialization">حفظ</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة/تعديل فصل دراسي -->
    <BaseModal v-model="termModalOpen" :title="termEditId ? 'تعديل الفصل الدراسي' : 'إضافة فصل دراسي جديد'" size="sm">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="termForm.name" label="اسم الفصل" placeholder="مثال: الفصل الأول 2026/2027" />
        <label class="flex items-center gap-2 text-body-sm font-bold text-text-900 cursor-pointer">
          <input v-model="termForm.is_current" type="checkbox">
          اعتماده كالفصل الدراسي الحالي
        </label>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="termModalOpen = false">إلغاء</BaseButton>
        <BaseButton :loading="submitting" @click="submitTerm">حفظ</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد الحذف -->
    <BaseModal v-model="deleteModalOpen" title="تأكيد الحذف" :description="deleteTarget ? `سيُحذف '${deleteTarget.name}' نهائيًا. هذا الإجراء لا يمكن التراجع عنه.` : ''" size="sm">
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModalOpen = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Building2, Plus, Pencil, Trash2, Star } from 'lucide-vue-next'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useUiStore } from '@/stores/ui.store'
import { DEGREE_LABELS, DEGREE_OPTIONS } from '@/stores/landing.store'

const emptyDepartmentForm = () => ({ name: '' })
const emptySpecializationForm = () => ({ department_id: '', name: '', degree: 'bachelor' })
const emptyTermForm = () => ({ name: '', is_current: false })

export default {
  name: 'SuperAdminOrgStructurePage',

  components: { Building2, Pencil, Star, Trash2, BaseInput, BaseSelect, BaseButton, BaseBadge, BaseModal, DataTable, EmptyState },

  data() {
    return {
      Plus, Trash2,
      submitting: false,

      departmentColumns: [
        { key: 'name', label: 'اسم القسم' },
        { key: 'actions', label: 'إجراءات', className: 'text-end' }
      ],
      specializationColumns: [
        { key: 'name', label: 'اسم التخصص' },
        { key: 'department', label: 'القسم' },
        { key: 'degree', label: 'الدرجة العلمية' },
        { key: 'actions', label: 'إجراءات', className: 'text-end' }
      ],
      termColumns: [
        { key: 'name', label: 'اسم الفصل' },
        { key: 'status', label: 'الحالة' },
        { key: 'actions', label: 'إجراءات', className: 'text-end' }
      ],
      degreeOptions: DEGREE_OPTIONS,

      departmentModalOpen: false,
      departmentEditId: null,
      departmentForm: emptyDepartmentForm(),

      specializationModalOpen: false,
      specializationEditId: null,
      specializationForm: emptySpecializationForm(),

      termModalOpen: false,
      termEditId: null,
      termForm: emptyTermForm(),

      deleteModalOpen: false,
      deleteTarget: null
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['departments', 'departmentsLoading', 'specializations', 'specializationsLoading']),
    ...mapState(useUiStore, ['semesters', 'semestersLoading']),

    departmentRows() {
      return this.departments
    },

    departmentOptions() {
      return this.departments.map((d) => ({ value: d.id, label: d.name }))
    },

    specializationRows() {
      return this.specializations.map((s) => ({
        id: s.id,
        name: s.name,
        department_id: s.department_id,
        department: s.department?.name || 'غير محدد',
        degree: s.degree,
        degreeLabel: DEGREE_LABELS[s.degree] || s.degree
      }))
    },

    termRows() {
      return this.semesters
    }
  },

  async created() {
    await Promise.all([this.fetchDepartments(), this.fetchSpecializations(), this.fetchSemesters()])
  },

  methods: {
    ...mapActions(useTeamsStore, [
      'fetchDepartments', 'createDepartment', 'updateDepartment', 'deleteDepartment',
      'fetchSpecializations', 'createSpecialization', 'updateSpecialization', 'deleteSpecialization'
    ]),
    ...mapActions(useUiStore, ['fetchSemesters', 'createAcademicTerm', 'updateAcademicTerm', 'deleteAcademicTerm']),

    openDepartmentForm(row = null) {
      this.departmentEditId = row?.id || null
      this.departmentForm = row ? { name: row.name } : emptyDepartmentForm()
      this.departmentModalOpen = true
    },
    async submitDepartment() {
      if (!this.departmentForm.name.trim()) {
        this.$toast?.error('يرجى إدخال اسم القسم')
        return
      }
      this.submitting = true
      try {
        if (this.departmentEditId) {
          await this.updateDepartment(this.departmentEditId, this.departmentForm)
          this.$toast?.success('تم حفظ التعديلات')
        } else {
          await this.createDepartment(this.departmentForm)
          this.$toast?.success('تمت إضافة القسم')
        }
        this.departmentModalOpen = false
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ القسم')
      } finally {
        this.submitting = false
      }
    },

    openSpecializationForm(row = null) {
      this.specializationEditId = row?.id || null
      this.specializationForm = row
        ? { department_id: row.department_id, name: row.name, degree: row.degree }
        : { ...emptySpecializationForm(), department_id: this.departments[0]?.id || '' }
      this.specializationModalOpen = true
    },
    async submitSpecialization() {
      if (!this.specializationForm.department_id || !this.specializationForm.name.trim()) {
        this.$toast?.error('يرجى اختيار القسم وإدخال اسم التخصص')
        return
      }
      this.submitting = true
      try {
        if (this.specializationEditId) {
          await this.updateSpecialization(this.specializationEditId, this.specializationForm)
          this.$toast?.success('تم حفظ التعديلات')
        } else {
          await this.createSpecialization(this.specializationForm)
          this.$toast?.success('تمت إضافة التخصص')
        }
        this.specializationModalOpen = false
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التخصص')
      } finally {
        this.submitting = false
      }
    },

    openTermForm(row = null) {
      this.termEditId = row?.id || null
      this.termForm = row ? { name: row.name, is_current: !!row.is_current } : emptyTermForm()
      this.termModalOpen = true
    },
    async submitTerm() {
      if (!this.termForm.name.trim()) {
        this.$toast?.error('يرجى إدخال اسم الفصل الدراسي')
        return
      }
      this.submitting = true
      try {
        if (this.termEditId) {
          await this.updateAcademicTerm(this.termEditId, this.termForm)
          this.$toast?.success('تم حفظ التعديلات')
        } else {
          await this.createAcademicTerm(this.termForm)
          this.$toast?.success('تمت إضافة الفصل الدراسي')
        }
        this.termModalOpen = false
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ الفصل الدراسي')
      } finally {
        this.submitting = false
      }
    },
    async setCurrentTerm(row) {
      try {
        await this.updateAcademicTerm(row.id, { name: row.name, is_current: true })
        this.$toast?.success(`تم اعتماد "${row.name}" كالفصل الحالي`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث الفصل الحالي')
      }
    },

    openDelete(type, row) {
      this.deleteTarget = { type, id: row.id, name: row.name }
      this.deleteModalOpen = true
    },
    async confirmDelete() {
      this.submitting = true
      try {
        if (this.deleteTarget.type === 'department') await this.deleteDepartment(this.deleteTarget.id)
        else if (this.deleteTarget.type === 'specialization') await this.deleteSpecialization(this.deleteTarget.id)
        else await this.deleteAcademicTerm(this.deleteTarget.id)
        this.$toast?.success('تم الحذف')
        this.deleteModalOpen = false
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر الحذف')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>
