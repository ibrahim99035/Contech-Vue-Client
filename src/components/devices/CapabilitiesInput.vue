<template>
  <div class="capabilities-input">
    <div class="capability-section" v-if="type === 'Light'">
      <h4>Light Settings</h4>
      
      <div class="form-group">
        <label for="brightness">Brightness (0-100)</label>
        <input
          id="brightness"
          v-model.number="brightness"
          type="number"
          class="form-input"
          min="0"
          max="100"
          placeholder="50"
        />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="spectrumRgb">Color (Hex)</label>
          <div class="color-input-wrapper">
            <input
              id="spectrumRgb"
              v-model="colorHex"
              type="color"
              class="color-input"
              @change="updateColorFromHex"
            />
            <input
              type="text"
              v-model="colorHex"
              class="form-input"
              placeholder="#FFFFFF"
              @input="updateColorFromHexInput"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="temperatureK">Temperature (2000-6500K)</label>
          <input
            id="temperatureK"
            :value="temperatureK"
            @input="updateTemperatureK"
            type="number"
            class="form-input"
            min="2000"
            max="6500"
            placeholder="4000"
          />
        </div>
      </div>
    </div>
    
    <div class="capability-section" v-if="type === 'Thermostat'">
      <h4>Thermostat Settings</h4>
      
      <div class="form-row">
        <div class="form-group">
          <label for="targetTemperature">Target Temperature (16-30°C)</label>
          <input
            id="targetTemperature"
            v-model.number="targetTemperature"
            type="number"
            class="form-input"
            min="16"
            max="30"
            step="0.5"
            placeholder="22"
          />
        </div>
        
        <div class="form-group">
          <label for="thermostatMode">Mode</label>
          <select
            id="thermostatMode"
            v-model="thermostatMode"
            class="form-input"
          >
            <option value="heat">Heat</option>
            <option value="cool">Cool</option>
            <option value="auto">Auto</option>
            <option value="off">Off</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="capability-section" v-if="type === 'Lock'">
      <h4>Lock Settings</h4>
      
      <div class="form-group">
        <label for="lockState">Default State</label>
        <select
          id="lockState"
          v-model="lockState"
          class="form-input"
        >
          <option value="locked">Locked</option>
          <option value="unlocked">Unlocked</option>
        </select>
      </div>
    </div>
    
    <div class="capability-section" v-if="type === 'Fan'">
      <h4>Fan Settings</h4>
      
      <div class="form-group">
        <label for="speed">Speed (1-3)</label>
        <input
          id="speed"
          v-model.number="speed"
          type="number"
          class="form-input"
          min="1"
          max="3"
          placeholder="1"
        />
      </div>
    </div>
    
    <div class="capability-section" v-if="type === 'Curtain'">
      <h4>Curtain Settings</h4>
      
      <div class="form-group">
        <label for="position">Position (0-100%)</label>
        <input
          id="position"
          v-model.number="position"
          type="number"
          class="form-input"
          min="0"
          max="100"
          placeholder="0"
        />
      </div>
    </div>
    
    <div class="capability-section" v-if="type === 'Camera'">
      <h4>Camera Settings</h4>
      <p class="form-hint">Camera capabilities are managed automatically</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  type: { type: String, required: true }
})

const emit = defineEmits(['update:modelValue'])

function fieldModel(key) {
  return computed({
    get: () => props.modelValue[key],
    set: (value) => emit('update:modelValue', { ...props.modelValue, [key]: value })
  })
}

const brightness = fieldModel('brightness')
const targetTemperature = fieldModel('targetTemperature')
const thermostatMode = fieldModel('thermostatMode')
const lockState = fieldModel('lockState')
const speed = fieldModel('speed')
const position = fieldModel('position')

const colorHex = ref('#FFFFFF')

watch(() => props.modelValue.color?.spectrumRgb, (newVal) => {
  if (newVal) {
    colorHex.value = rgbToHex(newVal)
  }
}, { immediate: true })

watch(colorHex, (newVal) => {
  if (newVal) {
    const rgb = hexToRgb(newVal)
    if (rgb !== null) {
      emit('update:modelValue', {
        ...props.modelValue,
        color: { ...props.modelValue.color, spectrumRgb: rgb }
      })
    }
  }
})

function updateColorFromHex(e) {
  const rgb = hexToRgb(e.target.value)
  if (rgb !== null) {
    emit('update:modelValue', {
      ...props.modelValue,
      color: { ...props.modelValue.color, spectrumRgb: rgb }
    })
  }
}

function updateColorFromHexInput(e) {
  if (e.target.value.length === 7) {
    const rgb = hexToRgb(e.target.value)
    if (rgb !== null) {
      emit('update:modelValue', {
        ...props.modelValue,
        color: { ...props.modelValue.color, spectrumRgb: rgb }
      })
    }
  }
}

const temperatureK = computed(() => props.modelValue.color?.temperatureK ?? null)

function updateTemperatureK(e) {
  const value = e.target.value === '' ? null : Number(e.target.value)
  emit('update:modelValue', {
    ...props.modelValue,
    color: { ...props.modelValue.color, temperatureK: value }
  })
}

function rgbToHex(rgb) {
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = rgb & 0xff
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? (parseInt(result[1], 16) << 16) + (parseInt(result[2], 16) << 8) + parseInt(result[3], 16) : null
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.capabilities-input {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.capability-section {
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-input {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  color: var(--text-color);
  background: var(--surface-ground);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-100);
  }
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
  
  .color-input {
    width: 50px;
    height: 38px;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    flex-shrink: 0;
  }
}

.form-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-color-secondary);
}
</style>