<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SlugFieldDefinition } from '../../types'

interface Props {
  modelValue: string | null
  field: SlugFieldDefinition
  fieldName: string
  formData: Record<string, unknown>
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

const value = computed({
  get: () => props.modelValue || '',
  set: (val) => emit('update:modelValue', val || null)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || `Auto-generated from "${props.field.from}"`)
const required = computed(() => props.field.required || false)

const isLocked = ref(!!props.modelValue)
const separator = computed(() => props.field.separator || '-')
const prefix = computed(() => props.field.prefix || '')

// Watch source field and auto-generate slug
const sourceValue = computed(() => {
  return props.formData[props.field.from] as string | undefined
})

watch(sourceValue, (newValue) => {
  if (!isLocked.value && newValue) {
    value.value = slugify(newValue)
  }
})

function slugify(text: string): string {
  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/\s+/g, separator.value) // Replace spaces
    .replace(new RegExp(`${separator.value}+`, 'g'), separator.value) // Remove consecutive separators

  if (prefix.value) {
    slug = prefix.value + separator.value + slug
  }

  return slug
}

function regenerate() {
  if (sourceValue.value) {
    value.value = slugify(sourceValue.value)
  }
}

function toggleLock() {
  isLocked.value = !isLocked.value
}
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div class="flex gap-2">
      <UInput
        v-model="value"
        variant="outline"
        :disabled="disabled || isLocked"
        :placeholder="`auto-generated-${separator}slug`"
        class="flex-1 font-mono text-sm"
      />

      <UButton
        type="button"
        variant="outline"
        :disabled="disabled"
        @click="toggleLock"
      >
        {{ isLocked ? '🔒' : '🔓' }}
      </UButton>

      <UButton
        type="button"
        variant="outline"
        :disabled="disabled || !sourceValue"
        @click="regenerate"
      >
        ↻
      </UButton>
    </div>
  </UFormField>
</template>
