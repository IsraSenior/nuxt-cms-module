<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta } from '#imports'
import { useCmsMedia } from '../../composables/useCmsMedia'

definePageMeta({
  middleware: 'cms-auth'
})

const {
  items,
  pending,
  total,
  upload,
  remove,
  getUrl,
  isImage,
  formatSize,
  refresh
} = useCmsMedia({ limit: 24 })

const uploading = ref(false)
const selectedItem = ref<any>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const showDeleteModal = ref(false)

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) return

  uploading.value = true

  for (const file of Array.from(files)) {
    await upload(file)
  }

  uploading.value = false

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function confirmDelete() {
  if (!selectedItem.value) return

  await remove(selectedItem.value.id)
  selectedItem.value = null
  showDeleteModal.value = false
}

function selectItem(item: any) {
  selectedItem.value = selectedItem.value?.id === item.id ? null : item
}
</script>

<template>
  <CmsAdminLayout>
    <div class="media-page">
      <!-- Header -->
      <div class="page__header">
        <div>
          <h1 class="page__title">Media Library</h1>
          <p class="page__subtitle">{{ total }} {{ total === 1 ? 'file' : 'files' }}</p>
        </div>

        <UButton
          color="primary"
          icon="i-heroicons-arrow-up-tray"
          :loading="uploading"
          @click="openFilePicker"
        >
          Upload
        </UButton>
      </div>

      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden-input"
        @change="handleFileChange"
      />

      <div class="media-layout">
        <!-- Grid -->
        <div class="media-grid-container">
          <!-- Loading state -->
          <div v-if="pending" class="loading-state">
            <UIcon name="i-heroicons-arrow-path" class="loading-state__icon" />
          </div>

          <!-- Empty state -->
          <div v-else-if="items.length === 0" class="empty-state">
            <div class="empty-state__icon">
              <UIcon name="i-heroicons-photo" class="w-8 h-8" />
            </div>
            <h3 class="empty-state__title">No files uploaded</h3>
            <p class="empty-state__text">
              Upload your first file to get started
            </p>
            <UButton
              color="primary"
              icon="i-heroicons-arrow-up-tray"
              @click="openFilePicker"
              class="empty-state__button"
            >
              Upload Files
            </UButton>
          </div>

          <!-- Media grid -->
          <div v-else class="media-grid">
            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              class="media-item"
              :class="{ 'media-item--selected': selectedItem?.id === item.id }"
              @click="selectItem(item)"
            >
              <img
                v-if="isImage(item)"
                :src="getUrl(item)"
                :alt="item.alt || item.originalName"
                class="media-item__image"
              />
              <div v-else class="media-item__file">
                <UIcon name="i-heroicons-document" class="media-item__file-icon" />
                <span class="media-item__file-name">
                  {{ item.originalName }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Details panel -->
        <div v-if="selectedItem" class="details-panel">
          <div class="details-panel__header">
            <h3 class="details-panel__title">Details</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="selectedItem = null"
            />
          </div>

          <!-- Preview -->
          <div class="details-panel__preview">
            <img
              v-if="isImage(selectedItem)"
              :src="getUrl(selectedItem)"
              :alt="selectedItem.alt"
              class="details-panel__preview-image"
            />
            <div v-else class="details-panel__preview-file">
              <UIcon name="i-heroicons-document" class="w-12 h-12" />
            </div>
          </div>

          <!-- Info -->
          <div class="details-panel__info">
            <div class="details-panel__field">
              <p class="details-panel__label">Filename</p>
              <p class="details-panel__value details-panel__value--truncate">
                {{ selectedItem.originalName }}
              </p>
            </div>
            <div class="details-panel__row">
              <div class="details-panel__field">
                <p class="details-panel__label">Type</p>
                <p class="details-panel__value">{{ selectedItem.mimeType.split('/')[1] }}</p>
              </div>
              <div class="details-panel__field">
                <p class="details-panel__label">Size</p>
                <p class="details-panel__value">{{ formatSize(selectedItem.size) }}</p>
              </div>
            </div>
            <div v-if="selectedItem.width" class="details-panel__field">
              <p class="details-panel__label">Dimensions</p>
              <p class="details-panel__value">{{ selectedItem.width }} x {{ selectedItem.height }}</p>
            </div>
          </div>

          <!-- URL -->
          <div class="details-panel__field">
            <p class="details-panel__label">URL</p>
            <UInput
              :model-value="getUrl(selectedItem)"
              readonly
              size="sm"
              @focus="($event.target as HTMLInputElement).select()"
            />
          </div>

          <!-- Actions -->
          <div class="details-panel__actions">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons-arrow-top-right-on-square"
              class="details-panel__action-btn"
              :to="getUrl(selectedItem)"
              target="_blank"
            >
              Open
            </UButton>
            <UButton
              color="error"
              variant="soft"
              icon="i-heroicons-trash"
              class="details-panel__action-btn"
              @click="showDeleteModal = true"
            >
              Delete
            </UButton>
          </div>
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <UModal v-model:open="showDeleteModal">
        <template #content>
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-icon modal-icon--danger">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="modal-title">Delete file</h3>
                <p class="modal-text">This action cannot be undone.</p>
              </div>
            </div>
            <div class="modal-actions">
              <UButton color="neutral" variant="outline" @click="showDeleteModal = false">
                Cancel
              </UButton>
              <UButton color="error" @click="confirmDelete">
                Delete
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </CmsAdminLayout>
</template>

<style>
/* Media Page */
.media-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Page Header */
.page__header {
  display: flex;
  align-items: center;
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

/* Hidden Input */
.hidden-input {
  display: none;
}

/* Media Layout */
.media-layout {
  display: flex;
  gap: 24px;
}

.media-grid-container {
  flex: 1;
  min-width: 0;
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

/* Media Grid */
.media-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1280px) {
  .media-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Media Item */
.media-item {
  aspect-ratio: 1;
  background-color: white;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
}

.media-item:hover {
  border-color: #d1d5db;
}

.media-item--selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

:root.dark .media-item {
  background-color: #111827;
  border-color: #1f2937;
}

:root.dark .media-item:hover {
  border-color: #374151;
}

:root.dark .media-item--selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
}

.media-item__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-item__file {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: #f9fafb;
}

:root.dark .media-item__file {
  background-color: #1f2937;
}

.media-item__file-icon {
  width: 32px;
  height: 32px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.media-item__file-name {
  font-size: 11px;
  color: #6b7280;
  text-align: center;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:root.dark .media-item__file-name {
  color: #9ca3af;
}

/* Details Panel */
.details-panel {
  width: 320px;
  flex-shrink: 0;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: fit-content;
}

:root.dark .details-panel {
  background-color: #111827;
  border-color: #1f2937;
}

.details-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.details-panel__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

:root.dark .details-panel__title {
  color: white;
}

.details-panel__preview {
  aspect-ratio: 16/9;
  background-color: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
}

:root.dark .details-panel__preview {
  background-color: #1f2937;
}

.details-panel__preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.details-panel__preview-file {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.details-panel__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.details-panel__row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.details-panel__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.details-panel__label {
  font-size: 12px;
  color: #6b7280;
}

:root.dark .details-panel__label {
  color: #9ca3af;
}

.details-panel__value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.details-panel__value--truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:root.dark .details-panel__value {
  color: white;
}

.details-panel__actions {
  display: flex;
  gap: 12px;
}

.details-panel__action-btn {
  flex: 1;
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

/* Responsive - Hide details panel on mobile */
@media (max-width: 1023px) {
  .details-panel {
    display: none;
  }
}
</style>
