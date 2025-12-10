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
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>
    <input
      v-model="value"
      type="text"
      class="cms-field__input"
      :class="{ 'cms-field__input--error': error, 'cms-field__input--disabled': disabled }"
      :placeholder="placeholder"
      :disabled="disabled"
      :minlength="field.minLength"
      :maxlength="field.maxLength"
      :pattern="field.pattern"
    />
    <p v-if="help && !error" class="cms-field__help">{{ help }}</p>
    <p v-if="error" class="cms-field__error">{{ error }}</p>
  </div>
</template>

<style>
.cms-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cms-field__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.cms-field__required {
  color: #dc2626;
  margin-left: 2px;
}

.cms-field__input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  color: #111827;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.cms-field__input::placeholder {
  color: #9ca3af;
}

.cms-field__input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.cms-field__input--disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.cms-field__input--error {
  border-color: #dc2626;
}

.cms-field__input--error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.cms-field__help {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.cms-field__error {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}

</style>
