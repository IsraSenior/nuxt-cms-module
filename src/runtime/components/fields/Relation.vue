<script setup lang="ts">
import { computed, ref } from 'vue'
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
  return selectOptions.value.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div v-if="pending" class="text-gray-500 text-sm">
      Loading options...
    </div>

    <USelect
      v-else
      v-model="value"
      :options="filteredOptions"
      :placeholder="`Select ${field.collection}`"
      :disabled="disabled"
      :multiple="isMultiple"
      :searchable="true"
      class="w-full"
    />
  </UFormField>
</template>
