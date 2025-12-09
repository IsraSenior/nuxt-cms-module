#!/usr/bin/env node

/**
 * Post-install script for @neskeep/nuxt-cms
 * Automatically configures the module in the user's nuxt.config.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Find the project root (where the user installed the package)
function findProjectRoot() {
  let dir = process.cwd()

  // If we're in node_modules, go up to find the project root
  if (dir.includes('node_modules')) {
    dir = dir.split('node_modules')[0]
  }

  // Also check common paths
  const possiblePaths = [
    dir,
    join(dir, '..', '..', '..'), // node_modules/@neskeep/nuxt-cms -> project
    join(dir, '..', '..'),
  ]

  for (const path of possiblePaths) {
    if (existsSync(join(path, 'nuxt.config.ts')) || existsSync(join(path, 'nuxt.config.js'))) {
      return path
    }
    if (existsSync(join(path, 'package.json'))) {
      try {
        const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8'))
        if (pkg.dependencies?.nuxt || pkg.devDependencies?.nuxt) {
          return path
        }
      } catch {}
    }
  }

  return dir
}

// Default CMS configuration
const DEFAULT_CMS_CONFIG = `
  cms: {
    database: {
      provider: 'sqlite',
      filename: '.cms/data.db'
    },
    admin: {
      enabled: true,
      path: '/admin',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    }
  }`

// Default cms.config.ts content
const CMS_CONFIG_TEMPLATE = `import { defineCmsConfig } from '@neskeep/nuxt-cms'

export default defineCmsConfig({
  locales: ['en'],
  defaultLocale: 'en',

  collections: {
    // Example collection - customize as needed
    posts: {
      label: 'Post',
      labelPlural: 'Posts',
      icon: 'DocumentTextIcon',
      titleField: 'title',
      slugField: 'slug',
      fields: {
        title: {
          type: 'text',
          label: 'Title',
          required: true,
          translatable: true
        },
        slug: {
          type: 'slug',
          label: 'Slug',
          from: 'title'
        },
        content: {
          type: 'richtext',
          label: 'Content',
          translatable: true
        },
        featuredImage: {
          type: 'image',
          label: 'Featured Image'
        },
        publishedAt: {
          type: 'datetime',
          label: 'Publish Date'
        }
      }
    }
  },

  singletons: {
    // Example singleton - customize as needed
    settings: {
      label: 'Site Settings',
      icon: 'CogIcon',
      fields: {
        siteName: {
          type: 'text',
          label: 'Site Name',
          required: true
        },
        description: {
          type: 'textarea',
          label: 'Site Description',
          translatable: true
        }
      }
    }
  }
})
`

function main() {
  // Skip if running in CI or during module development
  if (process.env.CI || process.env.NUXT_CMS_SKIP_POSTINSTALL) {
    console.log('[@neskeep/nuxt-cms] Skipping postinstall in CI environment')
    return
  }

  const projectRoot = findProjectRoot()

  // Check if this is a Nuxt project
  const nuxtConfigTs = join(projectRoot, 'nuxt.config.ts')
  const nuxtConfigJs = join(projectRoot, 'nuxt.config.js')
  const hasNuxtConfig = existsSync(nuxtConfigTs) || existsSync(nuxtConfigJs)

  if (!hasNuxtConfig) {
    console.log('[@neskeep/nuxt-cms] No nuxt.config found. Please add the module manually.')
    console.log('[@neskeep/nuxt-cms] See: https://github.com/IsraSenior/nuxt-cms-module#quick-start')
    return
  }

  const configPath = existsSync(nuxtConfigTs) ? nuxtConfigTs : nuxtConfigJs
  const configContent = readFileSync(configPath, 'utf-8')

  // Check if module is already configured
  if (configContent.includes('@neskeep/nuxt-cms') || configContent.includes("'@neskeep/nuxt-cms'")) {
    console.log('[@neskeep/nuxt-cms] Module already configured in nuxt.config')
    return
  }

  let updated = false
  let newContent = configContent

  // Add module to modules array
  if (configContent.includes('modules:')) {
    // Modules array exists - add to it
    newContent = newContent.replace(
      /modules:\s*\[/,
      "modules: [\n    '@neskeep/nuxt-cms',"
    )
    updated = true
  } else if (configContent.includes('defineNuxtConfig')) {
    // No modules array - add it
    newContent = newContent.replace(
      /defineNuxtConfig\s*\(\s*\{/,
      "defineNuxtConfig({\n  modules: ['@neskeep/nuxt-cms'],\n"
    )
    updated = true
  }

  // Add cms configuration if not present
  if (updated && !configContent.includes('cms:')) {
    // Find a good place to add the cms config
    // Try to add before the closing of defineNuxtConfig
    const insertPosition = newContent.lastIndexOf('})')
    if (insertPosition > 0) {
      // Check if we need a comma before
      const beforeInsert = newContent.substring(0, insertPosition).trim()
      const needsComma = !beforeInsert.endsWith(',') && !beforeInsert.endsWith('{')

      newContent = newContent.substring(0, insertPosition) +
        (needsComma ? ',' : '') +
        DEFAULT_CMS_CONFIG + '\n' +
        newContent.substring(insertPosition)
    }
  }

  if (updated) {
    writeFileSync(configPath, newContent)
    console.log('[@neskeep/nuxt-cms] Added module to nuxt.config')
    console.log('[@neskeep/nuxt-cms] Added default CMS configuration')
  }

  // Create cms.config.ts if it doesn't exist
  const cmsConfigPath = join(projectRoot, 'cms.config.ts')
  if (!existsSync(cmsConfigPath)) {
    writeFileSync(cmsConfigPath, CMS_CONFIG_TEMPLATE)
    console.log('[@neskeep/nuxt-cms] Created cms.config.ts with example configuration')
  }

  console.log('')
  console.log('[@neskeep/nuxt-cms] Setup complete!')
  console.log('')
  console.log('  Next steps:')
  console.log('  1. Review and customize cms.config.ts')
  console.log('  2. Update admin credentials in nuxt.config.ts')
  console.log('  3. Run your Nuxt app and go to /admin')
  console.log('')
  console.log('  Docs: https://github.com/IsraSenior/nuxt-cms-module')
  console.log('')
}

main()
