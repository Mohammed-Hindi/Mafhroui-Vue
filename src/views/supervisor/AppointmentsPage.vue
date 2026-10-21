<template>
  <!-- مواعيد المناقشات للمشرف بنمط البوابة: كارت واحد فيه جدول يملأ الشاشة ورأسه ثابت أثناء التمرير،
       الشعبة كزر يفتح تفاصيل المجموعة (المشروع + الأعضاء)، والموعد في خانة واحدة + شريط الملخص الأخضر -->
  <div class="dash aps-page">
    <section class="gr gr-card sup-tall-card">
      <div class="sup-tall-slide">
        <SkeletonLoader v-if="discussionsLoading" :rows="4" height="70px" />
        <SlideTable v-else :rows="rows" :size="5" label="المناقشات">
          <template #default="{ rows: shown }">
            <div class="gr-table-wrap">
              <table class="gr-table aps-table">
                <thead>
                  <tr>
                    <th class="hm-center">الشعبة</th>
                    <th>المجموعة</th>
                    <th>المشروع</th>
                    <th>الطلاب وأماكن تواجدهم</th>
                    <th class="hm-center">الموعد</th>
                    <th class="hm-center">القاعة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in shown" :key="r.id" class="gr-row">
                    <!-- الشعبة: زر يفتح تفاصيل المجموعة -->
                    <td class="hm-center">
                      <button type="button" class="ev-sec-chip aps-sec" :title="`تفاصيل ${r.team}`" @click="openTeam(r.teamId)">شعبة {{ r.section }}</button>
                    </td>
                    <td><b>{{ r.team }}</b></td>
                    <td class="ad-proj-cell">
                      <b>{{ r.project }}</b>
                      <span v-if="r.spec" class="ad-proj-spec">{{ r.spec }}</span>
                    </td>
                    <td>
                      <ul class="dp-students">
                        <li v-for="m in r.members" :key="m.id">{{ m.name }} <span class="pt-muted">— {{ REGIONS[m.region] || 'غير محدد' }}</span></li>
                        <li v-if="!r.members.length" class="pt-muted">—</li>
                      </ul>
                    </td>
                    <!-- الموعد: التاريخ بارز والوقت سطر ثانوي -->
                    <td class="hm-center">
                      <span class="mono aps-date">{{ r.date }}</span>
                      <span class="svm-when">{{ r.time }}</span>
                    </td>
                    <td class="hm-center"><bdi>{{ r.room }}</bdi></td>
                  </tr>
                  <tr v-if="!rows.length"><td colspan="6" class="gr-empty">لم تُنشر مواعيد مناقشات لمجموعاتك بعد</td></tr>
                </tbody>
              </table>
            </div>
          </template>
          <template #after>
            <div class="gr-sumbar dp-sumbar">
              <span>عدد المناقشات: {{ rows.length }}</span>
              <span>القاعات: {{ [...new Set(rows.map((r) => r.room))].join('، ') || '—' }}</span>
              <span>الأيام: {{ new Set(rows.map((r) => r.date)).size }}</span>
            </div>
          </template>
        </SlideTable>
      </div>
    </section>

    <!-- تفاصيل المجموعة (مشتركة مع صفحة الاجتماعات) -->
    <TeamDetailsModal v-model="teamOpen" :team-id="teamId" :spec="specOf(teamId)" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import SlideTable from '@/components/ui/SlideTable.vue'
import TeamDetailsModal from '@/components/shared/TeamDetailsModal.vue'
import { useDiscussionsStore } from '@/stores/discussions.store'
import { useAuthStore } from '@/stores/auth.store'
import { loadGroups } from '@/services/adminData'
import { REGIONS } from '@/utils/progressData'

export default {
  name: 'SupervisorAppointmentsPage',

  components: { SlideTable, TeamDetailsModal },

  data() {
    return { REGIONS, groups: [], teamOpen: false, teamId: null }
  },

  computed: {
    ...mapState(useDiscussionsStore, ['discussions', 'discussionsLoading']),
    ...mapState(useAuthStore, ['user']),

    /** GET /discussions — المنشورة (confirmed) لمجموعات المشرف فقط، مرتبة بالموعد */
    rows() {
      const me = this.user?.id
      return this.discussions
        .filter((d) => d.status === 'confirmed' && (d.supervisor_id === me || d.project?.team?.supervisor_id === me))
        .map((d) => {
          const teamId = d.project?.team?.id ?? d.project?.team_id ?? null
          const g = this.groups.find((x) => x.id === teamId)
          return {
            id: d.id,
            teamId,
            section: d.project?.team?.section || g?.section || '—',
            team: d.project?.team?.name || g?.teamName || '—',
            project: d.project?.name || '—',
            spec: g?.spec || '',
            members: g?.members || [],
            date: (d.discussion_date || '').slice(0, 10),
            time: (d.discussion_time || '').slice(0, 5),
            room: d.place
          }
        })
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    },

    /** تخصص المجموعة (لسطر العنوان الفرعي في نافذة التفاصيل) */
    specOf(teamId) {
      return this.groups.find((g) => g.id === teamId)?.spec || ''
    }
  },

  created() {
    this.fetchDiscussions().catch(() => this.$toast?.error('تعذّر تحميل مواعيد المناقشات'))
    // مجموعات المشرف (GET /progress) — الأعضاء وأماكن تواجدهم وبيانات التخصص
    loadGroups().then((gs) => { this.groups = gs }).catch(() => {})
  },

  methods: {
    ...mapActions(useDiscussionsStore, ['fetchDiscussions']),

    /** فتح تفاصيل المجموعة (النافذة المشتركة مع صفحة الاجتماعات) */
    openTeam(teamId) {
      if (!teamId) return
      this.teamId = teamId
      this.teamOpen = true
    }
  }
}
</script>
