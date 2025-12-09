<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { definePageMeta, useRuntimeConfig, navigateTo } from '#imports'
import { useCmsAdmin } from '../../composables/useCmsAdmin'

definePageMeta({
  layout: false
})

const { login, loading, error, isAuthenticated } = useCmsAdmin()
const config = useRuntimeConfig()

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
</script>

<template>
  <div class="login">
    <!-- Branding Panel -->
    <div class="login__branding">
      <div class="login__branding-content">
        <div class="login__branding-icon">
          <UIcon name="i-heroicons-cube" class="w-12 h-12 text-white" />
        </div>
        <h1 class="login__branding-title">
          Content Management System
        </h1>
        <p class="login__branding-text">
          Manage your content with a powerful and intuitive interface.
        </p>
        <div class="login__branding-features">
          <div class="login__feature">
            <UIcon name="i-heroicons-check-circle" class="login__feature-icon" />
            <span>Collections & Singletons</span>
          </div>
          <div class="login__feature">
            <UIcon name="i-heroicons-check-circle" class="login__feature-icon" />
            <span>Media Library</span>
          </div>
          <div class="login__feature">
            <UIcon name="i-heroicons-check-circle" class="login__feature-icon" />
            <span>Custom Fields</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Panel -->
    <div class="login__form-panel">
      <div class="login__form-container">
        <!-- Mobile Logo -->
        <div class="login__mobile-logo">
          <div class="login__mobile-icon">
            <UIcon name="i-heroicons-cube" class="w-6 h-6 text-white" />
          </div>
          <span class="login__mobile-text">CMS</span>
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
          <UFormField label="Username" required>
            <UInput
              v-model="form.username"
              type="text"
              variant="outline"
              placeholder="Enter your username"
              icon="i-heroicons-user"
              size="lg"
              autofocus
            />
          </UFormField>

          <UFormField label="Password" required>
            <UInput
              v-model="form.password"
              type="password"
              variant="outline"
              placeholder="Enter your password"
              icon="i-heroicons-lock-closed"
              size="lg"
            />
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            size="xl"
            block
            :loading="loading"
            class="login__submit"
          >
            Sign in
          </UButton>
        </form>

        <!-- Footer -->
        <p class="login__footer">
          Powered by <span class="login__footer-brand">Nuxt CMS</span>
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

:root.dark .login {
  background-color: #030712;
}

/* ============================================
   Branding Panel
   ============================================ */
.login__branding {
  display: none;
  width: 45%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
  padding: 48px;
  position: relative;
  overflow: hidden;
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
  margin-bottom: 40px;
}

.login__branding-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login__feature {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.login__feature-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.7);
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
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.login__mobile-text {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

:root.dark .login__mobile-text {
  color: white;
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

:root.dark .login__title {
  color: white;
}

.login__subtitle {
  font-size: 15px;
  color: #6b7280;
}

:root.dark .login__subtitle {
  color: #9ca3af;
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

.login__submit {
  margin-top: 8px;
  font-weight: 600;
  height: 48px;
}

/* Footer */
.login__footer {
  margin-top: 32px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.login__footer-brand {
  color: #2563eb;
  font-weight: 500;
}

:root.dark .login__footer-brand {
  color: #60a5fa;
}
</style>
