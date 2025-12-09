<script setup lang="ts">
import { computed } from 'vue'
import type { SelectFieldDefinition } from '../../types'

interface Props {
  modelValue: string | number | (string | number)[] | null
  field: SelectFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[] | null]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const placeholder = computed(() => props.field.placeholder || 'Select an option')
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)

const options = computed(() => props.field.options.map(opt => ({
  label: opt.label,
  value: opt.value,
  disabled: opt.disabled
})))
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <USelect
      v-model="value"
      :options="options"
      :placeholder="placeholder"
      :disabled="disabled"
      :multiple="field.multiple"
      :searchable="field.searchable"
      class="w-full"
    />
  </UFormField>
</template>
