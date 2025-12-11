# GitHub Actions Workflows

Este directorio contiene los workflows de GitHub Actions para automatizar CI/CD del proyecto.

## 📋 Workflows Disponibles

### 🔄 CI (`ci.yml`)
**Trigger:** Push a `main` o Pull Requests

Ejecuta validaciones automáticas:
- Instalación de dependencias con caché
- Linting del código
- Type checking con TypeScript
- Build del paquete
- Tests (si existen)

**Propósito:** Asegurar que todos los cambios pasen las validaciones antes de mergear.

### 📦 Publish (`publish.yml`)
**Triggers:**
- Manual (workflow_dispatch)
- Tags con formato `v*.*.*`

Publica el paquete a npm con:
- Build completo
- Provenance statements (seguridad)
- Publicación con acceso público

**Uso Manual:**
1. Ir a Actions → "Publish to npm"
2. Click en "Run workflow"
3. Seleccionar la rama
4. Click en "Run workflow"

**Uso con Tags:**
```bash
git tag v0.5.0
git push origin v0.5.0
```

### 🚀 Release (`release.yml`)
**Trigger:** Manual (workflow_dispatch)

Workflow completo de release:
1. Incrementa versión (patch/minor/major)
2. Hace commit del cambio de versión
3. Crea y pushea tag
4. Publica a npm
5. Crea GitHub Release

**Uso:**
1. Ir a Actions → "Release"
2. Click en "Run workflow"
3. Seleccionar tipo de versión:
   - **patch**: 0.4.0 → 0.4.1 (bug fixes)
   - **minor**: 0.4.0 → 0.5.0 (nuevas features)
   - **major**: 0.4.0 → 1.0.0 (breaking changes)
4. Click en "Run workflow"

## 🔐 Configuración Requerida

### Secrets de GitHub

Agregar en Settings → Secrets and variables → Actions:

- `NPM_TOKEN`: Token de npm con permisos de "Automation"
  - Generar en: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  - Tipo: "Automation"

### Permisos del Token

El `GITHUB_TOKEN` incluido automáticamente necesita:
- `contents: write` (para crear releases y pushear tags)
- `id-token: write` (para OIDC, si se usa)

Estos ya están configurados en los workflows.

## 📖 Guía de Configuración Completa

Ver [NPM_PUBLISH_SETUP.md](./NPM_PUBLISH_SETUP.md) para instrucciones detalladas sobre:
- Configuración de npm tokens
- OIDC Trusted Publishers
- Seguridad y mejores prácticas
- Troubleshooting

## 🔍 Monitoreo

### Ver Ejecuciones
- Ir a la tab "Actions" del repositorio
- Ver el historial de ejecuciones de cada workflow

### Logs
- Click en cualquier ejecución para ver logs detallados
- Los errores aparecerán resaltados en rojo

### Badges (Opcional)

Agregar al README.md principal:

```markdown
[![CI](https://github.com/neskeep/nuxt-cms-module/actions/workflows/ci.yml/badge.svg)](https://github.com/neskeep/nuxt-cms-module/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@neskeep%2Fnuxt-cms.svg)](https://www.npmjs.com/package/@neskeep/nuxt-cms)
```

## 🛡️ Seguridad

### Protección de Rama
Recomendado configurar en Settings → Branches:
- Requerir PR reviews antes de mergear
- Requerir que CI pase antes de mergear
- No permitir force push

### Revisión de Workflows
- Todos los workflows usan versiones específicas de actions (`@v4`)
- Se ejecutan en `ubuntu-latest` para consistencia
- Usan `--frozen-lockfile` para dependencias reproducibles

## 🔧 Mantenimiento

### Actualizar Actions
Revisar periódicamente las versiones de actions usadas:
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `pnpm/action-setup@v2`
- `actions/cache@v3`

### Renovar Tokens
Los tokens de npm pueden expirar. Si ves errores de autenticación:
1. Generar un nuevo token en npm
2. Actualizar el secret `NPM_TOKEN` en GitHub

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
