<template>
  <MainLayout>
    <template #default>
      <div class="devices-view">
        <div class="view-header">
          <div>
            <h1>Devices</h1>
            <p class="subtitle">Manage all your IoT devices</p>
          </div>
          <div class="header-filters">
            <select v-model="roomFilter" class="filter-select" @change="loadDevices">
              <option value="">All Rooms</option>
              <option v-for="room in userRooms" :key="room._id" :value="room._id">{{ room.name }}</option>
            </select>
            <select v-model="typeFilter" class="filter-select" @change="loadDevices">
              <option value="">All Types</option>
              <option v-for="type in deviceTypes" :key="type" :value="type">{{ type }}</option>
            </select>
            <button class="btn btn-primary" @click="showCreateDialog = true" v-if="selectedRoom">
              <i class="pi pi-plus"></i> Add Device
            </button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body p-0">
            <DataTable
              :value="devices"
              :loading="loading"
              :paginator="true"
              :rows="10"
              :totalRecords="pagination.total"
              :rowsPerPageOptions="[10, 25, 50]"
              @page="onPageChange"
              selectionMode="single"
              :selection="selectedDevice"
              @selection-change="onSelectionChange"
            >
              <Column field="name" header="Device" :style="{ width: '30%' }">
                <template #body="slotProps">
                  <div class="device-name-cell">
                    <div class="device-avatar" :class="getDeviceIconClass(slotProps.data.type)">
                      <i :class="getDeviceIcon(slotProps.data.type)"></i>
                    </div>
                    <div>
                      <span>{{ slotProps.data.name }}</span>
                      <span class="device-type-tag">{{ slotProps.data.type }}</span>
                    </div>
                  </div>
                </template>
              </Column>
              
              <Column field="room" header="Room" :style="{ width: '20%' }">
                <template #body="slotProps">
                  <span v-if="slotProps.data.room">{{ slotProps.data.room.name }}</span>
                  <span class="text-muted" v-else>—</span>
                </template>
              </Column>
              
              <Column field="status" header="Status" :style="{ width: '12%' }">
                <template #body="slotProps">
                  <span class="status-badge" :class="getStatusClass(slotProps.data)">
                    {{ getStatusLabel(slotProps.data) }}
                  </span>
                </template>
              </Column>
              
              <Column field="active" header="Active" :style="{ width: '10%' }">
                <template #body="slotProps">
                  <span class="badge" :class="slotProps.data.active ? 'badge-active' : 'badge-inactive'">
                    {{ slotProps.data.active ? 'Yes' : 'No' }}
                  </span>
                </template>
              </Column>
              
              <Column field="order" header="Order" :style="{ width: '10%' }">
                <template #body="slotProps">
                  <span class="order-badge">{{ slotProps.data.order }}</span>
                </template>
              </Column>
              
              <Column field="creator" header="Creator" :style="{ width: '18%' }">
                <template #body="slotProps">
                  <span v-if="slotProps.data.creator">{{ slotProps.data.creator.name }}</span>
                  <span class="text-muted" v-else>—</span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
        
        <CreateDeviceDialog
          v-model:visible="showCreateDialog"
          :room-id="selectedRoom"
          :preselected-type="typeFilter || undefined"
          @created="onDeviceCreated"
        />
      </div>
    </template>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { useRoomStore } from '@/stores/room'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Column from 'primevue/column'
import CreateDeviceDialog from '@/components/devices/CreateDeviceDialog.vue'

const deviceStore = useDeviceStore()
const roomStore = useRoomStore()
const toast = useToast()

const devices = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const userRooms = ref([])
const roomFilter = ref('')
const typeFilter = ref('')
const selectedDevice = ref(null)
const showCreateDialog = ref(false)

const deviceTypes = computed(() => deviceStore.DEVICE_TYPES)

const selectedRoom = computed(() => {
  return userRooms.value.find(r => r._id === roomFilter.value) || null
})

async function loadRooms() {
  try {
    const response = await roomStore.fetchUserRooms()
    userRooms.value = response.data || []
  } catch (error) {
    console.error('Failed to load rooms:', error)
  }
}

async function loadDevices(page = 1) {
  loading.value = true
  try {
    const params = { page, limit: 10 }
    if (roomFilter.value) params.room = roomFilter.value
    if (typeFilter.value) params.type = typeFilter.value
    
    const response = await deviceStore.fetchAllDevices(params)
    devices.value = response.data || []
    pagination.value = response.data?.pagination || { total: 0, page: 1, pages: 0, limit: 10 }
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadDevices(event.page + 1)
}

function onSelectionChange(selection) {
  selectedDevice.value = selection
}

function onDeviceCreated() {
  showCreateDialog.value = false
  loadDevices(pagination.value.page)
  toast.success('Device created successfully!')
}

function getDeviceIcon(type) {
  const icons = {
    'Light': 'pi pi-lightbulb',
    'Thermostat': 'pi pi-temperature-high',
    'Camera': 'pi pi-video',
    'Lock': 'pi pi-lock',
    'Air conditioner': 'pi pi-snowflake',
    'Fan': 'pi pi-fan',
    'Garage': 'pi pi-car',
    'Curtain': 'pi pi-window-maximize'
  }
  return icons[type] || 'pi pi-wifi'
}

function getDeviceIconClass(type) {
  const classes = {
    'Light': 'icon-yellow',
    'Thermostat': 'icon-orange',
    'Camera': 'icon-blue',
    'Lock': 'icon-purple',
    'Air conditioner': 'icon-cyan',
    'Fan': 'icon-teal',
    'Garage': 'icon-gray',
    'Curtain': 'icon-pink'
  }
  return classes[type] || 'icon-gray'
}

function getStatusClass(device) {
  if (!device.active) return 'inactive'
  if (device.status === 'offline') return 'offline'
  return device.status === 'on' || device.status === 'unlocked' ? 'online' : 'offline'
}

function getStatusLabel(device) {
  if (!device.active) return 'Inactive'
  if (device.status === 'offline') return 'Offline'
  const statusMap = {
    'on': 'Online',
    'off': 'Offline',
    'locked': 'Locked',
    'unlocked': 'Unlocked'
  }
  return statusMap[device.status] || device.status
}


onMounted(() => {
  loadRooms()
  loadDevices()
})

watch([roomFilter, typeFilter], () => {
  loadDevices(1)
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.devices-view {
  .view-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    
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
  
  .header-filters {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .filter-select {
    padding: 0.5rem 1rem;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    background: var(--surface-card);
    color: var(--text-color);
    min-width: 180px;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
}

.device-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  .device-avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
    
    &.icon-yellow { background: var(--yellow-100); color: var(--yellow-600); }
    &.icon-orange { background: var(--orange-100); color: var(--orange-600); }
    &.icon-blue { background: var(--blue-100); color: var(--blue-600); }
    &.icon-purple { background: var(--purple-100); color: var(--purple-600); }
    &.icon-cyan { background: var(--cyan-100); color: var(--cyan-600); }
    &.icon-teal { background: var(--teal-100); color: var(--teal-600); }
    &.icon-gray { background: var(--gray-100); color: var(--gray-600); }
    &.icon-pink { background: var(--pink-100); color: var(--pink-600); }
  }
  
  > div {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    
    span:first-child {
      font-weight: 500;
    }
  }
}

.device-type-tag {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  text-transform: capitalize;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  
  &.online { background: var(--green-100); color: var(--green-600); }
  &.offline { background: var(--red-100); color: var(--red-600); }
  &.inactive { background: var(--gray-100); color: var(--gray-600); }
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  font-weight: 600;
  
  &.badge-active { background: var(--green-100); color: var(--green-600); }
  &.badge-inactive { background: var(--red-100); color: var(--red-600); }
}

.order-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--primary-100);
  color: var(--primary-600);
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  font-weight: 600;
}

.text-muted {
  color: var(--text-color-secondary);
}
</style>