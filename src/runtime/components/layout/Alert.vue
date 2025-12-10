<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  variant?: 'success' | 'error' | 'warning' | 'info'
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  dismissible: false
})

const emit = defineEmits<{
  'dismiss': []
}>()

const show = ref(true)

function dismiss() {
  show.value = false
  emit('dismiss')
}
</script>

<template>
  <div v-if="show" class="cms-alert" :class="`cms-alert--${variant}`">
    <div class="cms-alert__content">
      <!-- Success icon -->
      <svg v-if="variant === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-alert__icon">
        <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
      </svg>
      <!-- Error icon -->
      <svg v-else-if="variant === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-alert__icon">
        <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" />
      </svg>
      <!-- Warning icon -->
      <svg v-else-if="variant === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-alert__icon">
        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
      </svg>
      <!-- Info icon -->
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-alert__icon">
        <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd" />
      </svg>
      <span class="cms-alert__text">
        <slot />
      </span>
    </div>
    <button v-if="dismissible" type="button" class="cms-alert__dismiss" @click="dismiss">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
      </svg>
    </button>
  </div>
</template>

<style>
.cms-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
}

.cms-alert__content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cms-alert__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.cms-alert__text {
  font-size: 14px;
  font-weight: 500;
}

.cms-alert__dismiss {
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.cms-alert__dismiss:hover {
  opacity: 1;
}

.cms-alert__dismiss svg {
  width: 100%;
  height: 100%;
}

/* Variants */
.cms-alert--success {
  background-color: #dcfce7;
  color: #166534;
}

.cms-alert--error {
  background-color: #fee2e2;
  color: #dc2626;
}

.cms-alert--warning {
  background-color: #fef3c7;
  color: #92400e;
}

.cms-alert--info {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>
