<script setup lang="ts">
import { computed } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch } from '#imports'
import { useCmsAdmin } from '../../composables/useCmsAdmin'
import { useCmsI18n } from '../../composables/useCmsI18n'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const { user } = useCmsAdmin()
const config = useRuntimeConfig()
const { t } = useCmsI18n()

// Fetch schema to get actual counts
const { data: schema } = await useFetch('/api/cms/schema')

// Fetch media to get count
const { data: media } = await useFetch<{ data: unknown[], meta: { total: number } }>('/api/cms/media')

const collectionsCount = computed(() => {
  return schema.value?.collections ? Object.keys(schema.value.collections).length : 0
})

const singletonsCount = computed(() => {
  return schema.value?.singletons ? Object.keys(schema.value.singletons).length : 0
})

const mediaCount = computed(() => {
  return media.value?.meta?.total || media.value?.data?.length || 0
})

</script>

<template>
  <CmsAdminLayout>
    <div class="dashboard">
      <!-- Header -->
      <div class="dashboard__header">
        <div>
          <h1 class="dashboard__title">{{ t('dashboard.title') }}</h1>
          <p class="dashboard__subtitle">{{ t('dashboard.welcome', { name: user?.username || '' }) }}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="dashboard__stats">
        <!-- Collections -->
        <NuxtLink :to="`${config.public.cms.adminPath}/collections`" class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ collectionsCount }}</span>
            <span class="stat-card__label">{{ t('dashboard.stats.collections') }}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="stat-card__arrow">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>

        <!-- Singletons -->
        <NuxtLink :to="`${config.public.cms.adminPath}/singletons`" class="stat-card">
          <div class="stat-card__icon stat-card__icon--emerald">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ singletonsCount }}</span>
            <span class="stat-card__label">{{ t('dashboard.stats.singletons') }}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="stat-card__arrow">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>

        <!-- Media Files -->
        <NuxtLink :to="`${config.public.cms.adminPath}/media`" class="stat-card">
          <div class="stat-card__icon stat-card__icon--violet">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__value">{{ mediaCount }}</span>
            <span class="stat-card__label">{{ t('dashboard.stats.media') }}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="stat-card__arrow">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>

      <!-- Quick Actions -->
      <div class="dashboard__section">
        <h2 class="dashboard__section-title">{{ t('dashboard.quickActions') }}</h2>
        <div class="dashboard__actions">
          <!-- Collections -->
          <NuxtLink :to="`${config.public.cms.adminPath}/collections`" class="action-card">
            <div class="action-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
              </svg>
            </div>
            <div class="action-card__content">
              <span class="action-card__title">{{ t('nav.collections') }}</span>
              <span class="action-card__description">{{ t('collections.title') }}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="action-card__arrow">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </NuxtLink>

          <!-- Singletons -->
          <NuxtLink :to="`${config.public.cms.adminPath}/singletons`" class="action-card">
            <div class="action-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <div class="action-card__content">
              <span class="action-card__title">{{ t('nav.singletons') }}</span>
              <span class="action-card__description">{{ t('singletons.editSingleInstance') }}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="action-card__arrow">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </NuxtLink>

          <!-- Media Library -->
          <NuxtLink :to="`${config.public.cms.adminPath}/media`" class="action-card">
            <div class="action-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div class="action-card__content">
              <span class="action-card__title">{{ t('media.title') }}</span>
              <span class="action-card__description">{{ t('media.subtitle') }}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="action-card__arrow">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style>
/* Utility classes for SVG sizes */
.w-5 { width: 20px; }
.h-5 { height: 20px; }
.w-6 { width: 24px; }
.h-6 { height: 24px; }

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

.dashboard__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
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
  background-color: var(--cms-primary-light, #eff6ff);
  color: var(--cms-primary, #2563eb);
}

.stat-card__icon--emerald {
  background-color: #ecfdf5;
  color: #059669;
}

.stat-card__icon--violet {
  background-color: #f5f3ff;
  color: #7c3aed;
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

.stat-card__label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
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
  border-color: var(--cms-primary, #2563eb);
  background-color: #fafafa;
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
  background-color: var(--cms-primary, #2563eb);
  color: white;
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
  color: var(--cms-primary, #2563eb);
}

.action-card__description {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.action-card__arrow {
  width: 18px;
  height: 18px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.action-card:hover .action-card__arrow {
  color: var(--cms-primary, #2563eb);
  transform: translateX(4px);
}

</style>
