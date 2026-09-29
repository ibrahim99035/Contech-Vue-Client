<template>
  <Dialog 
    :visible="visible" 
    header="Create Device"
    :style="{ width: '600px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <form @submit.prevent="handleSubmit" class="dialog-form">
      <div class="form-row">
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
        
        <div class="form-group">
          <label for="type">Device Type <span class="required">*</span></label>
          <select
            id="type"
            v-model="form.type"
            class="form-input"
            required
          >
            <option value="">Select type</option>
            <option v-for="type in deviceTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="room">Room <span class="required">*</span></label>
          <select
            id="room"
            v-model="form.room"
            class="form-input"
            required
          >
            <option value="">Select room</option>
            <option v-for="room in availableRooms" :key="room._id" :value="room._id">{{ room.name }}</option>
          </select>
        </div>
        
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
      </div>
      
      <div class="form-group" v-if="showCapabilities">
        <label>Capabilities</label>
        <CapabilitiesInput
          v-model="form.capabilities"
          :type="form.type"
        />
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="onClose">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting || !form.room">
          <span v-if="submitting"><i class="pi pi-spin pi-spinner"></i> Creating...</span>
          <span v-else>Create Device</span>
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { useRoomStore } from '@/stores/room'
import { useToast } from 'vue-toastification'
import Dialog from 'primevue/dialog'
import CapabilitiesInput from '@/components/devices/CapabilitiesInput.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  roomId: { type: String, default: null },
  preselectedType: { type: String, default: null }
})

const emit = defineEmits(['update:visible', 'created'])

const deviceStore = useDeviceStore()
const roomStore = useRoomStore()
const toast = useToast()

const form = ref({
  name: '',
  type: '',
  room: '',
  order: 1,
  capabilities: {}
})
const submitting = ref(false)
const availableRooms = ref([])
const availableOrders = ref([])
const deviceTypes = computed(() => deviceStore.DEVICE_TYPES)

const showCapabilities = computed(() => {
  return ['Light', 'Thermostat', 'Lock', 'Camera'].includes(form.value.type)
})

async function loadRooms() {
  try {
    const response = await roomStore.fetchUserRooms()
    availableRooms.value = response.data || []
    
    if (props.roomId) {
      form.value.room = props.roomId
    } else if (availableRooms.value.length > 0) {
      form.value.room = availableRooms.value[0]._id
    }
    await loadAvailableOrders()
  } catch (error) {
    console.error('Failed to load rooms:', error)
  }
}

async function loadAvailableOrders() {
  if (!form.value.room) return
  try {
    const orders = await deviceStore.fetchAvailableOrders(form.value.room)
    availableOrders.value = orders || []
    if (availableOrders.value.length > 0 && !form.value.order) {
      form.value.order = availableOrders.value[0]
    }
  } catch (error) {
    console.error('Failed to load orders:', error)
  }
}

function onClose() {
  emit('update:visible', false)
  form.value = { name: '', type: '', room: '', order: 1, capabilities: {} }
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.name.trim() || !form.value.type || !form.value.room) return
  
  submitting.value = true
  try {
    const deviceData = {
      name: form.value.name.trim(),
      type: form.value.type,
      room: form.value.room,
      order: form.value.order
    }
    
    if (showCapabilities.value && Object.keys(form.value.capabilities).length > 0) {
      deviceData.capabilities = form.value.capabilities
    }
    
    await deviceStore.createDevice(deviceData)
    emit('created')
    toast.success('Device created successfully!')
    onClose()
  } catch (error) {
    // Error handled in store
  } finally {
    submitting.value = false
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    loadRooms()
    if (props.preselectedType) {
      form.value.type = props.preselectedType
    }
  } else {
    onClose()
  }
}, { immediate: true })

watch(() => form.value.room, () => {
  loadAvailableOrders()
})

watch(() => form.value.type, (newType) => {
  if (newType && !showCapabilities.value) {
    form.value.capabilities = {}
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
    
    .required {
      color: var(--red-500);
    }
  }
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  font-size: 1rem;
  color: var(--text-color);
  background: var(--surface-ground);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-100);
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--primary-600);
  }
}

.btn-secondary {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  
  &:hover:not(:disabled) {
    background: var(--surface-hover);
  }
}
</style>