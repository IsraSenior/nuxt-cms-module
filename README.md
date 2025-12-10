# @neskeep/nuxt-cms

A powerful, flexible headless CMS module for Nuxt 3 with built-in admin panel, i18n support, and multiple database backends.

## Features

- **Admin Panel** - Beautiful, responsive admin interface
- **Multiple Databases** - SQLite (default) or PostgreSQL
- **Collections & Singletons** - Flexible content modeling
- **20+ Field Types** - Text, richtext, images, relations, repeaters, and more
- **i18n Ready** - Built-in translation support with visual indicators
- **Media Library** - Upload and manage images, videos, and files
- **Type Safe** - Full TypeScript support with auto-completion
- **Composables** - Easy data fetching with Vue composables
- **Public API** - Ready-to-use endpoints for frontend consumption
- **Flexible Layouts** - Configure field widths (full, half, third, quarter)

## Installation

```bash
# npm
npm install github:IsraSenior/nuxt-cms-module

# pnpm
pnpm add github:IsraSenior/nuxt-cms-module

# yarn
yarn add github:IsraSenior/nuxt-cms-module
```

## Quick Start

### Option A: Automatic Setup (Recommended)

After installing the module, run the init command:

```bash
# pnpm
pnpm exec nuxt-cms-init

# npm
npx nuxt-cms-init

# yarn
yarn nuxt-cms-init
```

This will automatically:
- Add `@neskeep/nuxt-cms` to your `nuxt.config.ts` modules
- Add default CMS configuration
- Create a `cms.config.ts` with example collections

**Default credentials after init:** `admin` / `admin123`

> ⚠️ **Important:** Change the default password in `nuxt.config.ts` before deploying to production!

### Option B: Manual Setup

#### 1. Add module to nuxt.config.ts

```ts
export default defineNuxtConfig({
  modules: ['@neskeep/nuxt-cms'],

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
        password: 'your-secure-password'
      }
    }
  }
})
```

#### 2. Create cms.config.ts

Create a `cms.config.ts` file in your project root:

```ts
import { defineCmsConfig } from '@neskeep/nuxt-cms'

export default defineCmsConfig({
  locales: ['en', 'es'],
  defaultLocale: 'en',

  collections: {
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
          translatable: true,
          width: 'half'
        },
        slug: {
          type: 'slug',
          label: 'Slug',
          from: 'title',
          width: 'half'
        },
        content: {
          type: 'richtext',
          label: 'Content',
          translatable: true
        },
        featuredImage: {
          type: 'image',
          label: 'Featured Image',
          width: 'half'
        },
        publishedAt: {
          type: 'datetime',
          label: 'Publish Date',
          width: 'half'
        }
      }
    }
  },

  singletons: {
    homepage: {
      label: 'Homepage',
      icon: 'HomeIcon',
      fields: {
        heroTitle: {
          type: 'text',
          label: 'Hero Title',
          translatable: true
        },
        heroDescription: {
          type: 'textarea',
          label: 'Hero Description',
          translatable: true
        }
      }
    }
  }
})
```

### 3. Access the Admin Panel

Start your Nuxt app and navigate to `/admin` (or your configured path).

Default credentials:
- Username: `admin`
- Password: (as configured in nuxt.config.ts)

## Configuration

### Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `database.provider` | `'sqlite' \| 'postgresql'` | `'sqlite'` | Database backend |
| `database.filename` | `string` | `'.cms/data.db'` | SQLite database file path |
| `database.url` | `string` | - | PostgreSQL connection URL |
| `admin.enabled` | `boolean` | `true` | Enable admin panel |
| `admin.path` | `string` | `'/admin'` | Admin panel route |
| `admin.credentials` | `object` | - | Admin login credentials |
| `uploads.path` | `string` | `'.cms/uploads'` | Upload directory |
| `uploads.maxSize` | `number` | `10485760` | Max file size (10MB) |
| `uploads.allowedTypes` | `string[]` | See below | Allowed MIME types |

Default allowed upload types:
- `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- `application/pdf`
- `video/mp4`, `video/webm`

### PostgreSQL Setup

```ts
export default defineNuxtConfig({
  cms: {
    database: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL
    }
  }
})
```

## Field Types

### Basic Fields

```ts
// Text input
title: { type: 'text', label: 'Title', maxLength: 200 }

// Textarea
description: { type: 'textarea', label: 'Description', rows: 5 }

// Number
price: { type: 'number', label: 'Price', min: 0, step: 0.01 }

// Email
email: { type: 'email', label: 'Email' }

// URL
website: { type: 'url', label: 'Website' }

// Password
password: { type: 'password', label: 'Password', minLength: 8 }
```

### Selection Fields

```ts
// Select dropdown
category: {
  type: 'select',
  label: 'Category',
  options: [
    { label: 'Technology', value: 'tech' },
    { label: 'Business', value: 'business' }
  ],
  multiple: true // Allow multiple selection
}

// Radio buttons
status: {
  type: 'radio',
  label: 'Status',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' }
  ],
  inline: true
}

// Checkboxes
tags: {
  type: 'checkbox',
  label: 'Tags',
  options: [
    { label: 'Featured', value: 'featured' },
    { label: 'Popular', value: 'popular' }
  ]
}

// Boolean toggle
isActive: {
  type: 'boolean',
  label: 'Active',
  labelOn: 'Yes',
  labelOff: 'No'
}
```

### Content Fields

```ts
// Rich text editor
content: {
  type: 'richtext',
  label: 'Content',
  toolbar: ['bold', 'italic', 'heading', 'link', 'image', 'list']
}

// Markdown editor
readme: {
  type: 'markdown',
  label: 'README',
  preview: true
}

// Code editor
snippet: {
  type: 'code',
  label: 'Code Snippet',
  language: 'javascript',
  lineNumbers: true
}
```

### Media Fields

```ts
// Single image
avatar: {
  type: 'image',
  label: 'Avatar',
  aspectRatio: '1:1',
  maxSize: 2097152 // 2MB
}

// File upload
document: {
  type: 'file',
  label: 'Document',
  accept: ['application/pdf']
}

// Image gallery
gallery: {
  type: 'gallery',
  label: 'Gallery',
  maxItems: 10,
  sortable: true
}
```

### Date/Time Fields

```ts
// Date only
birthday: {
  type: 'date',
  label: 'Birthday',
  format: 'YYYY-MM-DD'
}

// Date and time
publishedAt: {
  type: 'datetime',
  label: 'Publish Date'
}

// Time only
openingTime: {
  type: 'time',
  label: 'Opening Time',
  step: 900 // 15 minute intervals
}
```

### Relation Fields

```ts
// Relation to another collection
author: {
  type: 'relation',
  label: 'Author',
  collection: 'users',
  relationship: 'one-to-one',
  displayField: 'name'
}

// Many-to-many relation
categories: {
  type: 'relation',
  label: 'Categories',
  collection: 'categories',
  relationship: 'many-to-many'
}
```

### Layout Fields

```ts
// Repeater (array of items)
features: {
  type: 'repeater',
  label: 'Features',
  min: 1,
  max: 10,
  sortable: true,
  fields: {
    icon: { type: 'text', label: 'Icon' },
    title: { type: 'text', label: 'Title' },
    description: { type: 'textarea', label: 'Description' }
  }
}

// Group (nested object)
seo: {
  type: 'group',
  label: 'SEO Settings',
  collapsed: false,
  fields: {
    metaTitle: { type: 'text', label: 'Meta Title' },
    metaDescription: { type: 'textarea', label: 'Meta Description' }
  }
}
```

### Special Fields

```ts
// Color picker
brandColor: {
  type: 'color',
  label: 'Brand Color',
  format: 'hex',
  presets: ['#3b82f6', '#10b981', '#f59e0b']
}

// Auto-generated slug
slug: {
  type: 'slug',
  label: 'URL Slug',
  from: 'title', // Generate from title field
  separator: '-'
}

// JSON editor
metadata: {
  type: 'json',
  label: 'Metadata'
}
```

### Field Options

All fields support these common options:

```ts
{
  type: 'text',
  label: 'Field Label',        // Display label
  required: true,              // Make field required
  default: 'Default value',    // Default value
  placeholder: 'Enter text',   // Placeholder text
  help: 'Help text below',     // Help text
  translatable: true,          // Enable i18n translations
  hidden: false,               // Hide from admin
  readonly: false,             // Read-only field
  width: 'half',               // Field width in form layout
  conditions: [{               // Conditional visibility
    field: 'type',
    operator: 'equals',
    value: 'premium'
  }]
}
```

### Field Width Options

Control how much horizontal space a field occupies in the form:

| Width | Description | Grid Columns |
|-------|-------------|--------------|
| `'full'` | Full width (default) | 12/12 |
| `'half'` | Half width | 6/12 |
| `'third'` | One third width | 4/12 |
| `'quarter'` | One quarter width | 3/12 |

Example layout with mixed widths:

```ts
fields: {
  // These two fields appear side by side
  firstName: { type: 'text', label: 'First Name', width: 'half' },
  lastName: { type: 'text', label: 'Last Name', width: 'half' },

  // Full width field
  email: { type: 'email', label: 'Email', width: 'full' },

  // Three fields in a row
  city: { type: 'text', label: 'City', width: 'third' },
  state: { type: 'text', label: 'State', width: 'third' },
  zip: { type: 'text', label: 'ZIP', width: 'third' },

  // Four fields in a row
  q1: { type: 'number', label: 'Q1', width: 'quarter' },
  q2: { type: 'number', label: 'Q2', width: 'quarter' },
  q3: { type: 'number', label: 'Q3', width: 'quarter' },
  q4: { type: 'number', label: 'Q4', width: 'quarter' }
}
```

> **Note:** On mobile devices, all fields automatically become full width for better usability.

## Multilingual Support (i18n)

### Configuration

Enable multiple languages in your `cms.config.ts`:

```ts
export default defineCmsConfig({
  locales: ['en', 'es', 'fr'],  // Available languages
  defaultLocale: 'en',          // Default/fallback language

  collections: {
    posts: {
      fields: {
        title: {
          type: 'text',
          label: 'Title',
          translatable: true  // This field can be translated
        },
        slug: {
          type: 'slug',
          from: 'title'
          // Not translatable - same slug for all languages
        }
      }
    }
  }
})
```

### Translatable Field Types

The following field types support translations by default:
- `text`
- `textarea`
- `richtext`
- `markdown`
- `code`

You can disable translation for any field by setting `translatable: false`.

### Admin Panel UX

When multiple locales are configured, the admin panel displays:

1. **Language Panel** - A prominent panel at the top of forms showing:
   - Language icon and "Language" label
   - Active language badge (e.g., "EN")
   - Language switcher buttons
   - Hint explaining which fields are translatable

2. **Translatable Field Indicators** - Fields that support translation show a small translation icon badge in the top-right corner

### Fetching Translated Content

```ts
// Fetch with specific locale
const { data } = useCmsSingleton('homepage', { locale: 'es' })

// Or use the public API
const posts = await $fetch('/api/cms/public/collections/posts?locale=es')
```

## Composables

### useCmsCollection

Fetch and manage collection items:

```vue
<script setup lang="ts">
const {
  items,
  pending,
  total,
  page,
  refresh,
  fetchById,
  create,
  update,
  remove
} = useCmsCollection('posts', {
  limit: 10,
  offset: 0,
  orderBy: { publishedAt: 'desc' },
  locale: 'en'
})

// Fetch single item
const post = await fetchById('post-id')

// Create new item
await create({
  title: 'New Post',
  content: 'Content here...'
}, {
  es: { title: 'Nuevo Post' }
})

// Update item
await update('post-id', { title: 'Updated Title' })

// Delete item
await remove('post-id')
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else>
    <article v-for="post in items" :key="post.id">
      <h2>{{ post.title }}</h2>
    </article>
  </div>
</template>
```

### useCmsCollectionItem

Fetch a single collection item:

```vue
<script setup lang="ts">
const route = useRoute()
const { data: post, pending, error } = useCmsCollectionItem('posts', route.params.id)
</script>
```

### useCmsSingleton

Fetch and update singleton data:

```vue
<script setup lang="ts">
const {
  data,
  pending,
  refresh,
  update,
  getTranslation
} = useCmsSingleton('homepage', {
  locale: 'en'
})

// Get translated value
const heroTitle = getTranslation('heroTitle', 'es')

// Update singleton
await update({
  heroTitle: 'New Hero Title'
}, {
  es: { heroTitle: 'Nuevo Titulo' }
})
</script>
```

### useCmsMedia

Manage media library:

```vue
<script setup lang="ts">
const {
  items,
  upload,
  uploadMultiple,
  remove,
  uploading,
  uploadProgress,
  getUrl,
  isImage,
  formatSize
} = useCmsMedia({
  type: 'image',
  limit: 20
})

// Upload file
const file = event.target.files[0]
const media = await upload(file, 'Alt text for image')

// Delete media
await remove('media-id')

// Get URL
const url = getUrl(media)
</script>
```

## API Endpoints

The module exposes two sets of API endpoints:

### Admin API (Authentication Required)

These endpoints require admin authentication:

#### Authentication
- `POST /api/cms/auth/login` - Admin login
- `POST /api/cms/auth/logout` - Admin logout
- `GET /api/cms/auth/me` - Get current user

#### Collections
- `GET /api/cms/collections` - List all collections
- `GET /api/cms/collections/:name` - List collection items
- `POST /api/cms/collections/:name` - Create item
- `GET /api/cms/collections/:name/:id` - Get item
- `PUT /api/cms/collections/:name/:id` - Update item
- `DELETE /api/cms/collections/:name/:id` - Delete item

#### Singletons
- `GET /api/cms/singletons` - List all singletons
- `GET /api/cms/singletons/:name` - Get singleton
- `PUT /api/cms/singletons/:name` - Update singleton

#### Media
- `GET /api/cms/media` - List media items
- `POST /api/cms/media/upload` - Upload file
- `GET /api/cms/media/file/:filename` - Get media file
- `DELETE /api/cms/media/:id` - Delete media

#### Schema
- `GET /api/cms/schema` - Get CMS schema (collections, singletons, fields)

### Public API (No Authentication Required)

These endpoints are designed for frontend consumption and don't require authentication:

#### Collections
```
GET /api/cms/public/collections/:name
```

Query parameters:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `locale` | string | - | Language code for translations |
| `sort` | string | `-createdAt` | Sort field (prefix with `-` for descending) |
| `search` | string | - | Search in title field |
| `status` | string | `published` | Filter by status (`published`, `draft`, `all`) |

Example:
```ts
// Fetch published posts in Spanish, sorted by date
const { items, total, totalPages } = await $fetch('/api/cms/public/collections/posts', {
  query: {
    locale: 'es',
    sort: '-publishedAt',
    limit: 10,
    page: 1
  }
})
```

#### Singletons
```
GET /api/cms/public/singletons/:name
```

Query parameters:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `locale` | string | - | Language code for translations |

Example:
```ts
// Fetch homepage content in French
const { data } = await $fetch('/api/cms/public/singletons/homepage', {
  query: { locale: 'fr' }
})
```

## Environment Variables

```env
# JWT secret for admin authentication
CMS_JWT_SECRET=your-secure-secret-here

# PostgreSQL connection (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

## Collection Options

```ts
collections: {
  posts: {
    label: 'Post',
    labelPlural: 'Posts',
    icon: 'DocumentTextIcon',     // Heroicons name
    description: 'Blog posts',
    titleField: 'title',          // Field to show in lists
    slugField: 'slug',            // Field for URL slugs
    timestamps: true,             // Add created_at, updated_at
    softDelete: false,            // Enable soft delete
    publishable: true,            // Enable draft/published status
    sortable: false,              // Enable manual sorting
    defaultSort: {
      field: 'createdAt',
      direction: 'desc'
    },
    fields: { /* ... */ }
  }
}
```

## TypeScript

The module provides full TypeScript support:

```ts
import type { CmsModuleOptions, CmsConfig, CollectionConfig, FieldDefinition } from '@neskeep/nuxt-cms'

// Infer types from your config
type Post = {
  id: string
  title: string
  content: string
  publishedAt: string
}

const { items } = useCmsCollection<Post>('posts')
```

## Uninstallation

To completely remove the CMS module from your project:

### Option A: Automatic Cleanup (Recommended)

Run the uninstall script:

```bash
# pnpm
pnpm exec nuxt-cms-uninstall

# npm
npx nuxt-cms-uninstall

# yarn
yarn nuxt-cms-uninstall
```

This will:
- Remove `@neskeep/nuxt-cms` from your `nuxt.config.ts` modules
- Remove the `cms:` configuration block from `nuxt.config.ts`
- Optionally delete `cms.config.ts`
- Optionally delete the `.cms` folder (database + uploads)

Then remove the package:

```bash
pnpm remove @neskeep/nuxt-cms
```

### Option B: Manual Cleanup

1. Remove the module from `nuxt.config.ts`:
   - Delete `'@neskeep/nuxt-cms'` from the `modules` array
   - Delete the entire `cms: { ... }` configuration block

2. Delete the configuration file:
   ```bash
   rm cms.config.ts
   ```

3. Delete the CMS data folder (optional):
   ```bash
   rm -rf .cms
   ```

4. Remove the package:
   ```bash
   pnpm remove @neskeep/nuxt-cms
   ```

5. Clean and restart:
   ```bash
   rm -rf .nuxt && pnpm dev
   ```

## Compatibility

This module is compatible with:
- **Nuxt 3.16+** and **Nuxt 4.x**
- **Tailwind CSS v3** and **v4** (styles are isolated to prevent conflicts)

### Tailwind CSS v4 Note

The CMS admin panel uses scoped CSS with `!important` declarations to ensure styles are properly isolated from your host application's Tailwind configuration. This prevents the `--color-*: initial` reset in Tailwind v4 from affecting CMS components.

## Development

```bash
# Install dependencies
pnpm install

# Development with playground
pnpm dev

# Build module
pnpm build

# Run tests
pnpm test

# Typecheck
pnpm typecheck
```

## License

MIT License

## Contributing

Contributions are welcome! Please read the contributing guidelines first.
