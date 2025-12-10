<script setup lang="ts">
interface Props {
  show: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'danger'
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'confirm': []
  'cancel': []
}>()

function close() {
  emit('update:show', false)
  emit('cancel')
}

function confirm() {
  emit('confirm')
  emit('update:show', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="cms-modal-overlay" @click.self="close">
      <div class="cms-modal-dialog">
        <div class="cms-modal-content">
          <div class="cms-modal-header">
            <div class="cms-modal-icon" :class="`cms-modal-icon--${variant}`">
              <!-- Danger icon -->
              <svg v-if="variant === 'danger'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-modal-icon__svg">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
              </svg>
              <!-- Warning icon -->
              <svg v-else-if="variant === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-modal-icon__svg">
                <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
              </svg>
              <!-- Info icon -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-modal-icon__svg">
                <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 class="cms-modal-title">{{ title }}</h3>
              <p v-if="message" class="cms-modal-text">{{ message }}</p>
            </div>
          </div>
          <div class="cms-modal-actions">
            <button type="button" class="cms-btn cms-btn--outline" @click="close">
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              :class="['cms-btn', variant === 'danger' ? 'cms-btn--danger' : variant === 'warning' ? 'cms-btn--warning' : 'cms-btn--primary']"
              @click="confirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* Modal Overlay */
.cms-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.cms-modal-dialog {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 90%;
}

.cms-modal-content {
  padding: 24px;
}

.cms-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.cms-modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cms-modal-icon--danger {
  background-color: #fee2e2;
  color: #dc2626;
}

.cms-modal-icon--warning {
  background-color: #fef3c7;
  color: #d97706;
}

.cms-modal-icon--info {
  background-color: #dbeafe;
  color: #2563eb;
}

.cms-modal-icon__svg {
  width: 24px;
  height: 24px;
}

.cms-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.cms-modal-text {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.cms-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
