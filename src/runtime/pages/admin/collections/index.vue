<script setup lang="ts">
import { computed } from 'vue'
import { definePageMeta, useRuntimeConfig, useFetch } from '#imports'

definePageMeta({
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()

// Icon mapping for collections
const iconMap: Record<string, string> = {
  posts: 'i-heroicons-newspaper',
  pages: 'i-heroicons-document',
  categories: 'i-heroicons-tag',
  team: 'i-heroicons-users',
  products: 'i-heroicons-shopping-bag',
  default: 'i-heroicons-folder'
}

// Fetch schema to get collections list
const { data: schema } = await useFetch('/api/cms/schema')

const collections = computed(() => {
  if (!schema.value?.collections) return []
  return Object.entries(schema.value.collections).map(([key, value]: [string, any]) => ({
    key,
    label: value.label || key,
    labelPlural: value.labelPlural || `${value.label || key}s`,
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
          <h1 class="page__title">Collections</h1>
          <p class="page__subtitle">Manage your content collections</p>
        </div>
      </div>

      <!-- Collections grid -->
      <div v-if="collections.length > 0" class="card-grid">
        <NuxtLink
          v-for="collection in collections"
          :key="collection.key"
          :to="`${config.public.cms.adminPath}/collections/${collection.key}`"
          class="item-card"
        >
          <div class="item-card__icon">
            <UIcon :name="collection.icon" class="w-6 h-6" />
          </div>
          <div class="item-card__content">
            <span class="item-card__title">{{ collection.labelPlural }}</span>
            <span v-if="collection.description" class="item-card__description">
              {{ collection.description }}
            </span>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="item-card__arrow" />
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-state__icon">
          <UIcon name="i-heroicons-inbox" class="w-8 h-8" />
        </div>
        <h3 class="empty-state__title">No collections configured</h3>
        <p class="empty-state__text">
          Define your collections in <code class="empty-state__code">cms.config.ts</code>
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

:root.dark .page__title {
  color: white;
}

.page__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 4px;
}

:root.dark .page__subtitle {
  color: #9ca3af;
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
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:root.dark .item-card {
  background-color: #111827;
  border-color: #1f2937;
}

:root.dark .item-card:hover {
  border-color: #2563eb;
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
  background-color: #eff6ff;
  color: #2563eb;
}

:root.dark .item-card__icon {
  background-color: #1f2937;
  color: #9ca3af;
}

:root.dark .item-card:hover .item-card__icon {
  background-color: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
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
  color: #2563eb;
}

:root.dark .item-card__title {
  color: white;
}

:root.dark .item-card:hover .item-card__title {
  color: #60a5fa;
}

.item-card__description {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:root.dark .item-card__description {
  color: #9ca3af;
}

.item-card__arrow {
  width: 20px;
  height: 20px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.item-card:hover .item-card__arrow {
  color: #2563eb;
  transform: translateX(4px);
}

:root.dark .item-card__arrow {
  color: #4b5563;
}

:root.dark .item-card:hover .item-card__arrow {
  color: #60a5fa;
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

:root.dark .empty-state {
  background-color: #111827;
  border-color: #1f2937;
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

:root.dark .empty-state__icon {
  background-color: #1f2937;
  color: #6b7280;
}

.empty-state__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

:root.dark .empty-state__title {
  color: white;
}

.empty-state__text {
  font-size: 14px;
  color: #6b7280;
  max-width: 320px;
}

:root.dark .empty-state__text {
  color: #9ca3af;
}

.empty-state__code {
  padding: 2px 8px;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-size: 13px;
  font-family: ui-monospace, monospace;
}

:root.dark .empty-state__code {
  background-color: #1f2937;
}
</style>
