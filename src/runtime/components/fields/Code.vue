<script setup lang="ts">
import { computed } from 'vue'
import type { CodeFieldDefinition } from '../../types'

interface Props {
  modelValue: string
  field: CodeFieldDefinition
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
const placeholder = computed(() => props.field.placeholder || '// Enter code here...')
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
const rows = computed(() => props.field.rows || 10)
const language = computed(() => props.field.language || 'javascript')

// Line numbers
const lineCount = computed(() => {
  return value.value.split('\n').length
})

const lineNumbers = computed(() => {
  return Array.from({ length: lineCount.value }, (_, i) => i + 1)
})
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div class="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-900">
      <!-- Language badge -->
      <div class="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
        {{ language }}
      </div>

      <div class="flex">
        <!-- Line numbers -->
        <div
          v-if="field.lineNumbers !== false"
          class="flex-shrink-0 py-3 px-2 text-right text-xs text-gray-500 bg-gray-800 select-none font-mono"
          :style="{ minWidth: '3rem' }"
        >
          <div v-for="n in lineNumbers" :key="n">
            {{ n }}
          </div>
        </div>

        <!-- Code editor -->
        <textarea
          v-model="value"
          :placeholder="placeholder"
          :disabled="disabled"
          :rows="rows"
          class="flex-1 w-full p-3 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none"
          spellcheck="false"
        />
      </div>
    </div>
  </UFormField>
</template>
