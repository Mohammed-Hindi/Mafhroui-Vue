<template>
  <!-- صفحة المهام الموحّدة (#38): مبدّل أنيق بين «مهامي» (المسندة إليّ) و«مهام طلابي» (مهام مجموعاتي)،
       يُظهر المبدّل فقط لمن عنده الوجهان (المشرف)؛ غيره يرى مهامه فقط بلا مبدّل -->
  <div class="dash tasks-hub">
    <div v-if="hasStudentTasks" class="th-seg" role="tablist" aria-label="تصنيف المهام">
      <span class="th-seg-thumb" :style="{ insetInlineStart: tab === 'mine' ? '4px' : '50%' }" aria-hidden="true" />
      <button type="button" role="tab" :aria-selected="tab === 'mine'" :class="['th-seg-btn', tab === 'mine' && 'is-active']" @click="setTab('mine')">
        <Inbox :size="16" /> مهامي
      </button>
      <button type="button" role="tab" :aria-selected="tab === 'students'" :class="['th-seg-btn', tab === 'students' && 'is-active']" @click="setTab('students')">
        <Users :size="16" /> مهام طلابي
      </button>
    </div>

    <!-- يُركَّب القسم النشط فقط ليحمّل بياناته عند الحاجة -->
    <KeepAlive>
      <StudentTasks v-if="hasStudentTasks && tab === 'students'" />
      <MyTasks v-else />
    </KeepAlive>
  </div>
</template>

<script>
import { Inbox, Users } from 'lucide-vue-next'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import MyTasks from '@/views/committee/MyTasksPage.vue'
import StudentTasks from '@/views/supervisor/TasksPage.vue'

export default {
  name: 'TasksHub',

  components: { Inbox, Users, MyTasks, StudentTasks },

  data() {
    // المشرف يبدأ على «مهام طلابي» (ما كانت صفحة «المهام»)، وافتتاح ?tab=mine يفتح «مهامي»
    return { tab: 'students' }
  },

  computed: {
    ...mapState(useAuthStore, ['user']),

    /** «مهام طلابي» للمشرف فقط (صاحب المجموعات)؛ غيره يرى «مهامي» فقط */
    hasStudentTasks() {
      return this.user?.role === 'supervisor'
    }
  },

  created() {
    if (!this.hasStudentTasks || this.$route.query.tab === 'mine') this.tab = 'mine'
  },

  methods: {
    setTab(tab) {
      if (this.tab === tab) return
      this.tab = tab
      // يحافظ على الوجه المختار عند التحديث/المشاركة دون إعادة تحميل
      const query = tab === 'mine' ? { tab: 'mine' } : {}
      this.$router.replace({ query }).catch(() => {})
    }
  }
}
</script>

<style scoped>
/* مبدّل مقسّم حديث: حاوية كبسولة + مؤشّر منزلق خلف الوجه النشط */
.th-seg {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  width: min(340px, 100%);
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
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-600, #5b6472);
  cursor: pointer;
  transition: color var(--dur-fast, 0.15s) ease;
}

.th-seg-btn.is-active {
  color: var(--color-primary-700, #004b8d);
}
</style>
