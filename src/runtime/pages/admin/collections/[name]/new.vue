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
            class="cms-btn cms-btn--primary"
            :disabled="saving"
            @click="handleSubmit"
          >
            <span v-if="saving" class="cms-btn__spinner"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-btn__icon">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Create
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
</style>
