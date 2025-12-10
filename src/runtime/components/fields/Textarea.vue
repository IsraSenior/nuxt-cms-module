<script setup lang="ts">
import { computed } from 'vue'
import type { TextareaFieldDefinition } from '../../types'

interface Props {
  modelValue: string
  field: TextareaFieldDefinition
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
const rows = computed(() => props.field.rows || 4)
</script>

<template>
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>
    <textarea
      v-model="value"
      class="cms-field__textarea"
      :class="{ 'cms-field__textarea--error': error, 'cms-field__textarea--disabled': disabled }"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :minlength="field.minLength"
      :maxlength="field.maxLength"
    />
    <p v-if="help && !error" class="cms-field__help">{{ help }}</p>
    <p v-if="error" class="cms-field__error">{{ error }}</p>
  </div>
</template>

<style>
.cms-field__textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  color: #111827;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.cms-field__textarea::placeholder {
  color: #9ca3af;
}

.cms-field__textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.cms-field__textarea--disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.cms-field__textarea--error {
  border-color: #dc2626;
}

.cms-field__textarea--error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

</style>
