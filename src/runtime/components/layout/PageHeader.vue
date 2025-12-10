<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  status?: 'draft' | 'published' | 'archived'
}

defineProps<Props>()
</script>

<template>
  <div class="cms-page-header">
    <div class="cms-page-header__left">
      <!-- Breadcrumbs -->
      <nav v-if="breadcrumbs && breadcrumbs.length" class="cms-breadcrumb">
        <template v-for="(item, index) in breadcrumbs" :key="index">
          <NuxtLink
            v-if="item.to"
            :to="item.to"
            class="cms-breadcrumb__link"
          >
            {{ item.label }}
          </NuxtLink>
          <span v-else class="cms-breadcrumb__current">{{ item.label }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="cms-breadcrumb__separator">›</span>
        </template>
      </nav>

      <!-- Title row -->
      <div class="cms-page-header__title-row">
        <h1 class="cms-page-header__title">{{ title }}</h1>
        <span v-if="status" class="cms-status-badge" :class="`cms-status-badge--${status}`">
          {{ status }}
        </span>
        <slot name="title-suffix" />
      </div>

      <!-- Subtitle -->
      <p v-if="subtitle" class="cms-page-header__subtitle">{{ subtitle }}</p>
    </div>

    <!-- Actions slot -->
    <div v-if="$slots.actions" class="cms-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style>
/* Page Header */
.cms-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.cms-page-header__left {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cms-page-header__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cms-page-header__title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  margin: 0;
}

.cms-page-header__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.cms-page-header__actions {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

/* Breadcrumb */
.cms-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.cms-breadcrumb__link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.15s ease;
}

.cms-breadcrumb__link:hover {
  color: #374151;
}

.cms-breadcrumb__separator {
  color: #9ca3af;
  font-size: 16px;
}

.cms-breadcrumb__current {
  color: #111827;
  font-weight: 500;
}

/* Status Badge */
.cms-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.cms-status-badge--published {
  background-color: #dcfce7;
  color: #166534;
}

.cms-status-badge--draft {
  background-color: #fef3c7;
  color: #92400e;
}

.cms-status-badge--archived {
  background-color: #f3f4f6;
  color: #4b5563;
}
</style>
