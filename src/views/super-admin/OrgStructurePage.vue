<template>
  <!-- الأقسام والتخصصات والفصول الدراسية (الإدارة العامة):
       أرقام سريعة ← الأقسام كبطاقات وداخل كل قسم تخصصاته (بحث + فلتر الدرجة) | الفصول الدراسية والحالي مميّز -->
  <div class="dash">
    <header class="dash-head">
      <div>
        <h2 class="dash-title">الأقسام والتخصصات والفصول الدراسية</h2>
        <p class="os-sub">الهيكل الأكاديمي الذي تُبنى عليه المجموعات والمشاريع ولجان الإشراف</p>
      </div>
    </header>

    <div class="dp-kpis os-kpis">
      <div class="dp-kpi"><b>{{ departments.length }}</b><span>الأقسام</span></div>
      <div class="dp-kpi"><b>{{ specializations.length }}</b><span>التخصصات</span></div>
      <div class="dp-kpi"><b>{{ countByDegree.diploma }} · {{ countByDegree.bachelor }}</b><span>دبلوم · بكالوريوس</span></div>
      <div class="dp-kpi is-good"><b class="os-kpi-term">{{ currentTerm?.name || '—' }}</b><span>الفصل الحالي</span></div>
    </div>

    <div class="os-grid">
      <!-- الأقسام والتخصصات -->
      <section class="dash-card os-card">
        <div class="dash-card-head">
          <h3>الأقسام والتخصصات</h3>
          <button type="button" class="pbtn is-green" @click="openDepartmentForm()"><Plus :size="16" /> إضافة قسم</button>
        </div>

        <div class="gr-filters" aria-label="تصفية التخصصات">
          <label class="gr-search">
            <Search :size="16" />
            <input v-model.trim="q" type="search" placeholder="بحث باسم القسم أو التخصص…">
          </label>
          <nav class="hm-tabs" aria-label="الدرجة العلمية">
            <button v-for="d in degreeTabs" :key="d.value" type="button" :class="degree === d.value && 'is-active'" @click="degree = d.value">{{ d.label }}</button>
          </nav>
        </div>

        <SkeletonLoader v-if="departmentsLoading && !departments.length" variant="cards" />
        <EmptyState v-else-if="!departments.length" title="لا توجد أقسام بعد" description="ابدأ بإضافة قسم، ثم أضف تخصصاته." />
        <EmptyState v-else-if="!visibleDepartments.length" title="لا نتائج" description="لا يوجد قسم أو تخصص مطابق للبحث." />

        <div v-else class="os-depts">
          <article v-for="d in visibleDepartments" :key="d.id" class="os-dept">
            <header class="os-dept-head">
              <span class="os-dept-ic" aria-hidden="true"><Building2 :size="18" /></span>
              <div class="os-dept-title">
                <h4>{{ d.name }}</h4>
                <small>{{ d.specs.length }} تخصص<template v-if="d.total !== d.specs.length"> من {{ d.total }}</template></small>
              </div>
              <div class="os-acts">
                <button type="button" class="os-act" title="إضافة تخصص لهذا القسم" @click="openSpecializationForm(null, d.id)"><Plus :size="15" /></button>
                <button type="button" class="os-act" title="تعديل القسم" @click="openDepartmentForm(d)"><Pencil :size="14" /></button>
                <button type="button" class="os-act is-danger" :title="d.total ? 'احذف تخصصات القسم أولًا' : 'حذف القسم'" :disabled="!!d.total" @click="openDelete('department', d)"><Trash2 :size="14" /></button>
              </div>
            </header>

            <ul v-if="d.specs.length" class="os-specs">
              <li v-for="s in d.specs" :key="s.id">
                <span class="os-spec-name">{{ s.name }}</span>
                <span :class="['spk-degree', `is-${s.degree}`]">{{ DEGREE_LABELS[s.degree] || s.degree }}</span>
                <div class="os-acts">
                  <button type="button" class="os-act" title="تعديل التخصص" @click="openSpecializationForm(s)"><Pencil :size="14" /></button>
                  <button type="button" class="os-act is-danger" title="حذف التخصص" @click="openDelete('specialization', s)"><Trash2 :size="14" /></button>
                </div>
              </li>
            </ul>
            <button v-else-if="!d.total" type="button" class="os-add-spec" @click="openSpecializationForm(null, d.id)"><Plus :size="15" /> أضف أول تخصص لهذا القسم</button>
          </article>
        </div>
      </section>

      <!-- الفصول الدراسية -->
      <section class="dash-card os-card">
        <div class="dash-card-head">
          <h3>الفصول الدراسية</h3>
          <button type="button" class="pbtn is-outline" @click="openTermForm()"><Plus :size="16" /> فصل جديد</button>
        </div>

        <SkeletonLoader v-if="semestersLoading && !semesters.length" :rows="3" height="56px" />
        <EmptyState v-else-if="!semesters.length" title="لا توجد فصول دراسية" description="أضف الفصل الدراسي الحالي لتبدأ المجموعات العمل عليه." />
        <ul v-else class="os-terms">
          <li v-for="t in sortedTerms" :key="t.id" :class="['os-term', t.is_current && 'is-current']">
            <span class="os-term-ic" aria-hidden="true"><CalendarDays :size="18" /></span>
            <div class="os-term-title">
              <b>{{ t.name }}</b>
              <span v-if="t.is_current" class="os-current"><Star :size="12" /> الفصل الحالي</span>
              <button v-else type="button" class="os-make" @click="setCurrentTerm(t)">تعيين كالفصل الحالي</button>
            </div>
            <div class="os-acts">
              <button type="button" class="os-act" title="تعديل" @click="openTermForm(t)"><Pencil :size="14" /></button>
              <button type="button" class="os-act is-danger" title="حذف" @click="openDelete('term', t)"><Trash2 :size="14" /></button>
            </div>
          </li>
        </ul>
        <p class="os-note">الفصل الحالي هو الذي تُعرض بياناته افتراضيًا في كل اللوحات، ويمكن لكل مستخدم التنقّل بين الفصول من الشريط العلوي.</p>
      </section>
    </div>

    <!-- إضافة/تعديل قسم -->
    <BaseModal v-model="departmentModalOpen" :title="departmentEditId ? 'تعديل القسم' : 'إضافة قسم جديد'" size="sm">
      <BaseInput v-model="departmentForm.name" label="اسم القسم" placeholder="مثال: قسم البرمجيات" required @keydown.enter="submitDepartment" />
      <template #footer>
        <BaseButton variant="ghost" @click="departmentModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" :disabled="!departmentForm.name.trim()" @click="submitDepartment">{{ departmentEditId ? 'حفظ التعديلات' : 'إضافة القسم' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة/تعديل تخصص -->
    <BaseModal v-model="specializationModalOpen" :title="specializationEditId ? 'تعديل التخصص' : 'إضافة تخصص جديد'" size="sm">
      <div class="flex flex-col gap-4">
        <BaseSelect v-model="specializationForm.department_id" label="القسم" placeholder="اختر القسم" :options="departmentOptions" required />
        <BaseInput v-model="specializationForm.name" label="اسم التخصص" placeholder="مثال: تطوير الويب" required />
        <div>
          <span class="os-field-label">الدرجة العلمية</span>
          <div class="mf-roles os-degrees" role="radiogroup" aria-label="الدرجة العلمية">
            <button v-for="o in degreeOptions" :key="o.value" type="button" role="radio" :aria-checked="specializationForm.degree === o.value" :class="['mf-role', specializationForm.degree === o.value && 'is-on']" @click="specializationForm.degree = o.value">
              <GraduationCap :size="20" /><b>{{ o.label }}</b>
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="specializationModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" :disabled="!specializationForm.department_id || !specializationForm.name.trim()" @click="submitSpecialization">{{ specializationEditId ? 'حفظ التعديلات' : 'إضافة التخصص' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة/تعديل فصل دراسي -->
    <BaseModal v-model="termModalOpen" :title="termEditId ? 'تعديل الفصل الدراسي' : 'إضافة فصل دراسي جديد'" size="sm">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="termForm.name" label="اسم الفصل" placeholder="مثال: الفصل الأول 2026/2027" required />
        <label :class="['os-switch', termForm.is_current && 'is-on']">
          <input v-model="termForm.is_current" type="checkbox">
          <span class="os-switch-ui" aria-hidden="true" />
          <span><b>اعتماده كالفصل الدراسي الحالي</b><small>يصبح الفصل الافتراضي في كل اللوحات</small></span>
        </label>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="termModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" :disabled="!termForm.name.trim()" @click="submitTerm">{{ termEditId ? 'حفظ التعديلات' : 'إضافة الفصل' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد الحذف -->
    <BaseModal v-model="deleteModalOpen" title="تأكيد الحذف" size="sm">
      <p v-if="deleteTarget" class="palert is-error"><span>سيُحذف <b>«{{ deleteTarget.name }}»</b> نهائيًا، ولا يمكن التراجع عن هذا الإجراء.</span></p>
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModalOpen = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
<script>
import { mapState, mapActions } from 'pinia'
import { Building2, Plus, Pencil, Trash2, Star, Search, CalendarDays, GraduationCap, Check } from 'lucide-vue-next'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useUiStore } from '@/stores/ui.store'
import { DEGREE_LABELS, DEGREE_OPTIONS } from '@/stores/landing.store'

const emptyDepartmentForm = () => ({ name: '' })
const emptySpecializationForm = () => ({ department_id: '', name: '', degree: 'bachelor' })
const emptyTermForm = () => ({ name: '', is_current: false })

export default {
  name: 'SuperAdminOrgStructurePage',

  components: { Building2, Plus, Pencil, Star, Trash2, Search, CalendarDays, GraduationCap, BaseInput, BaseSelect, BaseButton, BaseModal, SkeletonLoader, EmptyState },

  data() {
    return {
      Trash2, Check, DEGREE_LABELS,
      submitting: false,
      q: '',
      degree: '',
      degreeTabs: [{ value: '', label: 'الكل' }, ...DEGREE_OPTIONS],
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

    /** الأقسام مع تخصصاتها بعد البحث وفلتر الدرجة — القسم يظهر إذا طابق اسمه أو أحد تخصصاته */
    visibleDepartments() {
      const q = this.q
      return this.departments
        .map((d) => {
          const all = this.specializations.filter((s) => s.department_id === d.id)
          const nameHit = !q || d.name.includes(q)
          const specs = all.filter((s) => (!this.degree || s.degree === this.degree) && (nameHit || s.name.includes(q)))
          return { ...d, total: all.length, specs, show: (nameHit && (!this.degree || specs.length || !all.length)) || specs.length }
        })
        .filter((d) => d.show)
    },
    countByDegree() {
      return {
        diploma: this.specializations.filter((s) => s.degree === 'diploma').length,
        bachelor: this.specializations.filter((s) => s.degree === 'bachelor').length
      }
    },
    currentTerm() {
      return this.semesters.find((t) => t.is_current)
    },
    /** الحالي أولًا ثم الأحدث */
    sortedTerms() {
      return [...this.semesters].sort((a, b) => (b.is_current - a.is_current) || (b.id - a.id))
    },

    departmentOptions() {
      return this.departments.map((d) => ({ value: d.id, label: d.name }))
    },

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

    openSpecializationForm(row = null, departmentId = null) {
      this.specializationEditId = row?.id || null
      this.specializationForm = row
        ? { department_id: row.department_id, name: row.name, degree: row.degree }
        : { ...emptySpecializationForm(), department_id: departmentId || this.departments[0]?.id || '' }
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
