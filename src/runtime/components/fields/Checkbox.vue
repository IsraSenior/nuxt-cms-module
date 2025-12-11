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
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>
    <div
      class="cms-field__checkbox-group"
      :class="{ 'cms-field__checkbox-group--inline': field.inline }"
    >
      <label
        v-for="option in field.options"
        :key="String(option.value)"
        class="cms-field__checkbox-item"
        :class="{
          'cms-field__checkbox-item--disabled': disabled || option.disabled,
          'cms-field__checkbox-item--checked': isChecked(option.value)
        }"
      >
        <input
          type="checkbox"
          :checked="isChecked(option.value)"
          :disabled="disabled || option.disabled"
          class="cms-field__checkbox-input"
          @change="toggle(option.value)"
        />
        <span class="cms-field__checkbox-box">
          <svg
            class="cms-field__checkbox-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="cms-field__checkbox-label">{{ option.label }}</span>
      </label>
    </div>
    <p v-if="help && !error" class="cms-field__help">{{ help }}</p>
    <p v-if="error" class="cms-field__error">{{ error }}</p>
  </div>
</template>

<style>
.cms-field__checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cms-field__checkbox-group--inline {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}

.cms-field__checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.15s ease;
  background-color: white;
}

.cms-field__checkbox-item:hover:not(.cms-field__checkbox-item--disabled) {
  border-color: var(--cms-primary, #2563eb);
  background-color: #f8fafc;
}

.cms-field__checkbox-item--checked {
  border-color: var(--cms-primary, #2563eb);
  background-color: var(--cms-primary-light, #eff6ff);
}

.cms-field__checkbox-item--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.cms-field__checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.cms-field__checkbox-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.15s ease;
  flex-shrink: 0;
  background-color: white;
}

.cms-field__checkbox-item--checked .cms-field__checkbox-box {
  border-color: var(--cms-primary, #2563eb);
  background-color: var(--cms-primary, #2563eb);
}

.cms-field__checkbox-icon {
  width: 14px;
  height: 14px;
  color: white;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.15s ease;
}

.cms-field__checkbox-item--checked .cms-field__checkbox-icon {
  opacity: 1;
  transform: scale(1);
}

.cms-field__checkbox-label {
  font-size: 14px;
  color: #374151;
  user-select: none;
}

.cms-field__checkbox-item--disabled .cms-field__checkbox-label {
  color: #9ca3af;
}
</style>
