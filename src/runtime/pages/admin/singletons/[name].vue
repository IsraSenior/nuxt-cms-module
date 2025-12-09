<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useFetch } from '#imports'
import { useCmsSingleton } from '../../../composables/useCmsSingleton'

definePageMeta({
  middleware: 'cms-auth'
})

const route = useRoute()
const config = useRuntimeConfig()
const singletonName = route.params.name as string

// Fetch schema
const { data: schema } = await useFetch('/api/cms/schema')

const singletonConfig = computed(() => {
  return schema.value?.singletons?.[singletonName] || { label: singletonName, fields: {} }
})

const locales = computed(() => schema.value?.locales || ['es'])
const defaultLocale = computed(() => schema.value?.defaultLocale || 'es')

// Fetch singleton data
const { data: singleton, update, refresh } = useCmsSingleton(singletonName)

// Form state
const formData = ref<Record<string, unknown>>({})
const translations = ref<Record<string, Record<string, unknown>>>({})
const currentLocale = ref(defaultLocale.value)
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const saved = ref(false)

// Watch for singleton data
watch(() => singleton.value, () => {
  // Get raw data from the response
  const rawData = (singleton as any).rawData?.value
  if (rawData) {
    formData.value = rawData.data || {}
    translations.value = rawData.translations || {}
  }
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  errors.value = {}
  saved.value = false

  try {
    await update(formData.value, translations.value)
    await refresh()
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 3000)
  } catch (err: any) {
    if (err.data?.errors) {
      errors.value = err.data.errors
    }
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  navigateTo(`${config.public.cms.adminPath}/singletons`)
}
</script>

<template>
  <CmsAdminLayout>
    <div class="form-page">
      <!-- Header -->
      <div class="form-page__header">
        <div class="breadcrumb">
          <NuxtLink
            :to="`${config.public.cms.adminPath}/singletons`"
            class="breadcrumb__link"
          >
            Singletons
          </NuxtLink>
          <UIcon name="i-heroicons-chevron-right" class="breadcrumb__separator" />
          <span class="breadcrumb__current">{{ singletonConfig.label }}</span>
        </div>
        <h1 class="form-page__title">
          {{ singletonConfig.label }}
        </h1>
        <p v-if="singletonConfig.description" class="form-page__subtitle">
          {{ singletonConfig.description }}
        </p>
      </div>

      <!-- Success message -->
      <UAlert
        v-if="saved"
        color="success"
        variant="soft"
        icon="i-heroicons-check-circle"
        title="Changes saved successfully"
        class="success-alert"
      />

      <!-- Form -->
      <div class="form-card">
        <CmsFormForm
          :fields="singletonConfig.fields"
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
                color="primary"
                icon="i-heroicons-check"
                :loading="saving"
              >
                Save Changes
              </UButton>
            </div>
          </template>
        </CmsFormForm>
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

.form-page__subtitle {
  font-size: 15px;
  color: #6b7280;
}

:root.dark .form-page__subtitle {
  color: #9ca3af;
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

/* Success Alert */
.success-alert {
  border-radius: 12px;
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
</style>
