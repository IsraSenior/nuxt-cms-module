<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRuntimeConfig } from '#imports'
import { useBranding } from '../../composables/useBranding'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()
const { updateBranding, refreshBranding } = useBranding()

// Upload states
const uploadingLogo = ref(false)
const uploadingFavicon = ref(false)
const uploadingLoginBg = ref(false)
const uploadError = ref('')

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

// Upload handler
async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/cms/media/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  const data = await response.json()
  return `/api/cms/media/file/${data.filename}`
}

async function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingLogo.value = true
  uploadError.value = ''
  try {
    form.value.logo = await uploadImage(file)
  } catch (err) {
    uploadError.value = 'Logo upload failed'
    console.error(err)
  } finally {
    uploadingLogo.value = false
  }
}

async function handleFaviconUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingFavicon.value = true
  uploadError.value = ''
  try {
    form.value.favicon = await uploadImage(file)
  } catch (err) {
    uploadError.value = 'Favicon upload failed'
    console.error(err)
  } finally {
    uploadingFavicon.value = false
  }
}

async function handleLoginBgUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingLoginBg.value = true
  uploadError.value = ''
  try {
    form.value.loginBackgroundImage = await uploadImage(file)
  } catch (err) {
    uploadError.value = 'Background image upload failed'
    console.error(err)
  } finally {
    uploadingLoginBg.value = false
  }
}

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

// Watch for form changes and update branding in real-time
watch(() => form.value.primaryColor, (newColor) => {
  if (newColor) {
    updateBranding({ primaryColor: newColor })
  }
})

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

// Submit handler - saves branding to database
const submit = async () => {
  error.value = ''
  success.value = false
  loading.value = true

  try {
    // Build branding config object
    const brandingConfig = {
      name: form.value.name,
      logo: form.value.logo,
      primaryColor: form.value.primaryColor,
      favicon: form.value.favicon,
      login: {
        title: form.value.loginTitle,
        description: form.value.loginDescription,
        backgroundImage: form.value.loginBackgroundImage
      },
      poweredBy: {
        name: form.value.poweredByName,
        url: form.value.poweredByUrl
      },
      hidePoweredBy: form.value.hidePoweredBy
    }

    // Save to database via API
    const response = await fetch('/api/cms/settings/branding', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(brandingConfig),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to save branding settings')
    }

    // Refresh branding from the database
    await refreshBranding()

    success.value = true

    // Hide success message after 3 seconds
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
              Branding settings saved successfully!
            </div>

            <!-- Error Message -->
            <div v-if="error || uploadError" class="settings-form__error">
              {{ error || uploadError }}
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

            <!-- Logo -->
            <div class="form-field">
              <label for="logo" class="form-field__label">Logo</label>
              <div class="image-upload">
                <div v-if="form.logo" class="image-upload__preview">
                  <img :src="form.logo" alt="Logo" class="image-upload__img" />
                  <button type="button" class="image-upload__remove" @click="form.logo = ''">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div v-else class="image-upload__placeholder">
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    class="image-upload__input"
                    @change="handleLogoUpload"
                  />
                  <label for="logo" class="image-upload__label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span v-if="uploadingLogo">Uploading...</span>
                    <span v-else>Click to upload logo</span>
                  </label>
                </div>
              </div>
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
              <label for="favicon" class="form-field__label">Favicon</label>
              <div class="image-upload image-upload--small">
                <div v-if="form.favicon" class="image-upload__preview">
                  <img :src="form.favicon" alt="Favicon" class="image-upload__img" />
                  <button type="button" class="image-upload__remove" @click="form.favicon = ''">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div v-else class="image-upload__placeholder">
                  <input
                    id="favicon"
                    type="file"
                    accept="image/x-icon,image/png,image/ico"
                    class="image-upload__input"
                    @change="handleFaviconUpload"
                  />
                  <label for="favicon" class="image-upload__label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span v-if="uploadingFavicon">Uploading...</span>
                    <span v-else>Click to upload</span>
                  </label>
                </div>
              </div>
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
              <div class="image-upload">
                <div v-if="form.loginBackgroundImage" class="image-upload__preview">
                  <img :src="form.loginBackgroundImage" alt="Login Background" class="image-upload__img" />
                  <button type="button" class="image-upload__remove" @click="form.loginBackgroundImage = ''">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div v-else class="image-upload__placeholder">
                  <input
                    id="loginBackgroundImage"
                    type="file"
                    accept="image/*"
                    class="image-upload__input"
                    @change="handleLoginBgUpload"
                  />
                  <label for="loginBackgroundImage" class="image-upload__label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span v-if="uploadingLoginBg">Uploading...</span>
                    <span v-else>Click to upload background</span>
                  </label>
                </div>
              </div>
              <p class="form-field__hint">Background image for login page</p>
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
              <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? 'Saving...' : 'Save Settings' }}
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

/* Image Upload */
.image-upload {
  position: relative;
}

.image-upload__preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
}

.image-upload__img {
  width: 100%;
  height: 150px;
  object-fit: contain;
  display: block;
  padding: 12px;
}

.image-upload--small .image-upload__img {
  height: 80px;
}

.image-upload__remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-upload__remove:hover {
  background: rgba(185, 28, 28, 1);
}

.image-upload__remove svg {
  width: 18px;
  height: 18px;
}

.image-upload__placeholder {
  position: relative;
}

.image-upload__input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.image-upload__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 300px;
  height: 150px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.image-upload--small .image-upload__label {
  height: 80px;
}

.image-upload__label:hover {
  border-color: var(--cms-primary, #2563eb);
  background: #f3f4f6;
  color: var(--cms-primary, #2563eb);
}

.image-upload__label svg {
  width: 32px;
  height: 32px;
}

.image-upload__label span {
  font-size: 14px;
  font-weight: 500;
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
