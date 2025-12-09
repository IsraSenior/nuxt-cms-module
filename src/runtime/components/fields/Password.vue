<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PasswordFieldDefinition } from '../../types'

interface Props {
  modelValue: string
  field: PasswordFieldDefinition
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

const showPassword = ref(false)

const label = computed(() => props.field.label || props.fieldName)
const placeholder = computed(() => props.field.placeholder || '••••••••')
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
    <div class="relative">
      <UInput
        v-model="value"
        :type="showPassword ? 'text' : 'password'"
        variant="outline"
        :placeholder="placeholder"
        :disabled="disabled"
        :minlength="field.minLength"
        class="w-full pr-10"
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        @click="showPassword = !showPassword"
      >
        <span class="text-xs">{{ showPassword ? 'Hide' : 'Show' }}</span>
      </button>
    </div>
  </UFormField>
</template>
