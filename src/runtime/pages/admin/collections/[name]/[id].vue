<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useFetch, navigateTo } from '#imports'

definePageMeta({
  middleware: 'cms-auth'
})

const route = useRoute()
const config = useRuntimeConfig()
const collectionName = route.params.name as string
const itemId = route.params.id as string

// Fetch schema
const { data: schema } = await useFetch('/api/cms/schema')

const collectionConfig = computed(() => {
  return schema.value?.collections?.[collectionName] || { label: collectionName, fields: {} }
})

const locales = computed(() => schema.value?.locales || ['es'])
const defaultLocale = computed(() => schema.value?.defaultLocale || 'es')

// Fetch item
const { data: item, refresh } = await useFetch(`/api/cms/collections/${collectionName}/${itemId}`)

// Form state
const formData = ref<Record<string, unknown>>({})
const translations = ref<Record<string, Record<string, unknown>>>({})
const currentLocale = ref(defaultLocale.value)
const currentStatus = ref('draft')
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const showDeleteModal = ref(false)

// Initialize from fetched data
watch(item, (newItem) => {
  if (newItem) {
    formData.value = newItem.data || {}
    translations.value = newItem.translations || {}
    currentStatus.value = newItem.status || 'draft'
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  errors.value = {}

  try {
    await $fetch(`/api/cms/collections/${collectionName}/${itemId}`, {
      method: 'PUT',
      body: {
        data: formData.value,
        translations: translations.value,
        status: currentStatus.value
      }
    })

    await refresh()
  } catch (err: any) {
    if (err.data?.errors) {
      errors.value = err.data.errors
    }
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  currentStatus.value = 'published'
  await handleSubmit()
}

async function handleDelete() {
  await $fetch(`/api/cms/collections/${collectionName}/${itemId}`, {
    method: 'DELETE'
  })

  await navigateTo(`${config.public.cms.adminPath}/collections/${collectionName}`)
}

function handleCancel() {
  navigateTo(`${config.public.cms.adminPath}/collections/${collectionName}`)
}

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' }
]
</script>

<template>
  <CmsAdminLayout>
    <div class="form-page">
      <!-- Header -->
      <div class="form-page__header">
        <div>
          <div class="breadcrumb">
            <NuxtLink
              :to="`${config.public.cms.adminPath}/collections`"
              class="breadcrumb__link"
            >
              Collections
            </NuxtLink>
            <UIcon name="i-heroicons-chevron-right" class="breadcrumb__separator" />
            <NuxtLink
              :to="`${config.public.cms.adminPath}/collections/${collectionName}`"
              class="breadcrumb__link"
            >
              {{ collectionConfig.labelPlural || collectionConfig.label }}
            </NuxtLink>
            <UIcon name="i-heroicons-chevron-right" class="breadcrumb__separator" />
            <span class="breadcrumb__current">Edit</span>
          </div>
          <h1 class="form-page__title">
            Edit {{ collectionConfig.label }}
          </h1>
        </div>

        <div class="form-page__status">
          <span class="status-badge" :class="`status-badge--${currentStatus}`">
            {{ currentStatus }}
          </span>
        </div>
      </div>

      <!-- Form -->
      <div class="form-card">
        <CmsFormForm
          :fields="collectionConfig.fields"
          v-model="formData"
          v-model:translations="translations"
          v-model:current-locale="currentLocale"
          :locales="locales"
          :errors="errors"
          :disabled="saving"
          @submit="handleSubmit"
        >
          <template #actions>
            <div class="form-actions form-actions--split">
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                :disabled="saving"
                @click="showDeleteModal = true"
              >
                Delete
              </UButton>

              <div class="form-actions__right">
                <UButton
                  color="neutral"
                  variant="outline"
                  :disabled="saving"
                  @click="handleCancel"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  color="neutral"
                  variant="solid"
                  :loading="saving"
                >
                  Save Draft
                </UButton>
                <UButton
                  v-if="currentStatus !== 'published'"
                  color="primary"
                  icon="i-heroicons-check"
                  :loading="saving"
                  @click="handlePublish"
                >
                  Publish
                </UButton>
              </div>
            </div>
          </template>
        </CmsFormForm>
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
                <h3 class="modal-title">Delete item</h3>
                <p class="modal-text">This action cannot be undone.</p>
              </div>
            </div>
            <div class="modal-actions">
              <UButton color="neutral" variant="outline" @click="showDeleteModal = false">
                Cancel
              </UButton>
              <UButton color="error" @click="handleDelete">
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
/* Form Page */
.form-page {
  max-width: 896px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.form-page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

:root.dark .form-page__title {
  color: white;
}

.form-page__status {
  display: flex;
  align-items: center;
  gap: 12px;
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

/* Form Card */
.form-card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

:root.dark .form-card {
  background-color: #111827;
  border-color: #1f2937;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
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

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.form-actions--split {
  justify-content: space-between;
  align-items: center;
}

.form-actions__right {
  display: flex;
  gap: 12px;
}

:root.dark .form-actions {
  border-top-color: #1f2937;
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
</style>
