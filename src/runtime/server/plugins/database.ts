import { defineNitroPlugin, useRuntimeConfig } from '#imports'
import { initCmsDatabase } from '../database/client'
import { createInitialAdmin } from '../utils/auth'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()

  try {
    // Initialize database
    await initCmsDatabase({
      provider: config.cms.database.provider,
      url: config.cms.database.url,
      filename: config.cms.database.filename
    })

    // Create initial admin user if credentials are configured
    if (config.cms.admin.credentials) {
      await createInitialAdmin(
        config.cms.admin.credentials.username,
        config.cms.admin.credentials.password
      )
    }

    console.log('[CMS] Database plugin initialized')
  } catch (error) {
    console.error('[CMS] Failed to initialize database:', error)
  }
})
