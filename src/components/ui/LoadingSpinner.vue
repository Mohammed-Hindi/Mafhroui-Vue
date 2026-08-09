<template>
  <div :class="inline ? 'inline-flex' : 'flex justify-center items-center w-full'">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      class="animate-spin text-primary-600"
      role="status"
      aria-label="جارٍ التحميل"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.2" stroke-width="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <span v-if="label" class="ms-2 text-body-sm text-text-600">{{ label }}</span>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    size: { type: [Number, String], default: 28 },
    label: { type: String, default: '' },
    inline: { type: Boolean, default: false }
  }
}
</script>
