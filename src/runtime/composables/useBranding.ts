import { ref, computed } from 'vue'
import { useRuntimeConfig } from '#imports'
import type { BrandingConfig } from '../types'

const brandingState = ref<BrandingConfig | null>(null)
const isLoaded = ref(false)

export function useBranding() {
  const config = useRuntimeConfig()

  // Initialize from runtime config if not loaded
  if (!isLoaded.value) {
    brandingState.value = config.public.cms.branding || {}
    isLoaded.value = true
  }

  const branding = computed(() => brandingState.value || {})

  // Update branding (call this after saving)
  async function refreshBranding() {
    try {
      const response = await fetch('/api/cms/settings/branding', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        brandingState.value = data
      }
    } catch (error) {
      console.error('Failed to refresh branding:', error)
    }
  }

  // Update branding without fetching (for immediate preview)
  function updateBranding(newBranding: Partial<BrandingConfig>) {
    brandingState.value = {
      ...brandingState.value,
      ...newBranding
    }
  }

  return {
    branding,
    refreshBranding,
    updateBranding
  }
}
