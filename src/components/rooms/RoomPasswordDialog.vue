<template>
  <Dialog 
    :visible="visible" 
    :header="room?.hasPassword ? 'Change Room Password' : 'Set Room Password'"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <form @submit.prevent="handleSubmit" class="dialog-form">
      <div class="form-group">
        <label for="currentPassword">Current Password</label>
        <div class="password-input-wrapper" v-if="room?.hasPassword">
          <input
            id="currentPassword"
            v-model="form.currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Enter current password"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showCurrentPassword = !showCurrentPassword"
            :aria-label="showCurrentPassword ? 'Hide' : 'Show'"
          >
            <i :class="showCurrentPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
        <p class="form-hint" v-if="!room?.hasPassword">No password currently set</p>
      </div>
      
      <div class="form-group">
        <label for="newPassword">New Password <span class="required">*</span></label>
        <div class="password-input-wrapper">
          <input
            id="newPassword"
            v-model="form.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Enter new password (leave empty to remove)"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showNewPassword = !showNewPassword"
            :aria-label="showNewPassword ? 'Hide' : 'Show'"
          >
            <i :class="showNewPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
        <p class="form-hint">Leave empty to remove password protection</p>
      </div>
      
      <div class="form-group" v-if="form.newPassword">
        <label for="confirmPassword">Confirm New Password</label>
        <div class="password-input-wrapper">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showNewPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ error: form.confirmPassword && form.newPassword !== form.confirmPassword }"
            placeholder="Confirm new password"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showNewPassword = !showNewPassword"
            :aria-label="showNewPassword ? 'Hide' : 'Show'"
          >
            <i :class="showNewPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
        <p class="error-text" v-if="form.confirmPassword && form.newPassword !== form.confirmPassword">
          Passwords do not match
        </p>
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="onClose">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting || (form.newPassword && form.newPassword !== form.confirmPassword)">
          <span v-if="submitting"><i class="pi pi-spin pi-spinner"></i> Updating...</span>
          <span v-else>{{ room?.hasPassword ? 'Change Password' : 'Set Password' }}</span>
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useToast } from 'vue-toastification'
import Dialog from 'primevue/dialog'

const props = defineProps({
  visible: { type: Boolean, default: false },
  room: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'updated'])

const roomStore = useRoomStore()
const toast = useToast()

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const submitting = ref(false)

function onClose() {
  emit('update:visible', false)
  form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  showCurrentPassword.value = false
  showNewPassword.value = false
  submitting.value = false
}

async function handleSubmit() {
  if (form.value.newPassword && form.value.newPassword !== form.value.confirmPassword) return
  
  submitting.value = true
  try {
    await roomStore.updateRoomPassword(props.room._id || props.room.id, form.value.newPassword || undefined)
    emit('updated')
    toast.success(form.value.newPassword ? 'Password updated successfully!' : 'Password removed successfully!')
    onClose()
  } catch (error) {
    // Error handled in store
  } finally {
    submitting.value = false
  }
}

watch(() => props.visible, (visible) => {
  if (!visible) onClose()
})
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

.error-text {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--red-500);
}

.form-input.error {
  border-color: var(--red-500);
  
  &:focus {
    box-shadow: 0 0 0 3px var(--red-100);
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