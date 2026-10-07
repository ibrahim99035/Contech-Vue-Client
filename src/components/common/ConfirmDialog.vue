<template>
  <Dialog
    :visible="visible"
    :header="header"
    modal
    class="confirm-dialog"
    :style="{ width: '28rem' }"
    role="alertdialog"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="confirm-body">
      <i :class="['confirm-icon', icon]" />
      <span class="confirm-message">{{ message }}</span>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="onReject">
        Cancel
      </button>
      <button
        type="button"
        class="btn"
        :class="acceptClass"
        :disabled="acceptLoading"
        @click="onAccept"
      >
        <span v-if="acceptLoading"><i class="pi pi-spin pi-spinner" /></span>
        <span v-else>{{ acceptLabel }}</span>
      </button>
    </template>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'

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

.confirm-body {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.confirm-icon {
  font-size: 1.5rem;
  color: var(--red-500);
  line-height: 1;
  flex-shrink: 0;
}

.confirm-message {
  color: var(--text-color);
  line-height: 1.5;
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
