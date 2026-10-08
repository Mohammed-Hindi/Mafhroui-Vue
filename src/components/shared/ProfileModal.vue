<template>
  <!-- بروفايل طالب أو مشرف (نافذة منبثقة) — GET /students/{id}/profile و /supervisors/{id}/profile -->
  <BaseModal :model-value="modelValue" :title="title" size="lg" @update:model-value="$emit('update:modelValue', $event)">
    <p v-if="loading" class="pf-muted">جارٍ تحميل البيانات…</p>
    <p v-else-if="!data" class="pf-muted">تعذّر تحميل البيانات</p>

    <!-- الطالب -->
    <div v-else-if="kind === 'student'" class="pf">
      <dl class="pf-grid">
        <div><dt>الرقم الجامعي</dt><dd class="mono">{{ data.university_number || '—' }}</dd></div>
        <div><dt>الجنس</dt><dd>{{ GENDERS[data.gender] || 'غير محدد' }}</dd></div>
        <div><dt>مكان التواجد</dt><dd>{{ REGIONS[data.region] || 'غير محدد' }}</dd></div>
        <div><dt>الشعبة</dt><dd>{{ data.section || '—' }}</dd></div>
        <div><dt>البريد</dt><dd class="mono">{{ data.email || '—' }}</dd></div>
        <div><dt>الواتساب</dt><dd class="mono">{{ data.whatsapp || '—' }}</dd></div>
      </dl>

      <section v-if="data.project" class="pf-block">
        <h4>المشروع</h4>
        <p class="pf-strong">{{ data.project.name }}</p>
        <p class="pf-muted">{{ data.project.specialization || '—' }} · {{ DEGREES[data.project.degree] || '—' }} · {{ STATUS[data.project.status] || '—' }}</p>
      </section>

      <section class="pf-block">
        <h4>المشرف</h4>
        <p class="pf-strong">{{ data.supervisor?.name || 'غير محدد' }}</p>
        <a v-if="data.supervisor?.whatsapp" :href="`https://wa.me/${data.supervisor.whatsapp}`" target="_blank" rel="noopener" class="pf-link mono">{{ data.supervisor.whatsapp }}</a>
      </section>

      <section class="pf-block">
        <h4>زملاء المجموعة</h4>
        <table class="pf-table">
          <thead><tr><th>الاسم</th><th>مكان التواجد</th></tr></thead>
          <tbody>
            <tr v-for="m in data.teammates || []" :key="m.id">
              <td>{{ m.name }}</td>
              <td>{{ REGIONS[m.region] || 'غير محدد' }}</td>
            </tr>
            <tr v-if="!(data.teammates || []).length"><td colspan="2" class="pf-muted">لا يوجد زملاء</td></tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- المشرف -->
    <div v-else class="pf">
      <dl class="pf-grid">
        <div><dt>الرقم الوظيفي</dt><dd class="mono">{{ data.employee_number || '—' }}</dd></div>
        <div><dt>البريد</dt><dd class="mono">{{ data.email || '—' }}</dd></div>
        <div><dt>الواتساب</dt><dd class="mono">{{ data.whatsapp || '—' }}</dd></div>
        <div><dt>المجموعات</dt><dd>{{ data.interaction?.teams_count ?? 0 }}</dd></div>
        <div><dt>الطلاب</dt><dd>{{ data.interaction?.students_count ?? 0 }}</dd></div>
        <div><dt>متوسط التفاعل</dt><dd>{{ data.interaction?.average_activity ?? 0 }}%</dd></div>
      </dl>

      <section class="pf-block">
        <h4>التفاعل مع كل مجموعة</h4>
        <table class="pf-table">
          <thead><tr><th>المجموعة</th><th>الشعبة</th><th>المشروع</th><th>المهام</th><th>التفاعل</th></tr></thead>
          <tbody>
            <tr v-for="t in data.interaction?.teams || []" :key="t.team.id">
              <td>{{ t.team.name }} <span class="pf-muted">({{ t.team.members_count }})</span></td>
              <td>{{ t.team.section || '—' }}</td>
              <td>{{ t.project?.name || '—' }}</td>
              <td><span class="mono">{{ t.interaction.tasks_done }}/{{ t.interaction.tasks_total }}</span></td>
              <td>
                <span class="gr-progress is-sm"><span :class="level(t.interaction.activity_score)" :style="{ width: t.interaction.activity_score + '%' }" /></span>
                <span class="gr-pct">{{ t.interaction.activity_score }}%</span>
              </td>
            </tr>
            <tr v-if="!(data.interaction?.teams || []).length"><td colspan="5" class="pf-muted">لا توجد مجموعات</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  </BaseModal>
</template>

<script>
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'

const DEGREES = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }
const GENDERS = { male: 'طالب', female: 'طالبة' }
const REGIONS = { gaza: 'غزة', south: 'الجنوب' }
const STATUS = { proposed: 'مقترح', in_progress: 'قيد التنفيذ', completed: 'مكتمل' }

export default {
  name: 'ProfileModal',

  components: { BaseModal },

  props: {
    modelValue: { type: Boolean, default: false },
    /** 'student' | 'supervisor' */
    kind: { type: String, default: 'student' },
    personId: { type: [Number, String], default: null },
    /** الاسم المعروض في العنوان قبل وصول البيانات */
    name: { type: String, default: '' }
  },

  emits: ['update:modelValue'],

  data() {
    return { DEGREES, GENDERS, REGIONS, STATUS, data: null, loading: false }
  },

  computed: {
    title() {
      const who = this.data?.name || this.name
      return `${this.kind === 'student' ? 'الطالب' : 'المشرف'}${who ? ': ' + who : ''}`
    }
  },

  watch: {
    modelValue(open) {
      if (open) this.load()
    }
  },

  methods: {
    async load() {
      if (!this.personId) return
      this.loading = true
      this.data = null
      try {
        const path = this.kind === 'student' ? 'students' : 'supervisors'
        const { data } = await api.get(`/${path}/${this.personId}/profile`)
        this.data = data
      } catch {
        this.data = null
      } finally {
        this.loading = false
      }
    },

    level(pct) {
      return pct >= 70 ? 'is-high' : pct >= 35 ? 'is-mid' : 'is-low'
    }
  }
}
</script>
