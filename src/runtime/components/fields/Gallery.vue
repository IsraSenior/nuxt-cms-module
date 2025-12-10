<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GalleryFieldDefinition } from '../../types'

interface Props {
  modelValue: string[]
  field: GalleryFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const images = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
const maxItems = computed(() => props.field.maxItems)

const uploading = ref(false)
const uploadError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const canAddMore = computed(() => {
  if (!maxItems.value) return true
  return images.value.length < maxItems.value
})

function openFilePicker() {
  fileInput.value?.click()
}

function getImageUrl(filename: string): string {
  if (filename.startsWith('http')) return filename
  return `/api/cms/media/file/${filename}`
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) return

  uploading.value = true
  uploadError.value = null

  try {
    const newImages: string[] = []

    for (const file of Array.from(files)) {
      // Check max items
      if (maxItems.value && images.value.length + newImages.length >= maxItems.value) {
        break
      }

      const formData = new FormData()
      formData.append('file', file)

      const result = await $fetch<{ filename: string }>('/api/cms/media/upload', {
        method: 'POST',
        body: formData
      })

      newImages.push(result.filename)
    }

    images.value = [...images.value, ...newImages]
  } catch (err: any) {
    uploadError.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function removeImage(index: number) {
  const newImages = [...images.value]
  newImages.splice(index, 1)
  images.value = newImages
}

function moveImage(from: number, to: number) {
  if (to < 0 || to >= images.value.length) return
  const newImages = [...images.value]
  const [removed] = newImages.splice(from, 1)
  newImages.splice(to, 0, removed)
  images.value = newImages
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
      multiple
      class="cms-gallery__hidden-input"
      @change="handleFileChange"
    />

    <div class="cms-gallery">
      <!-- Image grid -->
      <div v-if="images.length > 0" class="cms-gallery__grid">
        <div
          v-for="(img, index) in images"
          :key="img"
          class="cms-gallery__item"
        >
          <img
            :src="getImageUrl(img)"
            alt=""
            class="cms-gallery__img"
          />

          <!-- Overlay actions -->
          <div class="cms-gallery__overlay">
            <button
              v-if="field.sortable !== false && index > 0"
              type="button"
              class="cms-gallery__action-btn"
              @click="moveImage(index, index - 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-gallery__action-icon">
                <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              class="cms-gallery__action-btn cms-gallery__action-btn--danger"
              @click="removeImage(index)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-gallery__action-icon">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
            <button
              v-if="field.sortable !== false && index < images.length - 1"
              type="button"
              class="cms-gallery__action-btn"
              @click="moveImage(index, index + 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-gallery__action-icon">
                <path fill-rule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Add button -->
      <div
        v-if="canAddMore && !disabled"
        class="cms-gallery__dropzone"
        @click="openFilePicker"
      >
        <div v-if="uploading" class="cms-gallery__uploading">
          <span class="cms-gallery__spinner"></span>
          Uploading...
        </div>
        <div v-else class="cms-gallery__placeholder">
          <div class="cms-gallery__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-gallery__icon-svg">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </div>
          <div class="cms-gallery__text">Add images</div>
          <div v-if="maxItems" class="cms-gallery__count">
            {{ images.length }} / {{ maxItems }}
          </div>
        </div>
      </div>
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

.cms-gallery__hidden-input {
  display: none;
}

.cms-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cms-gallery__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .cms-gallery__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .cms-gallery__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.cms-gallery__item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.cms-gallery__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.cms-gallery__overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.15s ease;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cms-gallery__item:hover .cms-gallery__overlay {
  opacity: 1;
}

.cms-gallery__action-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background-color: white;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.cms-gallery__action-btn:hover {
  background-color: #f3f4f6;
}

.cms-gallery__action-btn--danger {
  background-color: #dc2626;
  color: white;
}

.cms-gallery__action-btn--danger:hover {
  background-color: #b91c1c;
}

.cms-gallery__action-icon {
  width: 16px;
  height: 16px;
}

.cms-gallery__dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.cms-gallery__dropzone:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

.cms-gallery__uploading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
}

.cms-gallery__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: cms-gallery-spin 0.8s linear infinite;
}

@keyframes cms-gallery-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cms-gallery__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6b7280;
}

.cms-gallery__icon {
  margin-bottom: 8px;
  color: #9ca3af;
}

.cms-gallery__icon-svg {
  width: 32px;
  height: 32px;
}

.cms-gallery__text {
  font-size: 14px;
}

.cms-gallery__count {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>
