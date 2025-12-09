<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { JsonFieldDefinition } from '../../types'

interface Props {
  modelValue: Record<string, unknown> | null
  field: JsonFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown> | null]
}>()

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
const rows = computed(() => props.field.rows || 10)

// Internal JSON string for editing
const jsonString = ref('')
const parseError = ref<string | null>(null)

// Initialize from modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    try {
      jsonString.value = JSON.stringify(newValue, null, 2)
      parseError.value = null
    } catch {
      jsonString.value = '{}'
    }
  } else {
    jsonString.value = '{}'
  }
}, { immediate: true })

// Parse and emit on change
function handleChange(value: string) {
  jsonString.value = value

  try {
    const parsed = JSON.parse(value)
    parseError.value = null
    emit('update:modelValue', parsed)
  } catch (e: any) {
    parseError.value = e.message || 'Invalid JSON'
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(jsonString.value)
    jsonString.value = JSON.stringify(parsed, null, 2)
    parseError.value = null
  } catch (e: any) {
    parseError.value = e.message || 'Invalid JSON'
  }
}

function minifyJson() {
  try {
    const parsed = JSON.parse(jsonString.value)
    jsonString.value = JSON.stringify(parsed)
    parseError.value = null
  } catch (e: any) {
    parseError.value = e.message || 'Invalid JSON'
  }
}
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error || parseError"
  >
    <div class="space-y-2">
      <!-- Toolbar -->
      <div class="flex gap-2 justify-end">
        <button
          type="button"
          class="text-xs text-gray-500 hover:text-gray-700"
          :disabled="disabled"
          @click="formatJson"
        >
          Format
        </button>
        <button
          type="button"
          class="text-xs text-gray-500 hover:text-gray-700"
          :disabled="disabled"
          @click="minifyJson"
        >
          Minify
        </button>
      </div>

      <!-- Editor -->
      <div class="relative">
        <textarea
          :value="jsonString"
          :disabled="disabled"
          :rows="rows"
          class="w-full p-3 font-mono text-sm border rounded-lg bg-gray-900 text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="{ 'border-red-500': parseError }"
          spellcheck="false"
          @input="handleChange(($event.target as HTMLTextAreaElement).value)"
        />

        <!-- Status indicator -->
        <div class="absolute bottom-2 right-2 text-xs">
          <span v-if="parseError" class="text-red-400">Invalid</span>
          <span v-else class="text-green-400">Valid JSON</span>
        </div>
      </div>
    </div>
  </UFormField>
</template>
