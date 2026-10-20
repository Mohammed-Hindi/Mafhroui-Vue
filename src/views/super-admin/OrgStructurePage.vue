<template>
  <!-- الأقسام والتخصصات والفصول الدراسية (الإدارة العامة) — ثيم مسطّح:
       الفصل الحالي أولًا (الأهم) ← أرقام سريعة ← الأقسام وتخصصاتها ← كل الفصول -->
  <div class="st">
    <!-- 1) الفصل الحالي (الأهم — كل اللوحات تعتمد عليه) -->
    <section :class="['st-term-banner', currentTerm ? 'is-set' : 'is-unset']">
      <span class="st-term-ic" aria-hidden="true"><CalendarDays :size="20" /></span>
      <div class="st-term-info">
        <small>الفصل الدراسي الحالي</small>
        <b v-if="currentTerm">{{ currentTerm.name }}</b>
        <b v-else class="st-term-none">لا يوجد فصل حالي معتمد — اعتمد فصلًا لتبدأ المجموعات</b>
      </div>
      <BaseButton :icon="Plus" @click="openTermForm()">فصل جديد</BaseButton>
    </section>

    <!-- 2) أرقام سريعة -->
    <div class="st-stats">
      <div class="st-stat"><b>{{ departments.length }}</b><span>الأقسام</span></div>
      <div class="st-stat"><b>{{ specializations.length }}</b><span>التخصصات</span></div>
      <div class="st-stat"><b>{{ countByDegree.bachelor }}</b><span>بكالوريوس</span></div>
      <div class="st-stat"><b>{{ countByDegree.diploma }}</b><span>دبلوم</span></div>
    </div>

    <!-- 3) التخطيط الرئيسي -->
    <div class="st-grid">
      <!-- الأقسام والتخصصات (الأساس) -->
      <section class="st-card">
        <header class="st-card-head">
          <h3>الأقسام والتخصصات</h3>
          <BaseButton :icon="Plus" @click="openDepartmentForm()">إضافة قسم</BaseButton>
        </header>

        <div class="st-toolbar" aria-label="تصفية التخصصات">
          <label class="st-search">
            <Search :size="16" />
            <input v-model.trim="q" type="search" placeholder="بحث باسم القسم أو التخصص…">
          </label>
          <nav class="st-tabs" aria-label="الدرجة العلمية">
            <button v-for="d in degreeTabs" :key="d.value" type="button" :class="degree === d.value && 'is-active'" @click="degree = d.value">{{ d.label }}</button>
          </nav>
        </div>

        <SkeletonLoader v-if="departmentsLoading && !departments.length" variant="cards" />
        <EmptyState v-else-if="!departments.length" :icon="Building2" title="لا توجد أقسام بعد" description="ابدأ بإضافة قسم، ثم أضف تخصصاته." />
        <EmptyState v-else-if="!visibleDepartments.length" :icon="Search" title="لا نتائج مطابقة" />

        <div v-else class="st-depts">
          <article v-for="d in visibleDepartments" :key="d.id" class="st-dept">
            <header class="st-dept-head">
              <span class="st-dept-ic" aria-hidden="true"><Building2 :size="18" /></span>
              <div class="st-dept-title">
                <h4>{{ d.name }}</h4>
                <small>{{ d.specs.length }} تخصص<template v-if="d.total !== d.specs.length"> من {{ d.total }}</template></small>
              </div>
              <div class="st-acts">
                <button type="button" class="st-act" title="إضافة تخصص لهذا القسم" @click="openSpecializationForm(null, d.id)"><Plus :size="15" /></button>
                <button type="button" class="st-act" title="تعديل القسم" @click="openDepartmentForm(d)"><Pencil :size="14" /></button>
                <button type="button" class="st-act is-danger" :title="d.total ? 'احذف تخصصات القسم أولًا' : 'حذف القسم'" :disabled="!!d.total" @click="openDelete('department', d)"><Trash2 :size="14" /></button>
              </div>
            </header>

            <ul v-if="d.specs.length" class="st-specs">
              <li v-for="s in d.specs" :key="s.id" class="st-spec">
                <span class="st-spec-name">{{ s.name }}</span>
                <span :class="['spk-degree', `is-${s.degree}`]">{{ DEGREE_LABELS[s.degree] || s.degree }}</span>
                <div class="st-acts">
                  <button type="button" class="st-act" title="تعديل التخصص" @click="openSpecializationForm(s)"><Pencil :size="14" /></button>
                  <button type="button" class="st-act is-danger" title="حذف التخصص" @click="openDelete('specialization', s)"><Trash2 :size="14" /></button>
                </div>
              </li>
            </ul>
            <button v-else-if="!d.total" type="button" class="st-add-spec" @click="openSpecializationForm(null, d.id)"><Plus :size="15" /> أضف أول تخصص لهذا القسم</button>
          </article>
        </div>
      </section>

      <!-- كل الفصول الدراسية (ثانوي) -->
      <section class="st-card">
        <header class="st-card-head">
          <h3>كل الفصول الدراسية</h3>
        </header>

        <SkeletonLoader v-if="semestersLoading && !semesters.length" :rows="3" height="56px" />
        <EmptyState v-else-if="!semesters.length" :icon="CalendarDays" title="لا توجد فصول دراسية" description="أضف الفصل الحالي لتبدأ المجموعات العمل عليه." />
        <ul v-else class="st-terms">
          <li v-for="t in sortedTerms" :key="t.id" :class="['st-term', t.is_current && 'is-current']">
            <span class="st-term-dot" aria-hidden="true" />
            <div class="st-term-body">
              <b>{{ t.name }}</b>
              <span v-if="t.is_current" class="st-term-badge"><Star :size="11" /> الحالي</span>
              <button v-else type="button" class="st-term-make" @click="setCurrentTerm(t)">تعيين كالحالي</button>
            </div>
            <div class="st-acts">
              <button type="button" class="st-act" title="تعديل" @click="openTermForm(t)"><Pencil :size="14" /></button>
              <button type="button" class="st-act is-danger" title="حذف" @click="openDelete('term', t)"><Trash2 :size="14" /></button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- إضافة/تعديل قسم -->
    <BaseModal v-model="departmentModalOpen" :title="departmentEditId ? 'تعديل القسم' : 'إضافة قسم جديد'" :size="departmentEditId ? 'sm' : 'md'">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="departmentForm.name" label="اسم القسم" placeholder="مثال: قسم البرمجيات" required @keydown.enter="submitDepartment" />
        <div v-if="!departmentEditId" class="st-new-specs">
          <span class="st-field-label">تخصصات القسم <small>(اختياري — يمكن إضافتها لاحقًا)</small></span>
          <ul v-if="departmentForm.specs.length" class="st-new-list">
            <li v-for="(s, i) in departmentForm.specs" :key="i" class="st-new-row">
              <span class="st-new-no">{{ i + 1 }}</span>
              <input v-model.trim="s.name" type="text" class="st-new-input" maxlength="150" :aria-label="`اسم التخصص ${i + 1}`" placeholder="اسم التخصص">
              <span class="st-new-deg" role="radiogroup" aria-label="الدرجة العلمية">
                <button v-for="o in degreeOptions" :key="o.value" type="button" role="radio" :aria-checked="s.degree === o.value" :class="s.degree === o.value && 'is-on'" @click="s.degree = o.value">{{ o.label }}</button>
              </span>
              <button type="button" class="st-act is-danger" title="إزالة" aria-label="إزالة التخصص" @click="departmentForm.specs.splice(i, 1)"><Trash2 :size="14" /></button>
            </li>
          </ul>
          <button type="button" class="st-add-spec" @click="departmentForm.specs.push({ name: '', degree: 'bachelor' })"><Plus :size="15" /> إضافة تخصص</button>
        </div>
      </div>
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
          <span class="st-field-label">الدرجة العلمية</span>
          <div class="mf-roles st-degrees" role="radiogroup" aria-label="الدرجة العلمية">
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
        <label :class="['st-switch', termForm.is_current && 'is-on']">
          <input v-model="termForm.is_current" type="checkbox">
          <span class="st-switch-ui" aria-hidden="true" />
          <span class="st-switch-text"><b>اعتماده كالفصل الدراسي الحالي</b><small>يصبح الفصل الافتراضي في كل اللوحات</small></span>
        </label>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="termModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" :disabled="!termForm.name.trim()" @click="submitTerm">{{ termEditId ? 'حفظ التعديلات' : 'إضافة الفصل' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد الحذف -->
    <BaseModal v-model="deleteModalOpen" title="تأكيد الحذف" size="sm">
      <p v-if="deleteTarget" class="st-del">سيُحذف <b>«{{ deleteTarget.name }}»</b> نهائيًا، ولا يمكن التراجع عن هذا الإجراء.</p>
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

const emptyDepartmentForm = () => ({ name: '', specs: [] })
const emptySpecializationForm = () => ({ department_id: '', name: '', degree: 'bachelor' })
const emptyTermForm = () => ({ name: '', is_current: false })

export default {
  name: 'SuperAdminOrgStructurePage',

  components: { Building2, Plus, Pencil, Star, Trash2, Search, CalendarDays, GraduationCap, BaseInput, BaseSelect, BaseButton, BaseModal, SkeletonLoader, EmptyState },

  data() {
    return {
      Plus, Trash2, Check, DEGREE_LABELS,
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
      this.departmentForm = row ? { name: row.name, specs: [] } : emptyDepartmentForm()
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
          await this.updateDepartment(this.departmentEditId, { name: this.departmentForm.name })
          this.$toast?.success('تم حفظ التعديلات')
        } else {
          const dept = await this.createDepartment({ name: this.departmentForm.name })
          const specs = this.departmentForm.specs.filter((s) => s.name)
          const failed = []
          for (const s of specs) {
            await this.createSpecialization({ department_id: dept.id, name: s.name, degree: s.degree }).catch(() => failed.push(s.name))
          }
          if (failed.length) this.$toast?.error(`أُضيف القسم، وتعذّرت إضافة: ${failed.join('، ')}`)
          else this.$toast?.success(specs.length ? `تمت إضافة القسم و${specs.length} تخصص` : 'تمت إضافة القسم')
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

<style scoped>
.st { display: flex; flex-direction: column; gap: 16px; }

/* 1) بانر الفصل الحالي */
.st-term-banner { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 4px; background: var(--color-surface); box-shadow: inset 4px 0 0 var(--ucas-blue), 0 0 0 1px var(--color-border); }
.st-term-banner.is-unset { box-shadow: inset 4px 0 0 #E0A020, 0 0 0 1px var(--color-border); }
.st-term-ic { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: 4px; background: color-mix(in srgb, var(--ucas-blue) 10%, var(--color-surface)); color: var(--ucas-blue); }
.st-term-banner.is-unset .st-term-ic { background: color-mix(in srgb, #E0A020 14%, var(--color-surface)); color: #B9791A; }
.st-term-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.st-term-info small { font-size: 12px; color: var(--color-text-600); }
.st-term-info b { font-size: 18px; font-weight: 800; color: var(--color-text-900); }
.st-term-none { font-size: 14.5px !important; color: #B9791A !important; }
.st-term-banner :deep(.select-none) { margin-inline-start: auto; }

/* 2) الأرقام */
.st-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.st-stat { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; border-radius: 4px; background: var(--color-surface); box-shadow: 0 0 0 1px var(--color-border); }
.st-stat b { font-size: 24px; font-weight: 800; line-height: 1.15; color: var(--color-text-900); font-variant-numeric: tabular-nums; }
.st-stat span { font-size: 13px; color: var(--color-text-600); }

/* 3) التخطيط */
.st-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
.st-card { padding: 18px 20px; border-radius: 4px; background: var(--color-surface); box-shadow: 0 0 0 1px var(--color-border); }
.st-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.st-card-head h3 { font-size: 16px; font-weight: 800; color: var(--color-text-900); }

/* شريط الأدوات: بحث + تبويب الدرجة */
.st-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 16px; }
.st-search { display: flex; align-items: center; gap: 8px; flex: 1 1 220px; min-width: 180px; height: 40px; padding-inline: 12px; border-radius: 4px; background: var(--color-bg); color: var(--color-text-400); box-shadow: inset 0 0 0 1px var(--color-border); transition: box-shadow .2s ease, background-color .2s ease; }
.st-search:focus-within { background: var(--color-surface); box-shadow: inset 0 0 0 1px var(--ucas-blue), 0 0 0 4px rgba(0, 91, 170, .1); }
.st-search input { flex: 1; min-width: 0; border: 0; background: transparent; outline: 0; font-size: 14px; color: var(--color-text-900); }
.st-tabs { display: inline-flex; gap: 3px; padding: 3px; border-radius: 4px; background: var(--color-bg); box-shadow: inset 0 0 0 1px var(--color-border); }
.st-tabs button { height: 34px; padding-inline: 14px; border-radius: 4px; font-size: 13px; font-weight: 700; color: var(--color-text-600); transition: background-color .2s ease, color .2s ease; }
.st-tabs button:hover:not(.is-active) { color: var(--ucas-blue); }
.st-tabs button.is-active { background: var(--ucas-blue); color: #FFFFFF; }

/* بطاقات الأقسام */
.st-depts { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.st-dept { display: flex; flex-direction: column; border-radius: 4px; background: var(--color-surface); box-shadow: inset 0 0 0 1px var(--color-border); overflow: hidden; }
.st-dept-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--color-bg); border-bottom: 1px solid var(--color-border); }
.st-dept-ic { display: grid; place-items: center; flex: none; width: 36px; height: 36px; border-radius: 4px; background: color-mix(in srgb, var(--ucas-blue) 10%, var(--color-surface)); color: var(--ucas-blue); }
.st-dept-title { flex: 1; min-width: 0; }
.st-dept-title h4 { font-size: 15px; font-weight: 800; color: var(--color-text-900); line-height: 1.3; }
.st-dept-title small { font-size: 12px; color: var(--color-text-600); }
.st-specs { display: flex; flex-direction: column; }
.st-spec { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--color-border-soft); transition: background-color .2s ease; }
.st-spec:last-child { border-bottom: 0; }
.st-spec:hover { background: var(--color-bg); }
.st-spec-name { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; color: var(--color-text-900); }
.st-add-spec { display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin: 12px 14px; padding: 9px; border-radius: 4px; background: color-mix(in srgb, var(--ucas-blue) 6%, var(--color-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ucas-blue) 28%, transparent); color: var(--ucas-blue); font-size: 13px; font-weight: 700; transition: background-color .2s ease; }
.st-add-spec:hover { background: color-mix(in srgb, var(--ucas-blue) 12%, var(--color-surface)); }

/* أزرار الإجراءات الصغيرة (حادة، مسطّحة) */
.st-acts { display: inline-flex; gap: 6px; }
.st-act { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 4px; background: var(--color-surface); box-shadow: inset 0 0 0 1px var(--color-border); color: var(--color-text-600); transition: background-color .2s ease, color .2s ease, box-shadow .2s ease; }
.st-act:hover { background: color-mix(in srgb, var(--ucas-blue) 9%, var(--color-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ucas-blue) 32%, transparent); color: var(--ucas-blue); }
.st-act.is-danger:hover { background: color-mix(in srgb, #FF5B5B 11%, var(--color-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, #FF5B5B 42%, transparent); color: #E04848; }
.st-act:disabled { opacity: .4; pointer-events: none; }

/* قائمة الفصول */
.st-terms { display: flex; flex-direction: column; gap: 8px; }
.st-term { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 4px; background: var(--color-surface); box-shadow: inset 0 0 0 1px var(--color-border); }
.st-term.is-current { box-shadow: inset 4px 0 0 var(--ucas-blue), 0 0 0 1px color-mix(in srgb, var(--ucas-blue) 30%, transparent); background: color-mix(in srgb, var(--ucas-blue) 4%, var(--color-surface)); }
.st-term-dot { flex: none; width: 8px; height: 8px; border-radius: 4px; background: var(--color-border); }
.st-term.is-current .st-term-dot { background: var(--ucas-blue); }
.st-term-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.st-term-body b { font-size: 14px; font-weight: 700; color: var(--color-text-900); }
.st-term-badge { display: inline-flex; align-items: center; gap: 4px; width: fit-content; padding: 1px 8px; border-radius: 4px; background: color-mix(in srgb, var(--ucas-blue) 12%, var(--color-surface)); color: var(--ucas-blue); font-size: 11px; font-weight: 800; }
.st-term-make { width: fit-content; font-size: 12px; font-weight: 700; color: var(--ucas-green); }
.st-term-make:hover { text-decoration: underline; }

/* عناصر المودالات */
.st-field-label { display: block; margin-bottom: 8px; font-size: 13.5px; font-weight: 800; color: var(--ucas-green); }
.st-field-label small { font-weight: 600; color: var(--color-text-400); }
.st-new-specs { display: flex; flex-direction: column; }
.st-new-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.st-new-row { display: flex; align-items: center; gap: 8px; }
.st-new-no { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 4px; background: color-mix(in srgb, var(--ucas-blue) 10%, var(--color-surface)); color: var(--ucas-blue); font-size: 12px; font-weight: 800; }
.st-new-input { flex: 1; min-width: 0; height: 40px; padding-inline: 12px; border-radius: 4px; background: var(--color-bg); box-shadow: inset 0 0 0 1px var(--color-border); font-size: 14px; color: var(--color-text-900); transition: box-shadow .2s ease, background-color .2s ease; }
.st-new-input:focus { outline: 0; background: var(--color-surface); box-shadow: inset 0 0 0 1px var(--ucas-blue), 0 0 0 4px rgba(0, 91, 170, .1); }
.st-new-deg { display: inline-flex; flex: none; gap: 2px; padding: 2px; border-radius: 4px; background: var(--color-bg); box-shadow: inset 0 0 0 1px var(--color-border); }
.st-new-deg button { padding: 6px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; color: var(--color-text-600); transition: background-color .2s ease, color .2s ease; }
.st-new-deg button.is-on { background: var(--ucas-blue); color: #FFFFFF; }
.st-degrees { margin-top: 2px; }

/* مفتاح اعتماد الفصل */
.st-switch { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 4px; background: var(--color-bg); box-shadow: inset 0 0 0 1px var(--color-border); cursor: pointer; transition: box-shadow .2s ease, background-color .2s ease; }
.st-switch.is-on { background: color-mix(in srgb, var(--ucas-blue) 6%, var(--color-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ucas-blue) 36%, transparent); }
.st-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.st-switch-ui { position: relative; flex: none; width: 42px; height: 24px; border-radius: 4px; background: var(--color-border); transition: background-color .2s ease; }
.st-switch-ui::after { content: ""; position: absolute; top: 3px; inset-inline-start: 3px; width: 18px; height: 18px; border-radius: 4px; background: #FFFFFF; transition: transform .2s ease; }
.st-switch.is-on .st-switch-ui { background: var(--ucas-blue); }
.st-switch.is-on .st-switch-ui::after { transform: translateX(-18px); }
.st-switch-text { display: flex; flex-direction: column; gap: 1px; }
.st-switch-text b { font-size: 13.5px; font-weight: 700; color: var(--color-text-900); }
.st-switch-text small { font-size: 12px; color: var(--color-text-600); }

.st-del { padding: 12px 14px; border-radius: 4px; background: color-mix(in srgb, #FF5B5B 8%, var(--color-surface)); box-shadow: inset 3px 0 0 #E04848; font-size: 13.5px; color: var(--color-text-900); }

@media (max-width: 991.98px) {
  .st-grid { grid-template-columns: 1fr; }
}
@media (max-width: 575.98px) {
  .st-term-banner { flex-wrap: wrap; }
  .st-term-banner :deep(.select-none) { margin-inline-start: 0; width: 100%; }
  .st-new-row { flex-wrap: wrap; }
  .st-new-input { flex-basis: 100%; }
}
</style>
