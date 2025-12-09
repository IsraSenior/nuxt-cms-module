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
      class="hidden"
      @change="handleFileChange"
    />

    <div
      v-if="!modelValue"
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
      @click="!disabled && openFilePicker()"
    >
      <div v-if="uploading" class="text-gray-500">
        Uploading...
      </div>
      <div v-else class="text-gray-500">
        <div class="text-4xl mb-2">📷</div>
        <div class="text-sm">Click to upload an image</div>
        <div class="text-xs text-gray-400 mt-1">
          or drag and drop
        </div>
      </div>
    </div>

    <div v-else class="relative inline-block">
      <img
        :src="previewUrl"
        alt="Preview"
        class="max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
      />
      <button
        v-if="!disabled"
        type="button"
        class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
        @click="removeImage"
      >
        ✕
      </button>
    </div>
  </UFormField>
</template>
