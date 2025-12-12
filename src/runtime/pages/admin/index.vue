<script setup lang="ts">
import { definePageMeta, navigateTo, useRuntimeConfig } from '#imports'

definePageMeta({
  layout: false,
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()

// Redirect to dashboard
await navigateTo(`${config.public.cms.adminPath}/dashboard`, { replace: true })
</script>

<template>
  <div></div>
</template>
