<script setup lang="ts">
import { computed } from 'vue'
import type { NumberFieldDefinition } from '../../types'

interface Props {
  modelValue: number | null
  field: NumberFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const placeholder = computed(() => props.field.placeholder || '')
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <UInput
      v-model.number="value"
      type="number"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="field.min"
      :max="field.max"
      :step="field.step || 1"
      class="w-full"
    />
  </UFormField>
</template>
