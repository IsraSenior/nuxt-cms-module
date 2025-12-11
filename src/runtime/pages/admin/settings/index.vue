<script setup lang="ts">
import { definePageMeta, navigateTo, useRuntimeConfig } from '#imports'

definePageMeta({
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()

// Redirect to branding settings by default
navigateTo(`${config.public.cms.adminPath}/settings/branding`)
</script>

<template>
  <div />
</template>
