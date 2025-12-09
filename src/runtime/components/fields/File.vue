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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
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
      :accept="field.accept?.join(',')"
      class="hidden"
      @change="handleFileChange"
    />

    <div
      v-if="!modelValue"
      class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
      @click="!disabled && openFilePicker()"
    >
      <div v-if="uploading" class="text-gray-500">
        Uploading...
      </div>
      <div v-else class="text-gray-500">
        <div class="text-3xl mb-2">📄</div>
        <div class="text-sm">Click to upload a file</div>
      </div>
    </div>

    <div v-else class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div class="text-2xl">📄</div>
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate">{{ fileName || modelValue }}</div>
        <a
          :href="`/api/cms/media/file/${modelValue}`"
          target="_blank"
          class="text-sm text-blue-500 hover:underline"
        >
          Download
        </a>
      </div>
      <button
        v-if="!disabled"
        type="button"
        class="text-red-500 hover:text-red-600"
        @click="removeFile"
      >
        ✕
      </button>
    </div>
  </UFormField>
</template>
