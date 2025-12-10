<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAsyncData } from '#imports'
import type { RelationFieldDefinition } from '../../types'

interface Props {
  modelValue: string | string[] | null
  field: RelationFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || `Select from ${props.field.collection}`)
const required = computed(() => props.field.required || false)
const isMultiple = computed(() =>
  props.field.relationship === 'one-to-many' ||
  props.field.relationship === 'many-to-many'
)

// Fetch related collection items
const { data: options, pending } = useAsyncData(
  `relation-${props.field.collection}`,
  () => $fetch(`/api/cms/collections/${props.field.collection}`, {
    params: { perPage: 100 }
  }),
  { lazy: true }
)

const selectOptions = computed(() => {
  if (!options.value?.data) return []

  const displayField = props.field.displayField || 'title'

  return options.value.data.map((item: any) => ({
    label: item.data?.[displayField] || item.id,
    value: item.id
  }))
})

// For search functionality
const searchQuery = ref('')
const filteredOptions = computed(() => {
  if (!searchQuery.value) return selectOptions.value

  const query = searchQuery.value.toLowerCase()
  return selectOptions.value.filter((opt: any) =>
    opt.label.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>

    <!-- Loading state -->
    <div v-if="pending" class="cms-field__relation-loading">
      <svg class="cms-field__relation-spinner" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
      </svg>
      <span>Loading options...</span>
    </div>

    <!-- Select input -->
    <select
      v-else
      v-model="value"
      class="cms-field__select"
      :class="{
        'cms-field__select--error': error,
        'cms-field__select--disabled': disabled,
        'cms-field__select--placeholder': !value
      }"
      :disabled="disabled"
      :multiple="isMultiple"
    >
      <option v-if="!isMultiple" value="" disabled>Select {{ field.collection }}</option>
      <option
        v-for="option in filteredOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <p v-if="help && !error" class="cms-field__help">{{ help }}</p>
    <p v-if="error" class="cms-field__error">{{ error }}</p>
  </div>
</template>

<style>
.cms-field__relation-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.cms-field__relation-spinner {
  width: 18px;
  height: 18px;
  animation: cms-spin 1s linear infinite;
}

@keyframes cms-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
