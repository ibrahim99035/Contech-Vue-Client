<template>
  <ConfirmDialog 
    :visible="visible" 
    :message="message"
    :header="header"
    :icon="icon"
    @accept="onAccept"
    @reject="onReject"
  >
    <template #footer>
      <button class="btn btn-secondary" @click="onReject">
        Cancel
      </button>
      <button 
        class="btn" 
        :class="acceptClass"
        @click="onAccept"
        :disabled="acceptLoading"
      >
        <span v-if="acceptLoading"><i class="pi pi-spin pi-spinner"></i></span>
        <span v-else>{{ acceptLabel }}</span>
      </button>
    </template>
  </ConfirmDialog>
</template>

<script setup>
import ConfirmDialog from 'primevue/confirmdialog'

defineProps({
  visible: { type: Boolean, default: false },
  message: { type: String, required: true },
  header: { type: String, default: 'Confirm' },
  icon: { type: String, default: 'pi pi-exclamation-triangle' },
  acceptLabel: { type: String, default: 'Confirm' },
  acceptClass: { type: String, default: 'btn-danger' },
  acceptLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'accept', 'reject'])

function onAccept() {
  emit('accept')
}

function onReject() {
  emit('update:visible', false)
  emit('reject')
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

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

.btn-secondary {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  
  &:hover:not(:disabled) {
    background: var(--surface-hover);
  }
}

.btn-danger {
  background: var(--red-500);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--red-600);
  }
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--primary-600);
  }
}
</style>