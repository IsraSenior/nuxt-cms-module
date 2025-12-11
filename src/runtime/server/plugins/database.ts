import { defineNitroPlugin, useRuntimeConfig } from '#imports'
import { initCmsDatabase } from '../database/client'
import { createInitialAdmin } from '../utils/auth'
import { seedDefaultRoles, migrateLegacyUsers } from '../utils/seedRoles'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()

  try {
    // Initialize database
    await initCmsDatabase({
      provider: config.cms.database.provider,
      url: config.cms.database.url,
      filename: config.cms.database.filename
    })

    // Seed default roles (must be done before creating admin)
    await seedDefaultRoles()

    // Create initial admin user if credentials are configured
    if (config.cms.admin.credentials) {
      await createInitialAdmin(
        config.cms.admin.credentials.username,
        config.cms.admin.credentials.password
      )
    }

    // Migrate legacy users to new role system
    await migrateLegacyUsers()

    console.log('[CMS] Database plugin initialized')
  } catch (error) {
    console.error('[CMS] Failed to initialize database:', error)
  }
})
