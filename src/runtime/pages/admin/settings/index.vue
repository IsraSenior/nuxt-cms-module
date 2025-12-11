<script setup lang="ts">
import { onMounted } from 'vue'
import { definePageMeta, navigateTo, useRuntimeConfig } from '#imports'

definePageMeta({
  middleware: 'cms-auth',
  layout: false
})

const config = useRuntimeConfig()

// Redirect to general settings on mount
onMounted(() => {
  navigateTo(`${config.public.cms.adminPath}/settings/general`)
})
</script>

<template>
  <div />
</template>
