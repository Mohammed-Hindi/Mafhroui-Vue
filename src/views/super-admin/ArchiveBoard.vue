<template>
  <!-- أرشيف المشاريع للإدارة العامة — بيانات تجريبية (placeholder):
       أرشفة كل مشاريع الفصل دفعة واحدة + تمييز المشاريع (نجمة) لعرضها في المعرض حسب الدرجة وطلاب/طالبات -->
  <div class="dash">
    <header class="dash-head">
      <h2 class="dash-title">أرشيف المشاريع</h2>
      <div class="gr-tools">
        <button type="button" class="gr-tool is-primary" :disabled="!unarchived || archiving" @click="archiveAll">
          <Archive :size="16" /> {{ unarchived ? `أرشفة كل المشاريع (${unarchived})` : 'كل المشاريع مؤرشفة' }}
        </button>
      </div>
    </header>

    <section class="hm-stats" aria-label="ملخص الأرشيف">
      <div class="hm-stat"><span class="hm-stat-label">المشاريع</span><span class="hm-stat-value">{{ projects.length }}</span><span class="hm-stat-split">مؤرشف <b>{{ projects.length - unarchived }}</b></span></div>
      <div class="hm-stat"><span class="hm-stat-label">المميّزة للمعرض</span><span class="hm-stat-value">{{ featured.length }}</span><span class="hm-stat-split">من {{ projects.length }} مشروع</span></div>
      <div v-for="(label, key) in DEGREES" :key="key" class="hm-stat">
        <span class="hm-stat-label">{{ label }}</span>
        <span class="hm-stat-value">{{ projects.filter((p) => p.degree === key).length }}</span>
        <span class="hm-stat-split">مميّز <b>{{ featured.filter((p) => p.degree === key).length }}</b></span>
      </div>
    </section>

    <nav class="hm-tabs ar-tabs" aria-label="العرض">
      <button type="button" :class="view === 'list' && 'is-active'" @click="view = 'list'">كل المشاريع</button>
      <button type="button" :class="view === 'gallery' && 'is-active'" @click="view = 'gallery'">المعرض <span>{{ featured.length }}</span></button>
    </nav>

    <section class="gr-filters" aria-label="تصفية المشاريع">
      <label class="gr-search"><Search :size="16" /><input v-model.trim="q" type="search" placeholder="بحث بالمشروع أو الشعبة أو المشرف…"></label>
      <select v-model="f.degree" class="gr-select" aria-label="الدرجة"><option value="">دبلوم وبكالوريوس</option><option v-for="(l, k) in DEGREES" :key="k" :value="k">{{ l }}</option></select>
      <select v-model="f.gender" class="gr-select" aria-label="الفئة"><option value="">طلاب وطالبات</option><option value="male">طلاب</option><option value="female">طالبات</option></select>
      <select v-model="f.type" class="gr-select" aria-label="نوع المشروع"><option value="">كل الأنواع</option><option v-for="t in types" :key="t" :value="t">{{ t }}</option></select>
      <select v-if="view === 'list'" v-model="f.featured" class="gr-select" aria-label="التمييز"><option value="">المميّزة وغيرها</option><option value="yes">المميّزة فقط</option><option value="no">غير المميّزة</option></select>
    </section>

    <!-- كل المشاريع -->
    <div v-if="view === 'list'" class="pt-wrap">
      <table class="pt">
        <thead><tr><th>الشعبة</th><th>المشروع</th><th>النوع</th><th>الدرجة</th><th>الفئة</th><th>المشرف</th><th>الحالة</th><th>مميّز</th></tr></thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id">
            <td class="pt-strong">{{ p.section }}</td>
            <td>{{ p.project }}</td>
            <td>{{ p.type }}</td>
            <td>{{ DEGREES[p.degree] }}</td>
            <td>{{ p.gender === 'female' ? 'طالبات' : 'طلاب' }}</td>
            <td>{{ p.supName }}</td>
            <td><span :class="['rv-pill', p.archived ? 'is-approved' : 'is-pending']">{{ p.archived ? 'مؤرشف' : 'غير مؤرشف' }}</span></td>
            <td>
              <button type="button" :class="['ar-star', p.featured && 'is-on']" :aria-pressed="p.featured" :title="p.featured ? 'إلغاء التمييز' : 'تمييز للمعرض'" @click="toggleFeatured(p)">
                <Star :size="17" :fill="p.featured ? 'currentColor' : 'none'" />
              </button>
            </td>
          </tr>
          <tr v-if="!rows.length"><td colspan="8" class="gr-empty">{{ loading ? 'جارٍ التحميل…' : 'لا توجد مشاريع مطابقة' }}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- المعرض: المميّزة مقسّمة حسب الدرجة × طلاب/طالبات -->
    <div v-else class="ar-gallery">
      <section v-for="b in galleryBlocks" :key="b.key" class="dash-card">
        <div class="dash-card-head"><h3>{{ b.label }}</h3><span class="dash-chip">{{ b.items.length }} مشروع</span></div>
        <ul class="ar-cards">
          <li v-for="p in b.items" :key="p.id">
            <Star :size="15" fill="currentColor" class="ar-card-star" />
            <b>{{ p.project }}</b>
            <span class="pt-muted">{{ p.type }} · شعبة {{ p.section }}</span>
            <span class="pt-muted">{{ p.supName }} · {{ p.members.map((m) => m.name).join('، ') }}</span>
          </li>
        </ul>
      </section>
      <p v-if="!galleryBlocks.length" class="dash-empty">لا توجد مشاريع مميّزة مطابقة — ميّز المشاريع بالنجمة من تبويب "كل المشاريع".</p>
    </div>
  </div>
</template>

<script>
import { Archive, Search, Star } from 'lucide-vue-next'
import { DEGREES } from '@/utils/progressData'
import api from '@/services/api'
import { groupGender } from '@/services/adminData'
import { loadGroups } from '@/services/adminData'

export default {
  name: 'ArchiveBoard',

  components: { Archive, Search, Star },

  data() {
    return {
      DEGREES,
      view: 'list',
      q: '',
      f: { degree: '', gender: '', type: '', featured: '' },
      // نسخة محلية قابلة للتعديل (النجمة والأرشفة)
      loading: true,
      archiving: false,
      projects: []
    }
  },

  async created() {
    try {
      // مشاريع الفصل الحالي (المجموعات التي لها مشروع)
      this.projects = (await loadGroups()).filter((g) => g.projectId).map((g) => ({ ...g, gender: groupGender(g), archived: g.projectStatus === 'completed' }))
    } catch {
      this.$toast?.error('تعذّر تحميل المشاريع')
    } finally {
      this.loading = false
    }
  },

  computed: {
    types() {
      return [...new Set(this.projects.map((p) => p.type))]
    },
    unarchived() {
      return this.projects.filter((p) => !p.archived).length
    },
    featured() {
      return this.projects.filter((p) => p.featured)
    },
    filtered() {
      const { degree, gender, type } = this.f
      return this.projects.filter((p) =>
        (!this.q || `${p.project} ${p.section} ${p.supName}`.includes(this.q)) &&
        (!degree || p.degree === degree) && (!gender || p.gender === gender) && (!type || p.type === type)
      )
    },
    rows() {
      return this.filtered.filter((p) => !this.f.featured || (this.f.featured === 'yes') === !!p.featured)
    },
    galleryBlocks() {
      return Object.entries(DEGREES).flatMap(([d, dl]) => [['male', 'طلاب'], ['female', 'طالبات']].map(([gk, gl]) => ({
        key: `${d}-${gk}`,
        label: `${dl} — ${gl}`,
        items: this.filtered.filter((p) => p.featured && p.degree === d && p.gender === gk)
      }))).filter((b) => b.items.length)
    }
  },

  methods: {
    /** أرشفة = إكمال المشروع (POST /projects/{id}/complete) لكل مشروع غير مكتمل */
    async archiveAll() {
      const pending = this.projects.filter((p) => !p.archived)
      if (!window.confirm(`سيتم أرشفة ${pending.length} مشروعًا من مشاريع الفصل (تحويلها لمكتملة). متابعة؟`)) return
      this.archiving = true
      let ok = 0
      for (const p of pending) {
        try {
          await api.post(`/projects/${p.projectId}/complete`)
          p.archived = true
          ok += 1
        } catch {
          // يبقى غير مؤرشف
        }
      }
      this.archiving = false
      this.$toast?.[ok === pending.length ? 'success' : 'error'](`أُرشف ${ok} من ${pending.length} مشروعًا`)
    },

    /** تمييز المشروع للمعرض (PATCH /projects/{id} is_featured) */
    async toggleFeatured(p) {
      p.featured = !p.featured
      try {
        await api.patch(`/projects/${p.projectId}`, { is_featured: p.featured })
      } catch (err) {
        p.featured = !p.featured
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث التمييز')
      }
    }
  }
}
</script>
