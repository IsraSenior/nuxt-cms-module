<script setup lang="ts">
import { computed } from 'vue'
import type { TextareaFieldDefinition } from '../../types'

interface Props {
  modelValue: string
  field: TextareaFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const value = computed({
  get: () => props.modelValue || '',
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const placeholder = computed(() => props.field.placeholder || '')
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
const rows = computed(() => props.field.rows || 4)
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <UTextarea
      v-model="value"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :minlength="field.minLength"
      :maxlength="field.maxLength"
      class="w-full"
    />
  </UFormField>
</template>
