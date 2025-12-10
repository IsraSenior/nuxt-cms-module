<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  page: number
  totalPages: number
  total: number
  perPage: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const pages = computed(() => {
  const pages: (number | 'ellipsis')[] = []
  const { page, totalPages } = props

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    if (page > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)
  }

  return pages
})

const startItem = computed(() => (props.page - 1) * props.perPage + 1)
const endItem = computed(() => Math.min(props.page * props.perPage, props.total))

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:page', page)
  }
}
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-b-xl">
    <!-- Info -->
    <div class="text-sm text-gray-500 dark:text-gray-400">
      Showing <span class="font-medium text-gray-900 dark:text-white">{{ startItem }}</span>
      to <span class="font-medium text-gray-900 dark:text-white">{{ endItem }}</span>
      of <span class="font-medium text-gray-900 dark:text-white">{{ total }}</span> results
    </div>

    <!-- Pages -->
    <div class="flex items-center gap-1">
      <!-- Previous -->
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-heroicons-chevron-left"
        size="sm"
        :disabled="page === 1"
        @click="goToPage(page - 1)"
      />

      <!-- Page numbers -->
      <template v-for="(p, index) in pages" :key="index">
        <span v-if="p === 'ellipsis'" class="px-2 text-gray-400 dark:text-gray-500">...</span>
        <UButton
          v-else
          :color="p === page ? 'primary' : 'neutral'"
          :variant="p === page ? 'solid' : 'ghost'"
          size="sm"
          @click="goToPage(p)"
        >
          {{ p }}
        </UButton>
      </template>

      <!-- Next -->
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-heroicons-chevron-right"
        size="sm"
        :disabled="page === totalPages"
        @click="goToPage(page + 1)"
      />
    </div>
  </div>
</template>
