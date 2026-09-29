<template>
  <Dialog 
    :visible="visible" 
    header="Device Control"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="true"
  >
    <div class="dialog-content">
      <DeviceControlPanel
        :device="device"
        :readonly="false"
        @update="onUpdate"
      />
    </div>
    
    <template #footer>
      <button class="btn btn-secondary" @click="$emit('update:visible', false)">
        Close
      </button>
    </template>
  </Dialog>
</template>

<script setup>
import DeviceControlPanel from '@/components/devices/DeviceControlPanel.vue'
import Dialog from 'primevue/dialog'

defineProps({
  visible: { type: Boolean, default: false },
  device: { type: Object, required: true }
})

const emit = defineEmits(['update:visible'])

const onUpdate = () => {
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.dialog-content {
  padding: 0.5rem 0;
}
</style>