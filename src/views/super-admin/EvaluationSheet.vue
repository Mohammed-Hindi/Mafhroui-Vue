<template>
  <!-- ورقة تقييم مجموعة (صفحة مستقلة) بنمط نموذج الكلية: بطاقة المجموعة، ثم تبويبات: كل نموذج (جدول البنود بمجاميع حيّة وتعبئة سريعة
       وملاحظات) + "نتيجة التقييم" (الدرجة النهائية لكل طالب والتقييمات المحفوظة لكل نموذج) -->
  <div class="dash es-page">
    <!-- أثناء التحميل: زر الرجوع وحده -->
    <div v-if="loading || !sheet" class="es-back">
      <button type="button" class="pbtn is-cyan" @click="back"><ArrowRight :size="16" /> رجوع إلى التقييمات</button>
    </div>

    <SkeletonLoader v-if="loading" :rows="6" height="40px" />
    <div v-else-if="sheet" class="es">
      <!-- شريط الحفظ أعلى الصفحة (ثابت): حالة التعديل، مجاميع الطلبة، ثم تراجع/حفظ -->
      <div v-if="form && !viewOnly" class="es-actions is-top">
        <span :class="['as-summary', invalid && 'is-missing']">
          {{ invalid ? 'إحدى الدرجات خارج الحد المسموح' : dirty ? 'تعديلات غير محفوظة' : `تُحفظ باسم ${userName}` }}
        </span>
        <span class="es-totals-inline">
          <span v-for="m in sheet.team.members" :key="m.id">{{ m.name }}: <b class="mono">{{ total(m.id) }}</b></span>
          <span class="es-totals-max">/ {{ max }}</span>
        </span>
        <button type="button" class="pbtn is-outline" :disabled="!dirty" @click="selectForm(formId)">تراجع</button>
        <button v-if="!readonly" type="button" class="pbtn is-green" :disabled="saving || invalid || !dirty" @click="save">
          <Save :size="16" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ التقييم' }}
        </button>
      </div>

      <!-- 1) بانر المجموعة بالتدرّج: الرجوع والتمييز أعلاه، ثم الشعبة في خانة مستقلة، ثم المشروع وبياناته، ثم الفريق -->
      <section class="es-hero">
        <div class="es-hero-top">
          <button type="button" class="es-hero-btn" @click="back"><ArrowRight :size="16" /> رجوع إلى التقييمات</button>
          <label v-if="sheet.team.project_id" :class="['es-hero-btn es-hero-star', sheet.team.featured && 'is-on']">
            <input type="checkbox" class="sr-only" :checked="sheet.team.featured" :disabled="!sheet.team.can_feature || featuring" @change="toggleFeatured($event.target.checked)">
            <Star :size="16" :fill="sheet.team.featured ? 'currentColor' : 'none'" />
            {{ sheet.team.featured ? 'مشروع مميّز' : 'تمييز كمشروع مميّز' }}
          </label>
        </div>
        <div class="es-hero-main">
          <span class="es-hero-sec"><small>الشعبة</small><b>{{ sheet.team.section || sheet.team.name }}</b></span>
          <div class="es-hero-text">
            <small><GraduationCap :size="15" /> {{ sheet.team.specialization || '—' }} · {{ DEGREES[sheet.team.degree] || '' }}</small>
            <h2>{{ sheet.team.project || 'لم يُسجَّل مشروع' }}</h2>
            <span class="es-hero-chips">
              <button v-if="sheet.team.supervisor" type="button" class="es-hero-suplink" @click="supSel = sheet.team.supervisor"><UserRound :size="14" /> المشرف: {{ sheet.team.supervisor.name }}</button>
              <span v-else><UserRound :size="14" /> المشرف: —</span>
              <span><Users :size="14" /> {{ sheet.team.members.length }} طلاب</span>
            </span>
          </div>
        </div>
        <ul class="es-hero-team" aria-label="فريق المشروع">
          <li v-for="m in sheet.team.members" :key="m.id">{{ m.name }}</li>
        </ul>
      </section>

      <!-- 2) قسم التعبئة: النموذج القابل للتقييم فقط (يُعرض لمن يملك صلاحية التعبئة) -->
      <section v-if="form && !viewOnly" id="es-form" class="es-card es-form">
        <div class="es-form-head">
          <div class="es-form-headmain">
            <h4>{{ form.title }}</h4>
            <!-- مبدّل صغير بين النماذج القابلة للتعبئة فقط (نادر: الإدارة قد تملك أكثر من نموذج) -->
            <div v-if="editableForms.length > 1" class="es-formpick" role="tablist">
              <button v-for="f in editableForms" :key="f.id" type="button" role="tab" :aria-selected="formId === f.id" :class="formId === f.id && 'is-active'" @click="switchForm(f.id)">{{ formLabel(f) }}</button>
            </div>
          </div>
          <!-- تقدّم تعبئة الخانات -->
          <span class="es-progress">
            <span class="es-progress-bar"><span :style="{ width: (cells.total ? (cells.filled / cells.total) * 100 : 0) + '%' }" /></span>
            {{ cells.filled }} من {{ cells.total }} خانة
          </span>
        </div>

        <p v-if="mine" class="es-status is-saved">
          <CheckCircle2 :size="17" /> تقييمك محفوظ — آخر تحديث {{ formatDateTime(mine.updated_at) }}
        </p>

        <section v-for="s in form.sections" :key="s.id" :class="['es-section', `is-${s.scope}`]">
          <header class="es-section-head">
            <h5>{{ s.title }}</h5>
            <span class="es-scope">{{ s.scope === 'project' ? 'درجة مشتركة لكل الطلبة' : 'درجة لكل طالب' }} · {{ sectionMax(s) }} درجة</span>
          </header>
          <div class="pt-wrap">
            <table class="pt es-table">
              <thead>
                <tr v-if="s.scope === 'project'">
                  <th data-rt-title>البند</th><th class="es-max">القصوى</th><th class="es-col">الدرجة</th><th class="es-note">ملاحظات</th>
                </tr>
                <tr v-else>
                  <th data-rt-title>البند</th><th class="es-max">القصوى</th>
                  <th v-for="m in sheet.team.members" :key="m.id" class="es-col" :data-es-student="m.id">
                    <span class="es-col-name">{{ m.name }}</span>
                    <button v-if="!readonly" type="button" class="es-fill" :title="`الدرجة الكاملة لـ ${m.name} في هذا القسم`" @click="fillMax(s, m.id)">الدرجة الكاملة</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in s.items" :key="item.id">
                  <td class="es-text">{{ item.text }}</td>
                  <td class="es-max mono">{{ item.max }}</td>
                  <template v-if="s.scope === 'project'">
                    <td class="es-col"><ScoreInput v-model="draft.project[item.id].score" :max="item.max" :method="form.method" :label="`درجة البند ${i + 1}`" :disabled="readonly" /></td>
                    <td class="es-note"><input v-model.trim="draft.project[item.id].note" type="text" class="ev-input" placeholder="ملاحظة (اختياري)" :disabled="readonly"></td>
                  </template>
                  <td v-for="m in sheet.team.members" v-else :key="m.id" class="es-col" :data-es-student="m.id">
                    <ScoreInput v-model="draft.students[m.id][item.id]" :max="item.max" :method="form.method" :label="`${m.name} — البند ${i + 1}`" :disabled="readonly" />
                  </td>
                </tr>
                <tr class="es-sum">
                  <td>مجموع القسم</td>
                  <td class="mono">{{ sectionMax(s) }}</td>
                  <td v-if="s.scope === 'project'" colspan="2" class="mono">{{ sectionProject(s) }}</td>
                  <td v-for="m in sheet.team.members" v-else :key="m.id" class="mono">{{ sectionStudent(s, m.id) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ملاحظات عامة على المجموعة -->
        <label class="pfield es-notes">
          <span>ملاحظات عامة على المجموعة</span>
          <textarea v-model.trim="draft.general_notes" rows="3" placeholder="تظهر لباقي المقيّمين والإدارة" :disabled="readonly" />
        </label>
      </section>

      <!-- 3) قسم النتائج: ظاهر دائمًا على نفس الصفحة أسفل النموذج — الدرجة النهائية لكل طالب ثم التقييمات المحفوظة -->
      <section id="es-results" class="es-card es-form">
        <div class="es-form-head">
          <h4>نتائج الطلاب</h4>
          <span class="es-scope">{{ examinerOnly ? 'علامة لجنة المناقشة' : `المشرف ${weights.supervisor} + لجنة المناقشة ${weights.examiner} = 100` }}</span>
        </div>
        <div class="pt-wrap">
          <table class="pt es-result">
            <thead>
              <tr>
                <th>الطالب</th>
                <th v-if="!examinerOnly" class="es-r-c">جزء المشرف<small>من {{ weights.supervisor }}</small></th>
                <th class="es-r-c">علامة لجنة المناقشة<small>من {{ weights.examiner }}</small></th>
                <th v-if="!examinerOnly" class="es-r-c">المجموع<small>من 100</small></th>
                <th v-if="!examinerOnly" class="es-r-c">التقدير</th>
                <th v-if="editableForms.length" class="es-r-c">تعديل</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in sheet.team.members" :key="m.id">
                <td>
                  <span class="es-r-student">
                    <b>{{ m.name }}</b><small class="mono">{{ m.university_number || '—' }}</small>
                  </span>
                </td>
                <td v-if="!examinerOnly" class="es-r-c mono">{{ result(m.id)?.supervisor_score ?? 0 }}</td>
                <td class="es-r-c mono">{{ result(m.id)?.committee_score ?? 0 }}</td>
                <td v-if="!examinerOnly" class="es-r-c"><b class="es-r-total mono">{{ result(m.id)?.score ?? 0 }}</b></td>
                <td v-if="!examinerOnly" class="es-r-c">
                  <span v-if="result(m.id)?.score != null" :class="['rv-pill', gradeTone(result(m.id).score)]">{{ grade(result(m.id).score) }}</span>
                  <span v-else class="pt-muted">لم يكتمل</span>
                </td>
                <td v-if="editableForms.length" class="es-r-c">
                  <button type="button" class="pbtn is-sm is-outline" @click="editStudent(m.id)"><Pencil :size="13" /> تعديل</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section v-for="f in sheet.forms" :key="f.id" class="es-others">
          <h4>تقييمات {{ f.kind === 'examiner' ? 'المناقشين' : 'المشرف' }} المحفوظة ({{ subsOf(f.id).length }})</h4>
          <p v-if="!subsOf(f.id).length" class="pt-muted">لا توجد تقييمات محفوظة بعد.</p>
          <div v-else class="pt-wrap">
            <table class="pt es-others-table">
              <thead>
                <tr>
                  <th class="es-o-who">المقيّم</th>
                  <th v-for="m in sheet.team.members" :key="m.id" class="es-o-score">{{ m.name }}<small>من {{ formMax(f) }}</small></th>
                  <th class="es-o-note">ملاحظات</th>
                  <th class="es-o-date">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in subsOf(f.id)" :key="o.id">
                  <td class="pt-strong es-o-who">{{ o.evaluator?.name }}</td>
                  <td v-for="m in sheet.team.members" :key="m.id" class="es-o-score mono">{{ totalIn(f, o.answers, m.id) }}</td>
                  <td class="es-o-note">{{ o.general_notes || '—' }}</td>
                  <td class="es-o-date">{{ formatDateTime(o.updated_at) }}</td>
                </tr>
                <!-- متوسط المقيّمين = ما يدخل في الدرجة النهائية -->
                <tr v-if="subsOf(f.id).length > 1" class="es-sum">
                  <td>المتوسط</td>
                  <td v-for="m in sheet.team.members" :key="m.id" class="es-o-score mono">{{ avgIn(f, m.id) }}</td>
                  <td colspan="2" />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>

    <!-- معلومات المشرف (للقراءة) -->
    <BaseModal :model-value="!!supSel" :title="supSel ? supSel.name : ''" size="md" @update:model-value="!$event && (supSel = null)">
      <div v-if="supSel" class="pbm">
        <dl class="pbm-kv dp-supkv">
          <div><dt>الدور</dt><dd>مشرف المجموعة</dd></div>
          <div v-if="sheet?.team?.specialization"><dt>التخصص</dt><dd>{{ sheet.team.specialization }}</dd></div>
          <div v-if="supSel.employee_number"><dt>الرقم الوظيفي</dt><dd dir="ltr">{{ supSel.employee_number }}</dd></div>
          <div v-if="supSel.email"><dt>البريد الإلكتروني</dt><dd dir="ltr">{{ supSel.email }}</dd></div>
          <div v-if="supSel.whatsapp"><dt>واتساب</dt><dd dir="ltr">{{ supSel.whatsapp }}</dd></div>
        </dl>
      </div>
    </BaseModal>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ArrowRight, CheckCircle2, GraduationCap, Pencil, Save, Star, UserRound, Users } from 'lucide-vue-next'
import ScoreInput from '@/components/shared/ScoreInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { DEGREES } from '@/utils/progressData'
import { FORM_KINDS, formMax, grade, gradeTone, studentTotal } from '@/utils/evaluation'
import { formatDateTime } from '@/utils/formatters'

export default {
  name: 'EvaluationSheet',

  components: { ScoreInput, BaseModal, ArrowRight, CheckCircle2, GraduationCap, Pencil, Save, Star, UserRound, Users },

  // تنبيه قبل مغادرة الصفحة بتعديلات غير محفوظة
  beforeRouteLeave() {
    if (this.dirty && !this.saving) return window.confirm('لديك تعديلات غير محفوظة على التقييم. مغادرة الصفحة؟')
  },

  data() {
    return {
      DEGREES, FORM_KINDS, readonly: false, sheet: null, loading: false, saving: false, featuring: false,
      formId: null, draft: { project: {}, students: {} }, initial: '', supSel: null
    }
  },

  computed: {
    ...mapState(useAuthStore, ['user', 'userName']),
    teamId() {
      return this.$route.params.teamId
    },
    form() {
      return this.sheet?.forms.find((f) => f.id === this.formId) || null
    },
    max() {
      return this.form ? formMax(this.form) : 0
    },
    /** الخادم يرسل النماذج التي يعبّئها المستخدم؛ الباقي للعرض فقط */
    viewOnly() {
      return !!this.sheet?.editable && !this.sheet.editable.includes(this.formId)
    },
    /** المناقش (ليس مشرف المجموعة) يرى علامة اللجنة فقط */
    examinerOnly() {
      return !!this.sheet?.results?.length && !('score' in this.sheet.results[0])
    },
    /** النماذج التي يحق للمستخدم تعبئتها (المشرف أولًا عند الإدارة) */
    editableForms() {
      const ids = this.sheet?.editable || []
      return (this.sheet?.forms || [])
        .filter((f) => ids.includes(f.id))
        .sort((a, b) => (a.kind === 'supervisor' ? -1 : 1))
    },
    mine() {
      const uid = this.user?.id
      return this.sheet?.submissions.find((s) => s.form_id === this.formId && (s.evaluator_id === uid || s.evaluator?.id === uid))
    },
    /** وزن كل جزء في الدرجة النهائية = مجموع أوزان نماذجه */
    weights() {
      const w = (kind) => this.sheet.forms.filter((f) => f.kind === kind).reduce((n, f) => n + f.weight, 0)
      return { supervisor: w('supervisor'), examiner: w('examiner') }
    },
    dirty() {
      return !!this.form && !this.viewOnly && JSON.stringify(this.draft) !== this.initial
    },
    /** خانات الدرجات المعبّأة من الكل (بند المشروع خانة واحدة، وبند الطالب خانة لكل طالب) */
    cells() {
      const has = (v) => v !== null && v !== '' && v !== undefined
      let total = 0
      let filled = 0
      this.form?.sections.forEach((s) => s.items.forEach((i) => {
        if (s.scope === 'project') {
          total += 1
          filled += has(this.draft.project[i.id]?.score) ? 1 : 0
        } else {
          this.sheet.team.members.forEach((m) => {
            total += 1
            filled += has(this.draft.students[m.id]?.[i.id]) ? 1 : 0
          })
        }
      }))
      return { total, filled }
    },
    invalid() {
      if (!this.form) return false
      const bad = (v, max) => v != null && v !== '' && (Number(v) < 0 || Number(v) > max)
      return this.form.sections.some((s) => s.items.some((i) => (s.scope === 'project'
        ? bad(this.draft.project[i.id]?.score, i.max)
        : this.sheet.team.members.some((m) => bad(this.draft.students[m.id]?.[i.id], i.max)))))
    }
  },

  watch: {
    teamId: {
      immediate: true,
      handler(id) {
        if (id) this.load()
      }
    }
  },

  methods: {
    grade,
    gradeTone,
    formatDateTime,

    // GET /teams/{id}/evaluation
    async load() {
      this.loading = true
      this.sheet = null
      try {
        const { data } = await api.get(`/teams/${this.teamId}/evaluation`)
        this.sheet = data
        // النموذج النشط = نموذج المستخدم القابل للتعبئة (المشرف أولًا)؛ الباقي للعرض في قسم النتائج
        const editable = this.editableForms
        const keep = editable.some((f) => f.id === this.formId)
        this.selectForm(keep ? this.formId : editable[0]?.id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل ورقة التقييم')
        this.back()
      } finally {
        this.loading = false
      }
    },

    /** مسودة النموذج: من تعبئتي المحفوظة إن وُجدت، وإلا فارغة — بنية كاملة حتى يعمل v-model على كل خلية */
    selectForm(id) {
      this.formId = id
      const form = this.form
      if (!form) return
      const saved = this.mine?.answers || {}
      const project = {}
      const students = Object.fromEntries(this.sheet.team.members.map((m) => [m.id, {}]))
      form.sections.forEach((s) => s.items.forEach((i) => {
        if (s.scope === 'project') project[i.id] = { score: saved.project?.[i.id]?.score ?? null, note: saved.project?.[i.id]?.note || '' }
        else this.sheet.team.members.forEach((m) => { students[m.id][i.id] = saved.students?.[m.id]?.[i.id] ?? null })
      }))
      this.draft = { project, students, general_notes: this.mine?.general_notes || '' }
      this.initial = JSON.stringify(this.draft)
    },

    switchForm(id) {
      if (id === this.formId || (this.dirty && !window.confirm('تجاهل التعديلات غير المحفوظة على هذا النموذج؟'))) return
      this.selectForm(id)
    },

    /** الدرجة الكاملة لطالب في كل بنود القسم */
    fillMax(section, sid) {
      section.items.forEach((i) => { this.draft.students[sid][i.id] = i.max })
    },

    // صفحة قائمة التقييمات للدور نفسه: super-admin-evaluation-sheet ← super-admin-evaluations
    back() {
      this.$router.push({ name: this.$route.name.replace('-evaluation-sheet', '-evaluations'), query: { tab: 'groups' } })
    },

    /** اسم النموذج مع ترقيمه إن تكرر نفس النوع */
    formLabel(f) {
      const same = this.sheet.forms.filter((x) => x.kind === f.kind)
      const label = `نموذج ${FORM_KINDS[f.kind]}`
      return same.length > 1 ? `${label} ${same.indexOf(f) + 1}` : label
    },

    /** فتح النموذج القابل للتعبئة والانتقال إلى عمود الطالب لتعديل درجته مباشرة */
    editStudent(sid) {
      const target = this.editableForms[0]
      if (!target) return
      if (this.formId !== target.id) {
        if (this.dirty && !window.confirm('تجاهل التعديلات غير المحفوظة؟')) return
        this.selectForm(target.id)
      }
      this.$nextTick(() => {
        const el = document.querySelector(`[data-es-student="${sid}"]`)
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('is-flash')
        setTimeout(() => el.classList.remove('is-flash'), 1600)
      })
    },

    // PATCH /projects/{id} — تمييز المشروع (يظهر في نتائج "مشروع مميّز")
    async toggleFeatured(on) {
      this.featuring = true
      try {
        await api.patch(`/projects/${this.sheet.team.project_id}`, { is_featured: on })
        this.sheet.team.featured = on
        this.$toast?.success(on ? 'تم تمييز المشروع' : 'أُلغي تمييز المشروع')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث تمييز المشروع')
      } finally {
        this.featuring = false
      }
    },

    sectionMax: (s) => s.items.reduce((n, i) => n + Number(i.max), 0),
    sectionProject(s) {
      return s.items.reduce((n, i) => n + (Number(this.draft.project[i.id]?.score) || 0), 0)
    },
    sectionStudent(s, sid) {
      return s.items.reduce((n, i) => n + (Number(this.draft.students[sid]?.[i.id]) || 0), 0)
    },
    total(sid) {
      return studentTotal(this.form, this.draft, sid)
    },
    formMax,
    subsOf(formId) {
      return this.sheet.submissions.filter((x) => x.form_id === formId)
    },
    totalIn(form, answers, sid) {
      return studentTotal(form, answers, sid)
    },
    avgIn(form, sid) {
      const subs = this.subsOf(form.id)
      return Math.round((subs.reduce((n, o) => n + studentTotal(form, o.answers, sid), 0) / subs.length) * 100) / 100
    },
    result(sid) {
      return this.sheet.results?.find((r) => r.student_id === sid)
    },

    // PUT /teams/{id}/evaluation/{form} — ثم إعادة تحميل الورقة لتحديث الدرجات النهائية
    async save() {
      this.saving = true
      try {
        await api.put(`/teams/${this.teamId}/evaluation/${this.formId}`, {
          answers: { project: this.draft.project, students: this.draft.students },
          general_notes: this.draft.general_notes || null,
          nominate: null
        })
        this.$toast?.success('تم حفظ التقييم')
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التقييم')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
