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

// Get merged data for current locale
const currentData = computed(() => {
  if (!props.currentLocale || !props.translations[props.currentLocale]) {
    return formData.value
  }
  return { ...formData.value, ...props.translations[props.currentLocale] }
})

function updateField(fieldKey: string, value: unknown) {
  const field = props.fields[fieldKey]

  // Check if field is translatable and we have a locale selected
  const isTranslatable = field.translatable !== false &&
    ['text', 'textarea', 'richtext', 'markdown', 'code'].includes(field.type)

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

// Group fields by width
const fieldGroups = computed(() => {
  const groups: { key: string; field: any; width: string }[][] = []
  let currentRow: { key: string; field: any; width: string }[] = []
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

    if (currentWidth + widthValue > 12) {
      groups.push(currentRow)
      currentRow = []
      currentWidth = 0
    }

    currentRow.push({ key, field, width })
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

function getWidthClass(width: string): string {
  const classes: Record<string, string> = {
    full: 'col-span-12',
    half: 'col-span-12 md:col-span-6',
    third: 'col-span-12 md:col-span-4',
    quarter: 'col-span-12 md:col-span-3'
  }
  return classes[width] || 'col-span-12'
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- Locale switcher -->
    <div v-if="locales.length > 1" class="mb-6">
      <div class="flex gap-2">
        <button
          v-for="locale in locales"
          :key="locale"
          type="button"
          class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          :class="currentLocale === locale
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          @click="$emit('update:currentLocale', locale)"
        >
          {{ locale.toUpperCase() }}
        </button>
      </div>
    </div>

    <!-- Fields -->
    <div class="space-y-6">
      <div
        v-for="(row, rowIndex) in fieldGroups"
        :key="rowIndex"
        class="grid grid-cols-12 gap-4"
      >
        <div
          v-for="{ key, field, width } in row"
          :key="key"
          :class="getWidthClass(width)"
        >
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
