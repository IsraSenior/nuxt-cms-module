<script setup lang="ts">
import { ref, computed } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch, navigateTo } from '#imports'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()

// Fetch roles
const { data: rolesData, refresh, pending } = await useFetch<{
  data: Array<{
    id: string
    name: string
    displayName: string
    description: string | null
    isSystem: boolean
    createdAt: string
  }>
}>('/api/cms/roles')

const roles = computed(() => rolesData.value?.data || [])

// Delete role
const deleteRole = async (roleId: string, roleName: string) => {
  if (!confirm(`Are you sure you want to delete role "${roleName}"? This action cannot be undone.`)) {
    return
  }

  try {
    await $fetch(`/api/cms/roles/${roleId}`, { method: 'DELETE' })
    refresh()
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    alert(err.data?.statusMessage || 'Failed to delete role')
  }
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <CmsAdminLayout>
    <div class="roles-page">
      <!-- Header -->
      <div class="roles-page__header">
        <div>
          <h1 class="roles-page__title">Roles</h1>
          <p class="roles-page__subtitle">Manage user roles and permissions</p>
        </div>
        <NuxtLink :to="`${config.public.cms.adminPath}/roles/new`" class="btn btn--primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="btn__icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Role
        </NuxtLink>
      </div>

      <!-- Roles Grid -->
      <div class="roles-grid">
        <div v-if="pending" class="roles-grid__loading">
          Loading roles...
        </div>
        <div v-else-if="roles.length === 0" class="roles-grid__empty">
          No roles found
        </div>
        <template v-else>
          <div
            v-for="role in roles"
            :key="role.id"
            class="role-card"
            :class="{ 'role-card--system': role.isSystem }"
          >
            <div class="role-card__header">
              <div class="role-card__icon" :class="`role-card__icon--${role.name}`">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div class="role-card__info">
                <h3 class="role-card__name">{{ role.displayName }}</h3>
                <span class="role-card__slug">{{ role.name }}</span>
              </div>
              <span v-if="role.isSystem" class="role-card__badge">System</span>
            </div>

            <p class="role-card__description">
              {{ role.description || 'No description' }}
            </p>

            <div class="role-card__footer">
              <span class="role-card__date">Created {{ formatDate(role.createdAt) }}</span>
              <div class="role-card__actions">
                <NuxtLink
                  :to="`${config.public.cms.adminPath}/roles/${role.id}`"
                  class="action-btn action-btn--edit"
                  title="Edit role"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </NuxtLink>
                <button
                  v-if="!role.isSystem"
                  class="action-btn action-btn--delete"
                  title="Delete role"
                  @click="deleteRole(role.id, role.displayName)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style>
.roles-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.roles-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.roles-page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.roles-page__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
}

/* Roles Grid */
.roles-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .roles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .roles-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.roles-grid__loading,
.roles-grid__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px;
  color: #6b7280;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

/* Role Card */
.role-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s;
}

.role-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.role-card--system {
  border-left: 3px solid var(--cms-primary, #2563eb);
}

.role-card__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.role-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.role-card__icon svg {
  width: 20px;
  height: 20px;
}

.role-card__icon--super_admin {
  background: #fef3c7;
  color: #92400e;
}

.role-card__icon--admin {
  background: #dbeafe;
  color: #1e40af;
}

.role-card__icon--editor {
  background: #d1fae5;
  color: #065f46;
}

.role-card__icon--author {
  background: #e0e7ff;
  color: #3730a3;
}

.role-card__icon--viewer {
  background: #f3f4f6;
  color: #374151;
}

.role-card__info {
  flex: 1;
  min-width: 0;
}

.role-card__name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.role-card__slug {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
}

.role-card__badge {
  padding: 4px 8px;
  background: var(--cms-primary-light, #eff6ff);
  color: var(--cms-primary, #2563eb);
  font-size: 11px;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-card__description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  flex: 1;
}

.role-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.role-card__date {
  font-size: 12px;
  color: #9ca3af;
}

.role-card__actions {
  display: flex;
  gap: 8px;
}

/* Actions */
.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  text-decoration: none;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn--edit {
  background: #f3f4f6;
  color: #6b7280;
}

.action-btn--edit:hover {
  background: #e5e7eb;
  color: #374151;
}

.action-btn--delete {
  background: #fef2f2;
  color: #dc2626;
}

.action-btn--delete:hover {
  background: #fee2e2;
}

/* Button */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
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

.btn--primary:hover {
  background: var(--cms-primary-hover, #1d4ed8);
  color: white;
}

.btn__icon {
  width: 18px;
  height: 18px;
}
</style>
