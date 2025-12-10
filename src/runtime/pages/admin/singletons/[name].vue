<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRoute, useRuntimeConfig, useFetch, navigateTo } from '#imports'
import { useCmsSingleton } from '../../../composables/useCmsSingleton'
import CmsPageHeader from '../../../components/layout/PageHeader.vue'
import CmsFormCard from '../../../components/layout/FormCard.vue'
import CmsAlert from '../../../components/layout/Alert.vue'

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
const { data: singletonData, rawData, translations: singletonTranslations, update, refresh } = useCmsSingleton(singletonName)

// Form state
const formData = ref<Record<string, unknown>>({})
const translations = ref<Record<string, Record<string, unknown>>>({})
const currentLocale = ref(defaultLocale.value)
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const saved = ref(false)

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Singletons', to: `${config.public.cms.adminPath}/singletons` },
  { label: singletonConfig.value.label }
])

// Watch for singleton data changes
watch(rawData, (newRawData) => {
  if (newRawData) {
    formData.value = newRawData.data || {}
    translations.value = newRawData.translations || {}
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
    <div class="cms-form-page cms-form-page--narrow">
      <!-- Header with Actions -->
      <CmsPageHeader
        :title="singletonConfig.label"
        :subtitle="singletonConfig.description"
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
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
            </svg>
            Save Changes
          </button>
        </template>
      </CmsPageHeader>

      <!-- Success message -->
      <CmsAlert v-if="saved" variant="success">
        Changes saved successfully
      </CmsAlert>

      <!-- Form -->
      <CmsFormCard>
        <CmsForm
          :fields="singletonConfig.fields"
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

.cms-form-page--narrow {
  max-width: 896px;
}
</style>
