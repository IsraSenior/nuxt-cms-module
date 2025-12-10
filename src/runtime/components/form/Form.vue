<script setup lang="ts">
import { computed } from 'vue'
import type { FieldsSchema } from '../../types'
import { getFieldComponent } from '../fields'

interface Props {
  fields: FieldsSchema
  modelValue: Record<string, unknown>
  translations?: Record<string, Record<string, unknown>>
  locales?: string[]
  currentLocale?: string
  disabled?: boolean
  errors?: Record<string, string>
  excludeFields?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  translations: () => ({}),
  locales: () => [],
  currentLocale: '',
  disabled: false,
  errors: () => ({}),
  excludeFields: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  'update:translations': [value: Record<string, Record<string, unknown>>]
  'update:currentLocale': [value: string]
  'submit': []
}>()

const formData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Check if multilingual mode is active
const isMultilingual = computed(() => props.locales.length > 1)

// Get merged data for current locale
const currentData = computed(() => {
  if (!props.currentLocale || !props.translations[props.currentLocale]) {
    return formData.value
  }
  return { ...formData.value, ...props.translations[props.currentLocale] }
})

// Check if a field is translatable
function isFieldTranslatable(field: any): boolean {
  return field.translatable !== false &&
    ['text', 'textarea', 'richtext', 'markdown', 'code'].includes(field.type)
}

function updateField(fieldKey: string, value: unknown) {
  const field = props.fields[fieldKey]

  // Check if field is translatable and we have a locale selected
  const isTranslatable = isFieldTranslatable(field)

  if (isTranslatable && props.currentLocale) {
    // Update translation
    const newTranslations = { ...props.translations }
    if (!newTranslations[props.currentLocale]) {
      newTranslations[props.currentLocale] = {}
    }
    newTranslations[props.currentLocale] = {
      ...newTranslations[props.currentLocale],
      [fieldKey]: value
    }
    emit('update:translations', newTranslations)
  } else {
    // Update base data
    formData.value = { ...formData.value, [fieldKey]: value }
  }
}

function handleSubmit() {
  emit('submit')
}

// Group fields by width into rows
const fieldGroups = computed(() => {
  const groups: { key: string; field: any; width: string; translatable: boolean }[][] = []
  let currentRow: { key: string; field: any; width: string; translatable: boolean }[] = []
  let currentWidth = 0

  const widthMap: Record<string, number> = {
    full: 12,
    half: 6,
    third: 4,
    quarter: 3
  }

  for (const [key, field] of Object.entries(props.fields)) {
    if (field.hidden) continue
    if (props.excludeFields.includes(key)) continue

    const width = field.width || 'full'
    const widthValue = widthMap[width] || 12
    const translatable = isFieldTranslatable(field)

    if (currentWidth + widthValue > 12) {
      groups.push(currentRow)
      currentRow = []
      currentWidth = 0
    }

    currentRow.push({ key, field, width, translatable })
    currentWidth += widthValue

    if (currentWidth >= 12) {
      groups.push(currentRow)
      currentRow = []
      currentWidth = 0
    }
  }

  if (currentRow.length > 0) {
    groups.push(currentRow)
  }

  return groups
})
</script>

<template>
  <form class="cms-form" @submit.prevent="handleSubmit">
    <!-- Locale switcher -->
    <div v-if="isMultilingual" class="cms-form__locale-panel">
      <div class="cms-form__locale-header">
        <svg class="cms-form__locale-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7.75 2.75a.75.75 0 0 0-1.5 0v1.258a32.987 32.987 0 0 0-3.599.278.75.75 0 1 0 .198 1.487A31.545 31.545 0 0 1 8.7 5.545 19.381 19.381 0 0 1 7 9.56a19.418 19.418 0 0 1-1.002-2.05.75.75 0 0 0-1.384.577 20.935 20.935 0 0 0 1.492 2.91 19.613 19.613 0 0 1-3.828 4.154.75.75 0 1 0 .945 1.164A21.116 21.116 0 0 0 7 12.331c.095.132.192.262.29.391a.75.75 0 0 0 1.194-.91c-.204-.266-.4-.538-.59-.815a20.888 20.888 0 0 0 2.333-5.332c.31.031.618.068.924.108a.75.75 0 0 0 .198-1.487 32.832 32.832 0 0 0-3.599-.278V2.75Z" />
          <path fill-rule="evenodd" d="M13 8a.75.75 0 0 1 .671.415l4.25 8.5a.75.75 0 1 1-1.342.67L15.787 16h-5.573l-.793 1.585a.75.75 0 1 1-1.342-.67l4.25-8.5A.75.75 0 0 1 13 8Zm2.037 6.5L13 10.427 10.964 14.5h4.073Z" clip-rule="evenodd" />
        </svg>
        <span class="cms-form__locale-title">Language</span>
        <span class="cms-form__locale-active-label">{{ currentLocale.toUpperCase() }}</span>
      </div>
      <div class="cms-form__locale-switcher">
        <button
          v-for="locale in locales"
          :key="locale"
          type="button"
          class="cms-form__locale-btn"
          :class="{ 'cms-form__locale-btn--active': currentLocale === locale }"
          @click="$emit('update:currentLocale', locale)"
        >
          {{ locale.toUpperCase() }}
        </button>
      </div>
      <p class="cms-form__locale-hint">
        Fields marked with <span class="cms-form__translatable-badge-inline"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M6.2 2.2a.75.75 0 0 0-1.4.6l.7 1.6a22.3 22.3 0 0 0-2.4.2.75.75 0 1 0 .2 1.5h.1l.9-.1A13 13 0 0 1 3 9.5a13.2 13.2 0 0 1-.7-1.4.75.75 0 0 0-1.4.6c.3.7.6 1.4 1 2a13.2 13.2 0 0 1-2.6 2.8.75.75 0 1 0 1 1.1 14.5 14.5 0 0 0 2.8-3l.2.2a.75.75 0 0 0 1-.7l-.4-.6a14.2 14.2 0 0 0 1.6-3.6h.1a.75.75 0 0 0 .2-1.5 22.1 22.1 0 0 0-2.4-.2l-.7-1.6ZM11 6a.75.75 0 0 1 .7.4l2.8 5.7a.75.75 0 1 1-1.4.7l-.5-1h-3.7l-.5 1a.75.75 0 1 1-1.4-.7l2.9-5.7A.75.75 0 0 1 11 6Zm1.3 4.3L11 7.6l-1.3 2.7h2.6Z"/></svg></span> can be translated
      </p>
    </div>

    <!-- Fields -->
    <div class="cms-form__fields">
      <div
        v-for="(row, rowIndex) in fieldGroups"
        :key="rowIndex"
        class="cms-form__row"
      >
        <div
          v-for="{ key, field, width, translatable } in row"
          :key="key"
          class="cms-form__field"
          :class="`cms-form__field--${width}`"
        >
          <!-- Translatable indicator wrapper -->
          <div v-if="isMultilingual && translatable" class="cms-form__field-translatable">
            <span class="cms-form__translatable-badge" :title="`This field can be translated (editing ${currentLocale.toUpperCase()})`">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.2 2.2a.75.75 0 0 0-1.4.6l.7 1.6a22.3 22.3 0 0 0-2.4.2.75.75 0 1 0 .2 1.5h.1l.9-.1A13 13 0 0 1 3 9.5a13.2 13.2 0 0 1-.7-1.4.75.75 0 0 0-1.4.6c.3.7.6 1.4 1 2a13.2 13.2 0 0 1-2.6 2.8.75.75 0 1 0 1 1.1 14.5 14.5 0 0 0 2.8-3l.2.2a.75.75 0 0 0 1-.7l-.4-.6a14.2 14.2 0 0 0 1.6-3.6h.1a.75.75 0 0 0 .2-1.5 22.1 22.1 0 0 0-2.4-.2l-.7-1.6ZM11 6a.75.75 0 0 1 .7.4l2.8 5.7a.75.75 0 1 1-1.4.7l-.5-1h-3.7l-.5 1a.75.75 0 1 1-1.4-.7l2.9-5.7A.75.75 0 0 1 11 6Zm1.3 4.3L11 7.6l-1.3 2.7h2.6Z"/>
              </svg>
            </span>
          </div>
          <component
            :is="getFieldComponent(field.type)"
            :model-value="currentData[key]"
            :field="field"
            :field-name="key"
            :disabled="disabled || field.readonly"
            :error="errors[key]"
            :form-data="currentData"
            @update:model-value="updateField(key, $event)"
          />
        </div>
      </div>
    </div>

    <slot name="actions" />
  </form>
</template>

<style>
.cms-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Locale Panel */
.cms-form__locale-panel {
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 16px 20px;
}

.cms-form__locale-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.cms-form__locale-icon {
  width: 20px;
  height: 20px;
  color: #2563eb;
}

.cms-form__locale-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
}

.cms-form__locale-active-label {
  margin-left: auto;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  background-color: #2563eb;
  color: white;
  border-radius: 6px;
}

/* Locale Switcher */
.cms-form__locale-switcher {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cms-form__locale-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  background-color: white;
  color: #374151;
}

.cms-form__locale-btn:hover {
  border-color: #93c5fd;
  background-color: #eff6ff;
}

.cms-form__locale-btn--active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.cms-form__locale-btn--active:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

.cms-form__locale-hint {
  margin: 12px 0 0 0;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cms-form__translatable-badge-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background-color: #dbeafe;
  color: #2563eb;
  border-radius: 4px;
  vertical-align: middle;
}

.cms-form__translatable-badge-inline svg {
  width: 10px;
  height: 10px;
}

/* Fields Container */
.cms-form__fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Row - CSS Grid for field layout */
.cms-form__row {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

/* Field widths */
.cms-form__field {
  min-width: 0; /* Prevent grid blowout */
  position: relative;
}

.cms-form__field--full {
  grid-column: span 12;
}

.cms-form__field--half {
  grid-column: span 12;
}

.cms-form__field--third {
  grid-column: span 12;
}

.cms-form__field--quarter {
  grid-column: span 12;
}

/* Translatable field indicator */
.cms-form__field-translatable {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
}

.cms-form__translatable-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #dbeafe;
  color: #2563eb;
  border-radius: 4px;
  cursor: help;
  transition: background-color 0.15s ease;
}

.cms-form__translatable-badge:hover {
  background-color: #bfdbfe;
}

.cms-form__translatable-badge svg {
  width: 12px;
  height: 12px;
}

/* Responsive: apply actual widths on larger screens */
@media (min-width: 768px) {
  .cms-form__field--half {
    grid-column: span 6;
  }

  .cms-form__field--third {
    grid-column: span 4;
  }

  .cms-form__field--quarter {
    grid-column: span 3;
  }
}
</style>
