<template>
  <!-- تفاصيل المجموعة: بيانات المشروع + الأعضاء بمعلوماتهم الكاملة — مشترك بين صفحة الاجتماعات وصفحة المواعيد -->
  <BaseModal
    :model-value="modelValue"
    :title="detail?.name || 'تفاصيل المجموعة'"
    :description="subtitle"
    size="xl"
    @update:model-value="!$event && close()"
  >
    <SkeletonLoader v-if="loading" variant="list" :rows="3" />
    <div v-else-if="detail" class="svm-team">
      <!-- بطاقات المعلومات: صف أفقي ياخد كل العرض بدل التكديس العمودي -->
      <div class="svm-meta">
        <div class="svm-meta-cell">
          <span class="svm-meta-label">المشروع</span>
          <span class="svm-meta-value">{{ detail.project?.name || 'لم يُسجَّل مشروع بعد' }}</span>
        </div>
        <div class="svm-meta-cell">
          <span class="svm-meta-label">نوع المشروع</span>
          <span class="svm-meta-value">{{ detail.project?.types?.join(' · ') || '—' }}</span>
        </div>
        <div class="svm-meta-cell">
          <span class="svm-meta-label">المشرف</span>
          <button v-if="detail.supervisor?.id" type="button" class="svm-meta-link" @click="openSupervisor">
            {{ detail.supervisor.name }} <UserRound :size="14" />
          </button>
          <span v-else class="svm-meta-value">—</span>
        </div>
        <div class="svm-meta-cell">
          <span class="svm-meta-label">قائد المجموعة</span>
          <span class="svm-meta-value">{{ detail.leader?.name || '—' }}</span>
        </div>
        <div class="svm-meta-cell is-wide">
          <span class="svm-meta-label">وصف المشروع</span>
          <span class="svm-meta-desc">{{ detail.project?.description || 'لا يوجد وصف للمشروع' }}</span>
        </div>
      </div>

      <!-- الأعضاء بمعلوماتهم الكاملة -->
      <section class="svm-team-members">
        <header class="svm-team-members-head">
          <h4>أعضاء المجموعة <b>{{ members.length }}</b></h4>
        </header>
        <div class="gr-members">
          <table>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الرقم الجامعي</th>
                <th>مكان التواجد</th>
                <th>واتساب</th>
                <th>البريد</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mem in members" :key="mem.id">
                <td>
                  <span class="svm-member">
                    <span class="gm-av" aria-hidden="true">{{ (mem.student?.name || '?').charAt(0) }}</span>
                    <span class="gr-member-name">{{ mem.student?.name || '—' }}</span>
                    <span v-if="mem.is_leader" class="svm-leader" title="قائد المجموعة" aria-label="قائد المجموعة">
                      <StarIcon :size="13" fill="currentColor" />
                    </span>
                  </span>
                </td>
                <td><span class="mono">{{ mem.student?.university_number || '—' }}</span></td>
                <td>{{ REGIONS[mem.student?.region] || '—' }}</td>
                <td><span class="mono">{{ mem.student?.whatsapp || '—' }}</span></td>
                <td><span class="mono">{{ mem.student?.email || '—' }}</span></td>
              </tr>
              <tr v-if="!members.length"><td colspan="5" class="gr-empty">لا يوجد أعضاء في هذه المجموعة</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <p v-else class="gr-muted">تعذّر تحميل بيانات المجموعة</p>
  </BaseModal>

  <!-- بروفايل المشرف: يفتح من داخل بوب-أب المجموعة — GET /supervisors/{id}/profile -->
  <ProfileModal
    v-model="supervisorOpen"
    kind="supervisor"
    :layer="1"
    :person-id="detail?.supervisor?.id"
    :name="detail?.supervisor?.name || ''"
  />
</template>

<script>
import { Star as StarIcon, UserRound } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import api from '@/services/api'
import { REGIONS } from '@/utils/progressData'

/**
 * نافذة تفاصيل المجموعة — تفتح بيانات المجموعة (GET /teams/{id}):
 * المشروع ونوعه والمشرف وقائد المجموعة + جدول الأعضاء بكامل معلوماتهم.
 * تُستخدم في صفحة الاجتماعات وصفحة مواعيد المناقشات للمشرف.
 */
export default {
  name: 'TeamDetailsModal',

  components: { BaseModal, ProfileModal, StarIcon, UserRound },

  props: {
    /** فتح/إغلاق النافذة (v-model) */
    modelValue: { type: Boolean, default: false },
    /** معرّف المجموعة — يُحمَّل عند الفتح */
    teamId: { type: [Number, String], default: null },
    /** التخصص — يظهر في سطر العنوان الفرعي */
    spec: { type: String, default: '' }
  },

  emits: ['update:modelValue'],

  data() {
    return { REGIONS, loading: false, detail: null, supervisorOpen: false }
  },

  computed: {
    /** أعضاء المجموعة */
    members() {
      return this.detail?.members || []
    },

    /** سطر العنوان الفرعي: الشعبة والتخصص وعدد الأعضاء */
    subtitle() {
      if (!this.detail) return ''
      const parts = []
      if (this.detail.section) parts.push(`شعبة ${this.detail.section}`)
      if (this.spec) parts.push(this.spec)
      parts.push(`${this.members.length} أعضاء`)
      return parts.join(' · ')
    }
  },

  watch: {
    modelValue(v) {
      if (v) this.fetchTeam()
    }
  },

  methods: {
    async fetchTeam() {
      if (!this.teamId) return
      this.loading = true
      this.detail = null
      try {
        const { data } = await api.get(`/teams/${this.teamId}`)
        this.detail = data.data || data
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل بيانات المجموعة')
      } finally {
        this.loading = false
      }
    },

    close() {
      this.$emit('update:modelValue', false)
    },

    /** فتح بروفايل المشرف (ProfileModal) من داخل النافذة */
    openSupervisor() {
      if (!this.detail?.supervisor?.id) return
      this.supervisorOpen = true
    }
  }
}
</script>
