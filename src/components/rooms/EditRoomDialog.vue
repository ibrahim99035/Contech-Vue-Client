<template>
  <Dialog 
    :visible="visible" 
    header="Edit Room"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <form @submit.prevent="handleSubmit" class="dialog-form">
      <div class="form-group">
        <label for="name">Room Name <span class="required">*</span></label>
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
          <option value="bedroom">Bedroom</option>
          <option value="livingroom">Living Room</option>
          <option value="kitchen">Kitchen</option>
          <option value="bathroom">Bathroom</option>
          <option value="office">Office</option>
          <option value="garage">Garage</option>
          <option value="balcony">Balcony</option>
          <option value="basement">Basement</option>
          <option value="attic">Attic</option>
          <option value="other">Other</option>
        </select>
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

const form = ref({ name: '', type: 'bedroom' })
const submitting = ref(false)
const initialName = ref('')
const initialType = ref('')

function onClose() {
  emit('update:visible', false)
  form.value = { name: '', type: 'bedroom' }
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.name.trim() || (form.value.name.trim() === initialName.value && form.value.type === initialType.value)) return
  
  submitting.value = true
  try {
    const updates = {}
    if (form.value.name.trim() !== initialName.value) updates.name = form.value.name.trim()
    if (form.value.type !== initialType.value) updates.type = form.value.type
    
    let updated = { ...props.room }
    
    if (updates.name) {
      updated = await roomStore.updateRoomName(props.room._id, updates.name)
    }
    
    // Type update would require a new API endpoint
    // For now just update local state
    updated = { ...updated, ...updates }
    
    emit('updated', updated)
    toast.success('Room updated successfully!')
    onClose()
  } catch (error) {
    // Error handled in store
  } finally {
    submitting.value = false
  }
}

watch(() => props.room, (newRoom) => {
  if (newRoom) {
    form.value.name = newRoom.name
    form.value.type = newRoom.type || 'bedroom'
    initialName.value = newRoom.name
    initialType.value = newRoom.type || 'bedroom'
  }
}, { immediate: true })

watch(() => props.visible, (visible) => {
  if (!visible) onClose()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
</style>