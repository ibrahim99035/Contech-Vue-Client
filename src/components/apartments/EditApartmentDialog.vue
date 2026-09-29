<template>
  <Dialog 
    :visible="visible" 
    header="Edit Apartment"
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
import { useApartmentStore } from '@/stores/apartment'
import { useToast } from 'vue-toastification'
import Dialog from 'primevue/dialog'

const props = defineProps({
  visible: { type: Boolean, default: false },
  apartment: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'updated'])

const apartmentStore = useApartmentStore()
const toast = useToast()

const form = ref({ name: '' })
const submitting = ref(false)

const initialName = ref('')

watch(() => props.apartment, (newApartment) => {
  if (newApartment) {
    form.value.name = newApartment.name
    initialName.value = newApartment.name
  }
}, { immediate: true })

function onClose() {
  emit('update:visible', false)
  form.value.name = ''
  submitting.value = false
}

async function handleSubmit() {
  if (!form.value.name.trim() || form.value.name.trim() === initialName.value) return
  
  submitting.value = true
  try {
    const updated = await apartmentStore.updateApartmentName(props.apartment._id, form.value.name.trim())
    emit('updated', updated)
    toast.success('Apartment updated successfully!')
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
</style>