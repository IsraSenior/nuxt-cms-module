<script setup lang="ts">
import { ref, computed } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useFetch, navigateTo } from '#imports'
import { useCmsCollection } from '../../../../composables/useCmsCollection'

definePageMeta({
  middleware: 'cms-auth'
})

const route = useRoute()
const config = useRuntimeConfig()
const collectionName = route.params.name as string

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

const columns = computed(() => {
  const cols = [
    { key: `data.${titleField.value}`, label: 'Title', sortable: true }
  ]

  // Add status column
  cols.push({ key: 'status', label: 'Status', sortable: true })

  // Add date column
  cols.push({ key: 'createdAt', label: 'Created', sortable: true })

  return cols
})

const showDeleteModal = ref(false)
const itemToDelete = ref<string | null>(null)

function handleRowClick(item: Record<string, unknown>) {
  navigateTo(`${config.public.cms.adminPath}/collections/${collectionName}/${item.id}`)
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
            <UIcon name="i-heroicons-chevron-right" class="breadcrumb__separator" />
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
          <UIcon name="i-heroicons-plus" class="cms-btn__icon" />
          New {{ collectionConfig.label }}
        </NuxtLink>
      </div>

      <!-- Loading state -->
      <div v-if="pending" class="loading-state">
        <UIcon name="i-heroicons-arrow-path" class="loading-state__icon" />
      </div>

      <!-- Empty state -->
      <div v-else-if="items.length === 0" class="empty-state">
        <div class="empty-state__icon">
          <UIcon name="i-heroicons-document-plus" class="w-8 h-8" />
        </div>
        <h3 class="empty-state__title">No items yet</h3>
        <p class="empty-state__text">
          Create your first {{ collectionConfig.label?.toLowerCase() }}
        </p>
        <NuxtLink
          :to="`${config.public.cms.adminPath}/collections/${collectionName}/new`"
          class="cms-btn cms-btn--primary"
        >
          <UIcon name="i-heroicons-plus" class="cms-btn__icon" />
          Create {{ collectionConfig.label }}
        </NuxtLink>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <CmsListTable
          :columns="columns"
          :items="items"
          :loading="pending"
          @row-click="handleRowClick"
        >
          <template #cell-status="{ value }">
            <span class="status-badge" :class="`status-badge--${value}`">
              {{ value }}
            </span>
          </template>

          <template #cell-createdAt="{ value }">
            <span class="date-text">
              {{ value ? new Date(value).toLocaleDateString() : '-' }}
            </span>
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
              <div class="modal-icon modal-icon--danger">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
              </div>
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
  width: 16px;
  height: 16px;
  color: #9ca3af;
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

.loading-state__icon {
  width: 24px;
  height: 24px;
  color: #9ca3af;
  animation: spin 1s linear infinite;
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
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  margin-bottom: 20px;
}

:root.dark .empty-state__icon {
  background-color: #1f2937;
  color: #6b7280;
}

.empty-state__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

:root.dark .empty-state__title {
  color: white;
}

.empty-state__text {
  font-size: 14px;
  color: #6b7280;
  max-width: 320px;
  margin-bottom: 20px;
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

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
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

/* Date Text */
.date-text {
  font-size: 14px;
  color: #6b7280;
}

:root.dark .date-text {
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
}

.modal-icon--danger {
  background-color: #fee2e2;
  color: #dc2626;
}

:root.dark .modal-icon--danger {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

:root.dark .modal-title {
  color: white;
}

.modal-text {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
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
  width: 16px;
  height: 16px;
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
  background-color: transparent;
  color: #374151;
  border-color: #d1d5db;
}

.cms-btn--outline:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

:root.dark .cms-btn--outline {
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
