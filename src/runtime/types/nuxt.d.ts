import type { CmsModuleOptions } from './index'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    cms?: Partial<CmsModuleOptions>
  }

  interface RuntimeConfig {
    cms: {
      database: {
        provider: 'sqlite' | 'postgresql'
        url?: string
        filename?: string
      }
      admin: {
        credentials?: {
          username: string
          password: string
        }
      }
      uploads: {
        path: string
        maxSize: number
        allowedTypes: string[]
      }
      jwtSecret: string
    }
  }

  interface PublicRuntimeConfig {
    cms: {
      adminPath: string
      adminEnabled: boolean
    }
  }
}

export {}
