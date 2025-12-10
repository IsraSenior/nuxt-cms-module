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

        <button
          type="button"
          class="cms-btn cms-btn--primary"
          :disabled="uploading"
          @click="openFilePicker"
        >
          <svg v-if="uploading" class="cms-btn__spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cms-btn__icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Upload
        </button>
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
            <svg class="loading-state__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>

          <!-- Empty state -->
          <div v-else-if="items.length === 0" class="empty-state">
            <div class="empty-state__icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <h3 class="empty-state__title">No files uploaded</h3>
            <p class="empty-state__text">
              Upload your first file to get started
            </p>
            <button
              type="button"
              class="cms-btn cms-btn--primary"
              @click="openFilePicker"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cms-btn__icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload Files
            </button>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="media-item__file-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
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
            <button
              type="button"
              class="details-panel__close"
              @click="selectedItem = null"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
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
            <input
              type="text"
              class="details-panel__url-input"
              :value="getUrl(selectedItem)"
              readonly
              @focus="($event.target as HTMLInputElement).select()"
            />
          </div>

          <!-- Actions -->
          <div class="details-panel__actions">
            <a
              :href="getUrl(selectedItem)"
              target="_blank"
              class="cms-btn cms-btn--outline details-panel__action-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cms-btn__icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open
            </a>
            <button
              type="button"
              class="cms-btn cms-btn--danger details-panel__action-btn"
              @click="showDeleteModal = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="cms-btn__icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-icon modal-icon--danger">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Delete file</h3>
                <p class="modal-text">This action cannot be undone.</p>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="cms-btn cms-btn--outline" @click="showDeleteModal = false">
                Cancel
              </button>
              <button type="button" class="cms-btn cms-btn--danger" @click="confirmDelete">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style>
/* CMS Buttons */
.cms-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.cms-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cms-btn__icon {
  width: 18px;
  height: 18px;
}

.cms-btn__spinner {
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

.cms-btn--primary {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.cms-btn--primary:hover:not(:disabled) {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

.cms-btn--outline {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.cms-btn--outline:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.cms-btn--danger {
  background-color: #dc2626;
  color: white;
  border-color: #dc2626;
}

.cms-btn--danger:hover:not(:disabled) {
  background-color: #b91c1c;
  border-color: #b91c1c;
}

/* Details panel close button */
.details-panel__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.details-panel__close:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.details-panel__close svg {
  width: 20px;
  height: 20px;
}

/* URL Input */
.details-panel__url-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #f9fafb;
  color: #374151;
}

.details-panel__url-input:focus {
  outline: none;
  border-color: #2563eb;
  background-color: white;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-dialog {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 90%;
}

/* Utility classes */
.w-5 { width: 20px; }
.h-5 { height: 20px; }
.w-8 { width: 32px; }
.h-8 { height: 32px; }
.w-12 { width: 48px; }
.h-12 { height: 48px; }
.opacity-25 { opacity: 0.25; }
.opacity-75 { opacity: 0.75; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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

.page__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
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

.empty-state__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.empty-state__text {
  font-size: 14px;
  color: #6b7280;
  max-width: 320px;
  margin-bottom: 20px;
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

.details-panel__preview {
  aspect-ratio: 16/9;
  background-color: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
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

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.modal-text {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
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
