<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRuntimeConfig } from '#imports'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()

// Form state
const form = ref({
  name: '',
  logo: '',
  primaryColor: '#2563eb',
  favicon: '',
  loginTitle: '',
  loginDescription: '',
  loginBackgroundImage: '',
  poweredByName: 'Neskeep',
  poweredByUrl: 'https://neskeep.com',
  hidePoweredBy: false
})

// Load current branding config
const branding = computed(() => config.public.cms.branding || {})

watch(branding, (value) => {
  if (value) {
    form.value.name = value.name || ''
    form.value.logo = value.logo || ''
    form.value.primaryColor = value.primaryColor || '#2563eb'
    form.value.favicon = value.favicon || ''
    form.value.loginTitle = value.login?.title || ''
    form.value.loginDescription = value.login?.description || ''
    form.value.loginBackgroundImage = value.login?.backgroundImage || ''
    form.value.poweredByName = value.poweredBy?.name || 'Neskeep'
    form.value.poweredByUrl = value.poweredBy?.url || 'https://neskeep.com'
    form.value.hidePoweredBy = value.hidePoweredBy || false
  }
}, { immediate: true })

const loading = ref(false)
const error = ref('')
const success = ref(false)

// Preview colors
const primaryColorStyle = computed(() => {
  const color = form.value.primaryColor || '#2563eb'
  return {
    '--cms-primary': color,
    '--cms-primary-hover': adjustColor(color, -15),
    '--cms-primary-dark': adjustColor(color, -25),
    '--cms-primary-light': adjustColor(color, 40, 0.1)
  }
})

// Helper to adjust color brightness
function adjustColor(hex: string, percent: number, alpha?: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))

  if (alpha !== undefined) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Submit handler (note: this is a preview only, actual config is in cms.config.ts)
const submit = async () => {
  error.value = ''
  success.value = false
  loading.value = true

  try {
    // In a real implementation, this would save to a database or config file
    // For now, we show a message that config must be updated manually
    await new Promise(resolve => setTimeout(resolve, 500))

    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Failed to save settings'
  } finally {
    loading.value = false
  }
}

// Generate config code
const configCode = computed(() => {
  const config: Record<string, unknown> = {}

  if (form.value.name) config.name = form.value.name
  if (form.value.logo) config.logo = form.value.logo
  if (form.value.primaryColor !== '#2563eb') config.primaryColor = form.value.primaryColor
  if (form.value.favicon) config.favicon = form.value.favicon
  if (form.value.hidePoweredBy) config.hidePoweredBy = true

  if (form.value.loginTitle || form.value.loginDescription || form.value.loginBackgroundImage) {
    config.login = {}
    if (form.value.loginTitle) config.login.title = form.value.loginTitle
    if (form.value.loginDescription) config.login.description = form.value.loginDescription
    if (form.value.loginBackgroundImage) config.login.backgroundImage = form.value.loginBackgroundImage
  }

  if (form.value.poweredByName !== 'Neskeep' || form.value.poweredByUrl !== 'https://neskeep.com') {
    config.poweredBy = {}
    if (form.value.poweredByName !== 'Neskeep') config.poweredBy.name = form.value.poweredByName
    if (form.value.poweredByUrl !== 'https://neskeep.com') config.poweredBy.url = form.value.poweredByUrl
  }

  return `export default defineNuxtConfig({
  modules: ['@neskeep/nuxt-cms'],

  cms: {
    branding: ${JSON.stringify(config, null, 6).replace(/\n/g, '\n    ')}
  }
})`
})

// Copy to clipboard
async function copyConfig() {
  try {
    await navigator.clipboard.writeText(configCode.value)
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 2000)
  } catch (err) {
    error.value = 'Failed to copy to clipboard'
  }
}
</script>

<template>
  <CmsAdminLayout>
    <div class="settings-page" :style="primaryColorStyle">
      <!-- Header -->
      <div class="settings-page__header">
        <NuxtLink :to="`${config.public.cms.adminPath}`" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <h1 class="settings-page__title">Branding Settings</h1>
        <p class="settings-page__description">
          Customize the appearance and branding of your CMS
        </p>
      </div>

      <div class="settings-grid">
        <!-- Settings Form -->
        <div class="settings-panel">
          <form class="settings-form" @submit.prevent="submit">
            <!-- Success Message -->
            <div v-if="success" class="settings-form__success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Settings updated successfully! Update your cms.config.ts file.
            </div>

            <!-- Error Message -->
            <div v-if="error" class="settings-form__error">
              {{ error }}
            </div>

            <h2 class="settings-section__title">General</h2>

            <!-- CMS Name -->
            <div class="form-field">
              <label for="name" class="form-field__label">CMS Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                class="form-field__input"
                placeholder="My CMS"
              />
              <p class="form-field__hint">Displayed in the sidebar and page titles</p>
            </div>

            <!-- Logo URL -->
            <div class="form-field">
              <label for="logo" class="form-field__label">Logo URL</label>
              <input
                id="logo"
                v-model="form.logo"
                type="url"
                class="form-field__input"
                placeholder="https://example.com/logo.svg"
              />
              <p class="form-field__hint">Sidebar logo image (recommended: SVG, max height 40px)</p>
            </div>

            <!-- Primary Color -->
            <div class="form-field">
              <label for="primaryColor" class="form-field__label">Primary Color</label>
              <div class="color-picker">
                <input
                  id="primaryColor"
                  v-model="form.primaryColor"
                  type="color"
                  class="color-picker__input"
                />
                <input
                  v-model="form.primaryColor"
                  type="text"
                  class="color-picker__text"
                  placeholder="#2563eb"
                />
              </div>
              <p class="form-field__hint">Used for buttons, links, and accents</p>
            </div>

            <!-- Favicon -->
            <div class="form-field">
              <label for="favicon" class="form-field__label">Favicon URL</label>
              <input
                id="favicon"
                v-model="form.favicon"
                type="url"
                class="form-field__input"
                placeholder="https://example.com/favicon.ico"
              />
              <p class="form-field__hint">Browser tab icon (ICO or PNG, 16x16 or 32x32)</p>
            </div>

            <h2 class="settings-section__title">Login Page</h2>

            <!-- Login Title -->
            <div class="form-field">
              <label for="loginTitle" class="form-field__label">Login Title</label>
              <input
                id="loginTitle"
                v-model="form.loginTitle"
                type="text"
                class="form-field__input"
                placeholder="Content Management System"
              />
              <p class="form-field__hint">Leave empty to hide</p>
            </div>

            <!-- Login Description -->
            <div class="form-field">
              <label for="loginDescription" class="form-field__label">Login Description</label>
              <textarea
                id="loginDescription"
                v-model="form.loginDescription"
                class="form-field__textarea"
                placeholder="Manage your content with a powerful and intuitive interface."
                rows="3"
              />
              <p class="form-field__hint">Leave empty to hide</p>
            </div>

            <!-- Login Background Image -->
            <div class="form-field">
              <label for="loginBackgroundImage" class="form-field__label">Login Background Image</label>
              <input
                id="loginBackgroundImage"
                v-model="form.loginBackgroundImage"
                type="url"
                class="form-field__input"
                placeholder="https://example.com/background.jpg"
              />
              <p class="form-field__hint">Background image for login branding panel</p>
            </div>

            <h2 class="settings-section__title">Footer</h2>

            <!-- Powered By Name -->
            <div class="form-field">
              <label for="poweredByName" class="form-field__label">Powered By Name</label>
              <input
                id="poweredByName"
                v-model="form.poweredByName"
                type="text"
                class="form-field__input"
                placeholder="Neskeep"
              />
            </div>

            <!-- Powered By URL -->
            <div class="form-field">
              <label for="poweredByUrl" class="form-field__label">Powered By URL</label>
              <input
                id="poweredByUrl"
                v-model="form.poweredByUrl"
                type="url"
                class="form-field__input"
                placeholder="https://neskeep.com"
              />
            </div>

            <!-- Hide Powered By -->
            <div class="form-field">
              <label class="checkbox">
                <input
                  v-model="form.hidePoweredBy"
                  type="checkbox"
                  class="checkbox__input"
                />
                <span class="checkbox__label">Hide "Powered By" footer</span>
              </label>
            </div>

            <!-- Actions -->
            <div class="settings-form__actions">
              <button type="button" class="btn btn--secondary" @click="copyConfig">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                Copy Config
              </button>
              <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? 'Saving...' : 'Save Preview' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Live Preview -->
        <div class="preview-panel">
          <div class="preview-panel__header">
            <h3 class="preview-panel__title">Live Preview</h3>
            <p class="preview-panel__description">See how your branding looks</p>
          </div>

          <div class="preview-panel__content">
            <!-- Color Swatches -->
            <div class="preview-section">
              <h4 class="preview-section__title">Colors</h4>
              <div class="color-swatches">
                <div class="color-swatch">
                  <div class="color-swatch__box" :style="{ backgroundColor: form.primaryColor }" />
                  <span class="color-swatch__label">Primary</span>
                </div>
                <div class="color-swatch">
                  <div class="color-swatch__box" :style="{ backgroundColor: adjustColor(form.primaryColor, -15) }" />
                  <span class="color-swatch__label">Hover</span>
                </div>
                <div class="color-swatch">
                  <div class="color-swatch__box" :style="{ backgroundColor: adjustColor(form.primaryColor, 40, 0.1) }" />
                  <span class="color-swatch__label">Light</span>
                </div>
              </div>
            </div>

            <!-- Button Preview -->
            <div class="preview-section">
              <h4 class="preview-section__title">Buttons</h4>
              <div class="button-preview">
                <button class="preview-btn preview-btn--primary">Primary Button</button>
                <button class="preview-btn preview-btn--secondary">Secondary Button</button>
              </div>
            </div>

            <!-- Logo Preview -->
            <div v-if="form.logo" class="preview-section">
              <h4 class="preview-section__title">Logo</h4>
              <div class="logo-preview">
                <img :src="form.logo" :alt="form.name || 'Logo'" class="logo-preview__img" />
              </div>
            </div>

            <!-- Config Code -->
            <div class="preview-section">
              <h4 class="preview-section__title">Configuration Code</h4>
              <p class="preview-section__hint">Add this to your <code>nuxt.config.ts</code></p>
              <pre class="config-code">{{ configCode }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style scoped>
.settings-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
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
}

.back-link:hover {
  color: #374151;
}

.back-link svg {
  width: 18px;
  height: 18px;
}

.settings-page__title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.settings-page__description {
  font-size: 16px;
  color: #6b7280;
}

/* Grid Layout */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

/* Settings Panel */
.settings-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px;
}

.settings-form__success {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  color: #065f46;
  font-size: 14px;
  margin-bottom: 24px;
}

.settings-form__success svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.settings-form__error {
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 24px;
}

.settings-section__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 32px 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.settings-section__title:first-of-type {
  margin-top: 0;
}

/* Form Fields */
.form-field {
  margin-bottom: 24px;
}

.form-field__label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-field__input,
.form-field__textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: white;
}

.form-field__input:focus,
.form-field__textarea:focus {
  border-color: var(--cms-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--cms-primary-light, rgba(37, 99, 235, 0.1));
}

.form-field__textarea {
  resize: vertical;
  font-family: inherit;
}

.form-field__hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.form-field__hint code {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
}

/* Color Picker */
.color-picker {
  display: flex;
  gap: 12px;
  align-items: center;
}

.color-picker__input {
  width: 60px;
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.color-picker__text {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.color-picker__text:focus {
  border-color: var(--cms-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--cms-primary-light, rgba(37, 99, 235, 0.1));
}

/* Checkbox */
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox__input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--cms-primary, #2563eb);
}

.checkbox__label {
  font-size: 14px;
  color: #374151;
  user-select: none;
}

/* Actions */
.settings-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn svg {
  width: 18px;
  height: 18px;
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

.btn--secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn--secondary:hover {
  background: #f9fafb;
}

/* Preview Panel */
.preview-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  max-height: calc(100vh - 200px);
  position: sticky;
  top: 24px;
}

.preview-panel__header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-panel__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.preview-panel__description {
  font-size: 14px;
  color: #6b7280;
}

.preview-panel__content {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

/* Preview Sections */
.preview-section {
  margin-bottom: 32px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-section__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.preview-section__hint {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}

/* Color Swatches */
.color-swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.color-swatch {
  text-align: center;
}

.color-swatch__box {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.color-swatch__label {
  font-size: 12px;
  color: #6b7280;
}

/* Button Preview */
.button-preview {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.preview-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.preview-btn--primary {
  background: var(--cms-primary, #2563eb);
  color: white;
}

.preview-btn--primary:hover {
  background: var(--cms-primary-hover, #1d4ed8);
  color: white;
}

.preview-btn--secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.preview-btn--secondary:hover {
  background: #f9fafb;
}

/* Logo Preview */
.logo-preview {
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.logo-preview__img {
  max-width: 100%;
  max-height: 60px;
  object-fit: contain;
}

/* Config Code */
.config-code {
  padding: 16px;
  background: #1f2937;
  color: #f3f4f6;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}
</style>
