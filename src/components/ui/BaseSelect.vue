<template>
  <div ref="root" class="relative">
    <label v-if="label" :for="selectId" class="block mb-2 text-label font-semibold text-text-700">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>

    <button
      :id="selectId"
      type="button"
      class="w-full h-icon-btn ps-3 pe-3 rounded-sm border bg-surface text-body text-start flex items-center justify-between gap-2 transition-colors duration-fast"
      :class="[
        error ? 'border-error' : isOpen ? 'border-primary-600 ring-2 ring-primary-500/15' : 'border-border hover:border-primary-200',
        disabled && 'bg-border-soft cursor-not-allowed opacity-70'
      ]"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleOpen"
    >
      <span :class="['truncate font-medium', selectedLabel ? 'text-text-900' : 'text-text-400']">
        {{ selectedLabel || placeholder }}
      </span>
      <ChevronDown :size="16" :class="['shrink-0 text-text-400 transition-transform duration-fast', isOpen && 'rotate-180']" />
    </button>

    <p v-if="error" class="mt-1.5 text-label text-error">{{ error }}</p>

    <teleport to="body">
      <transition
        enter-active-class="transition duration-fast ease-standard"
        enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
        leave-active-class="transition duration-fast"
        leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
      >
        <ul
          v-if="isOpen"
          ref="list"
          role="listbox"
          class="fixed z-popover max-h-72 overflow-y-auto scrollbar-thin rounded-md border border-border bg-surface shadow-dropdown p-1.5"
          :style="listStyle"
        >
          <li v-for="option in fullOptions" :key="option.value">
            <button
              type="button"
              role="option"
              :aria-selected="option.value === modelValue"
              class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm text-body-sm text-start transition-colors duration-fast"
              :class="option.value === modelValue ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-text-700 hover:bg-border-soft'"
              @click="select(option.value)"
            >
              <span class="truncate">{{ option.label }}</span>
              <Check v-if="option.value === modelValue" :size="15" class="shrink-0 text-primary-600" />
            </button>
          </li>
        </ul>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, watch } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui.store'

let uid = 0

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'اختاري' },
  error: { type: String, default: '' },
  valueKey: { type: String, default: 'value' },
  labelKey: { type: String, default: 'label' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  includePlaceholderOption: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

uid += 1
const selectId = `select-${uid}`
const isOpen = ref(false)
const root = ref(null)
const list = ref(null)
const listStyle = ref({})

const normalizedOptions = computed(() => {
  return props.options.map((option) =>
    typeof option === 'object'
      ? { value: option[props.valueKey], label: option[props.labelKey] }
      : { value: option, label: option }
  )
})

const fullOptions = computed(() => {
  if (!props.includePlaceholderOption || !props.placeholder) return normalizedOptions.value
  return [{ value: '', label: props.placeholder }, ...normalizedOptions.value]
})

const selectedLabel = computed(() => {
  const match = normalizedOptions.value.find((option) => String(option.value) === String(props.modelValue))
  return match?.label || ''
})

/** يحسب موقع القائمة بالنسبة للزر مباشرة (fixed على الـ body) عشان ما تنقص داخل مودال أو حاوية فيها overflow */
const updatePosition = () => {
  const button = root.value?.querySelector('button')
  if (!button) return

  const rect = button.getBoundingClientRect()
  const gap = 8
  const estimatedHeight = Math.min(fullOptions.value.length * 44 + 12, 288)
  const spaceBelow = window.innerHeight - rect.bottom
  const openAbove = spaceBelow < estimatedHeight && rect.top > spaceBelow

  listStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    ...(openAbove
      ? { bottom: `${window.innerHeight - rect.top + gap}px` }
      : { top: `${rect.bottom + gap}px` })
  }
}

const handleTrackMove = () => updatePosition()

const handleOutsideClick = (event) => {
  if (root.value?.contains(event.target) || list.value?.contains(event.target)) return
  closeDropdown()
}

const openDropdown = () => {
  isOpen.value = true
  nextTick(updatePosition)
  document.addEventListener('mousedown', handleOutsideClick)
  window.addEventListener('scroll', handleTrackMove, true)
  window.addEventListener('resize', handleTrackMove)
}

const closeDropdown = () => {
  isOpen.value = false
  document.removeEventListener('mousedown', handleOutsideClick)
  window.removeEventListener('scroll', handleTrackMove, true)
  window.removeEventListener('resize', handleTrackMove)
}

const toggleOpen = () => {
  if (isOpen.value) closeDropdown()
  else openDropdown()
}

const select = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
  closeDropdown()
}

onBeforeUnmount(closeDropdown)

/** القائمة المنسدلة (fixed على body) بتتراكب بصريًا فوق الـ drawer الجانبي عالموبايل إذا ضلّت مفتوحة — سكّريها فور ما الـ drawer يفتح */
const uiStore = useUiStore()
watch(
  () => uiStore.sidebarOpen,
  (open) => {
    if (open && isOpen.value) closeDropdown()
  }
)
</script>
