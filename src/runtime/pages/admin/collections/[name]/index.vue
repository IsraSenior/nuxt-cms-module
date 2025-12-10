<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useFetch, navigateTo } from '#imports'
import { useCmsCollection } from '../../../../composables/useCmsCollection'

definePageMeta({
  middleware: 'cms-auth'
})

const route = useRoute()
const config = useRuntimeConfig()
const collectionName = route.params.name as string

// Sorting state
const sortBy = ref('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')

// Fetch collection items
const page = ref(1)
const { data, items, pending, total, totalPages, refresh } = useCmsCollection(collectionName, {
  limit: 20
})

// Fetch schema to get collection config
const { data: schema } = await useFetch('/api/cms/schema')

const collectionConfig = computed(() => {
  return schema.value?.collections?.[collectionName] || { label: collectionName, fields: {} }
})

const titleField = computed(() => {
  return collectionConfig.value.titleField || 'title'
})

const slugField = computed(() => {
  return collectionConfig.value.slugField || 'slug'
})

// Build columns based on collection config
const columns = computed(() => {
  const cols: { key: string; label: string; sortable: boolean; width?: string }[] = []

  // Check if collection has listFields config
  const listFields = collectionConfig.value.listFields

  if (listFields && Array.isArray(listFields)) {
    // Use configured listFields
    for (const fieldKey of listFields) {
      const fieldDef = collectionConfig.value.fields?.[fieldKey]
      if (fieldDef) {
        cols.push({
          key: `data.${fieldKey}`,
          label: fieldDef.label || fieldKey,
          sortable: true
        })
      }
    }
  } else {
    // Default columns: Title field
    const titleFieldDef = collectionConfig.value.fields?.[titleField.value]
    cols.push({
      key: `data.${titleField.value}`,
      label: titleFieldDef?.label || 'Title',
      sortable: true,
      width: '40%'
    })

    // Slug field if it exists
    if (collectionConfig.value.fields?.[slugField.value]) {
      cols.push({
        key: `data.${slugField.value}`,
        label: 'Slug',
        sortable: true
      })
    }
  }

  // Always add status column
  cols.push({ key: 'status', label: 'Status', sortable: true, width: '100px' })

  // Always add updated date column
  cols.push({ key: 'updatedAt', label: 'Updated', sortable: true, width: '140px' })

  // Always add created date column
  cols.push({ key: 'createdAt', label: 'Created', sortable: true, width: '140px' })

  return cols
})

// Sort items locally (for now, could be moved to API)
const sortedItems = computed(() => {
  if (!items.value) return []

  const sorted = [...items.value]

  sorted.sort((a, b) => {
    let aVal: unknown
    let bVal: unknown

    // Get values using dot notation
    const keys = sortBy.value.split('.')
    aVal = a
    bVal = b

    for (const k of keys) {
      aVal = aVal && typeof aVal === 'object' ? (aVal as Record<string, unknown>)[k] : undefined
      bVal = bVal && typeof bVal === 'object' ? (bVal as Record<string, unknown>)[k] : undefined
    }

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return sortDir.value === 'asc' ? -1 : 1
    if (bVal == null) return sortDir.value === 'asc' ? 1 : -1

    // Compare values
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir.value === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    if (aVal < bVal) return sortDir.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })

  return sorted
})

const showDeleteModal = ref(false)
const itemToDelete = ref<string | null>(null)

function handleRowClick(item: Record<string, unknown>) {
  navigateTo(`${config.public.cms.adminPath}/collections/${collectionName}/${item.id}`)
}

function handleSort(key: string) {
  if (sortBy.value === key) {
    // Toggle direction
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortDir.value = 'desc'
  }
}

function confirmDelete(id: string) {
  itemToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!itemToDelete.value) return

  await $fetch(`/api/cms/collections/${collectionName}/${itemToDelete.value}`, {
    method: 'DELETE'
  })

  showDeleteModal.value = false
  itemToDelete.value = null
  await refresh()
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <CmsAdminLayout>
    <div class="page">
      <!-- Header -->
      <div class="page__header">
        <div>
          <div class="breadcrumb">
            <NuxtLink
              :to="`${config.public.cms.adminPath}/collections`"
              class="breadcrumb__link"
            >
              Collections
            </NuxtLink>
            <span class="breadcrumb__separator">›</span>
            <span class="breadcrumb__current">{{ collectionConfig.labelPlural || collectionConfig.label }}</span>
          </div>
          <h1 class="page__title">
            {{ collectionConfig.labelPlural || collectionConfig.label }}
          </h1>
          <p v-if="collectionConfig.description" class="page__subtitle">
            {{ collectionConfig.description }}
          </p>
        </div>

        <NuxtLink
          :to="`${config.public.cms.adminPath}/collections/${collectionName}/new`"
          class="cms-btn cms-btn--primary"
        >
          <span class="cms-btn__icon">+</span>
          New {{ collectionConfig.label }}
        </NuxtLink>
      </div>

      <!-- Loading state -->
      <div v-if="pending" class="loading-state">
        <span class="loading-state__spinner"></span>
      </div>

      <!-- Empty state -->
      <div v-else-if="items.length === 0" class="empty-state">
        <div class="empty-state__icon">📄</div>
        <h3 class="empty-state__title">No items yet</h3>
        <p class="empty-state__text">
          Create your first {{ collectionConfig.label?.toLowerCase() }}
        </p>
        <NuxtLink
          :to="`${config.public.cms.adminPath}/collections/${collectionName}/new`"
          class="cms-btn cms-btn--primary"
        >
          <span class="cms-btn__icon">+</span>
          Create {{ collectionConfig.label }}
        </NuxtLink>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <CmsListTable
          :columns="columns"
          :items="sortedItems"
          :loading="pending"
          :sort-by="sortBy"
          :sort-dir="sortDir"
          @row-click="handleRowClick"
          @sort="handleSort"
        >
          <!-- Title cell with primary styling -->
          <template #[`cell-data.${titleField}`]="{ value }">
            <span class="cell-title">{{ value || '-' }}</span>
          </template>

          <!-- Slug cell with monospace -->
          <template #[`cell-data.${slugField}`]="{ value }">
            <span class="cell-slug">{{ value || '-' }}</span>
          </template>

          <!-- Status cell -->
          <template #cell-status="{ value }">
            <span class="status-badge" :class="`status-badge--${value}`">
              {{ value }}
            </span>
          </template>

          <!-- Updated date cell -->
          <template #cell-updatedAt="{ value }">
            <span class="cell-date">{{ formatDateTime(value as string) }}</span>
          </template>

          <!-- Created date cell -->
          <template #cell-createdAt="{ value }">
            <span class="cell-date">{{ formatDate(value as string) }}</span>
          </template>
        </CmsListTable>
      </div>

      <!-- Pagination -->
      <CmsListPagination
        v-if="totalPages > 1"
        :page="page"
        :total-pages="totalPages"
        :total="total"
        :per-page="20"
        @update:page="page = $event"
      />

      <!-- Delete confirmation modal -->
      <UModal v-model:open="showDeleteModal">
        <template #content>
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-icon modal-icon--danger">⚠️</div>
              <div>
                <h3 class="modal-title">Delete item</h3>
                <p class="modal-text">This action cannot be undone.</p>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="cms-btn cms-btn--outline" @click="showDeleteModal = false">
                Cancel
              </button>
              <button type="button" class="cms-btn cms-btn--danger" @click="handleDelete">
                Delete
              </button>
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </CmsAdminLayout>
</template>

<style>
/* Page Styles */
.page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  margin: 0;
}

:root.dark .page__title {
  color: white;
}

.page__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
}

:root.dark .page__subtitle {
  color: #9ca3af;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}

.breadcrumb__link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumb__link:hover {
  color: #374151;
}

:root.dark .breadcrumb__link {
  color: #9ca3af;
}

:root.dark .breadcrumb__link:hover {
  color: #d1d5db;
}

.breadcrumb__separator {
  color: #9ca3af;
  font-size: 16px;
}

:root.dark .breadcrumb__separator {
  color: #6b7280;
}

.breadcrumb__current {
  color: #111827;
  font-weight: 500;
}

:root.dark .breadcrumb__current {
  color: white;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.loading-state__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

:root.dark .loading-state__spinner {
  border-color: #374151;
  border-top-color: #60a5fa;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  text-align: center;
}

:root.dark .empty-state {
  background-color: #111827;
  border-color: #1f2937;
}

.empty-state__icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

:root.dark .empty-state__title {
  color: white;
}

.empty-state__text {
  font-size: 14px;
  color: #6b7280;
  max-width: 320px;
  margin: 0 0 20px 0;
}

:root.dark .empty-state__text {
  color: #9ca3af;
}

/* Table Container */
.table-container {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

:root.dark .table-container {
  background-color: #111827;
  border-color: #1f2937;
}

/* Cell Styles */
.cell-title {
  font-weight: 500;
  color: #111827;
}

:root.dark .cell-title {
  color: white;
}

.cell-slug {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
}

:root.dark .cell-slug {
  color: #9ca3af;
  background-color: #1f2937;
}

.cell-date {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

:root.dark .cell-date {
  color: #9ca3af;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge--published {
  background-color: #dcfce7;
  color: #166534;
}

:root.dark .status-badge--published {
  background-color: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.status-badge--draft {
  background-color: #fef3c7;
  color: #92400e;
}

:root.dark .status-badge--draft {
  background-color: rgba(234, 179, 8, 0.15);
  color: #facc15;
}

.status-badge--archived {
  background-color: #f3f4f6;
  color: #4b5563;
}

:root.dark .status-badge--archived {
  background-color: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
}

/* Modal */
.modal-content {
  padding: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
}

.modal-icon--danger {
  background-color: #fee2e2;
}

:root.dark .modal-icon--danger {
  background-color: rgba(239, 68, 68, 0.15);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

:root.dark .modal-title {
  color: white;
}

.modal-text {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

:root.dark .modal-text {
  color: #9ca3af;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* CMS Button Styles */
.cms-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  border: 1px solid transparent;
  text-decoration: none;
}

.cms-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cms-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.cms-btn__icon {
  font-size: 18px;
  font-weight: 400;
}

/* Primary Button (Blue) */
.cms-btn--primary {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.cms-btn--primary:hover:not(:disabled) {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

/* Outline Button */
.cms-btn--outline {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.cms-btn--outline:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

:root.dark .cms-btn--outline {
  background-color: #1f2937;
  color: #d1d5db;
  border-color: #4b5563;
}

:root.dark .cms-btn--outline:hover:not(:disabled) {
  background-color: #374151;
  border-color: #6b7280;
}

/* Danger Button (Red solid) */
.cms-btn--danger {
  background-color: #dc2626;
  color: white;
  border-color: #dc2626;
}

.cms-btn--danger:hover:not(:disabled) {
  background-color: #b91c1c;
  border-color: #b91c1c;
}
</style>
