<script setup lang="ts">
import { computed, ref } from 'vue'
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

// Drag and drop state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

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

// Drag and drop handlers
function handleDragStart(event: DragEvent, index: number) {
  if (props.disabled || props.field.sortable === false) return

  draggedIndex.value = index

  // Set drag data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) return

  dragOverIndex.value = index

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDragLeave(event: DragEvent) {
  // Only clear if leaving the item completely
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement

  if (!currentTarget.contains(relatedTarget)) {
    dragOverIndex.value = null
  }
}

function handleDrop(event: DragEvent, toIndex: number) {
  event.preventDefault()

  if (draggedIndex.value === null || draggedIndex.value === toIndex) {
    resetDragState()
    return
  }

  moveItem(draggedIndex.value, toIndex)
  resetDragState()
}

function handleDragEnd() {
  resetDragState()
}

function resetDragState() {
  draggedIndex.value = null
  dragOverIndex.value = null
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
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>

    <div class="cms-repeater">
      <!-- Items -->
      <div
        v-for="(item, index) in items"
        :key="index"
        class="cms-repeater__item"
        :class="{
          'cms-repeater__item--dragging': draggedIndex === index,
          'cms-repeater__item--drag-over': dragOverIndex === index && draggedIndex !== index
        }"
        :draggable="field.sortable !== false && !disabled"
        @dragstart="handleDragStart($event, index)"
        @dragover="handleDragOver($event, index)"
        @dragleave="handleDragLeave($event)"
        @drop="handleDrop($event, index)"
        @dragend="handleDragEnd"
      >
        <!-- Item header -->
        <div
          class="cms-repeater__header"
          @click="toggleCollapse(index)"
        >
          <!-- Drag handle -->
          <span
            v-if="field.sortable !== false"
            class="cms-repeater__drag"
            :class="{ 'cms-repeater__drag--active': !disabled }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-repeater__drag-icon">
              <path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .55.24l3.25 3.5a.75.75 0 1 1-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 0 1-1.1-1.02l3.25-3.5A.75.75 0 0 1 10 3Zm-3.76 9.24a.75.75 0 0 1 1.06.04l2.7 2.908 2.7-2.908a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0l-3.25-3.5a.75.75 0 0 1 .04-1.06Z" clip-rule="evenodd" />
            </svg>
          </span>

          <!-- Collapse toggle -->
          <span class="cms-repeater__toggle">
            <svg v-if="collapsedItems.has(index)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-repeater__toggle-icon">
              <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-repeater__toggle-icon">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </span>

          <!-- Label -->
          <span class="cms-repeater__label">
            {{ getItemLabel(item, index) }}
          </span>

          <!-- Actions -->
          <div class="cms-repeater__actions" @click.stop>
            <button
              v-if="field.sortable !== false && index > 0"
              type="button"
              class="cms-repeater__action-btn"
              :disabled="disabled"
              @click="moveItem(index, index - 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-repeater__action-icon">
                <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" />
              </svg>
            </button>
            <button
              v-if="field.sortable !== false && index < items.length - 1"
              type="button"
              class="cms-repeater__action-btn"
              :disabled="disabled"
              @click="moveItem(index, index + 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-repeater__action-icon">
                <path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" />
              </svg>
            </button>
            <button
              v-if="canRemove"
              type="button"
              class="cms-repeater__action-btn cms-repeater__action-btn--danger"
              :disabled="disabled"
              @click="removeItem(index)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-repeater__action-icon">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Item fields -->
        <div
          v-show="!collapsedItems.has(index)"
          class="cms-repeater__content"
        >
          <div
            v-for="(fieldDef, fieldKey) in field.fields"
            :key="fieldKey"
            class="cms-repeater__field"
            :class="{
              'cms-repeater__field--half': fieldDef.width === 'half',
              'cms-repeater__field--third': fieldDef.width === 'third',
              'cms-repeater__field--two-thirds': fieldDef.width === 'two-thirds',
              'cms-repeater__field--quarter': fieldDef.width === 'quarter'
            }"
          >
            <component
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
      </div>

      <!-- Add button -->
      <button
        v-if="canAddMore && !disabled"
        type="button"
        class="cms-repeater__add-btn"
        @click="addItem"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-repeater__add-icon">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Add {{ field.itemLabel || 'Item' }}
      </button>

      <!-- Min/Max info -->
      <div v-if="field.min || field.max" class="cms-repeater__info">
        {{ items.length }}
        <span v-if="field.min">/ min {{ field.min }}</span>
        <span v-if="field.max">/ max {{ field.max }}</span>
      </div>
    </div>

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

.cms-repeater {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cms-repeater__item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
}

.cms-repeater__item--dragging {
  opacity: 0.5;
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cms-repeater__item--drag-over {
  border-color: #3b82f6;
  border-style: dashed;
  background-color: #eff6ff;
}

.cms-repeater__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f9fafb;
  cursor: pointer;
}

.cms-repeater__drag {
  color: #9ca3af;
  cursor: default;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.cms-repeater__drag--active {
  cursor: grab;
}

.cms-repeater__drag--active:hover {
  color: #6b7280;
  background-color: #e5e7eb;
}

.cms-repeater__drag--active:active {
  cursor: grabbing;
}

.cms-repeater__drag-icon {
  width: 16px;
  height: 16px;
  display: block;
}

.cms-repeater__toggle {
  color: #6b7280;
}

.cms-repeater__toggle-icon {
  width: 16px;
  height: 16px;
}

.cms-repeater__label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.cms-repeater__actions {
  display: flex;
  gap: 4px;
}

.cms-repeater__action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.cms-repeater__action-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.cms-repeater__action-btn--danger {
  color: #dc2626;
}

.cms-repeater__action-btn--danger:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.cms-repeater__action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cms-repeater__action-icon {
  width: 14px;
  height: 14px;
}

.cms-repeater__content {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

.cms-repeater__field {
  grid-column: span 12;
}

.cms-repeater__field--half {
  grid-column: span 6;
}

.cms-repeater__field--third {
  grid-column: span 4;
}

.cms-repeater__field--two-thirds {
  grid-column: span 8;
}

.cms-repeater__field--quarter {
  grid-column: span 3;
}

.cms-repeater__add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cms-repeater__add-btn:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.cms-repeater__add-icon {
  width: 16px;
  height: 16px;
}

.cms-repeater__info {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
}
</style>
