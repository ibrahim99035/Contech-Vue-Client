<template>
  <div class="device-type-stat">
    <div class="type-header">
      <div class="type-icon" :class="iconClass">
        <i :class="typeIcon"></i>
      </div>
      <div class="type-info">
        <h3>{{ type }}</h3>
        <p>{{ total }} devices</p>
      </div>
    </div>
    <div class="type-stats">
      <div class="stat-item online">
        <span class="stat-dot"></span>
        <span class="stat-label">Online</span>
        <span class="stat-count">{{ online }}</span>
      </div>
      <div class="stat-item offline">
        <span class="stat-dot"></span>
        <span class="stat-label">Offline</span>
        <span class="stat-count">{{ offline }}</span>
      </div>
    </div>
    <div class="type-progress" v-if="total > 0">
      <div class="progress-bar">
        <div 
          class="progress-fill online-fill" 
          :style="{ width: onlinePercentage + '%' }"
        ></div>
        <div 
          class="progress-fill offline-fill" 
          :style="{ width: offlinePercentage + '%' }"
        ></div>
      </div>
      <div class="progress-labels">
        <span>{{ onlinePercentage }}% online</span>
        <span>{{ offlinePercentage }}% offline</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
  total: { type: Number, default: 0 },
  online: { type: Number, default: 0 },
  offline: { type: Number, default: 0 }
})

const typeIcons = {
  'Light': 'pi pi-lightbulb',
  'Thermostat': 'pi pi-temperature-high',
  'Camera': 'pi pi-video',
  'Lock': 'pi pi-lock',
  'Air conditioner': 'pi pi-snowflake',
  'Fan': 'pi pi-fan',
  'Garage': 'pi pi-car',
  'Curtain': 'pi pi-window-maximize'
}

const iconClasses = {
  'Light': 'icon-yellow',
  'Thermostat': 'icon-orange',
  'Camera': 'icon-blue',
  'Lock': 'icon-purple',
  'Air conditioner': 'icon-cyan',
  'Fan': 'icon-teal',
  'Garage': 'icon-gray',
  'Curtain': 'icon-pink'
}

const typeIcon = computed(() => typeIcons[props.type] || 'pi pi-wifi')
const iconClass = computed(() => iconClasses[props.type] || 'icon-gray')

const onlinePercentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.online / props.total) * 100)
})

const offlinePercentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.offline / props.total) * 100)
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.device-type-stat {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: 1rem;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-1);
  }
}

.type-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  .type-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
    
    &.icon-yellow { background: var(--yellow-100); color: var(--yellow-600); }
    &.icon-orange { background: var(--orange-100); color: var(--orange-600); }
    &.icon-blue { background: var(--blue-100); color: var(--blue-600); }
    &.icon-purple { background: var(--purple-100); color: var(--purple-600); }
    &.icon-cyan { background: var(--cyan-100); color: var(--cyan-600); }
    &.icon-teal { background: var(--teal-100); color: var(--teal-600); }
    &.icon-gray { background: var(--gray-100); color: var(--gray-600); }
    &.icon-pink { background: var(--pink-100); color: var(--pink-600); }
  }
  
  .type-info {
    h3 {
      margin: 0 0 0.125rem;
      font-size: 0.9375rem;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
    }
  }
}

.type-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    
    .stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      
      &.online { background: var(--green-500); }
      &.offline { background: var(--red-500); }
    }
    
    .stat-label {
      color: var(--text-color-secondary);
    }
    
    .stat-count {
      font-weight: 600;
      color: var(--text-color);
    }
  }
}

.type-progress {
  .progress-bar {
    height: 6px;
    background: var(--surface-border);
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    
    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
      
      &.online-fill { background: var(--green-500); }
      &.offline-fill { background: var(--red-500); }
    }
  }
  
  .progress-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }
}
</style>