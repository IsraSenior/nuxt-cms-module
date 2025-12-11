<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { SelectFieldDefinition } from '../../types'

interface Props {
  modelValue: string | number | (string | number)[] | null
  field: SelectFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[] | null]
}>()

// State
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const containerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const optionsRef = ref<HTMLElement | null>(null)

// Computed
const label = computed(() => props.field.label || props.fieldName)
const placeholder = computed(() => props.field.placeholder || 'Select an option')
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)
const multiple = computed(() => props.field.multiple || false)
const searchable = computed(() => props.field.searchable !== false)

const options = computed(() => props.field.options.map(opt => ({
  label: opt.label,
  value: opt.value,
  disabled: opt.disabled
})))

// Filter options based on search
const filteredOptions = computed(() => {
  if (!searchQuery.value) return options.value
  const query = searchQuery.value.toLowerCase()
  return options.value.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})

// Get selected values as array
const selectedValues = computed<(string | number)[]>(() => {
  if (props.modelValue === null || props.modelValue === undefined) return []
  if (Array.isArray(props.modelValue)) return props.modelValue
  return [props.modelValue]
})

// Get selected options for display
const selectedOptions = computed(() => {
  return options.value.filter(opt => selectedValues.value.includes(opt.value))
})

// Display text for single select
const displayText = computed(() => {
  if (selectedOptions.value.length === 0) return ''
  if (multiple.value) {
    return selectedOptions.value.map(o => o.label).join(', ')
  }
  return selectedOptions.value[0]?.label || ''
})

// Is an option selected?
function isSelected(value: string | number): boolean {
  return selectedValues.value.includes(value)
}

// Toggle dropdown
function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    highlightedIndex.value = -1
    searchQuery.value = ''
    // Focus search input
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 50)
  }
}

// Select an option
function selectOption(option: { value: string | number; disabled?: boolean }) {
  if (option.disabled) return

  if (multiple.value) {
    const current = [...selectedValues.value]
    const index = current.indexOf(option.value)
    if (index > -1) {
      current.splice(index, 1)
    } else {
      current.push(option.value)
    }
    emit('update:modelValue', current)
  } else {
    emit('update:modelValue', option.value)
    isOpen.value = false
    searchQuery.value = ''
  }
}

// Remove a selected value (for multiple)
function removeValue(value: string | number, event: Event) {
  event.stopPropagation()
  if (props.disabled) return

  const current = [...selectedValues.value]
  const index = current.indexOf(value)
  if (index > -1) {
    current.splice(index, 1)
    emit('update:modelValue', current.length > 0 ? current : null)
  }
}

// Clear all
function clearAll(event: Event) {
  event.stopPropagation()
  if (props.disabled) return
  emit('update:modelValue', multiple.value ? [] : null)
}

// Keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      toggleDropdown()
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        filteredOptions.value.length - 1
      )
      scrollToHighlighted()
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      scrollToHighlighted()
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && filteredOptions.value[highlightedIndex.value]) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      isOpen.value = false
      searchQuery.value = ''
      break
  }
}

function scrollToHighlighted() {
  if (!optionsRef.value) return
  const highlighted = optionsRef.value.querySelector('.cms-select__option--highlighted')
  if (highlighted) {
    highlighted.scrollIntoView({ block: 'nearest' })
  }
}

// Close on outside click
function handleOutsideClick(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

// Reset highlight when search changes
watch(searchQuery, () => {
  highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1
})

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="cms-field">
    <label class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>

    <div
      ref="containerRef"
      class="cms-select"
      :class="{
        'cms-select--open': isOpen,
        'cms-select--disabled': disabled,
        'cms-select--error': error,
        'cms-select--multiple': multiple
      }"
      @keydown="handleKeydown"
    >
      <!-- Trigger -->
      <button
        type="button"
        class="cms-select__trigger"
        :disabled="disabled"
        @click="toggleDropdown"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
      >
        <!-- Selected values for multiple -->
        <div v-if="multiple && selectedOptions.length > 0" class="cms-select__tags">
          <span
            v-for="opt in selectedOptions"
            :key="String(opt.value)"
            class="cms-select__tag"
          >
            {{ opt.label }}
            <button
              type="button"
              class="cms-select__tag-remove"
              @click="removeValue(opt.value, $event)"
              :disabled="disabled"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="cms-select__tag-icon">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
              </svg>
            </button>
          </span>
        </div>

        <!-- Single value or placeholder -->
        <span
          v-else
          class="cms-select__value"
          :class="{ 'cms-select__value--placeholder': !displayText }"
        >
          {{ displayText || placeholder }}
        </span>

        <!-- Actions -->
        <div class="cms-select__actions">
          <!-- Clear button -->
          <button
            v-if="selectedValues.length > 0 && !disabled"
            type="button"
            class="cms-select__clear"
            @click="clearAll"
            title="Clear"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="cms-select__clear-icon">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
            </svg>
          </button>

          <!-- Chevron -->
          <svg
            class="cms-select__chevron"
            :class="{ 'cms-select__chevron--open': isOpen }"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
          </svg>
        </div>
      </button>

      <!-- Dropdown -->
      <Transition name="dropdown">
        <div v-if="isOpen" class="cms-select__dropdown">
          <!-- Search -->
          <div v-if="searchable" class="cms-select__search-wrap">
            <svg class="cms-select__search-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/>
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="cms-select__search"
              placeholder="Search..."
              @click.stop
            />
          </div>

          <!-- Options -->
          <div ref="optionsRef" class="cms-select__options" role="listbox">
            <template v-if="filteredOptions.length > 0">
              <button
                v-for="(option, index) in filteredOptions"
                :key="String(option.value)"
                type="button"
                class="cms-select__option"
                :class="{
                  'cms-select__option--selected': isSelected(option.value),
                  'cms-select__option--highlighted': index === highlightedIndex,
                  'cms-select__option--disabled': option.disabled
                }"
                role="option"
                :aria-selected="isSelected(option.value)"
                :disabled="option.disabled"
                @click="selectOption(option)"
                @mouseenter="highlightedIndex = index"
              >
                <!-- Checkbox for multiple -->
                <span v-if="multiple" class="cms-select__checkbox">
                  <svg v-if="isSelected(option.value)" viewBox="0 0 20 20" fill="currentColor" class="cms-select__check">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/>
                  </svg>
                </span>

                <span class="cms-select__option-label">{{ option.label }}</span>

                <!-- Checkmark for single -->
                <svg
                  v-if="!multiple && isSelected(option.value)"
                  class="cms-select__option-check"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/>
                </svg>
              </button>
            </template>
            <div v-else class="cms-select__empty">
              No options found
            </div>
          </div>

          <!-- Footer for multiple -->
          <div v-if="multiple && selectedValues.length > 0" class="cms-select__footer">
            <span>{{ selectedValues.length }} selected</span>
            <button type="button" class="cms-select__footer-clear" @click="clearAll">
              Clear all
            </button>
          </div>
        </div>
      </Transition>
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
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.cms-field__error {
  font-size: 13px;
  color: #dc2626;
  margin: 0;
}

/* Select Container */
.cms-select {
  position: relative;
}

.cms-select--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Trigger Button */
.cms-select__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.cms-select__trigger:hover:not(:disabled) {
  border-color: #9ca3af;
}

.cms-select--open .cms-select__trigger {
  border-color: var(--cms-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--cms-primary-light, rgba(37, 99, 235, 0.1));
}

.cms-select--error .cms-select__trigger {
  border-color: #dc2626;
}

.cms-select--error.cms-select--open .cms-select__trigger {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

/* Value Display */
.cms-select__value {
  flex: 1;
  font-size: 14px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-select__value--placeholder {
  color: #9ca3af;
}

/* Tags (Multiple) */
.cms-select__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.cms-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 13px;
  background-color: var(--cms-primary-light, #dbeafe);
  color: var(--cms-primary, #2563eb);
  border-radius: 6px;
  font-weight: 500;
}

.cms-select__tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s ease;
}

.cms-select__tag-remove:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.cms-select__tag-icon {
  width: 12px;
  height: 12px;
}

/* Actions */
.cms-select__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cms-select__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cms-select__clear:hover {
  color: #6b7280;
  background-color: #f3f4f6;
}

.cms-select__clear-icon {
  width: 16px;
  height: 16px;
}

.cms-select__chevron {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.cms-select__chevron--open {
  transform: rotate(180deg);
}

/* Dropdown */
.cms-select__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Search */
.cms-select__search-wrap {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.cms-select__search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.cms-select__search {
  width: 100%;
  padding: 8px 12px 8px 34px;
  font-size: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s ease;
}

.cms-select__search:focus {
  border-color: var(--cms-primary, #2563eb);
}

.cms-select__search::placeholder {
  color: #9ca3af;
}

/* Options */
.cms-select__options {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
}

.cms-select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #374151;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s ease;
}

.cms-select__option:hover:not(:disabled),
.cms-select__option--highlighted:not(:disabled) {
  background-color: #f3f4f6;
}

.cms-select__option--selected {
  color: var(--cms-primary, #2563eb);
  font-weight: 500;
}

.cms-select__option--selected:hover:not(:disabled),
.cms-select__option--selected.cms-select__option--highlighted:not(:disabled) {
  background-color: var(--cms-primary, #2563eb);
  color: white;
}

.cms-select__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cms-select__option-label {
  flex: 1;
}

/* Checkbox for multiple */
.cms-select__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.cms-select__option--selected .cms-select__checkbox {
  background-color: var(--cms-primary, #2563eb);
  border-color: var(--cms-primary, #2563eb);
}

.cms-select__check {
  width: 14px;
  height: 14px;
  color: white;
}

/* Checkmark for single */
.cms-select__option-check {
  width: 18px;
  height: 18px;
  color: var(--cms-primary, #2563eb);
  flex-shrink: 0;
}

/* Empty State */
.cms-select__empty {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Footer */
.cms-select__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 13px;
  color: #6b7280;
}

.cms-select__footer-clear {
  padding: 4px 8px;
  font-size: 13px;
  color: var(--cms-primary, #2563eb);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cms-select__footer-clear:hover {
  background-color: var(--cms-primary-light, #dbeafe);
}
</style>
