<script setup lang="ts">
import { computed } from 'vue'
import type { RepeaterFieldDefinition, FieldDefinition } from '../../types'

interface Props {
  modelValue: Record<string, unknown>[]
  field: RepeaterFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>[]]
}>()

const items = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)

const canAddMore = computed(() => {
  if (!props.field.max) return true
  return items.value.length < props.field.max
})

const canRemove = computed(() => {
  if (!props.field.min) return true
  return items.value.length > props.field.min
})

const collapsedItems = ref<Set<number>>(new Set())

function addItem() {
  if (!canAddMore.value) return

  const newItem: Record<string, unknown> = {}
  for (const [key, field] of Object.entries(props.field.fields)) {
    newItem[key] = field.default ?? null
  }

  items.value = [...items.value, newItem]
}

function removeItem(index: number) {
  if (!canRemove.value) return

  const newItems = [...items.value]
  newItems.splice(index, 1)
  items.value = newItems
  collapsedItems.value.delete(index)
}

function moveItem(from: number, to: number) {
  if (to < 0 || to >= items.value.length) return

  const newItems = [...items.value]
  const [removed] = newItems.splice(from, 1)
  newItems.splice(to, 0, removed)
  items.value = newItems
}

function toggleCollapse(index: number) {
  if (collapsedItems.value.has(index)) {
    collapsedItems.value.delete(index)
  } else {
    collapsedItems.value.add(index)
  }
}

function updateItemField(index: number, fieldKey: string, value: unknown) {
  const newItems = [...items.value]
  newItems[index] = { ...newItems[index], [fieldKey]: value }
  items.value = newItems
}

function getItemLabel(item: Record<string, unknown>, index: number): string {
  if (props.field.itemLabel) {
    const labelField = item[props.field.itemLabel]
    if (labelField) return String(labelField)
  }

  // Try common fields
  for (const key of ['title', 'name', 'label']) {
    if (item[key]) return String(item[key])
  }

  return `Item ${index + 1}`
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
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div class="space-y-3">
      <!-- Items -->
      <div
        v-for="(item, index) in items"
        :key="index"
        class="border border-gray-200 rounded-lg overflow-hidden"
      >
        <!-- Item header -->
        <div
          class="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer"
          @click="toggleCollapse(index)"
        >
          <!-- Drag handle -->
          <span
            v-if="field.sortable !== false"
            class="text-gray-400 cursor-move"
          >
            ⋮⋮
          </span>

          <!-- Collapse toggle -->
          <span class="text-gray-500">
            {{ collapsedItems.has(index) ? '▶' : '▼' }}
          </span>

          <!-- Label -->
          <span class="flex-1 font-medium text-sm">
            {{ getItemLabel(item, index) }}
          </span>

          <!-- Actions -->
          <div class="flex gap-1" @click.stop>
            <button
              v-if="field.sortable !== false && index > 0"
              type="button"
              class="p-1 text-gray-500 hover:text-gray-700"
              :disabled="disabled"
              @click="moveItem(index, index - 1)"
            >
              ↑
            </button>
            <button
              v-if="field.sortable !== false && index < items.length - 1"
              type="button"
              class="p-1 text-gray-500 hover:text-gray-700"
              :disabled="disabled"
              @click="moveItem(index, index + 1)"
            >
              ↓
            </button>
            <button
              v-if="canRemove"
              type="button"
              class="p-1 text-red-500 hover:text-red-700"
              :disabled="disabled"
              @click="removeItem(index)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Item fields -->
        <div
          v-show="!collapsedItems.has(index)"
          class="p-4 space-y-4"
        >
          <component
            v-for="(fieldDef, fieldKey) in field.fields"
            :key="fieldKey"
            :is="getFieldComponent(fieldDef.type)"
            :model-value="item[fieldKey]"
            :field="fieldDef"
            :field-name="fieldKey"
            :disabled="disabled"
            :form-data="item"
            @update:model-value="updateItemField(index, fieldKey, $event)"
          />
        </div>
      </div>

      <!-- Add button -->
      <UButton
        v-if="canAddMore && !disabled"
        type="button"
        variant="outline"
        class="w-full"
        @click="addItem"
      >
        + Add {{ field.itemLabel || 'Item' }}
      </UButton>

      <!-- Min/Max info -->
      <div v-if="field.min || field.max" class="text-xs text-gray-400 text-right">
        {{ items.length }}
        <span v-if="field.min">/ min {{ field.min }}</span>
        <span v-if="field.max">/ max {{ field.max }}</span>
      </div>
    </div>
  </UFormField>
</template>
