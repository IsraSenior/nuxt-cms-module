<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MarkdownFieldDefinition } from '../../types'

interface Props {
  modelValue: string
  field: MarkdownFieldDefinition
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

const showPreview = ref(props.field.preview ?? true)

const label = computed(() => props.field.label || props.fieldName)
const placeholder = computed(() => props.field.placeholder || 'Write markdown here...')
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
const rows = computed(() => props.field.rows || 10)

// Simple markdown to HTML conversion for preview
function parseMarkdown(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>')

  return html
}
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div class="space-y-2">
      <!-- Toggle -->
      <div class="flex justify-end">
        <button
          type="button"
          class="markdown-toggle"
          @click="showPreview = !showPreview"
        >
          {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
        </button>
      </div>

      <div :class="{ 'grid grid-cols-2 gap-4': showPreview }">
        <!-- Editor -->
        <UTextarea
          v-model="value"
          variant="outline"
          :placeholder="placeholder"
          :disabled="disabled"
          :rows="rows"
          class="w-full font-mono text-sm"
        />

        <!-- Preview -->
        <div
          v-if="showPreview"
          class="markdown-preview"
          :style="{ maxHeight: `${rows * 24}px` }"
          v-html="parseMarkdown(value)"
        />
      </div>
    </div>
  </UFormField>
</template>

<style>
.markdown-toggle {
  font-size: 14px;
  color: #6b7280;
  transition: color 0.15s ease;
}

.markdown-toggle:hover {
  color: #374151;
}

.markdown-preview {
  max-width: none;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
  overflow: auto;
  color: #111827;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  font-weight: 600;
  margin-bottom: 12px;
}

.markdown-preview h1 { font-size: 24px; }
.markdown-preview h2 { font-size: 20px; }
.markdown-preview h3 { font-size: 16px; }

.markdown-preview code {
  background-color: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.markdown-preview a {
  color: #2563eb;
  text-decoration: underline;
}

</style>
