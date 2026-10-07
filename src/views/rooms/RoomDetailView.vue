<template>
  <MainLayout>
    <template #default>
      <div class="room-detail-view" v-if="room">
        <div class="detail-header">
          <div class="header-left">
            <router-link :to="`/apartments/${apartmentId}`" class="back-link">
              <i class="pi pi-arrow-left"></i>
            </router-link>
            <div>
              <h1>{{ room.name }}</h1>
              <p class="subtitle">
                <span v-if="room.type">{{ roomTypeLabel }} · </span>
                {{ deviceStore.roomDevices.length }} devices
                <span v-if="room.apartment"> · {{ room.apartment.name }}</span>
              </p>
            </div>
          </div>
          <div class="header-actions">
            <div class="esp-status" :class="room.espConnected ? 'connected' : 'disconnected'">
              <i class="pi" :class="room.espConnected ? 'pi-wifi' : 'pi-wifi-off'"></i>
              <span>{{ room.espConnected ? 'ESP Connected' : 'ESP Disconnected' }}</span>
            </div>
            <button class="btn btn-primary" @click="showCreateDeviceDialog = true">
              <i class="pi pi-plus"></i> Add Device
            </button>
          </div>
        </div>
        
        <div class="room-grid">
          <section class="card devices-section">
            <div class="card-header">
              <h2>Devices</h2>
              <button class="btn btn-primary btn-sm" @click="showCreateDeviceDialog = true">
                <i class="pi pi-plus"></i> Add Device
              </button>
            </div>
            <div class="card-body p-0">
              <DeviceList
                :devices="deviceStore.roomDevices"
                :loading="devicesLoading"
                @view-device="viewDevice"
              />
            </div>
          </section>
          
          <section class="card info-section">
            <div class="card-header">
              <h2>Room Information</h2>
            </div>
            <div class="card-body">
              <dl class="info-list">
                <div class="info-item">
                  <dt>Room ID</dt>
                  <dd>{{ room._id }}</dd>
                </div>
                <div class="info-item">
                  <dt>Type</dt>
                  <dd>{{ roomTypeLabel }}</dd>
                </div>
                <div class="info-item">
                  <dt>Creator</dt>
                  <dd>{{ room.creator?.name || 'Unknown' }}</dd>
                </div>
                <div class="info-item">
                  <dt>Password Protected</dt>
                  <dd><span class="badge" :class="room.hasPassword ? 'badge-yes' : 'badge-no'">{{ room.hasPassword ? 'Yes' : 'No' }}</span></dd>
                </div>
                <div class="info-item">
                  <dt>ESP Status</dt>
                  <dd><span class="esp-badge" :class="room.espConnected ? 'connected' : 'disconnected'">{{ room.espConnected ? 'Connected' : 'Disconnected' }}</span></dd>
                </div>
                <div class="info-item">
                  <dt>Created</dt>
                  <dd>{{ formatDate(room.createdAt) }}</dd>
                </div>
                <div class="info-item">
                  <dt>Updated</dt>
                  <dd>{{ formatDate(room.updatedAt) }}</dd>
                </div>
              </dl>
              
              <div class="info-actions">
                <button class="btn btn-secondary" @click="showEditDialog = true">
                  <i class="pi pi-pencil"></i> Edit Room
                </button>
                <button class="btn btn-secondary" @click="showPasswordDialog = true" v-if="room.hasPassword || false">
                  <i class="pi pi-key"></i> Change Password
                </button>
                <button class="btn btn-danger" @click="confirmDelete">
                  <i class="pi pi-trash"></i> Delete Room
                </button>
              </div>
            </div>
          </section>
        </div>
        
        <CreateDeviceDialog
          v-model:visible="showCreateDeviceDialog"
          :room-id="room._id"
          @created="onDeviceCreated"
        />
        
        <EditRoomDialog
          v-model:visible="showEditDialog"
          :room="room"
          @updated="onRoomUpdated"
        />
        
        <RoomPasswordDialog
          v-model:visible="showPasswordDialog"
          :room="room"
          @updated="onPasswordUpdated"
        />
        
        <ConfirmDialog
          v-model:visible="showDeleteDialog"
          message="Are you sure you want to delete this room? All devices in this room will also be deleted."
          header="Delete Room"
          icon="pi pi-exclamation-triangle"
          accept-class="btn-danger"
          @accept="deleteRoom"
        />
      </div>
      
      <div class="loading-state" v-else>
        <div class="spinner"></div>
      </div>
    </template>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useDeviceStore } from '@/stores/device'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'
import DeviceList from '@/components/devices/DeviceList.vue'
import CreateDeviceDialog from '@/components/devices/CreateDeviceDialog.vue'
import EditRoomDialog from '@/components/rooms/EditRoomDialog.vue'
import RoomPasswordDialog from '@/components/rooms/RoomPasswordDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const deviceStore = useDeviceStore()
const toast = useToast()

const room = ref(null)
const apartmentId = ref(route.params.apartmentId)
const devicesLoading = ref(false)
const showCreateDeviceDialog = ref(false)
const showEditDialog = ref(false)
const showPasswordDialog = ref(false)
const showDeleteDialog = ref(false)

const roomTypeLabel = computed(() => {
  if (!room.value?.type) return 'Other'
  const labels = {
    bedroom: 'Bedroom',
    livingroom: 'Living Room',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    office: 'Office',
    garage: 'Garage',
    balcony: 'Balcony',
    basement: 'Basement',
    attic: 'Attic',
    other: 'Other'
  }
  return labels[room.value.type] || room.value.type
})

async function loadRoom() {
  try {
    const data = await roomStore.fetchRoomById(route.params.roomId, route.params.apartmentId)
    room.value = data
    await loadDevices()
  } catch (error) {
    router.push(`/apartments/${apartmentId.value}`)
  }
}

async function loadDevices() {
  if (!room.value?._id) return
  devicesLoading.value = true
  try {
    await deviceStore.fetchDevicesByRoom(room.value._id)
  } catch (error) {
    console.error('Failed to load devices:', error)
  } finally {
    devicesLoading.value = false
  }
}

function viewDevice(device) {
  router.push(`/devices/${device._id}`)
}

function onDeviceCreated() {
  showCreateDeviceDialog.value = false
  loadDevices()
  toast.success('Device created successfully!')
}

function onRoomUpdated(updatedRoom) {
  room.value = updatedRoom
  showEditDialog.value = false
  toast.success('Room updated successfully!')
}

function onPasswordUpdated() {
  showPasswordDialog.value = false
  loadRoom()
  toast.success('Room password updated successfully!')
}

function confirmDelete() {
  showDeleteDialog.value = true
}

async function deleteRoom() {
  if (!room.value) return
  
  try {
    await roomStore.deleteRoom(room.value._id)
    toast.success('Room deleted successfully!')
    router.push(`/apartments/${apartmentId.value}`)
  } catch (error) {
    // Error handled in store
  } finally {
    showDeleteDialog.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadRoom()
})

watch(() => route.params.roomId, () => {
  loadRoom()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.room-detail-view {
  .detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    
    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      
      .back-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--border-radius);
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        color: var(--text-color);
        margin-top: 0.25rem;
        
        &:hover {
          background: var(--surface-hover);
        }
      }
      
      h1 {
        margin: 0 0 0.25rem;
        font-size: 1.75rem;
        font-weight: 600;
      }
      
      .subtitle {
        margin: 0;
        color: var(--text-color-secondary);
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  }
}

.esp-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  font-size: 0.8125rem;
  font-weight: 500;
  
  &.connected {
    background: var(--green-50);
    color: var(--green-600);
  }
  
  &.disconnected {
    background: var(--red-50);
    color: var(--red-600);
  }
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--surface-border);
    
    h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }
  }
  
  .card-body {
    padding: 1.25rem;
    
    &.p-0 {
      padding: 0;
    }
  }
}

.info-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    dt {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
    }
    
    dd {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--text-color);
      word-break: break-all;
    }
  }
}

.info-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &.badge-yes { background: var(--green-100); color: var(--green-600); }
  &.badge-no { background: var(--gray-100); color: var(--gray-600); }
}

.esp-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &.connected { background: var(--green-100); color: var(--green-600); }
  &.disconnected { background: var(--red-100); color: var(--red-600); }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--surface-border);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .room-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: stretch;
    
    .header-actions {
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
}
</style>