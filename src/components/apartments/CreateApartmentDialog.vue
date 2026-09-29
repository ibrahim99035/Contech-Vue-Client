<template>
  <Dialog 
    :visible="visible" 
    :header="apartment ? 'Edit Apartment' : 'Create Apartment'"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <form @submit.prevent="handleSubmit" class="dialog-form">
      <div class="form-group">
        <label for="name">Apartment Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Enter apartment name"
          required
          maxlength="100"
          autofocus
        />
      </div>
      
      <div class="form-group" v-if="!apartment">
        <label for="creator">Creator (Auto)</label>
        <input
          id="creator"
          type="text"
          class="form-input"
          :value="currentUserName"
          readonly
        />
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="onClose">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <span v-if="submitting"><i class="pi pi-spin pi-spinner"></i> Saving...</span>
          <span v-else>{{ apartment ? 'Update' : 'Create' }}</span>
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Dialog from 'primevue/dialog'
import { useApartmentStore } from '@/stores/apartment'
import { useToast } from 'vue-toastification'

const props = defineProps({
  visible: { type: Boolean, default: false },
  apartment: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'created', 'updated'])

const authStore = useAuthStore()
const apartmentStore = useApartmentStore()
const toast = useToast()

const form = ref({ name: '' })
const submitting = ref(false)

const currentUserName = computed(() => authStore.user?.name || 'Current User')

function onClose() {
  emit('update:visible', false)
  form.value.name = ''
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.name.trim()) return
  
  submitting.value = true
  try {
    if (props.apartment) {
      const updated = await apartmentStore.updateApartmentName(props.apartment._id, form.value.name.trim())
      emit('updated', updated)
      toast.success('Apartment updated successfully!')
    } else {
      await apartmentStore.createApartment({ name: form.value.name.trim() })
      emit('created')
      toast.success('Apartment created successfully!')
    }
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
  
  &:disabled,
  &[readonly] {
    background: var(--surface-ground);
    opacity: 0.7;
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