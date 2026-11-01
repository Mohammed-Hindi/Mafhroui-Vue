// حركة أقسام صفحة الهبوط بمكتبة GSAP (ScrollTrigger فقط): دخول هادئ رسمي (fade-up)
// بلا رسم أيقونات (drawSVG) ولا تقطيع نصوص — تُبنى داخل gsap.matchMedia فتُلغى عند المغادرة،
// وتُتخطّى كاملة لمن فعّل "تقليل الحركة".
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * @param {import('vue').Ref<HTMLElement>} rootRef جذر القسم
 * @param {(root: HTMLElement) => void} build يبني الحركات (gsap/ScrollTrigger) للقسم
 * @param {() => unknown} [deps] مصدر بيانات غير متزامن؛ يُعاد البناء عند تغيّره
 */
export function useScrollMotion(rootRef, build, deps) {
  let mm = null
  const run = () => {
    mm?.revert()
    if (!rootRef.value) return
    // matchMedia يعمل كـ context: كل ما يُنشأ داخله يُلغى مع revert
    mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => build(rootRef.value), rootRef.value)
    ScrollTrigger.refresh()
  }
  onMounted(() => nextTick(run))
  if (deps) watch(deps, () => nextTick(run))
  onBeforeUnmount(() => mm?.revert())
}

/**
 * عنوان القسم: دخول هادئ رسمي — العنوان كله يظهر ويصعد قليلًا.
 * الخطان الجانبيان ثابتان (قيمة --tl الافتراضية 1) بلا رسم تدريجي.
 */
export function titleIn(tl, el) {
  tl.from(el, { y: 18, autoAlpha: 0, duration: 0.6, ease: 'power2.out' })
  return tl
}

export { gsap }
