<script setup lang="ts">
import { computed } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch } from '#imports'
import { useCmsAdmin } from '../../composables/useCmsAdmin'

definePageMeta({
  middleware: 'cms-auth'
})

const { user } = useCmsAdmin()
const config = useRuntimeConfig()

// Fetch schema to get actual counts
const { data: schema } = await useFetch('/api/cms/schema')

const collectionsCount = computed(() => {
  return schema.value?.collections ? Object.keys(schema.value.collections).length : 0
})

const singletonsCount = computed(() => {
  return schema.value?.singletons ? Object.keys(schema.value.singletons).length : 0
})

const stats = computed(() => [
  {
    label: 'Collections',
    value: collectionsCount.value.toString(),
    icon: 'i-heroicons-rectangle-stack',
    color: 'blue',
    to: `${config.public.cms.adminPath}/collections`
  },
  {
    label: 'Singletons',
    value: singletonsCount.value.toString(),
    icon: 'i-heroicons-document-text',
    color: 'emerald',
    to: `${config.public.cms.adminPath}/singletons`
  },
  {
    label: 'Media Files',
    value: '0',
    icon: 'i-heroicons-photo',
    color: 'violet',
    to: `${config.public.cms.adminPath}/media`
  }
])

const quickActions = [
  {
    label: 'Collections',
    description: 'Manage your content collections',
    icon: 'i-heroicons-rectangle-stack',
    to: `${config.public.cms.adminPath}/collections`
  },
  {
    label: 'Singletons',
    description: 'Edit single-instance content',
    icon: 'i-heroicons-document-text',
    to: `${config.public.cms.adminPath}/singletons`
  },
  {
    label: 'Media Library',
    description: 'Upload and manage files',
    icon: 'i-heroicons-photo',
    to: `${config.public.cms.adminPath}/media`
  }
]
</script>

<template>
  <CmsAdminLayout>
    <div class="dashboard">
      <!-- Header -->
      <div class="dashboard__header">
        <div>
          <h1 class="dashboard__title">Dashboard</h1>
          <p class="dashboard__subtitle">Welcome back, {{ user?.username }}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="dashboard__stats">
        <NuxtLink
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.to"
          class="stat-card"
          :class="`stat-card--${stat.color}`"
        >
          <div class="stat-card__icon" :class="`stat-card__icon--${stat.color}`">
            <UIcon :name="stat.icon" class="w-6 h-6" />
          </div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ stat.value }}</span>
            <span class="stat-card__label">{{ stat.label }}</span>
          </div>
          <UIcon name="i-heroicons-arrow-right" class="stat-card__arrow" />
        </NuxtLink>
      </div>

      <!-- Quick Actions -->
      <div class="dashboard__section">
        <h2 class="dashboard__section-title">Quick Actions</h2>
        <div class="dashboard__actions">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.label"
            :to="action.to"
            class="action-card"
          >
            <div class="action-card__icon">
              <UIcon :name="action.icon" class="w-5 h-5" />
            </div>
            <div class="action-card__content">
              <span class="action-card__title">{{ action.label }}</span>
              <span class="action-card__description">{{ action.description }}</span>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="action-card__arrow" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style>
/* Dashboard */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Header */
.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

:root.dark .dashboard__title {
  color: white;
}

.dashboard__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
}

:root.dark .dashboard__subtitle {
  color: #9ca3af;
}

/* Stats Grid */
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .dashboard__stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Stat Card */
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

:root.dark .stat-card {
  background-color: #111827;
  border-color: #1f2937;
}

:root.dark .stat-card:hover {
  border-color: #374151;
}

.stat-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__icon--blue {
  background-color: #eff6ff;
  color: #2563eb;
}

.stat-card__icon--emerald {
  background-color: #ecfdf5;
  color: #059669;
}

.stat-card__icon--violet {
  background-color: #f5f3ff;
  color: #7c3aed;
}

:root.dark .stat-card__icon--blue {
  background-color: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
}

:root.dark .stat-card__icon--emerald {
  background-color: rgba(5, 150, 105, 0.15);
  color: #34d399;
}

:root.dark .stat-card__icon--violet {
  background-color: rgba(124, 58, 237, 0.15);
  color: #a78bfa;
}

.stat-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

:root.dark .stat-card__value {
  color: white;
}

.stat-card__label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

:root.dark .stat-card__label {
  color: #9ca3af;
}

.stat-card__arrow {
  width: 20px;
  height: 20px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.stat-card:hover .stat-card__arrow {
  color: #9ca3af;
  transform: translateX(4px);
}

:root.dark .stat-card__arrow {
  color: #4b5563;
}

:root.dark .stat-card:hover .stat-card__arrow {
  color: #9ca3af;
}

/* Section */
.dashboard__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard__section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

:root.dark .dashboard__section-title {
  color: white;
}

/* Actions Grid */
.dashboard__actions {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .dashboard__actions {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Action Card */
.action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.action-card:hover {
  border-color: #2563eb;
  background-color: #fafafa;
}

:root.dark .action-card {
  background-color: #111827;
  border-color: #1f2937;
}

:root.dark .action-card:hover {
  border-color: #2563eb;
  background-color: #0f172a;
}

.action-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.action-card:hover .action-card__icon {
  background-color: #eff6ff;
  color: #2563eb;
}

:root.dark .action-card__icon {
  background-color: #1f2937;
  color: #9ca3af;
}

:root.dark .action-card:hover .action-card__icon {
  background-color: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
}

.action-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.action-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  transition: color 0.2s ease;
}

.action-card:hover .action-card__title {
  color: #2563eb;
}

:root.dark .action-card__title {
  color: white;
}

:root.dark .action-card:hover .action-card__title {
  color: #60a5fa;
}

.action-card__description {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

:root.dark .action-card__description {
  color: #9ca3af;
}

.action-card__arrow {
  width: 18px;
  height: 18px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.action-card:hover .action-card__arrow {
  color: #2563eb;
  transform: translateX(4px);
}

:root.dark .action-card__arrow {
  color: #4b5563;
}

:root.dark .action-card:hover .action-card__arrow {
  color: #60a5fa;
}
</style>
