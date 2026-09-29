<template>
  <Dialog 
    :visible="visible" 
    header="Edit Device"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <form @submit.prevent="handleSubmit" class="dialog-form">
      <div class="form-group">
        <label for="name">Device Name <span class="required">*</span></label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Enter device name"
          required
          maxlength="100"
          autofocus
        />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="order">Order (1-6) <span class="required">*</span></label>
          <input
            id="order"
            v-model.number="form.order"
            type="number"
            class="form-input"
            min="1"
            max="6"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="active">Status</label>
          <select id="active" v-model="form.active" class="form-input">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
      
      <div class="form-group" v-if="showCapabilities">
        <label>Capabilities</label>
        <CapabilitiesInput
          v-model="form.capabilities"
          :type="device.type"
        />
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="onClose">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting"><i class="pi pi-spin pi-spinner"></i> Updating...</span>
          <span v-else>Update</span>
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { useToast } from 'vue-toastification'
import Dialog from 'primevue/dialog'
import CapabilitiesInput from '@/components/devices/CapabilitiesInput.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  device: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'updated'])

const deviceStore = useDeviceStore()
const toast = useToast()

const form = ref({
  name: '',
  order: 1,
  active: true,
  capabilities: {}
})
const submitting = ref(false)

const showCapabilities = computed(() => {
  return props.device && ['Light', 'Thermostat', 'Lock', 'Camera'].includes(props.device.type)
})

function onClose() {
  emit('update:visible', false)
  form.value = { name: '', order: 1, active: true, capabilities: {} }
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.name.trim()) return
  
  submitting.value = true
  try {
    const updates = {
      name: form.value.name.trim(),
      order: form.value.order,
      active: form.value.active
    }
    
    if (showCapabilities.value && Object.keys(form.value.capabilities).length > 0) {
      updates.capabilities = form.value.capabilities
    }
    
    await deviceStore.updateDeviceName(props.device._id, form.value.name.trim())
    
    if (form.value.order !== props.device.order) {
      await deviceStore.updateDeviceOrder(props.device._id, form.value.order)
    }
    
    if (form.value.active !== props.device.active) {
      await deviceStore.toggleDeviceActivation(props.device._id)
    }
    
    const finalDevice = { ...props.device, ...updates }
    emit('updated', finalDevice)
    toast.success('Device updated successfully!')
    onClose()
  } catch (error) {
    // Error handled in store
  } finally {
    submitting.value = false
  }
}

watch(() => props.device, (newDevice) => {
  if (newDevice) {
    form.value.name = newDevice.name
    form.value.order = newDevice.order
    form.value.active = newDevice.active
    form.value.capabilities = newDevice.capabilities || {}
  }
}, { immediate: true })

watch(() => props.visible, (visible) => {
  if (!visible) onClose()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
</style>