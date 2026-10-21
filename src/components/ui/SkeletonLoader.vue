<template>
  <!-- صفوف جدول وهمية: تُوضع داخل <tbody> مكان صف "جارٍ التحميل" -->
  <template v-if="variant === 'table'">
    <tr v-for="n in rows" :key="n" class="sk-tr" aria-hidden="true">
      <td v-for="c in cols" :key="c"><span class="sk" :style="{ width: cellWidth(n, c) }" /></td>
    </tr>
  </template>

  <!-- بطاقات وهمية: أيقونة + سطران -->
  <div v-else-if="variant === 'cards'" class="sk-cards" role="status" aria-label="جارٍ التحميل">
    <div v-for="n in rows" :key="n" class="sk-card">
      <span class="sk sk-circle" />
      <div class="sk-card-body">
        <span class="sk" style="width: 60%" />
        <span class="sk" style="width: 90%" />
        <span class="sk" style="width: 40%" />
      </div>
    </div>
  </div>

  <!-- قائمة وهمية: صفوف المراسلات (دائرة + عنوان + مقتطف) — نفس شكل الصف الحقيقي -->
  <div v-else-if="variant === 'list'" class="sk-list" role="status" aria-label="جارٍ التحميل">
    <div v-for="n in rows" :key="n" class="sk-list-row">
      <span class="sk sk-dot" />
      <div class="sk-list-body">
        <span class="sk" :style="{ width: `${72 - (n % 3) * 14}%` }" />
        <span class="sk" style="width: 92%" />
        <span class="sk sk-thin" />
      </div>
    </div>
  </div>

  <!-- لوحة مهام وهمية: أعمدة كانبان برأس وعدّاد وبطاقات — نفس شكل اللوحة الحقيقية -->
  <div v-else-if="variant === 'board'" class="sk-board" role="status" aria-label="جارٍ التحميل">
    <div v-for="c in cols" :key="c" class="sk-col">
      <div class="sk-col-head">
        <span class="sk" :style="{ width: `${36 + (c % 3) * 8}%` }" />
        <span class="sk sk-col-count" />
      </div>
      <div class="sk-col-body">
        <div v-for="n in rows" :key="n" class="sk-task">
          <span class="sk" :style="{ width: `${88 - (n % 2) * 20}%` }" />
          <span class="sk" :style="{ width: `${66 - (n % 3) * 12}%` }" />
          <div class="sk-task-foot">
            <span class="sk sk-avatar" />
            <span class="sk" style="width: 30%" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="sk-lines" role="status" aria-label="جارٍ التحميل">
    <span
      v-for="n in rows"
      :key="n"
      class="sk"
      :style="{ height, width: n === rows && rows > 1 ? '70%' : '100%' }"
    />
  </div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    rows: { type: Number, default: 3 },
    height: { type: String, default: '16px' },
    // lines | cards | table | board | list
    variant: { type: String, default: 'lines' },
    cols: { type: Number, default: 4 }
  },
  methods: {
    // أطوال متفاوتة ثابتة حتى لا تبدو الصفوف متطابقة
    cellWidth(n, c) {
      return `${45 + ((n * 7 + c * 13) % 45)}%`
    }
  }
}
</script>
