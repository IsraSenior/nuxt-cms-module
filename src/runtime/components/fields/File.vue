<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FileFieldDefinition } from '../../types'

interface Props {
  modelValue: string | null
  field: FileFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)

const uploading = ref(false)
const uploadError = ref<string | null>(null)
const fileName = ref<string | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // Validate file size
  const maxSize = props.field.maxSize || 10 * 1024 * 1024
  if (file.size > maxSize) {
    uploadError.value = `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB`
    return
  }

  uploading.value = true
  uploadError.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await $fetch<{ id: string; filename: string; originalName: string }>('/api/cms/media/upload', {
      method: 'POST',
      body: formData
    })

    emit('update:modelValue', result.filename)
    fileName.value = file.name
  } catch (err: any) {
    uploadError.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function removeFile() {
  emit('update:modelValue', null)
  fileName.value = null
}
</script>

<template>
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>

    <input
      ref="fileInput"
      type="file"
      :accept="field.accept?.join(',')"
      class="cms-file__hidden-input"
      @change="handleFileChange"
    />

    <div
      v-if="!modelValue"
      class="cms-file__dropzone"
      :class="{ 'cms-file__dropzone--disabled': disabled }"
      @click="!disabled && openFilePicker()"
    >
      <div v-if="uploading" class="cms-file__uploading">
        <span class="cms-file__spinner"></span>
        Uploading...
      </div>
      <div v-else class="cms-file__placeholder">
        <div class="cms-file__icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cms-file__svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div class="cms-file__text">Click to upload a file</div>
        <div class="cms-file__hint">or drag and drop</div>
      </div>
    </div>

    <div v-else class="cms-file__preview">
      <div class="cms-file__preview-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cms-file__preview-svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
      <div class="cms-file__info">
        <div class="cms-file__name">{{ fileName || modelValue }}</div>
        <a
          :href="`/api/cms/media/file/${modelValue}`"
          target="_blank"
          class="cms-file__download"
        >
          Download
        </a>
      </div>
      <button
        v-if="!disabled"
        type="button"
        class="cms-file__remove"
        @click="removeFile"
        title="Remove file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-file__remove-icon">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>

    <p v-if="help && !error && !uploadError" class="cms-field__help">{{ help }}</p>
    <p v-if="error || uploadError" class="cms-field__error">{{ error || uploadError }}</p>
  </div>
</template>

<style>
.cms-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cms-field__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.cms-field__required {
  color: #dc2626;
  margin-left: 2px;
}

.cms-field__help {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.cms-field__error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}

.cms-file__hidden-input {
  display: none;
}

.cms-file__dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.cms-file__dropzone:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

.cms-file__dropzone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cms-file__dropzone--disabled:hover {
  border-color: #d1d5db;
  background-color: transparent;
}

.cms-file__uploading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
}

.cms-file__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: cms-file-spin 0.8s linear infinite;
}

@keyframes cms-file-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cms-file__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6b7280;
}

.cms-file__icon {
  margin-bottom: 8px;
  color: #9ca3af;
}

.cms-file__svg {
  width: 48px;
  height: 48px;
}

.cms-file__text {
  font-size: 14px;
}

.cms-file__hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.cms-file__preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.cms-file__preview-icon {
  flex-shrink: 0;
  color: #6b7280;
}

.cms-file__preview-svg {
  width: 32px;
  height: 32px;
}

.cms-file__info {
  flex: 1;
  min-width: 0;
}

.cms-file__name {
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cms-file__download {
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
}

.cms-file__download:hover {
  text-decoration: underline;
}

.cms-file__remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: #dc2626;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.cms-file__remove:hover {
  background-color: #fee2e2;
}

.cms-file__remove-icon {
  width: 16px;
  height: 16px;
}
</style>
