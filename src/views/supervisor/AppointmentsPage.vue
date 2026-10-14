<template>
  <!-- مواعيد المناقشات للمشرف بنمط صفحة الإدارة العامة (جدول المشرف بعد النشر): مواعيد مجموعاته المنشورة فقط،
       بلا أسماء المناقشين (مخفية عن المشرفين والطلاب) — سلايدر + شريط الملخص الأخضر -->
  <div class="dash">
    <header class="dash-head">
      <h2 class="dash-title">مواعيد المناقشات</h2>
    </header>

    <section class="dash-card">
      <div class="dash-card-head">
        <h3>جدول مناقشات مجموعاتي</h3>
        <span class="dash-chip">{{ rows.length }} مناقشة</span>
      </div>

      <p v-if="discussionsLoading" class="pt-muted">جارٍ التحميل…</p>
      <SlideTable v-else :rows="rows" label="المناقشات">
        <template #default="{ rows: shown }">
          <div class="gr-table-wrap">
            <table class="gr-table">
              <thead><tr><th>الشعبة</th><th>المجموعة</th><th>المشروع</th><th>الطلاب وأماكن تواجدهم</th><th>التاريخ</th><th>الوقت</th><th>القاعة</th></tr></thead>
              <tbody>
                <tr v-for="r in shown" :key="r.id" class="gr-row">
                  <td class="ad-nowrap"><span class="ev-sec">شعبة {{ r.section }}</span></td>
                  <td>{{ r.team }}</td>
                  <td>{{ r.project }}</td>
                  <td>
                    <ul class="dp-students">
                      <li v-for="m in r.members" :key="m.id">{{ m.name }} <span class="pt-muted">— {{ REGIONS[m.region] || "غير محدد" }}</span></li>
                      <li v-if="!r.members.length" class="pt-muted">—</li>
                    </ul>
                  </td>
                  <td><span class="mono">{{ r.date }}</span></td>
                  <td><span class="mono">{{ r.time }}</span></td>
                  <td><bdi>{{ r.room }}</bdi></td>
                </tr>
                <tr v-if="!rows.length"><td colspan="7" class="gr-empty">لم تُنشر مواعيد مناقشات لمجموعاتك بعد</td></tr>
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
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import SlideTable from '@/components/ui/SlideTable.vue'
import { useDiscussionsStore } from '@/stores/discussions.store'
import { useAuthStore } from '@/stores/auth.store'
import { loadGroups } from '@/services/adminData'
import { REGIONS } from '@/utils/progressData'

export default {
  name: 'SupervisorAppointmentsPage',

  components: { SlideTable },

  data() {
    return { REGIONS, members: {} }
  },

  computed: {
    ...mapState(useDiscussionsStore, ['discussions', 'discussionsLoading']),
    ...mapState(useAuthStore, ['user']),

    /** GET /discussions — المنشورة (confirmed) لمجموعات المشرف فقط، مرتبة بالموعد */
    rows() {
      const me = this.user?.id
      return this.discussions
        .filter((d) => d.status === 'confirmed' && (d.supervisor_id === me || d.project?.team?.supervisor_id === me))
        .map((d) => ({
          id: d.id,
          section: d.project?.team?.section || '—',
          team: d.project?.team?.name || '—',
          project: d.project?.name || '—',
          members: this.members[d.project?.team?.id ?? d.project?.team_id] || [],
          date: (d.discussion_date || '').slice(0, 10),
          time: (d.discussion_time || '').slice(0, 5),
          room: d.place
        }))
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    }
  },

  created() {
    this.fetchDiscussions().catch(() => this.$toast?.error('تعذّر تحميل مواعيد المناقشات'))
    // طلاب كل مجموعة ومكان تواجدهم (GET /progress — مجموعات المشرف فقط)
    loadGroups().then((gs) => { this.members = Object.fromEntries(gs.map((g) => [g.id, g.members])) }).catch(() => {})
  },

  methods: {
    ...mapActions(useDiscussionsStore, ['fetchDiscussions'])
  }
}
</script>
