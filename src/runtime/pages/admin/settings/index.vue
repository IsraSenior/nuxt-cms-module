<script setup lang="ts">
import { definePageMeta, navigateTo, useRuntimeConfig } from '#imports'

definePageMeta({
  middleware: 'cms-auth'
})

const config = useRuntimeConfig()

// Redirect to general settings by default
navigateTo(`${config.public.cms.adminPath}/settings/general`)
</script>

<template>
  <div />
</template>
