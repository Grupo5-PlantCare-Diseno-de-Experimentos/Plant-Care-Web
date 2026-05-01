<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  subtitle: string;
  sectionLabel: string;
  color: string;
  gradientId: string;
  data: { value: number; day?: string }[];
  dayLabels: string[];
  scaleFactor?: number;
  useMaxScale?: boolean;
}>();

const points = computed(() => {
  if (props.data.length === 0) return '25,90';
  if (props.useMaxScale) {
    const maxVal = Math.max(...props.data.map(d => d.value), 1);
    return props.data.map((point, i) => `${i * 50 + 25},${180 - (point.value / maxVal) * 150}`).join(' ');
  } else {
    const factor = props.scaleFactor || 1;
    return props.data.map((point, i) => `${i * 50 + 25},${180 - (point.value * factor)}`).join(' ');
  }
});

const areaPoints = computed(() => {
  const pts = points.value;
  if (!pts || pts === '25,90') return '25,180 25,180';
  return `25,180 ${pts} ${(props.data.length - 1) * 50 + 25},180`;
});
</script>

<template>
  <div class="glass-card an-chart-card">
    <p class="an-section-eye">{{ sectionLabel }}</p>
    <h3 class="an-chart-title">{{ title }}</h3>
    <p class="an-chart-sub">{{ subtitle }}</p>
    <div class="an-chart-area">
      <svg class="an-svg" viewBox="0 0 350 180">
        <defs>
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" :style="`stop-color:${color};stop-opacity:0.28`"/>
            <stop offset="100%" :style="`stop-color:${color};stop-opacity:0`"/>
          </linearGradient>
        </defs>
        <polygon :points="areaPoints" :fill="`url(#${gradientId})`"/>
        <polyline :points="points" fill="none" :stroke="color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle v-for="(point, i) in data" :key="i"
          :cx="i * 50 + 25"
          :cy="useMaxScale ? 180 - (point.value / Math.max(...data.map(d => d.value), 1)) * 150 : 180 - (point.value * (scaleFactor || 1))"
          r="4" :fill="color" stroke="white" stroke-width="2"/>
      </svg>
      <div class="an-chart-labels">
        <span v-for="day in dayLabels" :key="day">{{ day }}</span>
      </div>
    </div>
  </div>
</template>
