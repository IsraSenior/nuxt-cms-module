<script setup lang="ts">
import { ref, computed } from 'vue'
import { definePageMeta, useRuntimeConfig } from '#imports'
import { useCmsAdmin } from '../../../composables/useCmsAdmin'
import { useCmsI18n } from '../../../composables/useCmsI18n'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()
const { user } = useCmsAdmin()
const { t, locale, setLocale, availableLocales } = useCmsI18n()

const loading = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

// Form state
const form = ref({
  locale: user.value?.locale || 'en'
})

// Save settings
async function saveSettings() {
  if (!user.value) return

  loading.value = true
  success.value = false
  error.value = null

  try {
    await $fetch(`/api/cms/users/${user.value.id}`, {
      method: 'PUT',
      body: {
        locale: form.value.locale
      }
    })

    // Update locale immediately
    setLocale(form.value.locale as 'en' | 'es')

    // Update user in global state
    if (user.value) {
      user.value.locale = form.value.locale
    }

    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to save settings'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CmsAdminLayout>
    <div class="settings-page">
      <!-- Header -->
      <div class="settings-page__header">
        <NuxtLink :to="`${config.public.cms.adminPath}/settings/branding`" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {{ t('settings.branding') }}
        </NuxtLink>
        <h1 class="settings-page__title">{{ t('settings.general') }}</h1>
        <p class="settings-page__subtitle">Configure your personal preferences</p>
      </div>

      <!-- Form -->
      <div class="settings-form">
        <!-- Success message -->
        <div v-if="success" class="alert alert--success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
          </svg>
          {{ t('settings.settingsUpdated') }}
        </div>

        <!-- Error message -->
        <div v-if="error" class="alert alert--error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>

        <!-- Language Section -->
        <div class="settings-section">
          <h2 class="settings-section__title">Language Preferences</h2>
          <p class="settings-section__description">Select your preferred language for the admin interface</p>

          <div class="form-field">
            <label class="form-field__label">Language</label>
            <div class="locale-selector">
              <button
                v-for="lang in availableLocales"
                :key="lang.code"
                type="button"
                class="locale-selector__btn"
                :class="{ 'locale-selector__btn--active': form.locale === lang.code }"
                @click="form.locale = lang.code"
              >
                <span class="locale-selector__flag">{{ lang.flag }}</span>
                <span class="locale-selector__content">
                  <span class="locale-selector__name">{{ lang.name }}</span>
                  <span class="locale-selector__code">{{ lang.code.toUpperCase() }}</span>
                </span>
                <svg
                  v-if="form.locale === lang.code"
                  class="locale-selector__check"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <p class="form-field__hint">This will update the language for all admin pages</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="settings-actions">
          <button
            type="button"
            class="btn btn--primary"
            :disabled="loading"
            @click="saveSettings"
          >
            <span v-if="loading">{{ t('common.saving') }}</span>
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.settings-page__header {
  margin-bottom: 32px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  margin-bottom: 16px;
  transition: color 0.15s ease;
}

.back-link:hover {
  color: #374151;
}

.back-link svg {
  width: 16px;
  height: 16px;
}

.settings-page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.settings-page__subtitle {
  font-size: 15px;
  color: #6b7280;
}

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;
}

.alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.alert--success {
  background-color: #dcfce7;
  color: #15803d;
}

.alert--error {
  background-color: #fee2e2;
  color: #dc2626;
}

/* Form */
.settings-form {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.settings-section__description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
}

.form-field {
  margin-bottom: 24px;
}

.form-field__label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.form-field__hint {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
}

/* Locale Selector */
.locale-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.locale-selector__btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.15s ease;
}

.locale-selector__btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.locale-selector__btn--active {
  border-color: var(--cms-primary, #2563eb);
  background: #eff6ff;
}

.locale-selector__flag {
  font-size: 32px;
  line-height: 1;
}

.locale-selector__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.locale-selector__name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.locale-selector__code {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.locale-selector__check {
  width: 24px;
  height: 24px;
  color: var(--cms-primary, #2563eb);
}

/* Actions */
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn--primary {
  background: var(--cms-primary, #2563eb);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--cms-primary-hover, #1d4ed8);
  color: white;
}

.btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
