<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useFetch, navigateTo } from '#imports'

definePageMeta({
  middleware: 'cms-auth'
})

const route = useRoute()
const config = useRuntimeConfig()
const collectionName = route.params.name as string

// Fetch schema
const { data: schema } = await useFetch('/api/cms/schema')

const collectionConfig = computed(() => {
  return schema.value?.collections?.[collectionName] || { label: collectionName, fields: {} }
})

const locales = computed(() => schema.value?.locales || ['es'])
const defaultLocale = computed(() => schema.value?.defaultLocale || 'es')

// Form state
const formData = ref<Record<string, unknown>>({})
const translations = ref<Record<string, Record<string, unknown>>>({})
const currentLocale = ref(defaultLocale.value)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

// Initialize with defaults
onMounted(() => {
  const fields = collectionConfig.value.fields || {}
  const defaults: Record<string, unknown> = {}

  for (const [key, field] of Object.entries(fields) as [string, any][]) {
    if (field.default !== undefined) {
      defaults[key] = field.default
    }
  }

  formData.value = defaults
})

async function handleSubmit() {
  saving.value = true
  errors.value = {}

  try {
    const result = await $fetch<{ id: string }>(`/api/cms/collections/${collectionName}`, {
      method: 'POST',
      body: {
        data: formData.value,
        translations: translations.value,
        status: 'draft'
      }
    })

    // Navigate to edit page
    await navigateTo(`${config.public.cms.adminPath}/collections/${collectionName}/${result.id}`)
  } catch (err: any) {
    if (err.data?.errors) {
      errors.value = err.data.errors
    }
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  navigateTo(`${config.public.cms.adminPath}/collections/${collectionName}`)
}
</script>

<template>
  <CmsAdminLayout>
    <div class="form-page">
      <!-- Header -->
      <div class="form-page__header">
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
          <span class="breadcrumb__current">New</span>
        </div>
        <h1 class="form-page__title">
          New {{ collectionConfig.label }}
        </h1>
      </div>

      <!-- Form -->
      <div class="form-card">
        <CmsForm
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
            <div class="form-actions">
              <button
                type="button"
                class="cms-btn cms-btn--outline"
                :disabled="saving"
                @click="handleCancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="cms-btn cms-btn--primary"
                :disabled="saving"
              >
                <span v-if="saving" class="cms-btn__spinner"></span>
                Create
              </button>
            </div>
          </template>
        </CmsForm>
      </div>
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
  flex-direction: column;
  gap: 8px;
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

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
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

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

:root.dark .form-actions {
  border-top-color: #1f2937;
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
}

.cms-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cms-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.cms-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>
