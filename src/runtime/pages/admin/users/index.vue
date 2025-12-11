<script setup lang="ts">
import { ref, computed } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch, navigateTo } from '#imports'
import { useCmsAdmin } from '../../../composables/useCmsAdmin'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const { user: currentUser } = useCmsAdmin()
const config = useRuntimeConfig()
const searchQuery = ref('')
const page = ref(1)
const perPage = ref(20)

// Fetch users
const { data: usersData, refresh, pending } = await useFetch<{
  data: Array<{
    id: string
    username: string
    email: string
    avatar: string | null
    roleId: string | null
    roleName: string | null
    roleDisplayName: string | null
    createdAt: string
  }>
  meta: { total: number; page: number; perPage: number; totalPages: number }
}>('/api/cms/users', {
  query: computed(() => ({
    page: page.value,
    perPage: perPage.value,
    search: searchQuery.value || undefined
  }))
})

const users = computed(() => usersData.value?.data || [])
const meta = computed(() => usersData.value?.meta || { total: 0, page: 1, perPage: 20, totalPages: 1 })

// Delete user
const deleteUser = async (userId: string, username: string) => {
  if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
    return
  }

  try {
    await $fetch(`/api/cms/users/${userId}`, { method: 'DELETE' })
    refresh()
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    alert(err.data?.statusMessage || 'Failed to delete user')
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
    <div class="users-page">
      <!-- Header -->
      <div class="users-page__header">
        <div>
          <h1 class="users-page__title">Users</h1>
          <p class="users-page__subtitle">Manage user accounts and permissions</p>
        </div>
        <NuxtLink :to="`${config.public.cms.adminPath}/users/new`" class="btn btn--primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="btn__icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add User
        </NuxtLink>
      </div>

      <!-- Search -->
      <div class="users-page__search">
        <div class="search-input">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="search-input__icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="search-input__field"
          />
        </div>
      </div>

      <!-- Users Table -->
      <div class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th class="users-table__actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pending">
              <td colspan="5" class="users-table__loading">
                Loading users...
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="5" class="users-table__empty">
                No users found
              </td>
            </tr>
            <tr v-for="user in users" :key="user.id" class="users-table__row">
              <td>
                <div class="user-cell">
                  <div class="user-cell__avatar">
                    <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
                    <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="user-cell__name">{{ user.username }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="`role-badge--${user.roleName || 'editor'}`">
                  {{ user.roleDisplayName || user.roleName || 'Editor' }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="users-table__actions">
                  <NuxtLink
                    :to="`${config.public.cms.adminPath}/users/${user.id}`"
                    class="action-btn action-btn--edit"
                    title="Edit user"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </NuxtLink>
                  <button
                    v-if="user.id !== currentUser?.id"
                    class="action-btn action-btn--delete"
                    title="Delete user"
                    @click="deleteUser(user.id, user.username)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.totalPages > 1" class="users-page__pagination">
        <button
          class="pagination-btn"
          :disabled="page <= 1"
          @click="page--"
        >
          Previous
        </button>
        <span class="pagination-info">
          Page {{ meta.page }} of {{ meta.totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="page >= meta.totalPages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.users-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.users-page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.users-page__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
}

/* Search */
.users-page__search {
  max-width: 400px;
}

.search-input {
  position: relative;
}

.search-input__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #9ca3af;
}

.search-input__field {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input__field:focus {
  border-color: #2563eb;
}

/* Table */
.users-table-wrapper {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.users-table td {
  padding: 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.users-table__row:last-child td {
  border-bottom: none;
}

.users-table__row:hover {
  background: #f9fafb;
}

.users-table__loading,
.users-table__empty {
  text-align: center;
  color: #6b7280;
  padding: 48px 16px !important;
}

.users-table__actions-header {
  width: 100px;
  text-align: right;
}

/* User Cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-cell__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  overflow: hidden;
}

.user-cell__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-cell__name {
  font-weight: 500;
  color: #111827;
}

/* Role Badge */
.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge--super_admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge--admin {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge--editor {
  background: #d1fae5;
  color: #065f46;
}

.role-badge--author {
  background: #e0e7ff;
  color: #3730a3;
}

.role-badge--viewer {
  background: #f3f4f6;
  color: #374151;
}

/* Actions */
.users-table__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

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
  background: #2563eb;
  color: white;
}

.btn--primary:hover {
  background: #1d4ed8;
}

.btn__icon {
  width: 18px;
  height: 18px;
}

/* Pagination */
.users-page__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
}
</style>
