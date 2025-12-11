# 🚀 Configuración de Publicación Automática a npm

## ✅ Lo que ya está hecho

He configurado 3 workflows de GitHub Actions en tu repositorio:

1. **CI** (`.github/workflows/ci.yml`) - Valida código en cada PR
2. **Publish** (`.github/workflows/publish.yml`) - Publica manualmente o por tag
3. **Release** (`.github/workflows/release.yml`) - Release completo automático

## 📋 Pasos que debes seguir AHORA

### Paso 1: Generar Token de npm

1. Ir a: https://www.npmjs.com/settings/neskeep/tokens
2. Click en **"Generate New Token"** → **"Classic Token"**
3. Seleccionar **"Automation"** (para CI/CD)
4. Copiar el token (empieza con `npm_...`)
   - ⚠️ **IMPORTANTE**: Guárdalo en un lugar seguro, solo se muestra una vez

### Paso 2: Agregar Token a GitHub

1. Ir a: https://github.com/neskeep/nuxt-cms-module/settings/secrets/actions
2. Click en **"New repository secret"**
3. Llenar:
   - **Name**: `NPM_TOKEN` (exactamente así)
   - **Secret**: Pegar el token de npm
4. Click en **"Add secret"**

### Paso 3: Configurar Trusted Publisher en npm (OPCIONAL pero MÁS SEGURO)

Si quieres usar OIDC en lugar de tokens (más seguro):

1. Ir a: https://www.npmjs.com/package/@neskeep/nuxt-cms/access
2. Buscar la sección **"Publishing access"**
3. Click en **"Configure trusted publisher"** (si está disponible)
4. Llenar exactamente:
   - **Publisher**: `GitHub Actions`
   - **Organization or user**: `neskeep`
   - **Repository**: `nuxt-cms-module`
   - **Workflow filename**: `publish.yml` (SIN el path `.github/workflows/`)
   - **Environment name**: dejar vacío
5. Click en **"Set up connection"**

Si haces esto, luego necesitarás editar `.github/workflows/publish.yml` y `.github/workflows/release.yml` para quitar la línea:
```yaml
NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Paso 4: Probar la Configuración

Una vez tengas el token configurado:

1. Ir a: https://github.com/neskeep/nuxt-cms-module/actions/workflows/publish.yml
2. Click en **"Run workflow"**
3. Dejar todo por defecto
4. Click en **"Run workflow"** (el botón verde)
5. Esperar a que termine (verás si es exitoso o falla)

Si falla, revisar los logs en la ejecución del workflow.

## 🎯 Cómo usar los workflows después de configurar

### Para hacer un release (RECOMENDADO):

```bash
# Opción A: Desde GitHub (más fácil)
# 1. Ir a: https://github.com/neskeep/nuxt-cms-module/actions/workflows/release.yml
# 2. Click "Run workflow"
# 3. Seleccionar tipo de versión:
#    - patch: 0.4.0 → 0.4.1 (arreglos de bugs)
#    - minor: 0.4.0 → 0.5.0 (nuevas funcionalidades)
#    - major: 0.4.0 → 1.0.0 (cambios que rompen compatibilidad)
# 4. Click "Run workflow"

# Opción B: Desde la terminal
git tag v0.5.0
git push origin v0.5.0
# Esto automáticamente dispara el workflow de publicación
```

### Para publicar manualmente (sin cambiar versión):

```bash
# Solo si ya actualizaste package.json manualmente
# 1. Ir a: https://github.com/neskeep/nuxt-cms-module/actions/workflows/publish.yml
# 2. Click "Run workflow"
```

## 📊 Verificar que funciona

Después de ejecutar el workflow:

1. Ver el log en GitHub Actions
2. Verificar que se publicó en npm:
   ```bash
   npm view @neskeep/nuxt-cms version
   ```
3. Ver el release en: https://github.com/neskeep/nuxt-cms-module/releases

## 🔐 Seguridad Adicional (Recomendado)

### Habilitar 2FA en npm:

1. Ir a: https://www.npmjs.com/settings/neskeep/tfa
2. Habilitar 2FA con Google Authenticator o similar
3. En la configuración del paquete, seleccionar:
   - **"Require two-factor authentication or a granular access token with bypass 2fa enabled"**

### Proteger rama main:

1. Ir a: https://github.com/neskeep/nuxt-cms-module/settings/branches
2. Click en **"Add rule"**
3. Branch name pattern: `main`
4. Marcar:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - Seleccionar: `lint-and-test` (del workflow CI)

## ❓ Troubleshooting

### Error: "npm ERR! need auth"
- Verificar que agregaste el secret `NPM_TOKEN` en GitHub
- Verificar que el token es de tipo "Automation"
- Regenerar el token si es necesario

### Error: "npm ERR! 403 Forbidden"
- Verificar que tienes permisos de publicación en @neskeep/nuxt-cms
- Verificar configuración de 2FA en npm

### El workflow no aparece en Actions
- Esperar unos minutos después del push
- Verificar que los archivos están en `.github/workflows/`
- Verificar que Actions está habilitado en: Settings → Actions → General

## 📝 Resumen de Formulario de npm

Basado en el formulario que mostraste, debes llenar:

```
Publisher*: GitHub Actions
Organization or user*: neskeep
Repository*: nuxt-cms-module
Workflow filename*: publish.yml
Environment name: (dejar vacío)
```

Luego click en **"Set up connection"**.

## 📞 Próximos Pasos

1. ✅ Generar token de npm
2. ✅ Agregar token a GitHub Secrets
3. ✅ (Opcional) Configurar Trusted Publisher
4. ✅ Probar ejecutando el workflow manualmente
5. ✅ Habilitar 2FA en npm
6. ✅ Proteger rama main

¡Después de esto, cada release será automático! 🎉
