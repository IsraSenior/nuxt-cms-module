<script setup lang="ts">
import { computed } from 'vue'
import type { RadioFieldDefinition } from '../../types'

interface Props {
  modelValue: string | number | null
  field: RadioFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)

const options = computed(() => props.field.options.map(opt => ({
  label: opt.label,
  value: opt.value,
  disabled: opt.disabled
})))
</script>

<template>
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>
    <div
      class="cms-field__radio-group"
      :class="{ 'cms-field__radio-group--inline': field.inline }"
    >
      <label
        v-for="option in options"
        :key="String(option.value)"
        class="cms-field__radio-item"
        :class="{
          'cms-field__radio-item--disabled': disabled || option.disabled,
          'cms-field__radio-item--checked': value === option.value
        }"
      >
        <input
          type="radio"
          :value="option.value"
          :checked="value === option.value"
          :disabled="disabled || option.disabled"
          class="cms-field__radio-input"
          @change="value = option.value"
        />
        <span class="cms-field__radio-circle">
          <span class="cms-field__radio-dot"></span>
        </span>
        <span class="cms-field__radio-label">{{ option.label }}</span>
      </label>
    </div>
    <p v-if="help && !error" class="cms-field__help">{{ help }}</p>
    <p v-if="error" class="cms-field__error">{{ error }}</p>
  </div>
</template>

<style>
.cms-field__radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cms-field__radio-group--inline {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}

.cms-field__radio-item {
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

.cms-field__radio-item:hover:not(.cms-field__radio-item--disabled) {
  border-color: var(--cms-primary, #2563eb);
  background-color: #f8fafc;
}

.cms-field__radio-item--checked {
  border-color: var(--cms-primary, #2563eb);
  background-color: var(--cms-primary-light, #eff6ff);
}

.cms-field__radio-item--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.cms-field__radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.cms-field__radio-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.cms-field__radio-item--checked .cms-field__radio-circle {
  border-color: var(--cms-primary, #2563eb);
}

.cms-field__radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--cms-primary, #2563eb);
  transform: scale(0);
  transition: transform 0.15s ease;
}

.cms-field__radio-item--checked .cms-field__radio-dot {
  transform: scale(1);
}

.cms-field__radio-label {
  font-size: 14px;
  color: #374151;
  user-select: none;
}

.cms-field__radio-item--disabled .cms-field__radio-label {
  color: #9ca3af;
}
</style>
