<p align="center">
  <img src="./assets/logo.webp" alt="Neskeep CMS" width="280" />
</p>

<h1 align="center">@neskeep/nuxt-cms</h1>

<p align="center">
  <strong>A powerful, developer-friendly headless CMS module for Nuxt 3/4</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neskeep/nuxt-cms"><img src="https://img.shields.io/npm/v/@neskeep/nuxt-cms.svg?style=flat-square&color=2563eb" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@neskeep/nuxt-cms"><img src="https://img.shields.io/npm/dm/@neskeep/nuxt-cms.svg?style=flat-square&color=10b981" alt="npm downloads"></a>
  <a href="https://github.com/neskeep/nuxt-cms-module/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@neskeep/nuxt-cms.svg?style=flat-square&color=6366f1" alt="license"></a>
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt-3.16+-00DC82.svg?style=flat-square&logo=nuxt.js" alt="Nuxt"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-field-types">Field Types</a> •
  <a href="#-branding">Branding</a> •
  <a href="#-api">API</a>
</p>

---

## Overview

**@neskeep/nuxt-cms** is a full-featured, self-hosted headless CMS that integrates seamlessly into your Nuxt application. It provides a beautiful admin panel, flexible content modeling, built-in i18n support, and a powerful API — all with zero external dependencies.

```bash
npm install @neskeep/nuxt-cms
```

<p align="center">
  <img src="./assets/admin-panel-screenshot.webp" alt="Admin Panel Screenshot" width="800" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### Content Management
- **Collections** — Create dynamic content types (posts, products, etc.)
- **Singletons** — Manage unique pages (homepage, settings)
- **27 Field Types** — Text, richtext, images, icons, relations, repeaters, and more
- **Media Library** — Upload and manage images, videos, and files

</td>
<td width="50%">

### Developer Experience
- **Type Safe** — Full TypeScript support with auto-completion
- **Vue Composables** — Easy data fetching with `useCmsCollection`, `useCmsSingleton`
- **Public API** — Ready-to-use endpoints for frontend consumption
- **Zero Config** — Works out of the box with sensible defaults

</td>
</tr>
<tr>
<td width="50%">

### Internationalization
- **Multi-language** — Built-in i18n support with per-field translations
- **Visual Indicators** — Translation badges in the admin UI
- **Locale Switcher** — Easy language switching in forms

</td>
<td width="50%">

### Customization
- **Custom Branding** — Logo, colors, login page customization
- **Role-Based Access** — Users and roles management
- **Flexible Layouts** — Control field widths (full, half, third, quarter)
- **Multiple Databases** — SQLite (default) or PostgreSQL

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @neskeep/nuxt-cms

# pnpm
pnpm add @neskeep/nuxt-cms

# yarn
yarn add @neskeep/nuxt-cms
```

### Automatic Setup (Recommended)

Run the init command after installation:

```bash
npx nuxt-cms-init
```

This will:
- Add `@neskeep/nuxt-cms` to your `nuxt.config.ts`
- Create a `cms.config.ts` with example collections
- Set up default admin credentials

> **Default credentials:** `admin` / `admin123`
>
> ⚠️ **Change the password before deploying to production!**

### Manual Setup

<details>
<summary><strong>Click to expand manual setup instructions</strong></summary>

#### 1. Add module to `nuxt.config.ts`

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

#### 2. Create `cms.config.ts`

```ts
import { defineCmsConfig } from '@neskeep/nuxt-cms'

export default defineCmsConfig({
  locales: ['en', 'es'],
  defaultLocale: 'en',

  collections: {
    posts: {
      label: 'Post',
      labelPlural: 'Posts',
      icon: 'heroicons:document-text',
      titleField: 'title',
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
        }
      }
    }
  },

  singletons: {
    homepage: {
      label: 'Homepage',
      icon: 'heroicons:home',
      fields: {
        heroTitle: {
          type: 'text',
          label: 'Hero Title',
          translatable: true
        }
      }
    }
  }
})
```

</details>

### Access the Admin Panel

Start your app and navigate to `/admin`:

```bash
npm run dev
# Open http://localhost:3000/admin
```

---

## ⚙️ Configuration

### Module Options

Configure the CMS in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  cms: {
    // Database configuration
    database: {
      provider: 'sqlite',        // 'sqlite' | 'postgresql'
      filename: '.cms/data.db',  // SQLite file path
      url: process.env.DATABASE_URL  // PostgreSQL connection URL
    },

    // Admin panel configuration
    admin: {
      enabled: true,
      path: '/admin',
      credentials: {
        username: 'admin',
        password: 'secure-password'
      },
      branding: { /* See Branding section */ }
    },

    // Upload configuration
    uploads: {
      path: '.cms/uploads',
      maxSize: 10 * 1024 * 1024,  // 10MB
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'video/mp4', 'video/webm'
      ]
    },

    // JWT configuration
    jwt: {
      secret: process.env.CMS_JWT_SECRET
    }
  }
})
```

### Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `database.provider` | `'sqlite'` \| `'postgresql'` | `'sqlite'` | Database backend |
| `database.filename` | `string` | `'.cms/data.db'` | SQLite database file path |
| `database.url` | `string` | - | PostgreSQL connection URL |
| `admin.enabled` | `boolean` | `true` | Enable admin panel |
| `admin.path` | `string` | `'/admin'` | Admin panel route path |
| `admin.credentials` | `object` | - | Initial admin user credentials |
| `admin.branding` | `object` | - | Customize admin appearance |
| `uploads.path` | `string` | `'.cms/uploads'` | Upload directory |
| `uploads.maxSize` | `number` | `10485760` | Max file size in bytes |
| `uploads.allowedTypes` | `string[]` | See above | Allowed MIME types |

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

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

---

## 🎨 Branding

Customize the admin panel appearance with the `branding` configuration:

```ts
export default defineNuxtConfig({
  cms: {
    admin: {
      branding: {
        // Logo and name
        name: 'My CMS',                    // Text shown in sidebar
        logo: '/images/logo.svg',          // Custom logo image URL

        // Theme color (applies to navigation, buttons, links, etc.)
        primaryColor: '#2563eb',           // Primary color (hex)

        // "Powered by" footer
        poweredBy: {
          name: 'Neskeep',                 // Brand name
          url: 'https://neskeep.com'       // Optional link
        },

        // Login page customization
        login: {
          backgroundImage: '/images/login-bg.jpg',  // Left panel background
          title: 'Welcome to My CMS',
          description: 'Manage your content with ease.'
        }
      }
    }
  }
})
```

### Branding Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'CMS'` | CMS name shown in logo area |
| `logo` | `string` | - | Custom logo image URL |
| `primaryColor` | `string` | `'#2563eb'` | Primary theme color (hex) - applies to nav, buttons, links, hovers |
| `poweredBy.name` | `string` | `'Neskeep'` | "Powered by" text |
| `poweredBy.url` | `string` | `'https://neskeep.com'` | Optional link URL |
| `login.backgroundImage` | `string` | - | Login left panel background |
| `login.title` | `string` | `'Content Management System'` | Login page heading |
| `login.description` | `string` | - | Login page description |

---

## 📝 Field Types

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
  multiple: true
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
isActive: { type: 'boolean', label: 'Active' }
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
readme: { type: 'markdown', label: 'README', preview: true }

// Code editor
snippet: { type: 'code', label: 'Code', language: 'javascript' }
```

### Media Fields

```ts
// Single image
avatar: { type: 'image', label: 'Avatar' }

// File upload
document: { type: 'file', label: 'Document', accept: ['application/pdf'] }

// Image gallery
gallery: { type: 'gallery', label: 'Gallery', maxItems: 10 }
```

### Date & Time Fields

```ts
birthday: { type: 'date', label: 'Birthday' }
publishedAt: { type: 'datetime', label: 'Publish Date' }
openingTime: { type: 'time', label: 'Opening Time' }
```

### Relation Fields

```ts
// One-to-one relation
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
    icon: { type: 'text', label: 'Icon', width: 'half' },
    title: { type: 'text', label: 'Title', width: 'half' },
    description: { type: 'textarea', label: 'Description' }
  }
}

// Group (nested object)
seo: {
  type: 'group',
  label: 'SEO Settings',
  fields: {
    metaTitle: { type: 'text', label: 'Meta Title' },
    metaDescription: { type: 'textarea', label: 'Meta Description' }
  }
}
```

### Special Fields

```ts
// Color picker
brandColor: { type: 'color', label: 'Brand Color' }

// Auto-generated slug
slug: { type: 'slug', label: 'URL Slug', from: 'title' }

// Icon picker (Heroicons)
icon: {
  type: 'icon',
  label: 'Icon',
  variants: ['outline', 'solid'],  // Available variants
  defaultVariant: 'outline',       // Default variant
  clearable: true                  // Allow clearing
}

// JSON editor
metadata: { type: 'json', label: 'Metadata' }
```

### Common Field Options

All fields support these options:

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
  width: 'half'                // 'full' | 'half' | 'third' | 'quarter'
}
```

### Field Width Options

| Width | Columns | Description |
|-------|---------|-------------|
| `'full'` | 12/12 | Full width (default) |
| `'half'` | 6/12 | Half width — 2 fields per row |
| `'third'` | 4/12 | One third — 3 fields per row |
| `'quarter'` | 3/12 | One quarter — 4 fields per row |

Example:
```ts
fields: {
  firstName: { type: 'text', label: 'First Name', width: 'half' },
  lastName: { type: 'text', label: 'Last Name', width: 'half' },
  email: { type: 'email', label: 'Email' }  // full width
}
```

---

## 🌐 Internationalization (i18n)

### Configuration

```ts
export default defineCmsConfig({
  locales: ['en', 'es', 'fr'],  // Available languages
  defaultLocale: 'en',

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
          // Not translatable — same slug for all languages
        }
      }
    }
  }
})
```

### Admin Panel UX

When multiple locales are configured:

1. **Language Switcher** — Appears at the top of forms
2. **Translation Badges** — Translatable fields show an indicator icon
3. **Visual Feedback** — Easy to see which language you're editing

### Fetching Translations

```ts
// Via composable
const { data } = useCmsSingleton('homepage', { locale: 'es' })

// Via API
const posts = await $fetch('/api/cms/public/collections/posts?locale=es')
```

---

## 🔌 Composables

### useCmsCollection

Fetch and manage collection items:

```vue
<script setup lang="ts">
const {
  items,
  pending,
  total,
  refresh,
  fetchById,
  create,
  update,
  remove
} = useCmsCollection('posts', {
  limit: 10,
  orderBy: { publishedAt: 'desc' },
  locale: 'en'
})

// Fetch single item
const post = await fetchById('post-id')

// Create
await create({ title: 'New Post', content: '...' })

// Update
await update('post-id', { title: 'Updated' })

// Delete
await remove('post-id')
</script>

<template>
  <div v-if="pending">Loading...</div>
  <article v-for="post in items" :key="post.id">
    <h2>{{ post.title }}</h2>
  </article>
</template>
```

### useCmsSingleton

Fetch and update singleton data:

```vue
<script setup lang="ts">
const { data, pending, update } = useCmsSingleton('homepage', {
  locale: 'en'
})

await update({ heroTitle: 'New Title' })
</script>
```

### useCmsMedia

Manage media library:

```vue
<script setup lang="ts">
const {
  items,
  upload,
  remove,
  uploading,
  getUrl
} = useCmsMedia({ type: 'image' })

const handleUpload = async (file: File) => {
  const media = await upload(file, 'Alt text')
  console.log('Uploaded:', getUrl(media))
}
</script>
```

---

## 🔗 API Endpoints

### Public API (No Auth Required)

Perfect for frontend consumption:

```
GET /api/cms/public/collections/:name
GET /api/cms/public/singletons/:name
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `locale` | string | - | Language code |
| `sort` | string | `-createdAt` | Sort field (prefix `-` for desc) |
| `status` | string | `published` | `published`, `draft`, or `all` |

**Example:**
```ts
const { items, total } = await $fetch('/api/cms/public/collections/posts', {
  query: { locale: 'es', sort: '-publishedAt', limit: 10 }
})
```

### Admin API (Auth Required)

<details>
<summary><strong>View all admin endpoints</strong></summary>

**Authentication:**
- `POST /api/cms/auth/login`
- `POST /api/cms/auth/logout`
- `GET /api/cms/auth/me`

**Collections:**
- `GET /api/cms/collections`
- `GET /api/cms/collections/:name`
- `POST /api/cms/collections/:name`
- `GET /api/cms/collections/:name/:id`
- `PUT /api/cms/collections/:name/:id`
- `DELETE /api/cms/collections/:name/:id`

**Singletons:**
- `GET /api/cms/singletons`
- `GET /api/cms/singletons/:name`
- `PUT /api/cms/singletons/:name`

**Media:**
- `GET /api/cms/media`
- `POST /api/cms/media/upload`
- `GET /api/cms/media/file/:filename`
- `DELETE /api/cms/media/:id`

**Users & Roles:**
- `GET /api/cms/users`
- `POST /api/cms/users`
- `GET /api/cms/users/:id`
- `PUT /api/cms/users/:id`
- `DELETE /api/cms/users/:id`
- `GET /api/cms/roles`
- `POST /api/cms/roles`
- `PUT /api/cms/roles/:id`
- `DELETE /api/cms/roles/:id`

</details>

---

## 🔐 Security

### Role-Based Access Control

The CMS includes a full RBAC system:

- **Admin** — Full access to all features
- **Editor** — Can manage content, no user management
- **Custom Roles** — Define granular permissions

### Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure password hashing (bcrypt)
- CSRF protection
- XSS prevention

### Environment Variables

```env
# Required for production
CMS_JWT_SECRET=your-very-secure-secret-at-least-32-characters

# PostgreSQL (if used)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

---

## 📦 Collection Options

```ts
collections: {
  posts: {
    label: 'Post',                  // Singular label
    labelPlural: 'Posts',           // Plural label
    icon: 'heroicons:document-text', // Heroicon name
    description: 'Blog posts',
    titleField: 'title',            // Field to show in lists
    slugField: 'slug',              // Field for URL slugs
    timestamps: true,               // Add created_at, updated_at
    softDelete: false,              // Enable soft delete
    publishable: true,              // Enable draft/published
    sortable: false,                // Enable manual sorting
    defaultSort: {
      field: 'createdAt',
      direction: 'desc'
    },
    fields: { /* ... */ }
  }
}
```

---

## 🛠 TypeScript Support

Full TypeScript support with type inference:

```ts
import type {
  CmsModuleOptions,
  CmsConfig,
  CollectionConfig,
  FieldDefinition,
  BrandingConfig
} from '@neskeep/nuxt-cms'

// Type your content
interface Post {
  id: string
  title: string
  content: string
  publishedAt: string
}

const { items } = useCmsCollection<Post>('posts')
```

---

## 🗑 Uninstallation

### Automatic Cleanup

```bash
npx nuxt-cms-uninstall
```

This removes:
- Module from `nuxt.config.ts`
- `cms.config.ts` file
- `.cms` folder (optional)

Then uninstall the package:

```bash
npm remove @neskeep/nuxt-cms
```

### Manual Cleanup

1. Remove `'@neskeep/nuxt-cms'` from `modules` in `nuxt.config.ts`
2. Remove the `cms: { ... }` configuration block
3. Delete `cms.config.ts`
4. Delete `.cms` folder
5. Run `rm -rf .nuxt && npm run dev`

---

## 🧩 Compatibility

| Requirement | Version |
|-------------|---------|
| Nuxt | 3.16+ or 4.x |
| Node.js | 18+ |
| TypeScript | 5.0+ (optional) |

Works with Tailwind CSS v3 and v4 — admin styles are fully isolated.

---

## 📖 Development

```bash
# Install dependencies
pnpm install

# Run playground
pnpm dev

# Build module
pnpm build

# Run tests
pnpm test
```

---

## 📄 License

[MIT License](LICENSE) © [Neskeep](https://neskeep.com)

---

<p align="center">
  Made with ❤️ by <a href="https://neskeep.com">Neskeep</a>
</p>
