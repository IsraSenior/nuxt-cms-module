<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageFieldDefinition } from '../../types'

interface Props {
  modelValue: string | null
  field: ImageFieldDefinition
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
const previewUrl = computed(() => {
  if (!props.modelValue) return null
  if (props.modelValue.startsWith('http')) return props.modelValue
  return `/api/cms/media/file/${props.modelValue}`
})

const fileInput = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // Validate file type
  const accept = props.field.accept || ['image/*']
  const isValidType = accept.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })

  if (!isValidType) {
    uploadError.value = 'Invalid file type'
    return
  }

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

    const result = await $fetch<{ id: string; filename: string }>('/api/cms/media/upload', {
      method: 'POST',
      body: formData
    })

    emit('update:modelValue', result.filename)
  } catch (err: any) {
    uploadError.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
    // Reset input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function removeImage() {
  emit('update:modelValue', null)
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
      accept="image/*"
      class="cms-image__hidden-input"
      @change="handleFileChange"
    />

    <div
      v-if="!modelValue"
      class="cms-image__dropzone"
      :class="{ 'cms-image__dropzone--disabled': disabled }"
      @click="!disabled && openFilePicker()"
    >
      <div v-if="uploading" class="cms-image__uploading">
        <span class="cms-image__spinner"></span>
        Uploading...
      </div>
      <div v-else class="cms-image__placeholder">
        <div class="cms-image__icon">📷</div>
        <div class="cms-image__text">Click to upload an image</div>
        <div class="cms-image__hint">or drag and drop</div>
      </div>
    </div>

    <div v-else class="cms-image__preview">
      <img
        :src="previewUrl"
        alt="Preview"
        class="cms-image__img"
      />
      <button
        v-if="!disabled"
        type="button"
        class="cms-image__remove"
        @click="removeImage"
      >
        ✕
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

:root.dark .cms-field__label {
  color: #d1d5db;
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

:root.dark .cms-field__help {
  color: #9ca3af;
}

.cms-field__error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}

:root.dark .cms-field__error {
  color: #f87171;
}

.cms-image__hidden-input {
  display: none;
}

.cms-image__dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.cms-image__dropzone:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

:root.dark .cms-image__dropzone {
  border-color: #4b5563;
}

:root.dark .cms-image__dropzone:hover {
  border-color: #6b7280;
  background-color: #1f2937;
}

.cms-image__dropzone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cms-image__dropzone--disabled:hover {
  border-color: #d1d5db;
  background-color: transparent;
}

.cms-image__uploading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
}

:root.dark .cms-image__uploading {
  color: #9ca3af;
}

.cms-image__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cms-image__placeholder {
  color: #6b7280;
}

:root.dark .cms-image__placeholder {
  color: #9ca3af;
}

.cms-image__icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.cms-image__text {
  font-size: 14px;
}

.cms-image__hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

:root.dark .cms-image__hint {
  color: #6b7280;
}

.cms-image__preview {
  position: relative;
  display: inline-block;
}

.cms-image__img {
  max-width: 100%;
  height: auto;
  max-height: 256px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

:root.dark .cms-image__img {
  border-color: #374151;
}

.cms-image__remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background-color: #dc2626;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.cms-image__remove:hover {
  background-color: #b91c1c;
}
</style>
