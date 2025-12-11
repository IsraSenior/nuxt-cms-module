# Migration Guide: Upgrading Admin Users to Super Admin

## Overview

If you created your CMS admin user **before version 0.5.1**, your admin account may be using the legacy role system and not have access to the new RBAC (Role-Based Access Control) features. This guide helps you upgrade your admin user to the new `super_admin` role with full permissions.

## Symptoms

You'll know you need this migration if:
- You can't access the Roles management section
- You see "Permission denied" errors when trying to manage users or settings
- Your user profile shows "Admin" but you don't have full system access

## Migration Script

We provide a simple script to upgrade your admin user. There are two versions:

### Option 1: Auto-Detection Script (Recommended)

This script will try to find your database automatically:

```bash
# In your Nuxt project directory
node node_modules/@neskeep/nuxt-cms/scripts/migrate-admin-to-superadmin.mjs [username]

# Examples:
node node_modules/@neskeep/nuxt-cms/scripts/migrate-admin-to-superadmin.mjs admin
node node_modules/@neskeep/nuxt-cms/scripts/migrate-admin-to-superadmin.mjs  # migrates first admin user found
```

### Option 2: Explicit Path Script (If auto-detection fails)

If the auto-detection doesn't work, use this version with an explicit database path:

```bash
# Find your database first
find . -name "*.db" -type f

# Common locations:
# - ./.cms/data.db
# - ./.cms/cms.db
# - ./.nuxt/.cms/data.db

# Run the script with explicit path
node node_modules/@neskeep/nuxt-cms/scripts/upgrade-to-superadmin-simple.mjs <path-to-db> [username]

# Examples:
node node_modules/@neskeep/nuxt-cms/scripts/upgrade-to-superadmin-simple.mjs ./.cms/data.db admin
node node_modules/@neskeep/nuxt-cms/scripts/upgrade-to-superadmin-simple.mjs ./.cms/data.db  # migrates first admin
```

## What the Script Does

1. ✅ Creates the `super_admin` role if it doesn't exist
2. ✅ Grants full permissions to the role:
   - Content: create, read, update, delete
   - Media: create, read, update, delete
   - Users: create, read, update, delete
   - Roles: create, read, update, delete
   - Settings: read, update
3. ✅ Updates your admin user to use the `super_admin` role
4. ✅ Shows confirmation with details

## Expected Output

When successful, you'll see:

```
📊 Using database: ./.cms/data.db

🔧 Creating super_admin role...
✅ Super admin role created

👤 Found user: admin
   Current role: admin
   Current role_id: null

✅ User upgraded to super_admin!
   Username: admin
   New role_id: xyz123abc456def789
   Role: Super Administrator
```

## Post-Migration Steps

1. **Restart your development server** (the script only updates the database):
   ```bash
   # Stop server (Ctrl+C) then restart
   npm run dev
   # or
   pnpm run dev
   ```

2. **Log out and log back in** to your CMS admin panel

3. **Verify access**:
   - Navigate to `/admin/roles` - you should now see the Roles section
   - Try creating a new role to confirm permissions
   - Check your user profile - should show "Super Administrator"

## Troubleshooting

### Error: "Could not find SQLite database file"

The script couldn't auto-detect your database. Use Option 2 (explicit path) instead.

First, find your database:
```bash
find . -name "*.db" -type f
```

Then run with the explicit path.

### Error: "User not found"

Make sure you're specifying the correct username. Check your database or try without specifying a username to migrate the first admin user found.

### Error: "UNIQUE constraint failed"

The `super_admin` role might already exist. This is fine - the script will use the existing role and just update your user.

### Still Having Issues?

If you're using **PostgreSQL** instead of SQLite, you'll need to modify the script or update your user manually through SQL:

```sql
-- First, find or create the super_admin role
-- Then update your user
UPDATE cms_users
SET role_id = (SELECT id FROM cms_roles WHERE name = 'super_admin')
WHERE username = 'your-username';
```

## Version Information

- **Affects**: Versions < 0.5.1
- **Fixed in**: Version 0.5.1+
- **Migration script added**: Version 0.5.1

## Need Help?

If you encounter issues not covered here:
1. Check the [GitHub Issues](https://github.com/neskeep/nuxt-cms-module/issues)
2. Create a new issue with:
   - Your module version
   - Database type (SQLite/PostgreSQL)
   - Error message
   - Database location

## Related Documentation

- [RBAC System Documentation](./docs/rbac.md) (coming soon)
- [User Management Guide](./docs/users.md) (coming soon)
- [Roles and Permissions](./docs/roles.md) (coming soon)
