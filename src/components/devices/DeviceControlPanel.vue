<template>
  <div class="device-control-panel">
    <div class="control-section" v-if="device.type === 'Light'">
      <h4>Light Control</h4>
      
      <div class="control-row">
        <label>Power</label>
        <button 
          class="btn-toggle-large" 
          :class="device.status === 'on' ? 'on' : 'off'"
          @click="togglePower"
          :disabled="!isOnline || readonly"
        >
          <i :class="device.status === 'on' ? 'pi pi-lightbulb' : 'pi pi-lightbulb-off'"></i>
          <span>{{ device.status === 'on' ? 'ON' : 'OFF' }}</span>
        </button>
      </div>
      
      <div class="control-row" v-if="capabilities.brightness !== undefined">
        <label>Brightness</label>
        <div class="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            :value="localBrightness !== null ? localBrightness : capabilities.brightness"
            @input="updateLocalBrightness"
            @change="confirmBrightness"
            :disabled="!isOnline || readonly"
          />
          <span class="slider-value">{{ localBrightness !== null ? localBrightness : capabilities.brightness }}%</span>
        </div>
      </div>
      
      <div class="control-row" v-if="capabilities.color">
        <label>Color</label>
        <div class="color-controls">
          <input
            type="color"
            :value="rgbToHex(capabilities.color.spectrumRgb)"
            @change="updateColor"
            :disabled="!isOnline || readonly"
          />
          <span class="color-value">RGB: {{ capabilities.color.spectrumRgb || '—' }}</span>
        </div>
      </div>
      
      <div class="control-row" v-if="capabilities.color?.temperatureK">
        <label>Temperature</label>
        <div class="slider-container">
          <input
            type="range"
            min="2000"
            max="6500"
            :value="localTemp !== null ? localTemp : capabilities.color.temperatureK"
            @input="updateLocalTemp"
            @change="confirmTemp"
            :disabled="!isOnline || readonly"
          />
          <span class="slider-value">{{ localTemp !== null ? localTemp : capabilities.color.temperatureK }}K</span>
        </div>
      </div>
    </div>
    
    <div class="control-section" v-if="device.type === 'Thermostat'">
      <h4>Thermostat Control</h4>
      
      <div class="thermostat-display">
        <div class="current-temp">
          <span class="temp-value">{{ capabilities.currentTemperature || '—' }}°C</span>
          <span class="temp-label">Current</span>
        </div>
        <div class="target-temp">
          <span class="temp-value">{{ capabilities.targetTemperature || '—' }}°C</span>
          <span class="temp-label">Target</span>
        </div>
      </div>
      
      <div class="control-row">
        <label>Mode</label>
        <div class="mode-buttons">
          <button
            v-for="mode in thermostatModes"
            :key="mode"
            class="mode-btn"
            :class="{ active: capabilities.thermostatMode === mode }"
            @click="setMode(mode)"
            :disabled="!isOnline || readonly"
          >
            {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
          </button>
        </div>
      </div>
      
      <div class="control-row" v-if="capabilities.targetTemperature !== undefined">
        <label>Target Temperature</label>
        <div class="slider-container">
          <input
            type="range"
            min="16"
            max="30"
            step="0.5"
            :value="localTemp !== null ? localTemp : capabilities.targetTemperature"
            @input="updateLocalTemp"
            @change="confirmTemp"
            :disabled="!isOnline || readonly"
          />
          <span class="slider-value">{{ localTemp !== null ? localTemp : capabilities.targetTemperature }}°C</span>
        </div>
      </div>
    </div>
    
    <div class="control-section" v-if="device.type === 'Lock'">
      <h4>Lock Control</h4>
      
      <div class="lock-status-large" :class="device.status">
        <i :class="device.status === 'locked' ? 'pi pi-lock' : 'pi pi-lock-open'"></i>
        <span>{{ getLockStatusText(device.status) }}</span>
      </div>
      
      <div class="control-row">
        <button
          class="btn-toggle-large"
          :class="device.status === 'locked' ? 'locked' : 'unlocked'"
          @click="toggleLock"
          :disabled="!isOnline || readonly"
        >
          <i :class="device.status === 'locked' ? 'pi pi-lock-open' : 'pi pi-lock'"></i>
          <span>{{ device.status === 'locked' ? 'Unlock' : 'Lock' }}</span>
        </button>
      </div>
    </div>
    
    <div class="control-section" v-if="['Fan', 'Air conditioner', 'Garage', 'Curtain'].includes(device.type)">
      <h4>{{ device.type }} Control</h4>
      
      <div class="control-row">
        <label>Power</label>
        <button 
          class="btn-toggle-large" 
          :class="device.status === 'on' ? 'on' : 'off'"
          @click="togglePower"
          :disabled="!isOnline || readonly"
        >
          <i :class="getDeviceIcon(device.type)"></i>
          <span>{{ device.status === 'on' ? 'ON' : 'OFF' }}</span>
        </button>
      </div>
      
      <div class="control-row" v-if="device.type === 'Fan' && capabilities.speed !== undefined">
        <label>Speed</label>
        <div class="slider-container">
          <input
            type="range"
            min="1"
            max="3"
            :value="localSpeed !== null ? localSpeed : capabilities.speed"
            @input="updateLocalSpeed"
            @change="confirmSpeed"
            :disabled="!isOnline || readonly"
          />
          <span class="slider-value">Level {{ localSpeed !== null ? localSpeed : capabilities.speed }}</span>
        </div>
      </div>
      
      <div class="control-row" v-if="device.type === 'Curtain' && capabilities.position !== undefined">
        <label>Position</label>
        <div class="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            :value="localPosition !== null ? localPosition : capabilities.position"
            @input="updateLocalPosition"
            @change="confirmPosition"
            :disabled="!isOnline || readonly"
          />
          <span class="slider-value">{{ localPosition !== null ? localPosition : capabilities.position }}%</span>
        </div>
      </div>
    </div>
    
    <div class="control-section" v-if="device.type === 'Camera'">
      <h4>Camera Control</h4>
      
      <div class="control-row">
        <label>Stream</label>
        <button 
          class="btn-toggle-large" 
          :class="device.status === 'on' ? 'on' : 'off'"
          @click="togglePower"
          :disabled="!isOnline || readonly"
        >
          <i :class="device.status === 'on' ? 'pi pi-video' : 'pi pi-video-off'"></i>
          <span>{{ device.status === 'on' ? 'LIVE' : 'OFF' }}</span>
        </button>
      </div>
    </div>
    
    <div class="control-section" v-if="!hasControls">
      <div class="no-controls">
        <i class="pi pi-info-circle"></i>
        <p>No controls available for this device type</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import socketService from '@/services/socket'

const props = defineProps({
  device: { type: Object, required: true },
  readonly: { type: Boolean, default: false }
})

const emit = defineEmits(['update'])

const capabilities = computed(() => props.device.capabilities || {})
const isOnline = computed(() => props.device.active && props.device.status !== 'offline')

const localBrightness = ref(null)
const localTemp = ref(null)
const localSpeed = ref(null)
const localPosition = ref(null)

const thermostatModes = ['heat', 'cool', 'auto', 'off']

const hasControls = computed(() => {
  const controlledTypes = ['Light', 'Thermostat', 'Lock', 'Fan', 'Air conditioner', 'Garage', 'Curtain', 'Camera']
  return controlledTypes.includes(props.device.type)
})

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

function getDeviceIcon(type) {
  return deviceIcons[type] || 'pi pi-wifi'
}

function getLockStatusText(status) {
  const statusMap = {
    'locked': 'Locked',
    'unlocked': 'Unlocked',
    'on': 'Locked',
    'off': 'Unlocked'
  }
  return statusMap[status] || status
}

function rgbToHex(rgb) {
  if (!rgb) return '#ffffff'
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = rgb & 0xff
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? (parseInt(result[1], 16) << 16) + (parseInt(result[2], 16) << 8) + parseInt(result[3], 16) : null
}

function togglePower() {
  if (!isOnline.value || props.readonly) return
  const newState = props.device.status === 'on' ? 'off' : 'on'
  socketService.updateDeviceState(props.device._id, newState)
  emit('update', { ...props.device, status: newState })
}

function updateLocalBrightness(e) {
  localBrightness.value = parseInt(e.target.value)
}

function confirmBrightness(e) {
  if (!isOnline.value || props.readonly) return
  const value = parseInt(e.target.value)
  socketService.updateDeviceState(props.device._id, { brightness: value })
  localBrightness.value = null
  emit('update', { ...props.device, capabilities: { ...capabilities.value, brightness: value } })
}

function updateColor(e) {
  const rgb = hexToRgb(e.target.value)
  if (rgb !== null) {
    socketService.updateDeviceState(props.device._id, { color: { spectrumRgb: rgb } })
    emit('update', { ...props.device, capabilities: { ...capabilities.value, color: { ...capabilities.value.color, spectrumRgb: rgb } } })
  }
}

function updateLocalTemp(e) {
  localTemp.value = parseFloat(e.target.value)
}

function confirmTemp(e) {
  if (!isOnline.value || props.readonly) return
  const value = parseFloat(e.target.value)
  const updateKey = props.device.type === 'Thermostat' ? 'targetTemperature' : 'color.temperatureK'
  const update = updateKey.includes('.') 
    ? { color: { ...capabilities.value.color, temperatureK: value } }
    : { targetTemperature: value }
  socketService.updateDeviceState(props.device._id, update)
  localTemp.value = null
  emit('update', { ...props.device, capabilities: { ...capabilities.value, ...update } })
}

function setMode(mode) {
  if (!isOnline.value || props.readonly) return
  socketService.updateDeviceState(props.device._id, { thermostatMode: mode })
  emit('update', { ...props.device, capabilities: { ...capabilities.value, thermostatMode: mode } })
}

function toggleLock() {
  if (!isOnline.value || props.readonly) return
  const newState = props.device.status === 'locked' ? 'unlocked' : 'locked'
  socketService.updateDeviceState(props.device._id, newState)
  emit('update', { ...props.device, status: newState })
}

function updateLocalSpeed(e) {
  localSpeed.value = parseInt(e.target.value)
}

function confirmSpeed(e) {
  if (!isOnline.value || props.readonly) return
  const value = parseInt(e.target.value)
  socketService.updateDeviceState(props.device._id, { speed: value })
  localSpeed.value = null
  emit('update', { ...props.device, capabilities: { ...capabilities.value, speed: value } })
}

function updateLocalPosition(e) {
  localPosition.value = parseInt(e.target.value)
}

function confirmPosition(e) {
  if (!isOnline.value || props.readonly) return
  const value = parseInt(e.target.value)
  socketService.updateDeviceState(props.device._id, { position: value })
  localPosition.value = null
  emit('update', { ...props.device, capabilities: { ...capabilities.value, position: value } })
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.device-control-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-section h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color-secondary);
  }
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  input[type="range"] {
    flex: 1;
    accent-color: var(--primary-color);
  }
  
  .slider-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
    min-width: 60px;
    text-align: right;
  }
}

.color-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  input[type="color"] {
    width: 50px;
    height: 36px;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
  }
  
  .color-value {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
  }
}

.thermostat-display {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  
  .current-temp,
  .target-temp {
    flex: 1;
    text-align: center;
    
    .temp-value {
      display: block;
      font-size: 3rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1;
    }
    
    .temp-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

.mode-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  background: var(--surface-card);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  
  &.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.lock-status-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  
  i {
    font-size: 4rem;
  }
  
  span {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  &.locked {
    i { color: var(--green-500); }
    span { color: var(--green-600); }
  }
  
  &.unlocked {
    i { color: var(--red-500); }
    span { color: var(--red-600); }
  }
}

.btn-toggle-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.on { background: var(--green-100); color: var(--green-600); }
  &.off { background: var(--red-100); color: var(--red-600); }
  &.locked { background: var(--green-100); color: var(--green-600); }
  &.unlocked { background: var(--red-100); color: var(--red-600); }
  
  &:hover:not(:disabled) {
    transform: scale(1.02);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.no-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--text-color-secondary);
  background: var(--surface-ground);
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