<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRuntimeConfig, useRoute } from '#imports'
import { useCmsAdmin } from '../../composables/useCmsAdmin'
import { useCmsI18n } from '../../composables/useCmsI18n'

const { user, logout, checkAuth } = useCmsAdmin()
const config = useRuntimeConfig()
const route = useRoute()
const { t, init } = useCmsI18n()
const branding = computed(() => config.public.cms.branding || {})

// Initialize locale from user preference
onMounted(async () => {
  // Refresh user data to get latest locale
  await checkAuth()

  if (user.value?.locale) {
    init(user.value.locale)
  }
})

// Watch for user locale changes and update i18n
watch(() => user.value?.locale, (newLocale) => {
  if (newLocale) {
    init(newLocale)
  }
})

// CSS variables for primary color
const primaryColorStyle = computed(() => {
  const color = branding.value.primaryColor || '#2563eb'
  return {
    '--cms-primary': color,
    '--cms-primary-hover': adjustColor(color, -15),
    '--cms-primary-dark': adjustColor(color, -25),
    '--cms-primary-light': adjustColor(color, 40)
  }
})

// Helper to darken/lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Mobile sidebar state
const sidebarOpen = ref(false)

// User dropdown state
const userDropdownOpen = ref(false)

const navigation = computed(() => [
  {
    label: t('nav.dashboard'),
    icon: 'i-heroicons-squares-2x2',
    to: config.public.cms.adminPath
  },
  {
    label: t('nav.collections'),
    icon: 'i-heroicons-rectangle-stack',
    to: `${config.public.cms.adminPath}/collections`
  },
  {
    label: t('nav.singletons'),
    icon: 'i-heroicons-document-text',
    to: `${config.public.cms.adminPath}/singletons`
  },
  {
    label: t('nav.media'),
    icon: 'i-heroicons-photo',
    to: `${config.public.cms.adminPath}/media`
  },
  {
    label: t('nav.users'),
    icon: 'i-heroicons-users',
    to: `${config.public.cms.adminPath}/users`
  },
  {
    label: t('nav.roles'),
    icon: 'i-heroicons-shield-check',
    to: `${config.public.cms.adminPath}/roles`
  }
])

function isActive(path: string): boolean {
  if (path === config.public.cms.adminPath) {
    return route.path === path
  }
  return route.path.startsWith(path)
}

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="cms-layout" :style="primaryColorStyle">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="cms-overlay"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside class="cms-sidebar" :class="{ 'cms-sidebar--open': sidebarOpen }">
      <!-- Logo -->
      <div class="cms-sidebar__header">
        <div class="cms-logo">
          <!-- Custom logo image -->
          <template v-if="branding.logo">
            <img :src="branding.logo" :alt="branding.name || 'CMS'" class="cms-logo__img" />
          </template>
          <!-- Default icon + text -->
          <template v-else>
            <div class="cms-logo__icon">
              <UIcon name="i-heroicons-cube" class="cms-logo__svg" />
            </div>
            <span class="cms-logo__text">{{ branding.name || 'CMS' }}</span>
          </template>
        </div>
        <!-- Mobile close button -->
        <button class="cms-sidebar__close" @click="sidebarOpen = false">
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="cms-nav">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="cms-nav__item"
          :class="{ 'cms-nav__item--active': isActive(item.to) }"
        >
          <UIcon :name="item.icon" class="cms-nav__icon" />
          <span class="cms-nav__label">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- User section -->
      <div class="cms-user" v-if="user">
        <button class="cms-user__profile" @click="userDropdownOpen = !userDropdownOpen">
          <div class="cms-user__avatar-wrap">
            <img v-if="user.avatar" :src="user.avatar" :alt="user.username" class="cms-user__avatar-img" />
            <span v-else>{{ user.username?.charAt(0).toUpperCase() || 'U' }}</span>
          </div>
          <div class="cms-user__info">
            <span class="cms-user__name">@{{ user.username }}</span>
            <span class="cms-user__role">{{ user.roleName || user.role || 'User' }}</span>
          </div>
          <UIcon name="i-heroicons-chevron-up" class="cms-user__chevron" :class="{ 'cms-user__chevron--open': userDropdownOpen }" />
        </button>

        <!-- Dropdown menu -->
        <Transition name="dropdown">
          <div v-if="userDropdownOpen" class="cms-user__dropdown">
            <NuxtLink :to="`${config.public.cms.adminPath}/users/${user.id}`" class="cms-user__dropdown-item" @click="userDropdownOpen = false">
              <UIcon name="i-heroicons-user" class="cms-user__dropdown-icon" />
              {{ t('common.profile') }}
            </NuxtLink>
            <button class="cms-user__dropdown-item cms-user__dropdown-item--logout" @click="logout">
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="cms-user__dropdown-icon" />
              {{ t('common.logout') }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- Footer -->
      <div class="cms-footer">
        <a
          v-if="branding.poweredBy?.url"
          :href="branding.poweredBy.url"
          target="_blank"
          rel="noopener noreferrer"
          class="cms-footer__link"
        >
          {{ branding.poweredBy?.name || 'Neskeep' }}
        </a>
        <span v-else class="cms-footer__text">
          {{ branding.poweredBy?.name || 'Neskeep' }}
        </span>
      </div>
    </aside>

    <!-- Main area -->
    <div class="cms-main">
      <!-- Top bar (mobile) -->
      <header class="cms-topbar">
        <button class="cms-topbar__menu" @click="sidebarOpen = true">
          <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
        </button>
        <div class="cms-topbar__logo">
          <!-- Custom logo image -->
          <template v-if="branding.logo">
            <img :src="branding.logo" :alt="branding.name || 'CMS'" class="cms-logo__img cms-logo__img--small" />
          </template>
          <!-- Default icon + text -->
          <template v-else>
            <div class="cms-logo__icon cms-logo__icon--small">
              <UIcon name="i-heroicons-cube" class="w-4 h-4 text-white" />
            </div>
            <span class="cms-logo__text">{{ branding.name || 'CMS' }}</span>
          </template>
        </div>
        <div class="cms-topbar__spacer" />
      </header>

      <!-- Content -->
      <main class="cms-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   CMS Admin Layout - Modern Minimal Design
   Scoped styles to avoid conflicts with host app
   ============================================ */

/* Layout Container - using direct colors for isolation */
.cms-layout {
  --cms-sidebar-width: 260px;
  --cms-topbar-height: 64px;
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb !important;
}

.cms-layout.dark {
  background-color: #030712 !important;
}

/* Mobile Overlay */
.cms-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5) !important;
  z-index: 40;
  backdrop-filter: blur(4px);
}

@media (min-width: 1024px) {
  .cms-overlay {
    display: none;
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================
   Sidebar
   ============================================ */
.cms-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--cms-sidebar-width);
  background-color: #ffffff !important;
  border-right: 1px solid #e5e7eb !important;
  display: flex;
  flex-direction: column;
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cms-sidebar--open {
  transform: translateX(0);
}

@media (min-width: 1024px) {
  .cms-sidebar {
    transform: translateX(0);
  }
}

/* Sidebar Header */
.cms-sidebar__header {
  height: var(--cms-topbar-height);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb !important;
  flex-shrink: 0;
}

.cms-sidebar__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: #6b7280 !important;
  transition: all 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;
}

.cms-sidebar__close:hover {
  background-color: #f3f4f6 !important;
  color: #374151 !important;
}

@media (min-width: 1024px) {
  .cms-sidebar__close {
    display: none;
  }
}

/* Logo */
.cms-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cms-logo__icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--cms-primary, #2563eb) 0%, var(--cms-primary-hover, #1d4ed8) 100%) !important;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.cms-logo__icon--small {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.cms-logo__img {
  height: 36px;
  max-width: 140px;
  width: auto;
  object-fit: contain;
  display: block;
}

.cms-logo__img--small {
  height: 28px;
  max-width: 100px;
  width: auto;
}

.cms-logo__svg {
  width: 20px;
  height: 20px;
  color: #ffffff !important;
}

.cms-logo__text {
  font-size: 18px;
  font-weight: 700;
  color: #111827 !important;
  letter-spacing: -0.02em;
}

/* Navigation */
.cms-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.cms-nav__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563 !important;
  text-decoration: none !important;
  transition: all 0.15s ease;
}

.cms-nav__item:hover {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}

.cms-nav__item--active {
  background-color: var(--cms-primary, #2563eb) !important;
  color: #ffffff !important;
}

.cms-nav__item--active:hover {
  background-color: var(--cms-primary-hover, #1d4ed8) !important;
  color: #ffffff !important;
}

.cms-nav__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.cms-nav__label {
  flex: 1;
}

/* User Section */
.cms-user {
  padding: 12px;
  border-top: 1px solid #e5e7eb !important;
  flex-shrink: 0;
  position: relative;
}

.cms-user__profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cms-user__profile:hover {
  background-color: #f3f4f6 !important;
}

.cms-user__avatar-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cms-primary, #2563eb) 0%, var(--cms-primary-hover, #1d4ed8) 100%) !important;
  color: white !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.cms-user__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-user__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.cms-user__name {
  font-size: 14px;
  font-weight: 500;
  color: #111827 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-user__role {
  font-size: 12px;
  color: #6b7280 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-user__chevron {
  width: 16px;
  height: 16px;
  color: #9ca3af !important;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.cms-user__chevron--open {
  transform: rotate(180deg);
}

/* User Dropdown */
.cms-user__dropdown {
  position: absolute;
  bottom: 100%;
  left: 12px;
  right: 12px;
  margin-bottom: 8px;
  background: white !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
}

.cms-user__dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  width: 100%;
  background: transparent;
  border: none;
  color: #374151 !important;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none !important;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cms-user__dropdown-item:hover {
  background-color: #f3f4f6 !important;
}

.cms-user__dropdown-item--logout {
  color: #dc2626 !important;
  border-top: 1px solid #e5e7eb !important;
}

.cms-user__dropdown-item--logout:hover {
  background-color: #fef2f2 !important;
}

.cms-user__dropdown-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Footer */
.cms-footer {
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid #e5e7eb !important;
  flex-shrink: 0;
}

.cms-footer__link,
.cms-footer__text {
  font-size: 12px;
  color: #9ca3af !important;
  text-decoration: none !important;
  transition: color 0.15s ease;
}

.cms-footer__link:hover {
  color: var(--cms-primary, #2563eb) !important;
}

/* ============================================
   Main Content Area
   ============================================ */
.cms-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

@media (min-width: 1024px) {
  .cms-main {
    margin-left: var(--cms-sidebar-width);
  }
}

/* Top Bar (Mobile) */
.cms-topbar {
  height: var(--cms-topbar-height);
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: #ffffff !important;
  border-bottom: 1px solid #e5e7eb !important;
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .cms-topbar {
    display: none;
  }
}

.cms-topbar__menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #4b5563 !important;
  transition: all 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;
}

.cms-topbar__menu:hover {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}

.cms-topbar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cms-topbar__spacer {
  flex: 1;
}

/* Content */
.cms-content {
  flex: 1;
  padding: 24px 16px;
}

@media (min-width: 640px) {
  .cms-content {
    padding: 32px 24px;
  }
}

@media (min-width: 1024px) {
  .cms-content {
    padding: 32px 40px;
  }
}

@media (min-width: 1280px) {
  .cms-content {
    padding: 40px 48px;
    max-width: 1400px;
  }
}
</style>
