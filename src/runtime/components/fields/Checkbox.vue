<script setup lang="ts">
import { computed } from 'vue'
import type { CheckboxFieldDefinition } from '../../types'

interface Props {
  modelValue: (string | number)[]
  field: CheckboxFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
}>()

const value = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)

function isChecked(optValue: string | number | boolean): boolean {
  return value.value.includes(optValue as string | number)
}

function toggle(optValue: string | number | boolean) {
  const val = optValue as string | number
  if (isChecked(val)) {
    value.value = value.value.filter(v => v !== val)
  } else {
    value.value = [...value.value, val]
  }
}
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div :class="{ 'flex flex-wrap gap-4': field.inline, 'space-y-2': !field.inline }">
      <div
        v-for="option in field.options"
        :key="String(option.value)"
        class="flex items-center"
      >
        <UCheckbox
          :model-value="isChecked(option.value)"
          :disabled="disabled || option.disabled"
          :label="option.label"
          @update:model-value="toggle(option.value)"
        />
      </div>
    </div>
  </UFormField>
</template>
