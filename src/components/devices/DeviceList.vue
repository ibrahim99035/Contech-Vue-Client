<template>
  <div class="device-list">
    <div class="list-header">
      <div class="device-stats">
        <span class="stat" v-for="stat in deviceStats" :key="stat.label">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </span>
      </div>
    </div>
    
    <div class="device-grid" v-if="devices.length > 0">
      <DeviceCard
        v-for="device in devices"
        :key="device._id"
        :device="device"
        @click="$emit('view-device', device)"
      />
    </div>
    
    <div class="empty-state" v-if="devices.length === 0 && !loading">
      <i class="pi pi-wifi"></i>
      <p>No devices found</p>
    </div>
    
    <div class="loading-grid" v-if="loading">
      <div class="device-card skeleton" v-for="i in 6" :key="i">
        <div class="skeleton-icon"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
        <div class="skeleton-bar"></div>
        <div class="skeleton-bar short"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DeviceCard from '@/components/devices/DeviceCard.vue'

const props = defineProps({
  devices: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

defineEmits(['view-device'])

const deviceStats = computed(() => [
  { label: 'Total', value: props.devices.length },
  { label: 'Online', value: props.devices.filter(d => d.active && d.status !== 'offline').length },
  { label: 'Offline', value: props.devices.filter(d => !d.active || d.status === 'offline').length }
])
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.device-list {
  .list-header {
    margin-bottom: 1rem;
  }
  
  .device-stats {
    display: flex;
    gap: 2rem;
    
    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      
      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-color);
      }
      
      .stat-label {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.device-card.skeleton {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: 1.25rem;
  animation: pulse 1.5s ease-in-out infinite;
  
  .skeleton-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--border-radius);
    background: linear-gradient(90deg, var(--surface-200) 25%, var(--surface-300) 50%, var(--surface-200) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: 1rem;
  }
  
  .skeleton-text {
    height: 1rem;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--surface-200) 25%, var(--surface-300) 50%, var(--surface-200) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: 0.5rem;
    
    &.short { width: 60%; }
  }
  
  .skeleton-bar {
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--surface-200) 25%, var(--surface-300) 50%, var(--surface-200) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: 0.5rem;
    
    &.short { width: 40%; }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
  }
}
</style>