<template>
  <Dialog 
    :visible="visible" 
    header="Component Number"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <div class="dialog-content">
      <p class="dialog-description">
        The component number is a unique identifier used by the physical device to authenticate with the server.
        It will be SHA-256 hashed before storage for security.
      </p>
      
      <div class="form-group">
        <label for="componentNumber">Component Number <span class="required">*</span></label>
        <div class="password-input-wrapper">
          <input
            id="componentNumber"
            v-model="form.componentNumber"
            :type="showComponentNumber ? 'text' : 'password'"
            class="form-input"
            placeholder="Enter component number"
            required
            maxlength="100"
            autocomplete="off"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showComponentNumber = !showComponentNumber"
            :aria-label="showComponentNumber ? 'Hide' : 'Show'"
          >
            <i :class="showComponentNumber ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
        <p class="form-hint">This is the plaintext component number. It will be hashed before saving.</p>
      </div>
      
      <div class="current-component" v-if="device.componentNumber">
        <label>Current Status</label>
        <div class="status-badge badge-set">Component number is set (hashed)</div>
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="onClose">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="submitting || !form.componentNumber">
          <span v-if="submitting"><i class="pi pi-spin pi-spinner"></i> Updating...</span>
          <span v-else>Update Component Number</span>
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { useToast } from 'vue-toastification'
import Dialog from 'primevue/dialog'

const props = defineProps({
  visible: { type: Boolean, default: false },
  device: { type: Object, required: true }
})

const emit = defineEmits(['update:visible', 'updated'])

const deviceStore = useDeviceStore()
const toast = useToast()

const form = ref({ componentNumber: '' })
const showComponentNumber = ref(false)
const submitting = ref(false)

function onClose() {
  emit('update:visible', false)
  form.value.componentNumber = ''
  showComponentNumber.value = false
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.componentNumber.trim()) return
  
  submitting.value = true
  try {
    await deviceStore.updateComponentNumber(props.device._id, form.value.componentNumber.trim())
    emit('updated')
    toast.success('Component number updated successfully!')
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

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dialog-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
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

.current-component {
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    margin-bottom: 0.5rem;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  
  &.badge-set { background: var(--green-100); color: var(--green-600); }
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