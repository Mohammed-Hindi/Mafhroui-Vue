<template>
  <!-- إعداد نماذج التقييم (الإدارة العامة ولجنة الإشراف): القوالب ثابتة — اختيار النموذج بفلاتر متجاورة (النوع · الدرجة)
       ثم يظهر الفورم: تعديل نص البنود ودرجاتها القصوى وترتيبها بالسحب، بلا إضافة ولا حذف -->
  <div class="ef-wrap">
    <section class="dash-card">
      <!-- اختيار النموذج بنمط تصنيف صفحة المجموعات -->
      <div class="gr-classes" aria-label="اختيار النموذج">
        <div v-for="c in filters" :key="c.key" class="gr-class" role="radiogroup" :aria-label="c.label">
          <span class="gr-class-label">{{ c.label }}</span>
          <div class="gr-seg">
            <button
              v-for="o in c.options" :key="o.value" type="button" role="radio"
              :class="c.value === o.value && 'is-active'" :aria-checked="c.value === o.value"
              @click="choose(c.key, o.value)"
            >
              {{ o.label }}
            </button>
          </div>
        </div>
      </div>
      <SkeletonLoader v-if="loading" :rows="5" height="44px" />
      <p v-else-if="!draft" class="pt-muted tk-loading">لا يوجد نموذج لهذا الاختيار</p>
    </section>

    <section v-if="draft" class="dash-card ef-edit">
      <!-- شريط الحفظ أعلى النموذج (الأهم): حالة التعديل ثم تراجع/حفظ -->
      <div class="ef-actions is-top">
        <span :class="['as-summary', missing && 'is-missing']">{{ missing || `القصوى لكل طالب: ${formMax(draft)} درجة` }}</span>
        <button v-if="isOverride" type="button" class="pbtn is-outline is-red-text" :disabled="saving" @click="removeOverride"><Trash2 :size="15" /> حذف التخصيص</button>
        <button type="button" class="pbtn is-outline" :disabled="!dirty" @click="reset">تراجع</button>
        <button type="button" class="pbtn is-green" :disabled="!!missing || saving || (!dirty && !customizing)" @click="save"><Save :size="15" /> {{ saving ? 'جارٍ الحفظ…' : customizing ? 'تخصيص لهذا القسم' : 'حفظ النموذج' }}</button>
      </div>

      <!-- قسم مختار بلا تخصيص: تنبيه أن الحفظ يُنشئ نسخة خاصة بالقسم ويُبقي الافتراضي -->
      <p v-if="customizing" class="ef-dept-note"><Info :size="16" /> هذا القسم يستخدم النموذج الافتراضي حاليًا. عدّل ثم احفظ لإنشاء نموذج خاص بقسم «{{ deptName }}» دون تغيير باقي الأقسام.</p>

      <div class="dash-card-head ef-edit-head">
        <div>
          <span class="ef-item-tags">
            <span :class="['ef-kind', `is-${draft.kind}`]">{{ FORM_KINDS[draft.kind] }}</span>
            <span class="ef-kind">{{ draft.degree ? DEGREES[draft.degree] : 'دبلوم وبكالوريوس' }}</span>
            <span v-if="isOverride" class="ef-kind is-dept">خاص بقسم {{ deptName }}</span>
            <span v-else-if="dept" class="ef-kind">{{ deptName }} · افتراضي</span>
            <span v-if="dirty" class="ef-kind is-dirty">تعديلات غير محفوظة</span>
          </span>
          <h3>{{ draft.title }}</h3>
        </div>
        <span class="ef-outline">{{ draft.sections.length }} قسم · {{ itemsOf(draft) }} بند · القصوى {{ formMax(draft) }} درجة</span>
      </div>

      <section
        v-for="(s, si) in draft.sections" :key="s.id"
        :class="['ef-sec', `is-${s.scope}`, drag?.id === s.id && 'is-dragging']"
        @dragover.prevent="dragOver($event, draft.sections, si)" @drop.prevent="dragEnd"
      >
        <header class="ef-sec-head">
          <button
            type="button" class="ef-grip" draggable="true" :aria-label="`ترتيب القسم ${si + 1} — اسحب أو استخدم الأسهم`" title="اسحب لإعادة الترتيب"
            @dragstart="dragStart($event, draft.sections, si, s.id)" @dragend="dragEnd"
            @keydown.up.prevent="move(draft.sections, si, -1)" @keydown.down.prevent="move(draft.sections, si, 1)"
          >
            <GripVertical :size="18" />
          </button>
          <h4 class="ef-sec-title">{{ s.title }}</h4>
          <span :class="['ef-scope-tag', `is-${s.scope}`]">{{ SCOPES[s.scope] }}</span>
          <span class="ef-sec-max mono">{{ sectionMax(s) }} درجة</span>
        </header>

        <ol class="ef-items">
          <li
            v-for="(item, ii) in s.items" :key="item.id" :class="drag?.id === item.id && 'is-dragging'"
            @dragover.prevent="dragOver($event, s.items, ii)" @drop.prevent="dragEnd"
          >
            <button
              type="button" class="ef-grip" draggable="true" :aria-label="`ترتيب البند ${ii + 1} — اسحب أو استخدم الأسهم`" title="اسحب لإعادة الترتيب"
              @dragstart="dragStart($event, s.items, ii, item.id)" @dragend="dragEnd"
              @keydown.up.prevent="move(s.items, ii, -1)" @keydown.down.prevent="move(s.items, ii, 1)"
            >
              <GripVertical :size="16" />
            </button>
            <span class="ef-num">{{ ii + 1 }}</span>
            <textarea v-model.trim="item.text" rows="2" class="ev-input ef-text" placeholder="نص البند" aria-label="نص البند" />
            <label class="ef-max"><span>القصوى</span><input v-model.number="item.max" type="number" min="1" max="100" class="ev-input mono"></label>
          </li>
        </ol>
      </section>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { GripVertical, Info, Save, Trash2 } from 'lucide-vue-next'
import api from '@/services/api'
import { useTeamsStore } from '@/stores/teams.store'
import { DEGREES } from '@/utils/progressData'
import { FORM_KINDS, SCOPES, formMax } from '@/utils/evaluation'

const clone = (v) => JSON.parse(JSON.stringify(v))

export default {
  name: 'EvaluationFormEditor',

  components: { GripVertical, Info, Save, Trash2 },

  data() {
    return { DEGREES, FORM_KINDS, SCOPES, forms: [], loading: true, kind: 'supervisor', degree: 'diploma', dept: '', draft: null, saving: false, drag: null }
  },

  computed: {
    ...mapState(useTeamsStore, ['departments']),

    filters() {
      return [
        { key: 'kind', value: this.kind, label: 'نوع النموذج', options: Object.entries(FORM_KINDS).map(([value, label]) => ({ value, label })) },
        { key: 'degree', value: this.degree, label: 'الدرجة', options: Object.entries(DEGREES).map(([value, label]) => ({ value, label })) },
        // القسم: «كل الأقسام» = النموذج الافتراضي، واختيار قسم يُظهر نموذجه الخاص إن وُجد (أو الافتراضي لتخصيصه)
        { key: 'dept', value: this.dept, label: 'القسم', options: [{ value: '', label: 'كل الأقسام' }, ...this.departments.map((d) => ({ value: d.id, label: d.name }))] }
      ]
    },
    /** النموذج المطابق (النوع + الدرجة): نموذج خاص بالقسم المختار يتقدّم على الافتراضي (بلا قسم) */
    selected() {
      const matches = this.forms.filter((f) => f.kind === this.kind && (!f.degree || f.degree === this.degree))
      if (this.dept) return matches.find((f) => f.department_id === Number(this.dept)) || matches.find((f) => !f.department_id) || null
      return matches.find((f) => !f.department_id) || null
    },
    /** النموذج المعروض خاص بقسم (وليس الافتراضي) */
    isOverride() {
      return !!this.selected?.department_id
    },
    /** قسم مختار لكنه ما زال على النموذج الافتراضي (لم يُخصَّص بعد) — الحفظ يُنشئ نسخة خاصة */
    customizing() {
      return !!this.dept && !this.isOverride
    },
    deptName() {
      return this.departments.find((d) => d.id === Number(this.dept))?.name || ''
    },
    dirty() {
      return !!this.draft && JSON.stringify(this.pick(this.draft)) !== JSON.stringify(this.pick(this.selected))
    },
    missing() {
      const d = this.draft
      if (d.sections.some((s) => s.items.some((i) => !i.text))) return 'كل بند يحتاج نصًا'
      if (d.sections.some((s) => s.items.some((i) => !(i.max >= 1 && i.max <= 100)))) return 'قصوى كل بند بين 1 و100'
      return ''
    }
  },

  // GET /evaluation-forms
  async created() {
    useTeamsStore().fetchOrgCatalog().catch(() => {})
    try {
      const { data } = await api.get('/evaluation-forms')
      this.forms = data
      this.reset()
    } catch {
      this.$toast?.error('تعذّر تحميل نماذج التقييم')
    } finally {
      this.loading = false
    }
  },

  methods: {
    formMax,

    // نحافظ على allow_nomination من النموذج نفسه (نماذج المناقشين تعتمده للترشيح) بدل إطفائه عند الحفظ
    pick: (f) => f && { title: f.title, method: f.method, weight: Number(f.weight), allow_nomination: !!f.allow_nomination, sections: f.sections },

    choose(key, value) {
      if (value === this[key] || (this.dirty && !window.confirm('تجاهل التعديلات غير المحفوظة؟'))) return
      this[key] = value
      this.reset()
    },

    reset() {
      this.draft = this.selected ? clone(this.selected) : null
    },

    sectionMax: (s) => s.items.reduce((n, i) => n + (Number(i.max) || 0), 0),
    itemsOf: (f) => f.sections.reduce((n, s) => n + s.items.length, 0),

    move(list, i, d) {
      if (i + d < 0 || i + d >= list.length) return
      list.splice(i + d, 0, list.splice(i, 1)[0])
    },

    // سحب وإفلات أصلي (HTML5): المقبض يبدأ السحب، والترتيب يتحدّث حيًّا عند المرور فوق عنصر من القائمة نفسها
    dragStart(e, list, index, id) {
      this.drag = { list, index, id }
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
      const row = e.target.closest('li, section')
      if (row) e.dataTransfer.setDragImage(row, 24, 24)
    },
    dragOver(e, list, index) {
      if (!this.drag || this.drag.list !== list) return
      e.stopPropagation() // بند فوق بند: لا يصل الحدث لقسمه
      if (this.drag.index === index) return
      this.move(list, this.drag.index, index - this.drag.index)
      this.drag.index = index
    },
    dragEnd() {
      this.drag = null
    },

    // الحفظ: قسم مختار بلا نموذج خاص ← POST نسخة خاصة بالقسم (يبقى الافتراضي كما هو)؛ غير ذلك ← PUT تحديث النموذج
    async save() {
      this.saving = true
      try {
        let data
        if (this.customizing) {
          const payload = { ...this.pick(this.draft), kind: this.selected.kind, degree: this.selected.degree, department_id: Number(this.dept) }
          data = (await api.post('/evaluation-forms', payload)).data
          this.forms = [...this.forms, data]
        } else {
          data = (await api.put(`/evaluation-forms/${this.selected.id}`, this.pick(this.draft))).data
          this.forms = this.forms.map((f) => (f.id === data.id ? data : f))
        }
        this.draft = clone(data)
        this.$toast?.success(this.customizing ? 'تم إنشاء نموذج خاص بالقسم' : 'تم حفظ النموذج')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ النموذج')
      } finally {
        this.saving = false
      }
    },

    // DELETE /evaluation-forms/{id} — حذف تخصيص القسم والعودة للنموذج الافتراضي (ممنوع إن عُبّئ)
    async removeOverride() {
      if (!this.isOverride || !window.confirm(`حذف نموذج قسم «${this.deptName}» والعودة للنموذج الافتراضي؟`)) return
      const id = this.selected.id
      try {
        await api.delete(`/evaluation-forms/${id}`)
        this.forms = this.forms.filter((f) => f.id !== id)
        this.reset()
        this.$toast?.success('حُذف التخصيص وعاد القسم للنموذج الافتراضي')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف التخصيص')
      }
    }
  }
}
</script>
