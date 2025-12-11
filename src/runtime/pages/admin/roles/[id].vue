<script setup lang="ts">
import { ref, watch } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch, useRoute, navigateTo } from '#imports'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()
const route = useRoute()
const roleId = route.params.id as string

// Permission resources and actions
const resources = [
  { key: 'collections', label: 'Collections', type: 'resource' },
  { key: 'singletons', label: 'Singletons', type: 'resource' },
  { key: 'media', label: 'Media', type: 'simple' },
  { key: 'users', label: 'Users', type: 'simple' },
  { key: 'roles', label: 'Roles', type: 'simple' },
  { key: 'settings', label: 'Settings', type: 'simple' }
]

const actions = ['create', 'read', 'update', 'delete', 'publish', 'manage']

// Form state
const form = ref({
  name: '',
  displayName: '',
  description: '',
  isSystem: false,
  permissions: {
    collections: { '*': [] as string[] },
    singletons: { '*': [] as string[] },
    media: [] as string[],
    users: [] as string[],
    roles: [] as string[],
    settings: [] as string[]
  }
})

const loading = ref(false)
const error = ref('')

// Fetch role
const { data: roleData, error: fetchError } = await useFetch<{
  data: {
    id: string
    name: string
    displayName: string
    description: string | null
    isSystem: boolean
    permissions: Record<string, unknown>
  }
}>(`/api/cms/roles/${roleId}`)

if (fetchError.value) {
  navigateTo(`${config.public.cms.adminPath}/roles`)
}

// Initialize form with role data
watch(roleData, (data) => {
  if (data?.data) {
    form.value.name = data.data.name
    form.value.displayName = data.data.displayName
    form.value.description = data.data.description || ''
    form.value.isSystem = data.data.isSystem

    // Parse permissions
    const perms = data.data.permissions as Record<string, unknown>

    // Collections
    if (perms.collections && typeof perms.collections === 'object') {
      const colPerms = perms.collections as Record<string, string[]>
      form.value.permissions.collections = { '*': colPerms['*'] || [] }
    }

    // Singletons
    if (perms.singletons && typeof perms.singletons === 'object') {
      const sinPerms = perms.singletons as Record<string, string[]>
      form.value.permissions.singletons = { '*': sinPerms['*'] || [] }
    }

    // Simple permissions
    if (Array.isArray(perms.media)) form.value.permissions.media = perms.media
    if (Array.isArray(perms.users)) form.value.permissions.users = perms.users
    if (Array.isArray(perms.roles)) form.value.permissions.roles = perms.roles
    if (Array.isArray(perms.settings)) form.value.permissions.settings = perms.settings
  }
}, { immediate: true })

// Toggle permission
const togglePermission = (resource: string, action: string) => {
  const perms = form.value.permissions as Record<string, unknown>

  if (resource === 'collections' || resource === 'singletons') {
    const resourcePerms = perms[resource] as Record<string, string[]>
    const current = resourcePerms['*'] || []
    const index = current.indexOf(action)
    if (index === -1) {
      current.push(action)
    } else {
      current.splice(index, 1)
    }
    resourcePerms['*'] = current
  } else {
    const current = perms[resource] as string[]
    const index = current.indexOf(action)
    if (index === -1) {
      current.push(action)
    } else {
      current.splice(index, 1)
    }
  }
}

// Check if permission is enabled
const hasPermission = (resource: string, action: string): boolean => {
  const perms = form.value.permissions as Record<string, unknown>

  if (resource === 'collections' || resource === 'singletons') {
    const resourcePerms = perms[resource] as Record<string, string[]>
    return (resourcePerms['*'] || []).includes(action)
  }

  return (perms[resource] as string[]).includes(action)
}

// Submit form
const submit = async () => {
  error.value = ''

  if (!form.value.displayName) {
    error.value = 'Display name is required'
    return
  }

  loading.value = true

  try {
    await $fetch(`/api/cms/roles/${roleId}`, {
      method: 'PUT',
      body: {
        displayName: form.value.displayName,
        description: form.value.description || undefined,
        permissions: form.value.permissions
      }
    })

    navigateTo(`${config.public.cms.adminPath}/roles`)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    error.value = e.data?.statusMessage || 'Failed to update role'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CmsAdminLayout>
    <div class="role-form-page">
      <!-- Header -->
      <div class="role-form-page__header">
        <NuxtLink :to="`${config.public.cms.adminPath}/roles`" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Roles
        </NuxtLink>
        <div class="role-form-page__title-row">
          <h1 class="role-form-page__title">Edit Role</h1>
          <span v-if="form.isSystem" class="system-badge">System Role</span>
        </div>
      </div>

      <!-- Form -->
      <form class="role-form" @submit.prevent="submit">
        <div v-if="error" class="role-form__error">
          {{ error }}
        </div>

        <!-- Basic Info -->
        <div class="role-form__section">
          <h2 class="role-form__section-title">Basic Information</h2>
          <div class="role-form__grid">
            <div class="form-field">
              <label for="name" class="form-field__label">Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                class="form-field__input"
                disabled
              />
              <p v-if="form.isSystem" class="form-field__hint">System role names cannot be changed</p>
            </div>

            <div class="form-field">
              <label for="displayName" class="form-field__label">
                Display Name <span class="form-field__required">*</span>
              </label>
              <input
                id="displayName"
                v-model="form.displayName"
                type="text"
                class="form-field__input"
                placeholder="e.g., Content Manager"
                required
              />
            </div>

            <div class="form-field form-field--full">
              <label for="description" class="form-field__label">Description</label>
              <textarea
                id="description"
                v-model="form.description"
                class="form-field__input form-field__textarea"
                placeholder="Describe what this role can do..."
                rows="2"
              />
            </div>
          </div>
        </div>

        <!-- Permissions -->
        <div class="role-form__section">
          <h2 class="role-form__section-title">Permissions</h2>
          <p class="role-form__section-desc">Select the permissions for this role</p>

          <div class="permissions-table-wrapper">
            <table class="permissions-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th v-for="action in actions" :key="action">{{ action }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="resource in resources" :key="resource.key">
                  <td class="permissions-table__resource">
                    {{ resource.label }}
                    <span v-if="resource.type === 'resource'" class="permissions-table__hint">
                      (all)
                    </span>
                  </td>
                  <td v-for="action in actions" :key="action" class="permissions-table__cell">
                    <label class="checkbox">
                      <input
                        type="checkbox"
                        :checked="hasPermission(resource.key, action)"
                        @change="togglePermission(resource.key, action)"
                      />
                      <span class="checkbox__mark" />
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div class="role-form__actions">
          <NuxtLink :to="`${config.public.cms.adminPath}/roles`" class="btn btn--secondary">
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
.role-form-page {
  max-width: 900px;
  margin: 0 auto;
}

.role-form-page__header {
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

.role-form-page__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-form-page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.system-badge {
  padding: 4px 10px;
  background: var(--cms-primary-light, #eff6ff);
  color: var(--cms-primary, #2563eb);
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
}

/* Form */
.role-form {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.role-form__error {
  padding: 12px 16px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  color: #dc2626;
  font-size: 14px;
}

.role-form__section {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.role-form__section:last-of-type {
  border-bottom: none;
}

.role-form__section-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.role-form__section-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
}

.role-form__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 640px) {
  .role-form__grid {
    grid-template-columns: 1fr;
  }
}

/* Form Field */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field--full {
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
  color: #6b7280;
  cursor: not-allowed;
}

.form-field__textarea {
  resize: vertical;
  min-height: 60px;
}

.form-field__hint {
  font-size: 12px;
  color: #6b7280;
}

/* Permissions Table */
.permissions-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.permissions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.permissions-table th {
  text-align: center;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.permissions-table th:first-child {
  text-align: left;
}

.permissions-table td {
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.permissions-table tr:last-child td {
  border-bottom: none;
}

.permissions-table__resource {
  font-weight: 500;
}

.permissions-table__hint {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 400;
}

.permissions-table__cell {
  text-align: center;
}

/* Checkbox */
.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox__mark {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s;
  position: relative;
}

.checkbox input:checked + .checkbox__mark {
  background: var(--cms-primary, #2563eb);
  border-color: var(--cms-primary, #2563eb);
}

.checkbox input:checked + .checkbox__mark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox:hover .checkbox__mark {
  border-color: #9ca3af;
}

/* Actions */
.role-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  background: #f9fafb;
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
