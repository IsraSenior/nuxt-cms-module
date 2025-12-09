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
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error || uploadError"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="handleFileChange"
    />

    <div class="space-y-4">
      <!-- Image grid -->
      <div v-if="images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div
          v-for="(img, index) in images"
          :key="img"
          class="relative group aspect-square"
        >
          <img
            :src="getImageUrl(img)"
            alt=""
            class="w-full h-full object-cover rounded-lg border border-gray-200"
          />

          <!-- Overlay actions -->
          <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              v-if="field.sortable !== false && index > 0"
              type="button"
              class="p-1 bg-white rounded text-sm"
              @click="moveImage(index, index - 1)"
            >
              ←
            </button>
            <button
              type="button"
              class="p-1 bg-red-500 text-white rounded text-sm"
              @click="removeImage(index)"
            >
              ✕
            </button>
            <button
              v-if="field.sortable !== false && index < images.length - 1"
              type="button"
              class="p-1 bg-white rounded text-sm"
              @click="moveImage(index, index + 1)"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <!-- Add button -->
      <div
        v-if="canAddMore && !disabled"
        class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        @click="openFilePicker"
      >
        <div v-if="uploading" class="text-gray-500">
          Uploading...
        </div>
        <div v-else class="text-gray-500">
          <div class="text-3xl mb-2">➕</div>
          <div class="text-sm">Add images</div>
          <div v-if="maxItems" class="text-xs text-gray-400 mt-1">
            {{ images.length }} / {{ maxItems }}
          </div>
        </div>
      </div>
    </div>
  </UFormField>
</template>
