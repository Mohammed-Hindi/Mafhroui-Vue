<template>
  <!-- بروفايل طالب أو مشرف (نافذة منبثقة) — GET /students/{id}/profile و /supervisors/{id}/profile -->
  <BaseModal :model-value="modelValue" :title="title" size="lg" @update:model-value="$emit('update:modelValue', $event)">
    <SkeletonLoader v-if="loading" :rows="4" />
    <p v-else-if="!data" class="pf-muted">تعذّر تحميل البيانات</p>

    <!-- الطالب -->
    <div v-else-if="kind === 'student'" class="pf">
      <dl class="pf-grid">
        <div><dt>الرقم الجامعي</dt><dd class="mono">{{ data.university_number || '—' }}</dd></div>
        <div><dt>الجنس</dt><dd>{{ GENDERS[data.gender] || 'غير محدد' }}</dd></div>
        <div><dt>مكان التواجد</dt><dd>{{ REGIONS[data.region] || 'غير محدد' }}</dd></div>
        <div><dt>الشعبة</dt><dd>{{ data.section || '—' }}</dd></div>
        <div class="pf-wide"><dt>البريد</dt><dd class="mono">{{ data.email || '—' }}</dd></div>
        <div class="pf-wide"><dt>الواتساب</dt><dd class="mono">{{ data.whatsapp || '—' }}</dd></div>
      </dl>
      <section v-if="data.project" class="pf-block">
        <h4>المشروع</h4>
        <!-- تعديل تفاصيل المشروع (المشرف): الاسم والوصف PATCH /projects/{id}، والنوع عبر ProjectTypes -->
        <form v-if="editProject && project" class="pf-project-form" @submit.prevent="saveProject">
          <label class="pfield"><span>اسم المشروع</span><input v-model.trim="project.name" type="text" maxlength="200" required></label>
          <label class="pfield"><span>وصف المشروع</span><textarea v-model.trim="project.description" rows="3" required /></label>
          <ProjectTypes :project-id="project.id" :types="project.types || []" :editable="false" />
          <button type="submit" class="pbtn is-green is-sm" :disabled="saving || !project.name || !project.description">{{ saving ? 'جارٍ الحفظ…' : 'حفظ تفاصيل المشروع' }}</button>
        </form>
        <template v-else>
          <p class="pf-strong">{{ data.project.name }}</p>
          <p class="pf-muted">{{ data.project.specialization || '—' }} · {{ DEGREES[data.project.degree] || '—' }} · {{ STATUS[data.project.status] || '—' }}</p>
        </template>
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

    <!-- عضو اللجنة -->
    <div v-else-if="kind === 'committee'" class="pf">
      <dl class="pf-grid">
        <div><dt>الرقم الوظيفي</dt><dd class="mono">{{ data?.employee_number || '—' }}</dd></div>
        <div><dt>التخصصات</dt><dd>{{ (data?.specializations || []).join('، ') || '—' }}</dd></div>
        <div class="pf-wide"><dt>البريد</dt><dd class="mono">{{ data?.email || '—' }}</dd></div>
        <div class="pf-wide"><dt>الواتساب</dt><dd class="mono">{{ data?.whatsapp || '—' }}</dd></div>
      </dl>
    </div>

    <!-- المشرف -->
    <div v-else class="pf">
      <dl class="pf-grid">
        <div><dt>الرقم الوظيفي</dt><dd class="mono">{{ data.employee_number || '—' }}</dd></div>
        <div><dt>المجموعات</dt><dd>{{ data.interaction?.teams_count ?? 0 }}</dd></div>
        <div><dt>الطلاب</dt><dd>{{ data.interaction?.students_count ?? 0 }}</dd></div>
        <div><dt>متوسط التفاعل</dt><dd>{{ data.interaction?.average_activity ?? 0 }}%</dd></div>
        <div class="pf-wide"><dt>البريد</dt><dd class="mono">{{ data.email || '—' }}</dd></div>
        <div class="pf-wide"><dt>الواتساب</dt><dd class="mono">{{ data.whatsapp || '—' }}</dd></div>
      </dl>

      <section class="pf-block">
        <h4>المجموعات والمشاريع والطلاب <span class="pf-muted">(اضغط المجموعة لعرض أعضائها)</span></h4>
        <table class="pf-table pf-teams">
          <thead><tr><th>المجموعة</th><th>الشعبة</th><th>المشروع</th><th>المهام</th><th>التفاعل</th></tr></thead>
          <tbody>
            <template v-for="t in pagedTeams" :key="t.team.id">
              <tr class="pf-team-row" :class="openTeamIds.includes(t.team.id) && 'is-open'" @click="toggleTeam(t.team.id)">
                <td>
                  <button type="button" class="pf-caret" :class="openTeamIds.includes(t.team.id) && 'is-open'" :aria-expanded="openTeamIds.includes(t.team.id)" :aria-label="`أعضاء ${t.team.name}`"><ChevronLeft :size="14" /></button>
                  {{ t.team.name }} <span class="pf-muted">({{ t.team.members_count }})</span>
                </td>
                <td>{{ t.team.section || '—' }}</td>
                <td>{{ t.project?.name || '—' }}</td>
                <td><span class="mono">{{ t.interaction.tasks_done }}/{{ t.interaction.tasks_total }}</span></td>
                <td>
                  <span class="gr-progress is-sm"><span :class="level(t.interaction.activity_score)" :style="{ width: t.interaction.activity_score + '%' }" /></span>
                  <span class="gr-pct">{{ t.interaction.activity_score }}%</span>
                </td>
              </tr>
              <tr v-if="openTeamIds.includes(t.team.id)" class="pf-team-sub">
                <td colspan="5">
                  <div v-if="(t.team.members || []).length" class="pf-members">
                    <span v-for="m in t.team.members" :key="m.id" class="pf-member">
                      <span class="pf-member-av" aria-hidden="true">{{ (m.name || '؟').charAt(0) }}</span>
                      <span class="pf-member-name">{{ m.name }}</span>
                      <small class="pf-muted">{{ REGIONS[m.region] || '—' }}</small>
                    </span>
                  </div>
                  <p v-else class="pf-muted pf-members-empty">لا يوجد طلاب في هذه المجموعة</p>
                </td>
              </tr>
            </template>
            <tr v-if="!teams.length"><td colspan="5" class="pf-muted">لا توجد مجموعات</td></tr>
          </tbody>
        </table>
        <Pagination v-if="teamsLastPage > 1" class="pf-teams-pager" :current-page="teamsPage" :last-page="teamsLastPage" :total="teams.length" @change="teamsPage = $event" />
      </section>
    </div>
  </BaseModal>
</template>

<script>
import { ChevronLeft } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import api from '@/services/api'
import ProjectTypes from '@/components/shared/ProjectTypes.vue'
import { REGIONS } from '@/utils/progressData'

const TEAMS_PER_PAGE = 6

const DEGREES = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }
const GENDERS = { male: 'طالب', female: 'طالبة' }
const STATUS = { proposed: 'مقترح', in_progress: 'قيد التنفيذ', completed: 'مكتمل' }

export default {
  name: 'ProfileModal',

  components: { BaseModal, Pagination, ProjectTypes, ChevronLeft },

  props: {
    modelValue: { type: Boolean, default: false },
    /** 'student' | 'supervisor' | 'committee' */
    kind: { type: String, default: 'student' },
    personId: { type: [Number, String], default: null },
    /** الاسم المعروض في العنوان قبل وصول البيانات */
    name: { type: String, default: '' },
    /** إتاحة تعديل تفاصيل مشروع الطالب (للمشرف) */
    editProject: { type: Boolean, default: false },
    /** بيانات جاهزة تُعرض مباشرة بلا طلب (عضو اللجنة — لا يوجد مسار بروفايل له) */
    preset: { type: Object, default: null }
  },

  emits: ['update:modelValue'],

  data() {
    return { DEGREES, GENDERS, REGIONS, STATUS, data: null, loading: false, project: null, saving: false, teamsPage: 1, openTeamIds: [] }
  },

  computed: {
    title() {
      const who = this.data?.name || this.name
      const label = { student: 'الطالب', committee: 'عضو اللجنة' }[this.kind] || 'المشرف'
      return `${label}${who ? ': ' + who : ''}`
    },
    teams() {
      return this.data?.interaction?.teams || []
    },
    teamsLastPage() {
      return Math.ceil(this.teams.length / TEAMS_PER_PAGE) || 1
    },
    pagedTeams() {
      const start = (this.teamsPage - 1) * TEAMS_PER_PAGE
      return this.teams.slice(start, start + TEAMS_PER_PAGE)
    }
  },

  watch: {
    modelValue(open) {
      if (open) this.load()
    }
  },

  methods: {
    async load() {
      this.teamsPage = 1
      this.openTeamIds = []
      if (this.kind === 'committee') {
        this.data = this.preset
        this.loading = false
        return
      }
      if (!this.personId) return
      this.loading = true
      this.data = null
      try {
        const path = this.kind === 'student' ? 'students' : 'supervisors'
        const { data } = await api.get(`/${path}/${this.personId}/profile`)
        this.data = data
        // تفاصيل المشروع الكاملة للتعديل (الوصف والنوع غير موجودة في بروفايل الطالب)
        this.project = null
        if (this.editProject && data.project) {
          try {
            const { data: p } = await api.get(`/projects/${data.project.id}`)
            const proj = p.data || p
            this.project = { id: proj.id, name: proj.name || '', description: proj.description || '', types: proj.types || [] }
          } catch {
            // بلا صلاحية تعديل: يبقى العرض فقط
          }
        }
      } catch {
        this.data = null
      } finally {
        this.loading = false
      }
    },

    async saveProject() {
      this.saving = true
      try {
        await api.patch(`/projects/${this.project.id}`, { name: this.project.name, description: this.project.description })
        this.data.project.name = this.project.name
        this.$toast?.success('تم حفظ تفاصيل المشروع')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ المشروع')
      } finally {
        this.saving = false
      }
    },

    toggleTeam(id) {
      const at = this.openTeamIds.indexOf(id)
      if (at > -1) this.openTeamIds.splice(at, 1)
      else this.openTeamIds.push(id)
    },

    level(pct) {
      return pct >= 70 ? 'is-high' : pct >= 35 ? 'is-mid' : 'is-low'
    }
  }
}
</script>
