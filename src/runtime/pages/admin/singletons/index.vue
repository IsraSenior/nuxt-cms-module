<script setup lang="ts">
import { computed } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch } from '#imports'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()

// Icon mapping for singletons
const iconMap: Record<string, string> = {
  homepage: 'i-heroicons-home',
  settings: 'i-heroicons-cog-6-tooth',
  about: 'i-heroicons-information-circle',
  contact: 'i-heroicons-envelope',
  default: 'i-heroicons-document-text'
}

// Fetch schema to get singletons list
const { data: schema } = await useFetch('/api/cms/schema')

const singletons = computed(() => {
  if (!schema.value?.singletons) return []
  return Object.entries(schema.value.singletons).map(([key, value]: [string, any]) => ({
    key,
    label: value.label || key,
    icon: iconMap[key] || iconMap.default,
    description: value.description
  }))
})
</script>

<template>
  <CmsAdminLayout>
    <div class="page">
      <!-- Header -->
      <div class="page__header">
        <div>
          <h1 class="page__title">Singletons</h1>
          <p class="page__subtitle">Manage single-instance content pages</p>
        </div>
      </div>

      <!-- Singletons grid -->
      <div v-if="singletons.length > 0" class="card-grid">
        <NuxtLink
          v-for="singleton in singletons"
          :key="singleton.key"
          :to="`${config.public.cms.adminPath}/singletons/${singleton.key}`"
          class="item-card"
        >
          <div class="item-card__icon">
            <UIcon :name="singleton.icon" class="w-6 h-6" />
          </div>
          <div class="item-card__content">
            <span class="item-card__title">{{ singleton.label }}</span>
            <span v-if="singleton.description" class="item-card__description">
              {{ singleton.description }}
            </span>
          </div>
          <UIcon name="i-heroicons-pencil-square" class="item-card__arrow" />
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-state__icon">
          <UIcon name="i-heroicons-inbox" class="w-8 h-8" />
        </div>
        <h3 class="empty-state__title">No singletons configured</h3>
        <p class="empty-state__text">
          Define your singletons in <code class="empty-state__code">cms.config.ts</code>
        </p>
      </div>
    </div>
  </CmsAdminLayout>
</template>

<style>
/* Page Styles */
.page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.page__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

.page__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Item Card */
.item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.item-card:hover {
  border-color: var(--cms-primary, #2563eb);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.item-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.item-card:hover .item-card__icon {
  background-color: var(--cms-primary-light, #eff6ff);
  color: var(--cms-primary, #2563eb);
}

.item-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  transition: color 0.2s ease;
}

.item-card:hover .item-card__title {
  color: var(--cms-primary, #2563eb);
}

.item-card__description {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-card__arrow {
  width: 20px;
  height: 20px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.item-card:hover .item-card__arrow {
  color: var(--cms-primary, #2563eb);
  transform: translateX(4px);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  text-align: center;
}

.empty-state__icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  margin-bottom: 20px;
}

.empty-state__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.empty-state__text {
  font-size: 14px;
  color: #6b7280;
  max-width: 320px;
}

.empty-state__code {
  padding: 2px 8px;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-size: 13px;
  font-family: ui-monospace, monospace;
}

</style>
