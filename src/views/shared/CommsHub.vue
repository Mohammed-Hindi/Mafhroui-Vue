<template>
  <!-- صفحة التواصل الموحّدة (#39): دمج «التكليفات والإعلانات» (الإرسال) و«الإعلانات والملفات» (الوارد)
       بمبدّل أنيق واحد بدل صفحتين متداخلتين -->
  <div class="dash comms-hub">
    <div class="th-seg" role="tablist" aria-label="التواصل">
      <span class="th-seg-thumb" :style="{ insetInlineStart: tab === 'outbox' ? '4px' : '50%' }" aria-hidden="true" />
      <button type="button" role="tab" :aria-selected="tab === 'outbox'" :class="['th-seg-btn', tab === 'outbox' && 'is-active']" @click="setTab('outbox')">
        <Send :size="16" /> التكليفات والإعلانات
      </button>
      <button type="button" role="tab" :aria-selected="tab === 'inbox'" :class="['th-seg-btn', tab === 'inbox' && 'is-active']" @click="setTab('inbox')">
        <Inbox :size="16" /> الإعلانات والملفات
      </button>
    </div>

    <KeepAlive>
      <Assignments v-if="tab === 'outbox'" />
      <AnnouncementsInbox v-else />
    </KeepAlive>
  </div>
</template>

<script>
import { Inbox, Send } from 'lucide-vue-next'
import Assignments from '@/views/super-admin/AssignmentsPage.vue'
import AnnouncementsInbox from '@/views/super-admin/AnnouncementsDesk.vue'

export default {
  name: 'CommsHub',

  components: { Inbox, Send, Assignments, AnnouncementsInbox },

  data() {
    // يبدأ على «التكليفات والإعلانات»؛ ?tab=inbox يفتح الوارد (تحويل من مسار الإعلانات القديم)
    return { tab: 'outbox' }
  },

  created() {
    if (this.$route.query.tab === 'inbox') this.tab = 'inbox'
  },

  methods: {
    setTab(tab) {
      if (this.tab === tab) return
      this.tab = tab
      const query = tab === 'inbox' ? { tab: 'inbox' } : {}
      this.$router.replace({ query }).catch(() => {})
    }
  }
}
</script>

<style scoped>
/* مبدّل مقسّم حديث: حاوية كبسولة + مؤشّر منزلق خلف الوجه النشط (مطابق لصفحة المهام) */
.th-seg {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  width: min(460px, 100%);
  margin: 0 0 18px;
  padding: 4px;
  border-radius: var(--radius-pill, 999px);
  background: var(--color-border-soft, #eef1f5);
  box-shadow: inset 0 0 0 1px var(--color-border, #e2e6ec);
}

.th-seg-thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  border-radius: var(--radius-pill, 999px);
  background: var(--color-surface, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: inset-inline-start var(--dur-base, 0.22s) cubic-bezier(0.4, 0, 0.2, 1);
}

.th-seg-btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  border-radius: var(--radius-pill, 999px);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-600, #5b6472);
  cursor: pointer;
  transition: color var(--dur-fast, 0.15s) ease;
}

.th-seg-btn.is-active {
  color: var(--color-primary-700, #004b8d);
}
</style>
