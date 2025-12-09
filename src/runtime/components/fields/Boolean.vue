<script setup lang="ts">
import { computed } from 'vue'
import type { BooleanFieldDefinition } from '../../types'

interface Props {
  modelValue: boolean
  field: BooleanFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const value = computed({
  get: () => props.modelValue || false,
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
const labelOn = computed(() => props.field.labelOn || 'Yes')
const labelOff = computed(() => props.field.labelOff || 'No')
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div class="flex items-center gap-2">
      <USwitch
        v-model="value"
        :disabled="disabled"
      />
      <span class="text-sm text-gray-600">
        {{ value ? labelOn : labelOff }}
      </span>
    </div>
  </UFormField>
</template>
