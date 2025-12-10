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

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Collections', to: `${config.public.cms.adminPath}/collections` },
  { label: collectionConfig.value.labelPlural || collectionConfig.value.label, to: `${config.public.cms.adminPath}/collections/${collectionName}` },
  { label: 'Edit' }
])

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

async function handleUnpublish() {
  currentStatus.value = 'draft'
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
</script>

<template>
  <CmsAdminLayout>
    <div class="cms-form-page">
      <!-- Header with Actions -->
      <CmsPageHeader
        :title="`Edit ${collectionConfig.label}`"
        :breadcrumbs="breadcrumbs"
        :status="currentStatus"
      >
        <template #actions>
          <!-- Publish Date input (if field exists) -->
          <div v-if="collectionConfig.fields?.publishedAt" class="cms-form-page__date-field">
            <label class="cms-form-page__date-label">Publish Date</label>
            <input
              type="datetime-local"
              class="cms-form-page__date-input"
              :value="formData.publishedAt ? new Date(formData.publishedAt as string).toISOString().slice(0, 16) : ''"
              @input="formData.publishedAt = ($event.target as HTMLInputElement).value ? new Date(($event.target as HTMLInputElement).value).toISOString() : null"
              :disabled="saving"
            />
          </div>

          <button
            type="button"
            class="cms-btn cms-btn--danger-outline"
            :disabled="saving"
            @click="showDeleteModal = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-btn__icon">
              <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
            </svg>
            Delete
          </button>
          <button
            type="button"
            class="cms-btn cms-btn--outline"
            :disabled="saving"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cms-btn cms-btn--secondary"
            :disabled="saving"
            @click="handleSubmit"
          >
            <span v-if="saving" class="cms-btn__spinner"></span>
            Save Draft
          </button>
          <button
            v-if="currentStatus !== 'published'"
            type="button"
            class="cms-btn cms-btn--primary"
            :disabled="saving"
            @click="handlePublish"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-btn__icon">
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
            </svg>
            Publish
          </button>
          <button
            v-else
            type="button"
            class="cms-btn cms-btn--warning"
            :disabled="saving"
            @click="handleUnpublish"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-btn__icon">
              <path fill-rule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clip-rule="evenodd" />
            </svg>
            Unpublish
          </button>
        </template>
      </CmsPageHeader>

      <!-- Form -->
      <CmsFormCard>
        <CmsForm
          :fields="collectionConfig.fields"
          v-model="formData"
          v-model:translations="translations"
          v-model:current-locale="currentLocale"
          :locales="locales"
          :errors="errors"
          :disabled="saving"
          :exclude-fields="['publishedAt']"
          @submit="handleSubmit"
        />
      </CmsFormCard>

      <!-- Delete confirmation modal -->
      <CmsConfirmModal
        v-model:show="showDeleteModal"
        title="Delete item"
        message="This action cannot be undone."
        confirm-label="Delete"
        variant="danger"
        @confirm="handleDelete"
      />
    </div>
  </CmsAdminLayout>
</template>

<style>
/* Form Page Layout */
.cms-form-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Date field in header */
.cms-form-page__date-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-right: 8px;
}

.cms-form-page__date-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cms-form-page__date-input {
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  color: #111827;
  min-width: 180px;
}

.cms-form-page__date-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
</style>
