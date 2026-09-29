<template>
  <div class="device-card" :class="{ 'device-offline': !isOnline }">
    <div class="device-header">
      <div class="device-icon" :class="iconClass">
        <i :class="deviceIcon"></i>
      </div>
      <div class="device-status-indicator" :class="isOnline ? 'online' : 'offline'"></div>
    </div>
    
    <div class="device-body">
      <h3>{{ device.name }}</h3>
      <p class="device-type">{{ device.type }}</p>
      
      <div class="device-state" v-if="device.type === 'Light' && device.capabilities?.brightness !== undefined">
        <label>Brightness</label>
        <div class="state-bar">
          <input 
            type="range" 
            :min="0" 
            :max="100" 
            :value="device.capabilities.brightness" 
            @input="updateBrightness($event.target.value)"
            @change="confirmBrightness($event.target.value)"
            :disabled="!isOnline || deviceReadonly"
          />
          <span class="state-value">{{ device.capabilities.brightness }}%</span>
        </div>
      </div>
      
      <div class="device-state" v-if="device.type === 'Thermostat' && device.capabilities?.targetTemperature !== undefined">
        <label>Target: {{ device.capabilities.targetTemperature }}°C</label>
        <div class="state-bar">
          <input 
            type="range" 
            :min="16" 
            :max="30" 
            :step="0.5"
            :value="device.capabilities.targetTemperature" 
            @input="updateTemp($event.target.value)"
            @change="confirmTemp($event.target.value)"
            :disabled="!isOnline || deviceReadonly"
          />
          <span class="state-value">{{ device.capabilities.currentTemperature || '—' }}°C current</span>
        </div>
      </div>
      
      <div class="device-state" v-if="device.type === 'Lock'">
        <label>Status</label>
        <div class="state-toggle">
          <span class="lock-status" :class="device.status">{{ getLockStatusText(device.status) }}</span>
          <button 
            class="btn-toggle" 
            :class="device.status === 'locked' ? 'locked' : 'unlocked'"
            @click="toggleLock"
            :disabled="!isOnline || deviceReadonly"
          >
            <i :class="device.status === 'locked' ? 'pi pi-lock' : 'pi pi-lock-open'"></i>
          </button>
        </div>
      </div>
      
      <div class="device-state" v-if="['Light', 'Fan', 'Air conditioner', 'Garage', 'Curtain'].includes(device.type) && device.type !== 'Lock' && device.type !== 'Thermostat'">
        <label>Power</label>
        <div class="state-toggle">
          <span class="power-status" :class="device.status">{{ device.status === 'on' ? 'ON' : 'OFF' }}</span>
          <button 
            class="btn-toggle" 
            :class="device.status === 'on' ? 'on' : 'off'"
            @click="togglePower"
            :disabled="!isOnline || deviceReadonly"
          >
            <i class="pi pi-power-off"></i>
          </button>
        </div>
      </div>
      
      <div class="device-state" v-if="device.type === 'Camera'">
        <label>Streaming</label>
        <div class="state-toggle">
          <span class="power-status" :class="device.status">{{ device.status === 'on' ? 'LIVE' : 'OFF' }}</span>
          <button 
            class="btn-toggle" 
            :class="device.status === 'on' ? 'on' : 'off'"
            @click="togglePower"
            :disabled="!isOnline || deviceReadonly"
          >
            <i class="pi pi-video"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div class="device-footer">
      <span class="device-order">Order: {{ device.order }}</span>
      <span class="device-room" v-if="device.room">{{ device.room.name || 'Unknown Room' }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import socketService from '@/services/socket'
import { useToast } from 'vue-toastification'

const props = defineProps({
  device: { type: Object, required: true },
  readonly: { type: Boolean, default: false }
})

const emit = defineEmits(['update'])

const toast = useToast()
const deviceReadonly = props.readonly
const localBrightness = ref(null)
const localTemp = ref(null)

const isOnline = computed(() => props.device.active && props.device.status !== 'offline')

const deviceIcons = {
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

const deviceIcon = computed(() => deviceIcons[props.device.type] || 'pi pi-wifi')
const iconClass = computed(() => iconClasses[props.device.type] || 'icon-gray')

function getLockStatusText(status) {
  const statusMap = {
    'locked': 'Locked',
    'unlocked': 'Unlocked',
    'on': 'Locked',
    'off': 'Unlocked'
  }
  return statusMap[status] || status
}

function updateBrightness(value) {
  localBrightness.value = value
}

function confirmBrightness(value) {
  if (!isOnline.value || deviceReadonly) return
  
  socketService.updateDeviceState(props.device._id, { brightness: parseInt(value) })
  localBrightness.value = null
  emit('update', { ...props.device, capabilities: { ...props.device.capabilities, brightness: parseInt(value) } })
}

function updateTemp(value) {
  localTemp.value = value
}

function confirmTemp(value) {
  if (!isOnline.value || deviceReadonly) return
  
  socketService.updateDeviceState(props.device._id, { targetTemperature: parseFloat(value) })
  localTemp.value = null
  emit('update', { ...props.device, capabilities: { ...props.device.capabilities, targetTemperature: parseFloat(value) } })
}

function togglePower() {
  if (!isOnline.value || deviceReadonly) return
  
  const newState = props.device.status === 'on' ? 'off' : 'on'
  socketService.updateDeviceState(props.device._id, newState)
  emit('update', { ...props.device, status: newState })
}

function toggleLock() {
  if (!isOnline.value || deviceReadonly) return
  
  const newState = props.device.status === 'locked' ? 'unlocked' : 'locked'
  socketService.updateDeviceState(props.device._id, newState)
  emit('update', { ...props.device, status: newState })
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.device-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-2);
    transform: translateY(-2px);
  }
  
  &.device-offline {
    opacity: 0.7;
    
    .device-icon {
      opacity: 0.5;
    }
  }
}

.device-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 0;
}

.device-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
  
  &.icon-yellow { background: var(--yellow-100); color: var(--yellow-600); }
  &.icon-orange { background: var(--orange-100); color: var(--orange-600); }
  &.icon-blue { background: var(--blue-100); color: var(--blue-600); }
  &.icon-purple { background: var(--purple-100); color: var(--purple-600); }
  &.icon-cyan { background: var(--cyan-100); color: var(--cyan-600); }
  &.icon-teal { background: var(--teal-100); color: var(--teal-600); }
  &.icon-gray { background: var(--gray-100); color: var(--gray-600); }
  &.icon-pink { background: var(--pink-100); color: var(--pink-600); }
}

.device-status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--surface-card);
  flex-shrink: 0;
  
  &.online { background: var(--green-500); }
  &.offline { background: var(--red-500); }
}

.device-body {
  padding: 1rem 1.25rem;
  
  h3 {
    margin: 0 0 0.25rem;
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .device-type {
    margin: 0 0 1rem;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
  }
}

.device-state {
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-color-secondary);
  }
}

.state-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  input[type="range"] {
    flex: 1;
    accent-color: var(--primary-color);
  }
  
  .state-value {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    min-width: 80px;
  }
}

.state-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .power-status,
  .lock-status {
    padding: 0.375rem 0.875rem;
    border-radius: var(--border-radius);
    font-size: 0.8125rem;
    font-weight: 600;
    
    &.on, &.locked { background: var(--green-100); color: var(--green-600); }
    &.off, &.unlocked { background: var(--red-100); color: var(--red-600); }
  }
}

.btn-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.on { background: var(--green-100); color: var(--green-600); }
  &.off { background: var(--red-100); color: var(--red-600); }
  &.locked { background: var(--green-100); color: var(--green-600); }
  &.unlocked { background: var(--red-100); color: var(--red-600); }
  
  &:hover:not(:disabled) {
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.device-footer {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: var(--surface-ground);
  border-top: 1px solid var(--surface-border);
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
</style>