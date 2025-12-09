<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GroupFieldDefinition } from '../../types'

interface Props {
  modelValue: Record<string, unknown>
  field: GroupFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const data = computed({
  get: () => props.modelValue || {},
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')

const isCollapsed = ref(props.field.collapsed ?? false)

function updateField(fieldKey: string, value: unknown) {
  data.value = { ...data.value, [fieldKey]: value }
}

// Field component mapping
function getFieldComponent(type: string): string {
  const componentMap: Record<string, string> = {
    text: 'CmsFieldText',
    textarea: 'CmsFieldTextarea',
    number: 'CmsFieldNumber',
    email: 'CmsFieldEmail',
    url: 'CmsFieldUrl',
    password: 'CmsFieldPassword',
    select: 'CmsFieldSelect',
    radio: 'CmsFieldRadio',
    checkbox: 'CmsFieldCheckbox',
    boolean: 'CmsFieldBoolean',
    richtext: 'CmsFieldRichtext',
    markdown: 'CmsFieldMarkdown',
    code: 'CmsFieldCode',
    image: 'CmsFieldImage',
    file: 'CmsFieldFile',
    gallery: 'CmsFieldGallery',
    date: 'CmsFieldDate',
    datetime: 'CmsFieldDatetime',
    time: 'CmsFieldTime',
    relation: 'CmsFieldRelation',
    json: 'CmsFieldJson',
    color: 'CmsFieldColor',
    slug: 'CmsFieldSlug'
  }

  return componentMap[type] || 'CmsFieldText'
}
</script>

<template>
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center gap-2 px-4 py-3 bg-gray-50 cursor-pointer"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="text-gray-500">
        {{ isCollapsed ? '▶' : '▼' }}
      </span>
      <span class="font-medium">{{ label }}</span>
      <span v-if="help" class="text-sm text-gray-400 ml-2">{{ help }}</span>
    </div>

    <!-- Content -->
    <div v-show="!isCollapsed" class="p-4 space-y-4">
      <component
        v-for="(fieldDef, fieldKey) in field.fields"
        :key="fieldKey"
        :is="getFieldComponent(fieldDef.type)"
        :model-value="data[fieldKey]"
        :field="fieldDef"
        :field-name="fieldKey"
        :disabled="disabled"
        :form-data="data"
        @update:model-value="updateField(fieldKey, $event)"
      />
    </div>
  </div>
</template>
