<template>
  <div class="bg-surface rounded-lg border border-border shadow-card flex flex-col h-[calc(100vh-160px)] min-h-[480px] overflow-hidden">
    <header class="flex items-center gap-3 px-5 py-4 border-b border-border-soft shrink-0">
      <span class="grid place-items-center w-9 h-9 rounded-md bg-gradient-to-bl from-primary-600 to-accent-500 text-white shrink-0">
        <Bot :size="18" />
      </span>
      <h3 class="font-cairo font-bold text-h4 text-text-900">{{ title }}</h3>
    </header>

    <div ref="body" class="flex-1 overflow-y-auto scrollbar-thin px-5 py-6 flex flex-col gap-4">
      <div v-if="!messages.length" class="m-auto text-center max-w-sm">
        <span class="grid place-items-center w-14 h-14 rounded-md bg-primary-50 text-primary-600 mx-auto mb-4">
          <Sparkles :size="24" />
        </span>
        <p class="text-body-sm text-text-600 mb-5">{{ emptyHint }}</p>
        <div class="flex flex-wrap gap-2.5 justify-center">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            type="button"
            class="text-caption font-semibold text-text-700 bg-bg border border-border px-4 py-2 rounded-pill hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors duration-fast"
            @click="sendSuggested(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        :class="[
          'max-w-[75%] px-4 py-3 rounded-lg text-body-sm leading-relaxed',
          message.who === 'user'
            ? 'self-end bg-gradient-to-bl from-primary-600 to-primary-700 text-white rounded-bl-sm'
            : 'self-start bg-bg border border-border-soft text-text-900 rounded-br-sm'
        ]"
      >
        {{ message.text }}
      </div>

      <div v-if="typing" class="self-start flex gap-1 px-4 py-3.5 bg-bg border border-border-soft rounded-lg">
        <span v-for="n in 3" :key="n" class="w-1.5 h-1.5 rounded-pill bg-text-400 animate-bounce" :style="{ animationDelay: `${n * 0.12}s` }" />
      </div>
    </div>

    <form class="flex items-center gap-2.5 px-5 py-4 border-t border-border-soft shrink-0" @submit.prevent="send">
      <input
        v-model.trim="draft"
        type="text"
        :placeholder="placeholder"
        class="flex-1 h-11 px-4 rounded-md border border-border bg-bg text-body-sm text-text-900 focus:border-primary-600 focus:bg-surface transition-colors duration-fast outline-none"
      >
      <button
        type="submit"
        class="grid place-items-center w-11 h-11 rounded-md bg-gradient-to-bl from-primary-600 to-primary-700 text-white shrink-0 disabled:opacity-50"
        :disabled="!draft"
        aria-label="إرسال"
      >
        <Send :size="17" />
      </button>
    </form>
  </div>
</template>

<script>
import { Bot, Sparkles, Send } from 'lucide-vue-next'

let uid = 0

export default {
  name: 'AssistantChat',

  components: { Bot, Sparkles, Send },

  props: {
    title: { type: String, default: 'المساعد الآلي' },
    emptyHint: { type: String, default: 'اكتب سؤالك وسيساعدك المساعد الآلي فورًا.' },
    placeholder: { type: String, default: 'اكتب رسالتك أو سؤالك...' },
    suggestions: { type: Array, default: () => [] },
    replies: { type: Array, default: () => [] }
  },

  data() {
    return {
      messages: [],
      draft: '',
      typing: false
    }
  },

  methods: {
    sendSuggested(text) {
      this.draft = text
      this.send()
    },

    send() {
      const text = this.draft.trim()
      if (!text) return
      this.pushMessage(text, 'user')
      this.draft = ''
      this.typing = true
      this.scrollToBottom()

      setTimeout(() => {
        this.typing = false
        const reply = this.replies[Math.floor(Math.random() * this.replies.length)] || '...'
        this.pushMessage(reply, 'ai')
      }, 900 + Math.random() * 500)
    },

    pushMessage(text, who) {
      uid += 1
      this.messages.push({ id: uid, text, who })
      this.scrollToBottom()
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const body = this.$refs.body
        if (body) body.scrollTop = body.scrollHeight
      })
    }
  }
}
</script>
