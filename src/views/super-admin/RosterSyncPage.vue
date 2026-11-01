<template>
  <!-- مزامنة كشف الطلبة (الإدارة العامة): رفع نسخة UCAS جديدة كل أسبوع/أسبوعين،
       معاينة الفرق (مضاف/معدّل/محذوف/مُستعاد) قبل الحفظ، مع تراجع خطوة واحدة.
       المحذوفون يُؤرشفون (حذف ناعم قابل للرجوع) لا يُمحون نهائيًا. -->
  <div class="rs">
    <header class="rs-head">
      <div class="rs-head-ic" aria-hidden="true"><RefreshCw :size="20" /></div>
      <div class="rs-head-txt">
        <h2>مزامنة كشف الطلبة</h2>
        <p>ارفع نسخة الكشف المصدّرة من النظام الجامعي، عايِن الفرق، ثم احفظ المزامنة. الطلاب الغائبون عن النسخة الجديدة يُؤرشفون (قابل للرجوع) ولا يُحذفون نهائيًا.</p>
      </div>
    </header>

    <!-- آخر مزامنة + التراجع -->
    <section v-if="latest" :class="['rs-last', latest.status]">
      <div class="rs-last-info">
        <span class="rs-last-ic" aria-hidden="true"><History :size="18" /></span>
        <div>
          <b>آخر مزامنة<template v-if="latest.original_filename">: {{ latest.original_filename }}</template></b>
          <small>
            {{ statusLabel(latest.status) }}
            <template v-if="latest.applied_at"> · {{ formatDate(latest.applied_at) }}</template>
          </small>
        </div>
      </div>
      <div v-if="latest.summary" class="rs-last-chips">
        <span class="rs-chip is-add">{{ latest.summary.added }} مضاف</span>
        <span class="rs-chip is-upd">{{ latest.summary.updated }} معدّل</span>
        <span class="rs-chip is-rem">{{ latest.summary.removed }} مؤرشف</span>
        <span class="rs-chip is-res">{{ latest.summary.restored }} مُستعاد</span>
      </div>
      <BaseButton
        v-if="latest.can_revert"
        variant="danger"
        :icon="Undo2"
        :loading="reverting"
        @click="showRevertConfirm = true"
      >
        تراجع عن آخر مزامنة
      </BaseButton>
    </section>

    <!-- رفع الملف + المعاينة -->
    <section class="rs-card">
      <header class="rs-card-head">
        <h3>رفع نسخة جديدة</h3>
      </header>

      <FileDropzone v-model="files" accept=".xlsx" :max-mb="10" label="اسحب ملف Excel هنا أو اختر من جهازك" />

      <div class="rs-card-actions">
        <BaseButton
          variant="outline"
          :icon="Eye"
          :loading="previewing"
          :disabled="!files.length"
          @click="runPreview"
        >
          معاينة الفرق
        </BaseButton>
        <BaseButton v-if="previewData" variant="ghost" :icon="X" @click="clearPreview">إلغاء المعاينة</BaseButton>
      </div>
    </section>

    <!-- نتيجة المعاينة -->
    <section v-if="previewData" class="rs-card">
      <header class="rs-card-head">
        <h3>معاينة الفرق قبل الحفظ</h3>
      </header>

      <!-- ملخّص -->
      <div class="rs-summary">
        <button type="button" :class="['rs-sum', 'is-add', activeTab === 'added' && 'is-active']" @click="activeTab = 'added'">
          <b>{{ summary.added }}</b><span>مضاف</span>
        </button>
        <button type="button" :class="['rs-sum', 'is-upd', activeTab === 'updated' && 'is-active']" @click="activeTab = 'updated'">
          <b>{{ summary.updated }}</b><span>معدّل</span>
        </button>
        <button type="button" :class="['rs-sum', 'is-rem', activeTab === 'removed' && 'is-active']" @click="activeTab = 'removed'">
          <b>{{ summary.removed }}</b><span>سيُؤرشَف</span>
        </button>
        <button type="button" :class="['rs-sum', 'is-res', activeTab === 'restored' && 'is-active']" @click="activeTab = 'restored'">
          <b>{{ summary.restored }}</b><span>مُستعاد</span>
        </button>
        <div class="rs-sum is-unc"><b>{{ summary.unchanged }}</b><span>بلا تغيير</span></div>
        <div v-if="summary.invalid" class="rs-sum is-err"><b>{{ summary.invalid }}</b><span>أخطاء</span></div>
      </div>

      <!-- تنبيه الأخطاء: الحفظ معطّل حتى تُصحَّح النسخة -->
      <div v-if="hasInvalid" class="rs-warn" role="alert">
        <AlertTriangle :size="18" />
        <div>
          <b>{{ summary.invalid }} صف به أخطاء — صحّح الملف ثم أعد المعاينة.</b>
          <ul>
            <li v-for="row in previewData.invalid.slice(0, 8)" :key="row.row">
              صف {{ row.row }}: {{ row.errors.join(' · ') }}
            </li>
          </ul>
          <small v-if="previewData.invalid.length > 8">…و{{ previewData.invalid.length - 8 }} صفًّا آخر.</small>
        </div>
      </div>

      <!-- جداول حسب التبويب -->
      <div class="rs-table-wrap">
        <EmptyState v-if="!activeRows.length" :icon="Inbox" :title="`لا توجد سجلات ${tabLabel}`" />

        <table v-else class="rs-table">
          <thead>
            <tr>
              <th class="rs-col-num">الرقم الجامعي</th>
              <th>الاسم</th>
              <template v-if="activeTab === 'added' || activeTab === 'restored'">
                <th>التخصص</th>
                <th class="rs-col-s">الجنس</th>
                <th class="rs-col-s">المنطقة</th>
              </template>
              <template v-else-if="activeTab === 'updated'">
                <th>التغييرات</th>
              </template>
              <template v-else>
                <th>الإجراء</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in activeRows" :key="item.university_number">
              <td class="rs-col-num" dir="ltr">{{ item.university_number }}</td>
              <td>{{ item.name }}</td>
              <template v-if="activeTab === 'added' || activeTab === 'restored'">
                <td>{{ item.specialization }}</td>
                <td class="rs-col-s">{{ genderLabel(item.gender) }}</td>
                <td class="rs-col-s">{{ regionLabel(item.region) }}</td>
              </template>
              <template v-else-if="activeTab === 'updated'">
                <td>
                  <span v-for="(c, key) in item.changes" :key="key" class="rs-change" :title="changeTitle(key, c)">
                    {{ fieldLabel(key) }}
                  </span>
                </td>
              </template>
              <template v-else>
                <td class="rs-muted">سيُؤرشَف (قابل للرجوع)</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="rs-card-actions rs-save">
        <BaseButton variant="ghost" @click="clearPreview">إلغاء</BaseButton>
        <BaseButton
          variant="primary"
          :icon="Save"
          :loading="saving"
          :disabled="!canSave"
          @click="showSaveConfirm = true"
        >
          حفظ المزامنة
        </BaseButton>
      </footer>
      <p v-if="previewData && !hasInvalid && !totalChanges" class="rs-nochange">لا توجد فروق بين النسخة المرفوعة والكشف الحالي — لا شيء للحفظ.</p>
    </section>

    <!-- تأكيد الحفظ -->
    <BaseModal v-model="showSaveConfirm" title="تأكيد حفظ المزامنة" size="sm">
      <p class="rs-confirm-txt">
        سيُطبَّق على كشف الطلبة:
      </p>
      <ul class="rs-confirm-list">
        <li v-if="summary.added"><b>{{ summary.added }}</b> طالب جديد سيُضاف</li>
        <li v-if="summary.updated"><b>{{ summary.updated }}</b> طالب ستُحدَّث بياناته</li>
        <li v-if="summary.restored"><b>{{ summary.restored }}</b> طالب سيُستعاد</li>
        <li v-if="summary.removed" class="is-warn"><b>{{ summary.removed }}</b> طالب سيُؤرشَف (يمكن الرجوع عنه)</li>
      </ul>
      <template #footer>
        <BaseButton variant="ghost" @click="showSaveConfirm = false">رجوع</BaseButton>
        <BaseButton variant="primary" :icon="Save" :loading="saving" @click="doSave">تأكيد الحفظ</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد التراجع -->
    <BaseModal v-model="showRevertConfirm" title="تأكيد التراجع" size="sm">
      <p class="rs-confirm-txt">
        سيُلغى أثر آخر مزامنة بالكامل: يُحذف الطلاب الذين أُضيفوا بها، ويُستعاد مَن أُرشِفوا، وتُرجَع البيانات المعدّلة كما كانت. لا يمكن التراجع إلا خطوة واحدة.
      </p>
      <template #footer>
        <BaseButton variant="ghost" @click="showRevertConfirm = false">رجوع</BaseButton>
        <BaseButton variant="danger" :icon="Undo2" :loading="reverting" @click="doRevert">تأكيد التراجع</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { RefreshCw, History, Eye, X, Save, Undo2, AlertTriangle, Inbox } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import { useRosterSyncStore } from '@/stores/rosterSync.store'

const GENDERS = { male: 'طالب', female: 'طالبة' }
const REGIONS = { gaza: 'غزة', middle: 'وسط غزة', south: 'الجنوب' }
const FIELDS = { name: 'الاسم', gender: 'الجنس', region: 'المنطقة', specialization_id: 'التخصص' }
const STATUSES = { applied: 'مطبَّقة', reverted: 'جرى التراجع عنها', superseded: 'تجاوزتها نسخة أحدث' }

export default {
  name: 'RosterSyncPage',
  components: { BaseButton, BaseModal, EmptyState, FileDropzone, RefreshCw, History, AlertTriangle },
  data() {
    return {
      RefreshCw, History, Eye, X, Save, Undo2, AlertTriangle, Inbox,
      files: [],
      previewData: null,
      previewing: false,
      saving: false,
      reverting: false,
      activeTab: 'added',
      showSaveConfirm: false,
      showRevertConfirm: false,
    }
  },
  computed: {
    ...mapState(useRosterSyncStore, ['latest']),
    summary() {
      return this.previewData?.summary || { added: 0, updated: 0, removed: 0, restored: 0, unchanged: 0, invalid: 0 }
    },
    hasInvalid() {
      return this.summary.invalid > 0
    },
    totalChanges() {
      return this.summary.added + this.summary.updated + this.summary.removed + this.summary.restored
    },
    canSave() {
      return !!this.previewData && !this.hasInvalid && this.totalChanges > 0
    },
    activeRows() {
      return this.previewData?.[this.activeTab] || []
    },
    tabLabel() {
      return { added: 'مضافة', updated: 'معدّلة', removed: 'للأرشفة', restored: 'مُستعادة' }[this.activeTab]
    },
  },
  async mounted() {
    try {
      await this.fetchLatest()
    } catch {
      /* لا شيء لعرضه بعد */
    }
  },
  methods: {
    ...mapActions(useRosterSyncStore, ['fetchLatest', 'preview', 'confirm', 'revert']),
    genderLabel: (v) => GENDERS[v] || '—',
    regionLabel: (v) => REGIONS[v] || '—',
    fieldLabel: (k) => FIELDS[k] || k,
    statusLabel: (s) => STATUSES[s] || s,
    changeTitle(key, c) {
      if (key === 'gender') return `${this.genderLabel(c.from)} ← ${this.genderLabel(c.to)}`
      if (key === 'region') return `${this.regionLabel(c.from)} ← ${this.regionLabel(c.to)}`
      if (key === 'specialization_id') return 'تغيّر التخصص'
      return `${c.from ?? '—'} ← ${c.to ?? '—'}`
    },
    formatDate(iso) {
      try {
        return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      } catch {
        return iso
      }
    },
    async runPreview() {
      if (!this.files.length) return
      this.previewing = true
      try {
        this.previewData = await this.preview(this.files[0])
        this.activeTab = ['added', 'updated', 'removed', 'restored'].find((t) => this.previewData[t]?.length) || 'added'
        if (this.hasInvalid) this.$toast?.warning(`المعاينة تمّت مع ${this.summary.invalid} صف به أخطاء — صحّح الملف قبل الحفظ.`)
      } catch (e) {
        this.$toast?.error(e?.normalized?.message || 'تعذّرت قراءة الملف — تأكد أنه بصيغة xlsx وبالأعمدة الصحيحة.')
      } finally {
        this.previewing = false
      }
    },
    clearPreview() {
      this.previewData = null
      this.files = []
    },
    async doSave() {
      this.saving = true
      try {
        const rows = this.previewData.valid
        const res = await this.confirm(rows, this.files[0]?.name || null)
        const s = res.summary
        this.$toast?.success(`تمت المزامنة: ${s.added} مضاف · ${s.updated} معدّل · ${s.removed} مؤرشف · ${s.restored} مُستعاد.`)
        this.showSaveConfirm = false
        this.clearPreview()
      } catch (e) {
        this.$toast?.error(e?.normalized?.message || 'تعذّر حفظ المزامنة.')
      } finally {
        this.saving = false
      }
    },
    async doRevert() {
      this.reverting = true
      try {
        await this.revert()
        this.$toast?.success('تم التراجع عن آخر مزامنة.')
        this.showRevertConfirm = false
      } catch (e) {
        this.$toast?.error(e?.normalized?.message || 'تعذّر التراجع.')
      } finally {
        this.reverting = false
      }
    },
  },
}
</script>

<style scoped>
.rs { display: flex; flex-direction: column; gap: 16px; }

.rs-head { display: flex; align-items: flex-start; gap: 12px; }
.rs-head-ic {
  flex: none; width: 40px; height: 40px; display: grid; place-items: center;
  border-radius: 8px; color: var(--ucas-blue);
  background: color-mix(in srgb, var(--ucas-blue) 10%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--ucas-blue) 20%, transparent);
}
.rs-head-txt h2 { font-size: 20px; font-weight: 800; color: var(--color-text-900); margin: 0; }
.rs-head-txt p { font-size: 13px; color: var(--color-text-600); margin: 4px 0 0; line-height: 1.6; max-width: 70ch; }

/* آخر مزامنة */
.rs-last {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 12px 16px; border-radius: 8px;
  background: var(--color-surface); border: 1px solid var(--color-border);
}
.rs-last.reverted { opacity: .75; }
.rs-last-info { display: flex; align-items: center; gap: 10px; flex: 1 1 240px; }
.rs-last-ic { color: var(--ucas-blue); flex: none; }
.rs-last-info b { display: block; font-size: 14px; color: var(--color-text-900); }
.rs-last-info small { font-size: 12px; color: var(--color-text-600); }
.rs-last-chips { display: flex; gap: 6px; flex-wrap: wrap; }

.rs-chip { font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.rs-chip.is-add { color: var(--color-success); background: var(--color-success-bg); }
.rs-chip.is-upd { color: var(--color-warning-text); background: var(--color-warning-bg); }
.rs-chip.is-rem { color: var(--color-error); background: var(--color-error-bg); }
.rs-chip.is-res { color: var(--color-info); background: var(--color-info-bg); }

/* بطاقات */
.rs-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; padding: 18px; }
.rs-card-head { margin-bottom: 14px; }
.rs-card-head h3 { font-size: 16px; font-weight: 800; color: var(--color-text-900); margin: 0; }
.rs-card-actions { display: flex; gap: 10px; align-items: center; margin-top: 14px; flex-wrap: wrap; }
.rs-save { justify-content: flex-end; border-top: 1px solid var(--color-border-soft); padding-top: 14px; }
.rs-nochange { margin: 8px 0 0; font-size: 12.5px; color: var(--color-text-600); text-align: center; }

/* ملخّص الفرق — أزرار تبويب */
.rs-summary { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.rs-sum {
  flex: 1 1 96px; min-width: 96px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 12px 8px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-surface); cursor: default; transition: border-color .2s ease, box-shadow .2s ease;
}
button.rs-sum { cursor: pointer; }
.rs-sum b { font-size: 22px; font-weight: 800; line-height: 1; }
.rs-sum span { font-size: 12px; color: var(--color-text-600); }
button.rs-sum.is-active { box-shadow: inset 0 -3px 0 currentColor; }
.rs-sum.is-add b { color: var(--color-success); }
.rs-sum.is-upd b { color: var(--color-warning-text); }
.rs-sum.is-rem b { color: var(--color-error); }
.rs-sum.is-res b { color: var(--color-info); }
.rs-sum.is-unc b { color: var(--color-text-600); }
.rs-sum.is-err b { color: var(--color-error); }

/* تنبيه الأخطاء */
.rs-warn {
  display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px;
  padding: 12px 14px; border-radius: 8px;
  color: var(--color-warning-text); background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
}
.rs-warn b { font-size: 13px; }
.rs-warn ul { margin: 6px 0 0; padding-inline-start: 18px; font-size: 12px; line-height: 1.6; }

/* الجدول */
.rs-table-wrap { overflow-x: auto; }
.rs-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rs-table th, .rs-table td { text-align: start; padding: 9px 10px; border-bottom: 1px solid var(--color-border-soft); }
.rs-table th { font-weight: 700; color: var(--color-text-600); background: var(--color-bg-subtle, var(--color-border-soft)); white-space: nowrap; }
.rs-table tbody tr:hover { background: color-mix(in srgb, var(--ucas-blue) 4%, transparent); }
.rs-col-num { white-space: nowrap; font-variant-numeric: tabular-nums; }
.rs-col-s { width: 90px; }
.rs-muted { color: var(--color-text-600); }
.rs-change {
  display: inline-block; margin: 2px 4px 2px 0; font-size: 11.5px; font-weight: 700; padding: 2px 8px;
  border-radius: 999px; color: var(--color-warning-text); background: var(--color-warning-bg);
}

/* نوافذ التأكيد */
.rs-confirm-txt { font-size: 13.5px; color: var(--color-text-700); line-height: 1.7; margin: 0; }
.rs-confirm-list { margin: 10px 0 0; padding-inline-start: 18px; font-size: 13.5px; line-height: 1.9; color: var(--color-text-700); }
.rs-confirm-list .is-warn { color: var(--color-error); }
</style>
