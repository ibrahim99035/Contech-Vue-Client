<template>
  <div class="capabilities-display">
    <div class="capability-group" v-for="(group, groupName) in groupedCapabilities" :key="groupName">
      <h4>{{ formatGroupName(groupName) }}</h4>
      <dl class="capability-list">
        <div class="capability-item" v-for="(value, key) in group" :key="key">
          <dt>{{ formatKey(key) }}</dt>
          <dd>{{ formatValue(key, value) }}</dd>
        </div>
      </dl>
    </div>
    
    <div class="no-capabilities" v-if="Object.keys(groupedCapabilities).length === 0">
      <i class="pi pi-info-circle"></i>
      <p>No capabilities configured for this device</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  capabilities: { type: Object, default: () => ({}) },
  type: { type: String, default: '' }
})

const groupedCapabilities = computed(() => {
  const caps = props.capabilities || {}
  const groups = {}
  
  if (props.type === 'Light') {
    if (caps.brightness !== undefined) groups['Light Settings'] = { brightness: caps.brightness }
    if (caps.color) groups['Color'] = { spectrumRgb: caps.color.spectrumRgb, temperatureK: caps.color.temperatureK }
    if (caps.nicknames) groups['Other'] = { nicknames: caps.nicknames }
  } else if (props.type === 'Thermostat') {
    if (caps.targetTemperature !== undefined || caps.currentTemperature !== undefined || caps.thermostatMode) {
      groups['Temperature'] = {
        targetTemperature: caps.targetTemperature,
        currentTemperature: caps.currentTemperature,
        thermostatMode: caps.thermostatMode
      }
    }
  } else if (props.type === 'Lock') {
    if (caps.lockState) groups['Lock'] = { lockState: caps.lockState }
  } else if (props.type === 'Fan') {
    if (caps.speed !== undefined) groups['Fan Settings'] = { speed: caps.speed }
  } else if (props.type === 'Curtain') {
    if (caps.position !== undefined) groups['Curtain Settings'] = { position: caps.position }
  } else {
    // Generic grouping
    Object.entries(caps).forEach(([key, value]) => {
      const group = getGroupForKey(key)
      if (!groups[group]) groups[group] = {}
      groups[group][key] = value
    })
  }
  
  return groups
})

function getGroupForKey(key) {
  const groups = {
    'brightness': 'Light Settings',
    'color': 'Color',
    'spectrumRgb': 'Color',
    'temperatureK': 'Color',
    'targetTemperature': 'Temperature',
    'currentTemperature': 'Temperature',
    'thermostatMode': 'Temperature',
    'lockState': 'Lock',
    'speed': 'Fan Settings',
    'position': 'Curtain Settings',
    'nicknames': 'Other'
  }
  return groups[key] || 'Other'
}

function formatGroupName(name) {
  return name
}

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

function formatValue(key, value) {
  if (value === null || value === undefined) return '—'
  
  if (key === 'spectrumRgb' && typeof value === 'number') {
    const r = (value >> 16) & 0xff
    const g = (value >> 8) & 0xff
    const b = value & 0xff
    return `RGB(${r}, ${g}, ${b})`
  }
  
  if (key === 'temperatureK' && typeof value === 'number') {
    return `${value} K`
  }
  
  if (key === 'brightness' && typeof value === 'number') {
    return `${value}%`
  }
  
  if (key === 'speed' && typeof value === 'number') {
    return `Level ${value}`
  }
  
  if (key === 'position' && typeof value === 'number') {
    return `${value}%`
  }
  
  if (key === 'thermostatMode') {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  
  if (key === 'lockState') {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  
  return value
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.capabilities-display {
  .capability-group {
    margin-bottom: 1.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }
  }
}

.capability-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.capability-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  
  dt {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
  }
  
  dd {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--text-color);
    font-family: monospace;
    word-break: break-all;
  }
}

.no-capabilities {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  
  i {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
  }
}
</style>