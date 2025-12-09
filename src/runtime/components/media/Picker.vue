<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCmsMedia } from '../../composables/useCmsMedia'

const props = defineProps<{
  modelValue?: string | string[]
  multiple?: boolean
  accept?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[] | null): void
}>()

const { items, upload, uploading, refresh } = useCmsMedia({
  type: props.accept?.[0]?.startsWith('image/') ? 'image' : undefined
})

const isOpen = ref(false)

const selectedItems = computed(() => {
  if (!props.modelValue) return []
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
})

function selectItem(id: string) {
  if (props.multiple) {
    const current = selectedItems.value
    if (current.includes(id)) {
      emit('update:modelValue', current.filter(i => i !== id))
    } else {
      emit('update:modelValue', [...current, id])
    }
  } else {
    emit('update:modelValue', id)
    isOpen.value = false
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const media = await upload(file)
    if (media) {
      selectItem(media.id)
    }
  }
}

function open() {
  isOpen.value = true
  refresh()
}
</script>

<template>
  <div class="cms-media-picker">
    <UButton @click="open" variant="outline" icon="i-heroicons-photo">
      Select Media
    </UButton>

    <UModal v-model="isOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Media Library</h3>
            <label class="cursor-pointer">
              <UButton as="span" variant="soft" icon="i-heroicons-arrow-up-tray" :loading="uploading">
                Upload
              </UButton>
              <input type="file" class="hidden" :accept="accept?.join(',')" @change="handleFileUpload" />
            </label>
          </div>
        </template>

        <div class="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto p-4">
          <div
            v-for="item in items"
            :key="item.id"
            class="relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-colors"
            :class="selectedItems.includes(item.id) ? 'border-primary-500' : 'border-transparent hover:border-gray-300'"
            @click="selectItem(item.id)"
          >
            <img
              v-if="item.mimeType.startsWith('image/')"
              :src="item.url"
              :alt="item.alt || item.filename"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
              <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="isOpen = false">Cancel</UButton>
            <UButton @click="isOpen = false">Done</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
