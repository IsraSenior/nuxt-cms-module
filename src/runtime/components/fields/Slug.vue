<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SlugFieldDefinition } from '../../types'

interface Props {
  modelValue: string | null
  field: SlugFieldDefinition
  fieldName: string
  formData: Record<string, unknown>
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const value = computed({
  get: () => props.modelValue || '',
  set: (val) => emit('update:modelValue', val || null)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || `Auto-generated from "${props.field.from}"`)
const required = computed(() => props.field.required || false)

const isLocked = ref(!!props.modelValue)
const separator = computed(() => props.field.separator || '-')
const prefix = computed(() => props.field.prefix || '')

// Watch source field and auto-generate slug
const sourceValue = computed(() => {
  return props.formData[props.field.from] as string | undefined
})

watch(sourceValue, (newValue) => {
  if (!isLocked.value && newValue) {
    value.value = slugify(newValue)
  }
})

function slugify(text: string): string {
  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/\s+/g, separator.value) // Replace spaces
    .replace(new RegExp(`${separator.value}+`, 'g'), separator.value) // Remove consecutive separators

  if (prefix.value) {
    slug = prefix.value + separator.value + slug
  }

  return slug
}

function regenerate() {
  if (sourceValue.value) {
    value.value = slugify(sourceValue.value)
  }
}

function toggleLock() {
  isLocked.value = !isLocked.value
}
</script>

<template>
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>
    <div class="cms-slug">
      <input
        v-model="value"
        type="text"
        class="cms-slug__input"
        :class="{ 'cms-slug__input--disabled': disabled || isLocked }"
        :disabled="disabled || isLocked"
        :placeholder="`auto-generated${separator}slug`"
      />
      <button
        type="button"
        class="cms-slug__btn"
        :disabled="disabled"
        @click="toggleLock"
        :title="isLocked ? 'Unlock to edit' : 'Lock slug'"
      >
        <svg v-if="isLocked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-slug__icon">
          <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-slug__icon">
          <path fill-rule="evenodd" d="M14.5 1A4.5 4.5 0 0010 5.5V9H3a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1.5V5.5a3 3 0 116 0v2.75a.75.75 0 001.5 0V5.5A4.5 4.5 0 0014.5 1z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        type="button"
        class="cms-slug__btn"
        :disabled="disabled || !sourceValue"
        @click="regenerate"
        title="Regenerate slug"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-slug__icon">
          <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389 5.5 5.5 0 019.2-2.466l.312.311h-2.433a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.22z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <p class="cms-field__help">{{ help }}</p>
    <p v-if="error" class="cms-field__error">{{ error }}</p>
  </div>
</template>

<style>
.cms-slug {
  display: flex;
  gap: 8px;
}

.cms-slug__input {
  flex: 1;
  padding: 10px 12px;
  font-size: 14px;
  font-family: monospace;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  color: #111827;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.cms-slug__input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.cms-slug__input--disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.cms-slug__btn {
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cms-slug__btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.cms-slug__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cms-slug__icon {
  width: 16px;
  height: 16px;
}
</style>
