<template>
  <Dialog 
    :visible="visible" 
    header="Create Room"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <form @submit.prevent="handleSubmit" class="dialog-form">
      <div class="form-group">
        <label for="name">Room Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Enter room name"
          required
          maxlength="100"
          autofocus
        />
      </div>
      
      <div class="form-group">
        <label for="type">Room Type</label>
        <select
          id="type"
          v-model="form.type"
          class="form-input"
        >
          <!-- values must match ROOM_TYPES in the server's roomValidation.js -->
          <option value="living_room">Living Room</option>
          <option value="bedroom">Bedroom</option>
          <option value="kitchen">Kitchen</option>
          <option value="bathroom">Bathroom</option>
          <option value="dining_room">Dining Room</option>
          <option value="office">Office</option>
          <option value="garage">Garage</option>
          <option value="balcony">Balcony</option>
          <option value="basement">Basement</option>
          <option value="attic">Attic</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="roomPassword">Room Password (Optional)</label>
        <div class="password-input-wrapper">
          <input
            id="roomPassword"
            v-model="form.roomPassword"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Set a password for this room"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
          >
            <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
        <p class="form-hint">Leave empty for no password protection</p>
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="onClose">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting"><i class="pi pi-spin pi-spinner"></i> Creating...</span>
          <span v-else>Create Room</span>
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useToast } from 'vue-toastification'
import Dialog from 'primevue/dialog'

const props = defineProps({
  visible: { type: Boolean, default: false },
  apartmentId: { type: String, required: true }
})

const emit = defineEmits(['update:visible', 'created'])

const roomStore = useRoomStore()
const toast = useToast()

const form = ref({
  name: '',
  type: 'bedroom',
  roomPassword: ''
})
const showPassword = ref(false)
const submitting = ref(false)

function onClose() {
  emit('update:visible', false)
  form.value = { name: '', type: 'bedroom', roomPassword: '' }
  showPassword.value = false
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.name.trim()) return
  
  submitting.value = true
  try {
    await roomStore.createRoom({
      name: form.value.name.trim(),
      apartment: props.apartmentId,
      type: form.value.type,
      roomPassword: form.value.roomPassword || undefined
    })
    emit('created')
    toast.success('Room created successfully!')
    onClose()
  } catch (error) {
    // Error handled in store
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.password-input-wrapper {
  position: relative;
  
  .form-input {
    padding-right: 3rem;
  }
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--text-color);
  }
}

.form-hint {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
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