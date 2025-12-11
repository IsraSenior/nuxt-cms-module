<script setup lang="ts">
import { reactive, onMounted, computed } from 'vue'
import { definePageMeta, useRuntimeConfig, navigateTo } from '#imports'
import { useCmsAdmin } from '../../composables/useCmsAdmin'
import type { BrandingConfig } from '../../types'

definePageMeta({
  layout: false
})

const { login, loading, error, isAuthenticated } = useCmsAdmin()
const config = useRuntimeConfig()

// Get branding config with defaults
const branding = computed<BrandingConfig>(() => config.public.cms.branding || {})

const form = reactive({
  username: '',
  password: ''
})

async function handleSubmit() {
  const success = await login(form.username, form.password)
  if (success) {
    await navigateTo(config.public.cms.adminPath)
  }
}

// Redirect if already authenticated
onMounted(async () => {
  const { checkAuth } = useCmsAdmin()
  const isAuth = await checkAuth()
  if (isAuth) {
    await navigateTo(config.public.cms.adminPath)
  }
})

// Computed styles for branding panel background
const brandingPanelStyle = computed(() => {
  if (branding.value.login?.backgroundImage) {
    return {
      backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(29, 78, 216, 0.9) 50%, rgba(30, 64, 175, 0.9) 100%), url(${branding.value.login.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {}
})

// CSS variable for primary color
const primaryColorStyle = computed(() => {
  const color = branding.value.primaryColor || '#2563eb'
  return {
    '--cms-primary': color,
    '--cms-primary-hover': adjustColor(color, -15),
    '--cms-primary-dark': adjustColor(color, -25)
  }
})

// Helper to darken/lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
}
</script>

<template>
  <div class="login" :style="primaryColorStyle">
    <!-- Branding Panel -->
    <div class="login__branding" :style="brandingPanelStyle">
      <div class="login__branding-content">
        <!-- Custom Logo or Icon -->
        <div v-if="branding.logo" class="login__branding-logo">
          <img :src="branding.logo" :alt="branding.name || 'CMS'" class="login__branding-logo-img" />
        </div>
        <div v-else class="login__branding-icon">
          <UIcon name="i-heroicons-cube" class="w-12 h-12 text-white" />
        </div>

        <h1 class="login__branding-title">
          {{ branding.login?.title || 'Content Management System' }}
        </h1>
        <p class="login__branding-text">
          {{ branding.login?.description || 'Manage your content with a powerful and intuitive interface.' }}
        </p>
      </div>
    </div>

    <!-- Form Panel -->
    <div class="login__form-panel">
      <div class="login__form-container">
        <!-- Mobile Logo -->
        <div class="login__mobile-logo">
          <template v-if="branding.logo">
            <img :src="branding.logo" :alt="branding.name || 'CMS'" class="login__mobile-logo-img" />
          </template>
          <template v-else>
            <div class="login__mobile-icon">
              <UIcon name="i-heroicons-cube" class="w-6 h-6 text-white" />
            </div>
            <span class="login__mobile-text">{{ branding.name || 'CMS' }}</span>
          </template>
        </div>

        <!-- Form Header -->
        <div class="login__header">
          <h2 class="login__title">Welcome back</h2>
          <p class="login__subtitle">Sign in to your account to continue</p>
        </div>

        <!-- Error Alert -->
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-circle"
          :title="error"
          class="login__error"
        />

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="login__form">
          <div class="login__field">
            <label class="login__label">Username <span class="login__required">*</span></label>
            <div class="login__input-wrapper">
              <UIcon name="i-heroicons-user" class="login__input-icon" />
              <input
                v-model="form.username"
                type="text"
                placeholder="Enter your username"
                class="login__input"
                autofocus
              />
            </div>
          </div>

          <div class="login__field">
            <label class="login__label">Password <span class="login__required">*</span></label>
            <div class="login__input-wrapper">
              <UIcon name="i-heroicons-lock-closed" class="login__input-icon" />
              <input
                v-model="form.password"
                type="password"
                placeholder="Enter your password"
                class="login__input"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="login__submit"
          >
            <span v-if="loading" class="login__spinner"></span>
            Sign in
          </button>
        </form>

        <!-- Footer -->
        <p class="login__footer">
          Powered by
          <a
            v-if="branding.poweredBy?.url"
            :href="branding.poweredBy.url"
            target="_blank"
            rel="noopener noreferrer"
            class="login__footer-brand login__footer-brand--link"
          >
            {{ branding.poweredBy?.name || 'Neskeep' }}
          </a>
          <span v-else class="login__footer-brand">
            {{ branding.poweredBy?.name || 'Neskeep' }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   Login Page - Modern Minimal Design
   Scoped styles to avoid conflicts with host app
   ============================================ */

.login {
  min-height: 100vh;
  display: flex;
  background-color: #f9fafb !important;
}

/* ============================================
   Branding Panel
   ============================================ */
.login__branding {
  display: none;
  width: 45%;
  background: linear-gradient(135deg, var(--cms-primary, #2563eb) 0%, var(--cms-primary-hover, #1d4ed8) 50%, var(--cms-primary-dark, #1e40af) 100%);
  padding: 48px;
  position: relative;
  overflow: hidden;
}

.login__branding-logo {
  margin: 0 auto 32px;
}

.login__branding-logo-img {
  max-width: 180px;
  max-height: 80px;
  object-fit: contain;
}

.login__branding::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
}

.login__branding::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -30%;
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
}

@media (min-width: 1024px) {
  .login__branding {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.login__branding-content {
  position: relative;
  z-index: 1;
  max-width: 420px;
  text-align: center;
}

.login__branding-icon {
  width: 80px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
  backdrop-filter: blur(10px);
}

.login__branding-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.login__branding-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

/* ============================================
   Form Panel
   ============================================ */
.login__form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

@media (min-width: 640px) {
  .login__form-panel {
    padding: 48px;
  }
}

.login__form-container {
  width: 100%;
  max-width: 400px;
}

/* Mobile Logo */
.login__mobile-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
}

@media (min-width: 1024px) {
  .login__mobile-logo {
    display: none;
  }
}

.login__mobile-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--cms-primary, #2563eb) 0%, var(--cms-primary-hover, #1d4ed8) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.login__mobile-logo-img {
  max-width: 160px;
  max-height: 48px;
  object-fit: contain;
}

.login__mobile-text {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

/* Header */
.login__header {
  margin-bottom: 32px;
  text-align: center;
}

@media (min-width: 1024px) {
  .login__header {
    text-align: left;
  }
}

.login__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.login__subtitle {
  font-size: 15px;
  color: #6b7280;
}

/* Error */
.login__error {
  margin-bottom: 24px;
}

/* Form */
.login__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Field */
.login__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.login__required {
  color: #dc2626;
}

.login__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.login__input-icon {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: #9ca3af;
  pointer-events: none;
}

.login__input {
  width: 100%;
  padding: 12px 12px 12px 44px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  color: #111827;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.login__input::placeholder {
  color: #9ca3af;
}

.login__input:focus {
  outline: none;
  border-color: var(--cms-primary, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Submit Button */
.login__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background-color: var(--cms-primary, #2563eb);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.login__submit:hover {
  background-color: var(--cms-primary-hover, #1d4ed8);
}

.login__submit:active {
  transform: scale(0.98);
}

.login__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.login__footer {
  margin-top: 32px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.login__footer-brand {
  color: var(--cms-primary, #2563eb);
  font-weight: 500;
}

.login__footer-brand--link {
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.login__footer-brand--link:hover {
  opacity: 0.8;
}
</style>
