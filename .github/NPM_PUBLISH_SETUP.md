# Configuración de Publicación Automática a npm

Este documento explica cómo configurar la publicación automática del paquete `@neskeep/nuxt-cms` a npm usando GitHub Actions.

## Opciones de Configuración

Existen dos métodos principales para configurar la publicación automática:

### Opción 1: NPM Token (Más Simple) ⭐ Recomendado para empezar

Esta es la opción más simple y directa.

#### Pasos:

1. **Generar un token de npm:**
   - Ir a https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click en "Generate New Token" → "Classic Token"
   - Seleccionar "Automation" (para CI/CD)
   - Copiar el token generado

2. **Agregar el token a GitHub:**
   - Ir a tu repositorio en GitHub
   - Settings → Secrets and variables → Actions
   - Click en "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Pegar el token de npm
   - Click en "Add secret"

3. **Configurar 2FA en npm (Recomendado):**
   - Ir a https://www.npmjs.com/settings/YOUR_USERNAME/tfa
   - Habilitar 2FA con una app de autenticación
   - En tu paquete: Settings → "Require two-factor authentication and disallow tokens" (la opción más segura)
   - O "Require two-factor authentication or a granular access token with bypass 2fa enabled"

### Opción 2: OIDC Trusted Publisher (Más Seguro)

Esta opción usa OpenID Connect y no requiere guardar tokens en GitHub. Es más segura pero requiere configuración en npm.

#### Pasos:

1. **Configurar Trusted Publisher en npm:**
   - Ir a https://www.npmjs.com/package/@neskeep/nuxt-cms/access
   - En la sección "Publishing access", click en "Configure trusted publisher"
   - Llenar el formulario:
     - **Publisher**: GitHub Actions
     - **Organization or user**: `neskeep`
     - **Repository**: `nuxt-cms-module`
     - **Workflow filename**: `publish.yml`
     - **Environment name**: (opcional, dejar vacío por ahora)
   - Click en "Set up connection"

2. **Actualizar el workflow** (si usas OIDC):

   Editar `.github/workflows/publish.yml` y reemplazar la sección de publicación:

   ```yaml
   - name: Publish to npm
     run: npm publish --provenance --access public
     # Ya no necesitas NODE_AUTH_TOKEN con OIDC
   ```

   Y agregar estos permisos al inicio del job:

   ```yaml
   permissions:
     contents: read
     id-token: write
   ```

## Workflows Disponibles

El proyecto incluye 3 workflows de GitHub Actions:

### 1. `ci.yml` - Integración Continua
- Se ejecuta en cada push a `main` y en pull requests
- Ejecuta linting, type checking, build y tests
- Útil para validar cambios antes de mergear

### 2. `publish.yml` - Publicación Manual o por Tag
- **Trigger manual**: Ir a Actions → "Publish to npm" → "Run workflow"
- **Trigger por tag**: Crear y pushear un tag con formato `v*.*.*`
  ```bash
  git tag v0.5.0
  git push origin v0.5.0
  ```

### 3. `release.yml` - Release Automático
- **Trigger manual**: Ir a Actions → "Release" → "Run workflow"
- Permite seleccionar el tipo de versión (major, minor, patch)
- Automáticamente:
  1. Incrementa la versión en package.json
  2. Hace commit y tag
  3. Publica a npm
  4. Crea un GitHub Release

## Flujo de Trabajo Recomendado

### Para releases menores (bug fixes, pequeñas mejoras):

1. Hacer cambios en una rama feature
2. Crear Pull Request
3. El workflow `ci.yml` validará los cambios
4. Mergear a `main`
5. Ir a Actions → "Release" → Run workflow → Seleccionar "patch"
6. El sistema automáticamente:
   - Incrementará de 0.4.0 → 0.4.1
   - Publicará a npm
   - Creará un release en GitHub

### Para releases importantes (nuevas features):

1. Seguir los mismos pasos pero seleccionar "minor" o "major"
2. Minor: 0.4.0 → 0.5.0
3. Major: 0.4.0 → 1.0.0

### Para publicación manual urgente:

1. Actualizar manualmente la versión en `package.json`
2. Hacer commit y push
3. Ir a Actions → "Publish to npm" → Run workflow

## Seguridad

### Configuración Recomendada en npm:

1. **2FA habilitado** en tu cuenta de npm
2. **Publishing access**: "Require two-factor authentication and disallow tokens"
3. Si usas tokens: Usar tokens de "Automation" (no "Publish")
4. Si usas OIDC: Configurar trusted publisher correctamente

### En GitHub:

1. Proteger la rama `main`:
   - Settings → Branches → Add rule
   - Branch name pattern: `main`
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging

2. Limitar quién puede ejecutar workflows manualmente
3. Revisar los logs de Actions regularmente

## Provenance

Todos los workflows incluyen `--provenance` al publicar, lo que:
- Genera una declaración firmada de dónde y cómo se construyó el paquete
- Aumenta la confianza y seguridad del paquete
- Es una práctica recomendada por npm

## Troubleshooting

### Error: "npm ERR! need auth"
- Verificar que el secret `NPM_TOKEN` está configurado correctamente
- Verificar que el token tiene permisos de "Automation"
- Verificar que el token no ha expirado

### Error: "npm ERR! 403 Forbidden"
- Verificar que tu usuario tiene permisos de publicación en el paquete
- Verificar la configuración de 2FA
- Si usas OIDC, verificar la configuración del trusted publisher

### Workflow no se ejecuta
- Verificar que los workflows están en `.github/workflows/`
- Verificar que el formato del tag es correcto (`v1.2.3`)
- Verificar que Actions está habilitado en el repositorio

## Próximos Pasos

1. Decidir entre Opción 1 (NPM Token) u Opción 2 (OIDC)
2. Seguir los pasos de configuración
3. Hacer un test con un patch release (ej: 0.4.0 → 0.4.1)
4. Configurar protección de ramas en GitHub
5. (Opcional) Crear un CHANGELOG.md para documentar cambios

## Referencias

- [GitHub Actions para npm](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [npm OIDC Trusted Publishers](https://docs.npmjs.com/generating-provenance-statements)
- [Provenance Statements](https://github.blog/2023-04-19-introducing-npm-package-provenance/)
