<script setup lang="ts">
import { computed } from 'vue'
import type { ColorFieldDefinition } from '../../types'

interface Props {
  modelValue: string | null
  field: ColorFieldDefinition
  fieldName: string
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
  get: () => props.modelValue || '#000000',
  set: (val) => emit('update:modelValue', val)
})

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)

const presets = computed(() => props.field.presets || [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
])
</script>

<template>
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div class="space-y-3">
      <!-- Color picker -->
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer overflow-hidden"
          :style="{ backgroundColor: value }"
        >
          <input
            v-model="value"
            type="color"
            class="w-full h-full opacity-0 cursor-pointer"
            :disabled="disabled"
          />
        </div>
        <UInput
          v-model="value"
          variant="outline"
          :disabled="disabled"
          placeholder="#000000"
          class="flex-1 font-mono"
        />
      </div>

      <!-- Presets -->
      <div v-if="presets.length > 0" class="flex flex-wrap gap-2">
        <button
          v-for="color in presets"
          :key="color"
          type="button"
          class="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
          :class="{ 'ring-2 ring-blue-500': value === color }"
          :style="{ backgroundColor: color }"
          :disabled="disabled"
          @click="value = color"
        />
      </div>
    </div>
  </UFormField>
</template>
