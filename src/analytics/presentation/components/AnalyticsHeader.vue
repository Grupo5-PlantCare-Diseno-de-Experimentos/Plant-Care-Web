<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="an-header">
    <div>
      <p class="an-eyebrow">{{ t('analytics.header.eyebrow') }}</p>
      <h1 class="an-title">{{ t('analytics.header.title') }}</h1>
      <p class="an-subtitle">{{ t('analytics.header.subtitle') }}</p>
    </div>
    <span class="an-badge">{{ t('analytics.badge.last30Days') }}</span>
  </div>
</template>
