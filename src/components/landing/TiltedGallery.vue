<template>
  <!-- معرض أعمال بشريط منحنٍ (منقول من مكوّن Tilted Grid Hero إلى Vue): صف بطاقات يجري من اليمين لليسار حول
       باطن أسطوانة، الوسط مسطّح أمامك والأطراف تنحني نحوك وتتلاشى. كل بطاقة مقطّعة إلى SLICES شرائح عمودية،
       كل شريحة وجه مسطّح من الأسطوانة يعرض حصته من البطاقة، والبطاقة كلها حركة واحدة (rotateY حول محور الأسطوانة).
       الوقوف بالمؤشر يوقف الحركة، السحب أو العجلة الأفقية أو الأسهم تحرّك الصف يمينًا ويسارًا، والضغط يفتح المشروع. -->
  <div
    ref="root" class="tg" :style="{ containerType: 'size' }" @mouseenter="hover = true" @mouseleave="hover = false"
    @pointerdown="dragStart" @pointermove="dragMove" @pointerup="dragEnd" @pointercancel="dragEnd" @wheel="onWheel"
  >
    <component :is="'style'">{{ css }}</component>
    <div
      class="tg-band"
      :style="{
        opacity: layout ? 1 : 0,
        perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
        perspectiveOrigin: `50% ${axis}%`,
        maskImage: mask,
        WebkitMaskImage: mask
      }"
    >
      <div
        v-for="t in geo.columns"
        :key="t"
        :class="[tileClass, 'tg-tile']"
        :style="{
          left: `calc(50% - ${u(aspectRatio / 2)})`,
          top: `calc(${axis}% - ${u(0.5)})`,
          width: u(aspectRatio),
          height: u(1),
          animation: `${orbit} ${duration}s linear ${-(t - 1) * speed}s infinite`,
          animationPlayState: hover ? 'paused' : 'running'
        }"
        @animationiteration="syncLaps"
        @click="open(itemFor(t - 1))"
      >
        <div
          v-for="k in SLICES"
          :key="k"
          :class="['tg-slice', k === 1 && 'is-first', k === SLICES && 'is-last']"
          :style="{
            left: u((aspectRatio - share) / 2),
            width: k === SLICES ? u(share) : `calc(${u(share)} + 1px)`,
            height: u(1),
            transform: turn((aspectRatio / 2 - (k - 0.5) * share) * geo.unit)
          }"
        >
          <div class="tg-face" :style="{ left: u(-(k - 1) * share), width: u(aspectRatio), height: u(1), fontSize: u(0.075) }">
            <slot :item="itemFor(t - 1)" />
          </div>
        </div>
      </div>
    </div>
    <button type="button" class="tg-arrow is-right" aria-label="تحريك المعرض لليمين" @click="nudge(-1)"><ChevronRight :size="22" /></button>
    <button type="button" class="tg-arrow is-left" aria-label="تحريك المعرض لليسار" @click="nudge(1)"><ChevronLeft :size="22" /></button>
  </div>
</template>

<script>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

// شرائح لكل بطاقة: كل شريحة بضع درجات من القوس فلا تُرى كوجه مستقل
const SLICES = 16
// بُعد الكاميرا عن الشاشة كمضاعف لنصف قطر الأسطوانة
const CAMERA = 1.6
// أقصى عرض للبطاقة كنسبة من عرض الشريط، حتى يظهر الجيران على الجوال
const MAX_WIDTH = 55

/** نصف قطر الأسطوانة كنسبة من العرض بحيث تكون حافة الإطار bend راديان حول القوس */
function arc(bend) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend))
}

/** يضع الحلقة على الأسطوانة: unit قوس ارتفاع بطاقة، limit حيث تختفي البطاقة كليًا، sweep طرفا الحلقة (بالدرجات) */
function measure(width, height, tile, aspect, gap, bend) {
  const h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect)
  const radius = width * arc(bend)
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 }
  const deg = (rad) => (rad * 180) / Math.PI
  const unit = deg(h / radius)
  const pitch = (aspect + gap / 100) * unit
  const limit = deg(bend) + (aspect * unit) / 2
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)))
  const round = (n) => +n.toFixed(4)
  const sweep = round((columns * pitch) / 2)
  return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) }
}

let uid = 0

export default {
  name: 'TiltedGallery',

  components: { ChevronLeft, ChevronRight },

  props: {
    items: { type: Array, required: true },
    /** ثوانٍ لتقدّم الصف بطاقة واحدة */
    speed: { type: Number, default: 4 },
    /** ارتفاع البطاقة كنسبة من ارتفاع الشريط */
    tileHeight: { type: Number, default: 26 },
    aspectRatio: { type: Number, default: 16 / 9 },
    gap: { type: Number, default: 6 },
    /** موضع خط المنتصف العمودي (٪) */
    axis: { type: Number, default: 56 },
    /** انحناء الأطراف بالدرجات (5–85) */
    curve: { type: Number, default: 80 },
    /** عرض التلاشي عند كل طرف (٪) */
    fade: { type: Number, default: 12 }
  },

  emits: ['select'],

  data() {
    const id = ++uid
    return { SLICES, CAMERA, layout: null, laps: {}, hover: false, drag: null, moved: false, orbit: `tg-o-${id}`, tileClass: `tg-t-${id}` }
  },

  computed: {
    bend() { return (Math.min(85, Math.max(5, this.curve)) * Math.PI) / 180 },
    geo() { return this.layout || measure(1200, 560, this.tileHeight, this.aspectRatio, this.gap, this.bend) },
    r() { return 100 * arc(this.bend) },
    radius() { return `${+this.r.toFixed(3)}cqw` },
    share() { return this.aspectRatio / SLICES },
    duration() { return this.geo.columns * this.speed },
    mask() { return `linear-gradient(90deg,transparent,#000 ${this.fade}%,#000 ${100 - this.fade}%,transparent)` },
    css() {
      const { sweep, limit } = this.geo
      // خارج limit البطاقة خارج الإطار كليًا، فتُخفى هناك (ومنها لحظة الالتفاف)
      const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4)
      return `@keyframes ${this.orbit}{from{transform:${this.turn(-sweep)}}to{transform:${this.turn(sweep)}}` +
        `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
        `@media(prefers-reduced-motion:reduce){.${this.tileClass}{animation-play-state:paused!important}}`
    }
  },

  watch: {
    tileHeight: 'remeasure', aspectRatio: 'remeasure', gap: 'remeasure', curve: 'remeasure',
    items() { this.$nextTick(this.syncLaps) },
    layout() { this.$nextTick(this.syncLaps) }
  },

  mounted() {
    this.ro = new ResizeObserver(([entry]) => {
      this.size = entry.contentRect
      this.remeasure()
    })
    this.ro.observe(this.$refs.root)
  },

  beforeUnmount() {
    this.ro?.disconnect()
  },

  methods: {
    remeasure() {
      if (!this.size) return
      const next = measure(this.size.width, this.size.height, this.tileHeight, this.aspectRatio, this.gap, this.bend)
      const prev = this.layout
      if (!prev || prev.columns !== next.columns || prev.sweep !== next.sweep || prev.unit !== next.unit) this.layout = next
    },
    /** كل الأطوال مضاعفات لارتفاع البطاقة */
    u(n) {
      return `calc(${+n.toFixed(4)} * min(${this.tileHeight}cqh, ${+(MAX_WIDTH / this.aspectRatio).toFixed(4)}cqw))`
    },
    turn(deg) {
      return `translateZ(${this.radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${this.radius})`
    },
    /** البطاقة t تبدأ أقرب للمخرج؛ عنصرها = دورتها الحالية × عدد البطاقات + ترتيب دخولها */
    itemFor(t) {
      const n = Math.max(this.items.length, 1)
      const i = (this.laps[t] ?? 0) * this.geo.columns + (this.geo.columns - 1 - t)
      return this.items[((i % n) + n) % n]
    },
    anims() {
      return [...(this.$refs.root?.querySelectorAll('.tg-tile') || [])].map((el) => el.getAnimations()[0]).filter(Boolean)
    },
    /** الدورة الحالية لكل بطاقة: تتغير عند الالتفاف خارج النظر، أو بالتحريك للأمام والخلف */
    syncLaps() {
      const laps = {}
      this.anims().forEach((a, t) => { laps[t] = a.effect.getComputedTiming().currentIteration ?? 0 })
      this.laps = laps
    },
    /** تقديم الصف أو إرجاعه بزمن الحركة (ms)؛ موجب = نحو اليسار */
    shift(ms) {
      // ponytail: الوقت يُزاح 1000 دورة عند أول تحريك حتى يبقى الإرجاع للخلف موجبًا دائمًا
      const base = this.duration * 1000 * 1000
      for (const a of this.anims()) {
        const now = a.currentTime ?? 0
        a.currentTime = (now < base / 2 ? now + base : now) + ms
      }
      this.syncLaps()
    },
    tileMs() { return this.speed * 1000 },
    tilePx() { return this.$refs.root.querySelector('.tg-tile')?.offsetWidth || 300 },
    dragStart(e) {
      if (e.button > 0 || e.target.closest('.tg-arrow')) return
      this.drag = { x: e.clientX, id: e.pointerId }
      this.moved = false
    },
    dragMove(e) {
      if (!this.drag || e.pointerId !== this.drag.id) return
      const dx = e.clientX - this.drag.x
      if (!this.moved && Math.abs(dx) < 6) return
      if (!this.moved) { this.moved = true; this.$refs.root.setPointerCapture(e.pointerId) }
      this.drag.x = e.clientX
      this.shift((-dx / this.tilePx()) * this.tileMs())
    },
    dragEnd() {
      this.drag = null
      // الضغطة التي تلي السحب لا تفتح مشروعًا
      if (this.moved) setTimeout(() => { this.moved = false })
    },
    /** العجلة الأفقية (أو Shift + العجلة) تحرّك الصف؛ العمودية تبقى لتمرير الصفحة */
    onWheel(e) {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
      if (!d) return
      e.preventDefault()
      this.shift((d / this.tilePx()) * this.tileMs())
    },
    /** سهم: بطاقة كاملة بانسياب خلال 450ms (dir 1 = نحو اليسار) */
    nudge(dir) {
      const total = dir * this.tileMs()
      const t0 = performance.now()
      let done = 0
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 450)
        const eased = 1 - Math.pow(1 - p, 3)
        this.shift(total * eased - done)
        done = total * eased
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    },
    open(item) {
      if (item && !this.moved) this.$emit('select', item)
    }
  }
}
</script>

<style scoped>
.tg { position: relative; overflow: hidden; touch-action: pan-y; user-select: none; }
.tg-band { position: absolute; inset: 0; transition: opacity .5s ease; }
.tg-tile { position: absolute; transform-style: preserve-3d; cursor: pointer; }
.tg-slice { position: absolute; top: 0; overflow: hidden; background: var(--color-surface-muted, #E9EEF3); }
.tg-slice.is-first { border-radius: 8px 0 0 8px; }
.tg-slice.is-last { border-radius: 0 8px 8px 0; }
.tg-face { position: absolute; top: 0; max-width: none; }
.tg-arrow { position: absolute; top: 50%; z-index: 2; display: grid; place-items: center; width: 46px; height: 46px; margin-top: -23px; border: 1px solid var(--ucas-blue); border-radius: 50%; background: var(--color-surface); color: var(--ucas-blue); box-shadow: 0 4px 14px rgba(0, 0, 0, .12); transition: background-color var(--ucas-color-speed, .8s) ease, color var(--ucas-color-speed, .8s) ease; }
.tg-arrow:hover { background: var(--ucas-blue); color: #FFFFFF; }
.tg-arrow.is-right { right: 8px; }
.tg-arrow.is-left { left: 8px; }
@media (max-width: 639.98px) { .tg-arrow { display: none; } }
</style>
