<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch, useRoute, navigateTo } from '#imports'
import { useCmsAdmin } from '../../../composables/useCmsAdmin'
import CmsFieldSelect from '../../../components/fields/Select.vue'
import CmsFieldImage from '../../../components/fields/Image.vue'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()
const route = useRoute()
const { user: currentUser } = useCmsAdmin()
const userId = route.params.id as string

// Form state
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  roleId: '',
  avatar: ''
})

const loading = ref(false)
const error = ref('')

// Fetch user
const { data: userData, error: fetchError } = await useFetch<{
  data: {
    id: string
    username: string
    email: string
    avatar: string | null
    roleId: string | null
    roleName: string | null
  }
}>(`/api/cms/users/${userId}`)

if (fetchError.value) {
  navigateTo(`${config.public.cms.adminPath}/users`)
}

// Fetch roles
const { data: rolesData } = await useFetch<{
  data: Array<{
    id: string
    name: string
    displayName: string
    description: string | null
  }>
}>('/api/cms/roles')

const roles = computed(() => rolesData.value?.data || [])

const roleOptions = computed(() => roles.value.map(role => ({
  value: role.id,
  label: role.displayName
})))

// Initialize form with user data
watch(userData, (data) => {
  if (data?.data) {
    form.value.username = data.data.username
    form.value.email = data.data.email
    form.value.roleId = data.data.roleId || ''
    form.value.avatar = data.data.avatar || ''
  }
}, { immediate: true })

const isOwnProfile = computed(() => userId === currentUser.value?.id)

// Submit form
const submit = async () => {
  error.value = ''

  // Validation
  if (!form.value.username || !form.value.email) {
    error.value = 'Please fill in all required fields'
    return
  }

  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (form.value.password && form.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  loading.value = true

  try {
    const body: Record<string, string | undefined> = {
      username: form.value.username,
      email: form.value.email,
      avatar: form.value.avatar || undefined
    }

    if (form.value.password) {
      body.password = form.value.password
    }

    if (form.value.roleId && !isOwnProfile.value) {
      body.roleId = form.value.roleId
    }

    const updatedUser = await $fetch(`/api/cms/users/${userId}`, {
      method: 'PUT',
      body
    })

    // Update global user state if editing own profile
    if (isOwnProfile.value && updatedUser && typeof updatedUser === 'object') {
      user.value = updatedUser as any
    }

    navigateTo(`${config.public.cms.adminPath}/users`)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    error.value = e.data?.statusMessage || 'Failed to update user'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CmsAdminLayout>
    <div class="user-form-page">
      <!-- Header -->
      <div class="user-form-page__header">
        <NuxtLink :to="`${config.public.cms.adminPath}/users`" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Users
        </NuxtLink>
        <h1 class="user-form-page__title">Edit User</h1>
      </div>

      <!-- Form -->
      <form class="user-form" @submit.prevent="submit">
        <div v-if="error" class="user-form__error">
          {{ error }}
        </div>

        <div class="user-form__grid">
          <!-- Username -->
          <div class="form-field">
            <label for="username" class="form-field__label">
              Username <span class="form-field__required">*</span>
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="form-field__input"
              placeholder="Enter username"
              required
            />
          </div>

          <!-- Email -->
          <div class="form-field">
            <label for="email" class="form-field__label">
              Email <span class="form-field__required">*</span>
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-field__input"
              placeholder="Enter email"
              required
            />
          </div>

          <!-- Password -->
          <div class="form-field">
            <label for="password" class="form-field__label">
              New Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-field__input"
              placeholder="Leave blank to keep current"
            />
          </div>

          <!-- Confirm Password -->
          <div class="form-field">
            <label for="confirmPassword" class="form-field__label">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              class="form-field__input"
              placeholder="Repeat new password"
            />
          </div>

          <!-- Role -->
          <div class="form-field">
            <CmsFieldSelect
              v-model="form.roleId"
              :field="{
                type: 'select',
                label: 'Role',
                options: roleOptions,
                disabled: isOwnProfile
              }"
              field-name="role"
            />
            <p v-if="isOwnProfile" class="form-field__hint form-field__hint--warning">
              You cannot change your own role
            </p>
            <p v-else class="form-field__hint">
              {{ roles.find(r => r.id === form.roleId)?.description || '' }}
            </p>
          </div>

          <!-- Avatar -->
          <div class="form-field form-field--full-width">
            <CmsFieldImage
              v-model="form.avatar"
              :field="{
                type: 'image',
                label: 'Avatar',
                help: 'Upload an avatar image for this user',
                accept: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
                maxSize: 5 * 1024 * 1024
              }"
              field-name="avatar"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="user-form__actions">
          <NuxtLink :to="`${config.public.cms.adminPath}/users`" class="btn btn--secondary">
            Cancel
          </NuxtLink>
          <button type="submit" class="btn btn--primary" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </CmsAdminLayout>
</template>

<style>
.user-form-page {
  max-width: 800px;
  margin: 0 auto;
}

.user-form-page__header {
  margin-bottom: 24px;
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

.user-form-page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

/* Form */
.user-form {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.user-form__error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 24px;
}

.user-form__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 640px) {
  .user-form__grid {
    grid-template-columns: 1fr;
  }
}

/* Form Field */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field--full-width {
  grid-column: 1 / -1;
}

.form-field__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-field__required {
  color: #dc2626;
}

.form-field__input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: white;
}

.form-field__input:focus {
  border-color: var(--cms-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--cms-primary-light, rgba(37, 99, 235, 0.1));
}

.form-field__input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.form-field__hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.form-field__hint--warning {
  color: #d97706;
}

/* Actions */
.user-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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
  text-decoration: none;
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

.btn--secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn--secondary:hover {
  background: #f9fafb;
}
</style>
