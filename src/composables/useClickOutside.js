import { onMounted, onUnmounted, ref } from 'vue'

export function useClickOutside(callback) {
  const clickOutsideRoot = ref(null)

  const handleClick = (event) => {
    if (clickOutsideRoot.value && !clickOutsideRoot.value.contains(event.target)) {
      callback()
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClick)
  })

  return { clickOutsideRoot }
}
