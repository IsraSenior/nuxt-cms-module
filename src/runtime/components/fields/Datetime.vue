<script setup lang="ts">
import { computed } from 'vue'
import type { DatetimeFieldDefinition } from '../../types'

interface Props {
  modelValue: string | null
  field: DatetimeFieldDefinition
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

const value = computed({
  get: () => props.modelValue || '',
  set: (val) => emit('update:modelValue', val || null)
})

const label = computed(() => props.field.label || props.fieldName)
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
      v-model="value"
      type="datetime-local"
      variant="outline"
      :disabled="disabled"
      :min="field.min"
      :max="field.max"
      class="w-full"
    />
  </UFormField>
</template>
