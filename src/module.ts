import {
  defineNuxtModule,
  createResolver,
  addImports,
  addComponentsDir,
  addServerHandler,
  addRouteMiddleware,
  extendPages,
  addServerPlugin,
  installModule,
  useNuxt
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { defu } from 'defu'
import { existsSync } from 'fs'
import { join } from 'path'
import type { CmsModuleOptions, CmsConfig } from './runtime/types'

export type { CmsModuleOptions, CmsConfig }
export { defineCmsConfig } from './runtime/types'

/**
 * Load cms.config.ts from the project root using jiti (TypeScript support)
 */
async function loadCmsConfig(rootDir: string): Promise<CmsConfig | null> {
  const configPathTs = join(rootDir, 'cms.config.ts')
  const configPathJs = join(rootDir, 'cms.config.js')

  let finalPath: string | null = null

  console.log('[@neskeep/nuxt-cms] Looking for cms.config in:', rootDir)

  if (existsSync(configPathTs)) {
    console.log('[@neskeep/nuxt-cms] Found cms.config.ts')
    finalPath = configPathTs
  } else if (existsSync(configPathJs)) {
    console.log('[@neskeep/nuxt-cms] Found cms.config.js')
    finalPath = configPathJs
  }

  if (!finalPath) {
    console.warn('[@neskeep/nuxt-cms] No cms.config.ts or cms.config.js found. Collections and singletons will be empty.')
    return null
  }

  try {
    // Use jiti for TypeScript support (same as Nuxt uses internally)
    const { createJiti } = await import('jiti')
    const aliasPath = join(rootDir, 'node_modules/@neskeep/nuxt-cms/dist/runtime/types/config.js')
    console.log('[@neskeep/nuxt-cms] Using alias path:', aliasPath)
    const jiti = createJiti(rootDir, {
      interopDefault: true,
      // Map the module import to our types file which exports defineCmsConfig
      alias: {
        '@neskeep/nuxt-cms': aliasPath
      }
    })
    const configModule = await jiti.import(finalPath)
    const config = (configModule as any).default || configModule
    console.log('[@neskeep/nuxt-cms] Loaded config:', JSON.stringify({
      collections: config?.collections ? Object.keys(config.collections) : [],
      singletons: config?.singletons ? Object.keys(config.singletons) : [],
      locales: config?.locales,
      collectionsDetail: config?.collections
    }, null, 2))
    return config as CmsConfig
  } catch (error: any) {
    console.log('[@neskeep/nuxt-cms] First attempt failed:', error?.message)
    // Try without the alias as a fallback (maybe the user didn't use defineCmsConfig)
    try {
      const { createJiti } = await import('jiti')
      const jiti = createJiti(rootDir, { interopDefault: true })
      const configModule = await jiti.import(finalPath)
      const config = (configModule as any).default || configModule
      console.log('[@neskeep/nuxt-cms] Loaded config (fallback):', JSON.stringify({
        collections: config?.collections ? Object.keys(config.collections) : [],
        singletons: config?.singletons ? Object.keys(config.singletons) : [],
        locales: config?.locales
      }, null, 2))
      return config as CmsConfig
    } catch (fallbackError: any) {
      console.error('[@neskeep/nuxt-cms] Error loading cms.config:', fallbackError?.message || fallbackError)
      return null
    }
  }
}

const MODULE_NAME = '@neskeep/nuxt-cms'

const cmsModule: NuxtModule<CmsModuleOptions> = defineNuxtModule({
  meta: {
    name: MODULE_NAME,
    configKey: 'cms',
    compatibility: {
      nuxt: '>=3.16.0'
    }
  },

  defaults: {
    database: {
      provider: 'sqlite',
      filename: '.cms/data.db'
    },
    admin: {
      enabled: true,
      path: '/admin'
    },
    uploads: {
      path: '.cms/uploads',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'video/mp4',
        'video/webm'
      ]
    }
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Install Nuxt UI module (required for admin panel components)
    await installModule('@nuxt/ui')

    // Load cms.config.ts from project root
    const cmsConfig = await loadCmsConfig(nuxt.options.rootDir)

    // Merge options with defaults
    const moduleOptions = defu(options, {
      database: {
        provider: 'sqlite',
        filename: '.cms/data.db'
      },
      admin: {
        enabled: true,
        path: '/admin'
      },
      uploads: {
        path: '.cms/uploads',
        maxSize: 10 * 1024 * 1024,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
          'video/mp4',
          'video/webm'
        ]
      }
    }) as CmsModuleOptions

    // Normalize admin path
    if (!moduleOptions.admin.path.startsWith('/')) {
      moduleOptions.admin.path = '/' + moduleOptions.admin.path
    }

    // Set runtime config
    nuxt.options.runtimeConfig.cms = {
      database: moduleOptions.database,
      admin: {
        credentials: moduleOptions.admin.credentials
      },
      uploads: moduleOptions.uploads,
      jwtSecret: process.env.CMS_JWT_SECRET || 'change-this-secret-in-production',
      // Include CMS config (collections, singletons, locales)
      config: cmsConfig || {
        locales: ['en'],
        defaultLocale: 'en',
        collections: {},
        singletons: {}
      }
    }

    nuxt.options.runtimeConfig.public.cms = {
      adminPath: moduleOptions.admin.path,
      adminEnabled: moduleOptions.admin.enabled
    }

    // Add server plugin for database initialization
    addServerPlugin(resolver.resolve('./runtime/server/plugins/database'))

    // Add composables
    addImports([
      {
        name: 'useCms',
        from: resolver.resolve('./runtime/composables/useCms')
      },
      {
        name: 'useCmsCollection',
        from: resolver.resolve('./runtime/composables/useCmsCollection')
      },
      {
        name: 'useCmsSingleton',
        from: resolver.resolve('./runtime/composables/useCmsSingleton')
      },
      {
        name: 'useCmsMedia',
        from: resolver.resolve('./runtime/composables/useCmsMedia')
      },
      {
        name: 'useCmsAdmin',
        from: resolver.resolve('./runtime/composables/useCmsAdmin')
      },
      {
        name: 'defineCmsConfig',
        from: resolver.resolve('./runtime/types/config')
      }
    ])

    // Add field components with Cms prefix
    addComponentsDir({
      path: resolver.resolve('./runtime/components/fields'),
      prefix: 'CmsField',
      global: true
    })

    // Add admin components with Cms prefix
    addComponentsDir({
      path: resolver.resolve('./runtime/components/admin'),
      prefix: 'CmsAdmin',
      global: true
    })

    // Add list components
    addComponentsDir({
      path: resolver.resolve('./runtime/components/list'),
      prefix: 'CmsList',
      global: true
    })

    // Add form components (prefix 'Cms' so Form.vue becomes CmsForm)
    addComponentsDir({
      path: resolver.resolve('./runtime/components/form'),
      prefix: 'Cms',
      global: true
    })

    // Add media components
    addComponentsDir({
      path: resolver.resolve('./runtime/components/media'),
      prefix: 'CmsMedia',
      global: true
    })

    // Add layout components (PageHeader, FormCard, ConfirmModal, Alert)
    addComponentsDir({
      path: resolver.resolve('./runtime/components/layout'),
      prefix: 'Cms',
      global: true
    })

    // Add global CMS button styles
    nuxt.options.css.push(resolver.resolve('./runtime/assets/cms-buttons.css'))

    // Add API routes
    addServerHandler({
      route: '/api/cms/auth/login',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/cms/auth/login.post')
    })

    addServerHandler({
      route: '/api/cms/auth/logout',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/cms/auth/logout.post')
    })

    addServerHandler({
      route: '/api/cms/auth/me',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/auth/me.get')
    })

    addServerHandler({
      route: '/api/cms/schema',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/schema.get')
    })

    // Collections API
    addServerHandler({
      route: '/api/cms/collections',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/collections/index.get')
    })

    addServerHandler({
      route: '/api/cms/collections/:name',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/collections/[name]/index.get')
    })

    addServerHandler({
      route: '/api/cms/collections/:name',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/cms/collections/[name]/index.post')
    })

    addServerHandler({
      route: '/api/cms/collections/:name/:id',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/collections/[name]/[id]/index.get')
    })

    addServerHandler({
      route: '/api/cms/collections/:name/:id',
      method: 'put',
      handler: resolver.resolve('./runtime/server/api/cms/collections/[name]/[id]/index.put')
    })

    addServerHandler({
      route: '/api/cms/collections/:name/:id',
      method: 'delete',
      handler: resolver.resolve('./runtime/server/api/cms/collections/[name]/[id]/index.delete')
    })

    // Singletons API
    addServerHandler({
      route: '/api/cms/singletons',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/singletons/index.get')
    })

    addServerHandler({
      route: '/api/cms/singletons/:name',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/singletons/[name]/index.get')
    })

    addServerHandler({
      route: '/api/cms/singletons/:name',
      method: 'put',
      handler: resolver.resolve('./runtime/server/api/cms/singletons/[name]/index.put')
    })

    // Media API
    addServerHandler({
      route: '/api/cms/media',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/media/index.get')
    })

    addServerHandler({
      route: '/api/cms/media/upload',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/cms/media/upload.post')
    })

    addServerHandler({
      route: '/api/cms/media/:id',
      method: 'delete',
      handler: resolver.resolve('./runtime/server/api/cms/media/[id].delete')
    })

    addServerHandler({
      route: '/api/cms/media/file/:filename',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/cms/media/file/[filename].get')
    })

    // Add admin pages if enabled
    if (moduleOptions.admin.enabled) {
      const adminPath = moduleOptions.admin.path

      extendPages((pages) => {
        // Admin layout/index
        pages.push({
          name: 'cms-admin',
          path: adminPath,
          file: resolver.resolve('./runtime/pages/admin/index.vue')
        })

        // Login page
        pages.push({
          name: 'cms-admin-login',
          path: `${adminPath}/login`,
          file: resolver.resolve('./runtime/pages/admin/login.vue')
        })

        // Collections list
        pages.push({
          name: 'cms-admin-collections',
          path: `${adminPath}/collections`,
          file: resolver.resolve('./runtime/pages/admin/collections/index.vue')
        })

        // Collection items list
        pages.push({
          name: 'cms-admin-collection',
          path: `${adminPath}/collections/:name`,
          file: resolver.resolve('./runtime/pages/admin/collections/[name]/index.vue')
        })

        // New collection item
        pages.push({
          name: 'cms-admin-collection-new',
          path: `${adminPath}/collections/:name/new`,
          file: resolver.resolve('./runtime/pages/admin/collections/[name]/new.vue')
        })

        // Edit collection item
        pages.push({
          name: 'cms-admin-collection-edit',
          path: `${adminPath}/collections/:name/:id`,
          file: resolver.resolve('./runtime/pages/admin/collections/[name]/[id].vue')
        })

        // Singletons list
        pages.push({
          name: 'cms-admin-singletons',
          path: `${adminPath}/singletons`,
          file: resolver.resolve('./runtime/pages/admin/singletons/index.vue')
        })

        // Edit singleton
        pages.push({
          name: 'cms-admin-singleton',
          path: `${adminPath}/singletons/:name`,
          file: resolver.resolve('./runtime/pages/admin/singletons/[name].vue')
        })

        // Media library
        pages.push({
          name: 'cms-admin-media',
          path: `${adminPath}/media`,
          file: resolver.resolve('./runtime/pages/admin/media.vue')
        })
      })

      // Add admin auth middleware
      addRouteMiddleware({
        name: 'cms-auth',
        path: resolver.resolve('./runtime/middleware/cms-auth'),
        global: false
      })
    }

    // Log initialization
    console.log(`[${MODULE_NAME}] Module initialized`)
    console.log(`[${MODULE_NAME}] Database: ${moduleOptions.database.provider}`)
    if (moduleOptions.admin.enabled) {
      console.log(`[${MODULE_NAME}] Admin panel: ${moduleOptions.admin.path}`)
    }
  }
})

export default cmsModule

