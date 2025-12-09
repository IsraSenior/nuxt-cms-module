<script setup lang="ts">
import { computed } from 'vue'
import type { TextFieldDefinition } from '../../types'

interface Props {
  modelValue: string
  field: TextFieldDefinition
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
      variant="outline"
      :placeholder="placeholder"
      :disabled="disabled"
      :minlength="field.minLength"
      :maxlength="field.maxLength"
      :pattern="field.pattern"
      class="w-full"
    />
  </UFormField>
</template>
