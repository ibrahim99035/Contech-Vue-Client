<template>
  <div class="stat-card" :class="colorClass">
    <div class="stat-icon" :class="iconClass">
      <i :class="icon"></i>
    </div>
    <div class="stat-content">
      <h3>{{ title }}</h3>
      <p class="stat-value">{{ formatValue(value) }}</p>
    </div>
    <div class="stat-trend" v-if="trend" :class="{ 'trend-up': trendUp, 'trend-down': !trendUp && trend !== 'Scheduled' }">
      <i :class="trendIcon"></i>
      <span>{{ trend }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: String, required: true },
  color: { type: String, default: 'blue' },
  trend: { type: String, default: '' },
  trendUp: { type: Boolean, default: true }
})

const colorClasses = {
  blue: 'stat-blue',
  green: 'stat-green',
  purple: 'stat-purple',
  orange: 'stat-orange',
  red: 'stat-red',
  teal: 'stat-teal'
}

const colorClass = computed(() => colorClasses[props.color] || 'stat-blue')

const iconClasses = {
  blue: 'icon-blue',
  green: 'icon-green',
  purple: 'icon-purple',
  orange: 'icon-orange',
  red: 'icon-red',
  teal: 'icon-teal'
}

const iconClass = computed(() => iconClasses[props.color] || 'icon-blue')

const trendIcon = computed(() => {
  if (props.trend === 'Scheduled') return 'pi pi-clock'
  return props.trendUp ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
})

function formatValue(val) {
  if (typeof val === 'number') {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
  }
  return val
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-2);
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  
  &.icon-blue { background: var(--blue-100); color: var(--blue-600); }
  &.icon-green { background: var(--green-100); color: var(--green-600); }
  &.icon-purple { background: var(--purple-100); color: var(--purple-600); }
  &.icon-orange { background: var(--orange-100); color: var(--orange-600); }
  &.icon-red { background: var(--red-100); color: var(--red-600); }
  &.icon-teal { background: var(--teal-100); color: var(--teal-600); }
}

.stat-content {
  flex: 1;
  min-width: 0;
  
  h3 {
    margin: 0 0 0.25rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .stat-value {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.2;
  }
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  white-space: nowrap;
  
  &.trend-up {
    background: var(--green-50);
    color: var(--green-600);
  }
  
  &.trend-down {
    background: var(--red-50);
    color: var(--red-600);
  }
  
  &:not(.trend-up):not(.trend-down) {
    background: var(--blue-50);
    color: var(--blue-600);
  }
}
</style>