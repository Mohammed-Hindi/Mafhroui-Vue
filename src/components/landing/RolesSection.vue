<template>
  <!-- ميزات المنصة بنمط "ما يميز الكلية!" (195926): خلفية التدرج، أيقونات خطية بيضاء، عناوين بيضاء -->
  <section class="us-section us-feature-band">
    <div class="us-wrap">
      <h2 class="us-title reveal">ما يميز منصة مسار!</h2>
      <div class="us-features">
        <article v-for="role in roles" :key="role.title" class="us-feature reveal">
          <component :is="role.icon" :size="68" :stroke-width="1.2" />
          <h3>{{ role.title }}</h3>
          <ul>
            <li v-for="f in role.features" :key="f">{{ f }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { GraduationCap, ShieldCheck, UserCheck } from 'lucide-vue-next'

/* محتوى تعريفي ثابت — ليس بيانات أعمال */
const roles = [
  {
    title: 'لجنة الإشراف',
    icon: ShieldCheck,
    features: ['إدارة الفصول والمجموعات والمشرفين', 'جدولة مواعيد المناقشات ونشرها', 'اعتماد التقارير النهائية وأرشفة المشاريع', 'تعيين أفضل مشاريع التخرج']
  },
  {
    title: 'المشرف',
    icon: UserCheck,
    features: ['متابعة مجموعاته ومهامها وتقدّمها', 'مراجعة المقترحات والتقارير النهائية', 'الاجتماعات والتكليفات والإعلانات', 'تقييم الطلاب بنماذج الكلية']
  },
  {
    title: 'الطالب',
    icon: GraduationCap,
    features: ['تقديم المقترح والتقرير النهائي', 'لوحة مهام الفريق والملاحظات', 'الاجتماعات والإعلانات والملفات', 'مساعد آلي للإجابة عن الاستفسارات']
  }
]
</script>
