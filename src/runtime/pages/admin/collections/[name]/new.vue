<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useFetch, navigateTo } from '#imports'
import CmsPageHeader from '../../../../components/layout/PageHeader.vue'
import CmsFormCard from '../../../../components/layout/FormCard.vue'

definePageMeta({
  layout: false,
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

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Collections', to: `${config.public.cms.adminPath}/collections` },
  { label: collectionConfig.value.labelPlural || collectionConfig.value.label, to: `${config.public.cms.adminPath}/collections/${collectionName}` },
  { label: 'New' }
])

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
    <div class="cms-form-page">
      <!-- Header with Actions -->
      <CmsPageHeader
        :title="`New ${collectionConfig.label}`"
        :breadcrumbs="breadcrumbs"
      >
        <template #actions>
          <div class="cms-actions">
            <!-- Cancel Button -->
            <button
              type="button"
              class="cms-actions__btn cms-actions__btn--ghost"
              :disabled="saving"
              @click="handleCancel"
              title="Cancel"
            >
              <UIcon name="i-heroicons-x-mark" class="cms-actions__icon" />
              <span class="cms-actions__tooltip">Cancel</span>
            </button>

            <!-- Create Button -->
            <button
              type="button"
              class="cms-actions__btn cms-actions__btn--primary"
              :disabled="saving"
              @click="handleSubmit"
              title="Create"
            >
              <span v-if="saving" class="cms-actions__spinner"></span>
              <UIcon v-else name="i-heroicons-plus" class="cms-actions__icon" />
              <span class="cms-actions__label">Create</span>
              <span class="cms-actions__tooltip">Create new item</span>
            </button>
          </div>
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
          :default-locale="defaultLocale"
          :errors="errors"
          :disabled="saving"
          @submit="handleSubmit"
        />
      </CmsFormCard>
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

/* Actions Bar */
.cms-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cms-actions__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.cms-actions__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cms-actions__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.cms-actions__label {
  display: none;
}

@media (min-width: 768px) {
  .cms-actions__label {
    display: inline;
  }
}

/* Tooltip */
.cms-actions__tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background-color: #1f2937;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.15s ease;
  pointer-events: none;
  z-index: 50;
}

.cms-actions__tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1f2937;
}

.cms-actions__btn:hover .cms-actions__tooltip {
  opacity: 1;
  visibility: visible;
}

/* Ghost Button */
.cms-actions__btn--ghost {
  background-color: transparent;
  color: #6b7280;
}

.cms-actions__btn--ghost:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #374151;
}

/* Primary Button */
.cms-actions__btn--primary {
  background-color: var(--cms-primary, #2563eb);
  color: white;
  border-color: var(--cms-primary, #2563eb);
}

.cms-actions__btn--primary:hover:not(:disabled) {
  background-color: var(--cms-primary-hover, #1d4ed8);
  border-color: var(--cms-primary-hover, #1d4ed8);
}

/* Spinner */
.cms-actions__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: cms-actions-spin 0.6s linear infinite;
}

@keyframes cms-actions-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
