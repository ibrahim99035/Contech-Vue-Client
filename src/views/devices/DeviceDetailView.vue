<template>
  <MainLayout>
    <template #default>
      <div class="device-detail-view" v-if="device">
        <div class="detail-header">
          <div class="header-left">
            <router-link to="/devices" class="back-link">
              <i class="pi pi-arrow-left"></i>
            </router-link>
            <div>
              <div class="device-title">
                <div class="device-icon-large" :class="iconClass">
                  <i :class="deviceIcon"></i>
                </div>
                <div>
                  <h1>{{ device.name }}</h1>
                  <p class="subtitle">{{ device.type }} · Order {{ device.order }} · {{ device.room?.name || 'No Room' }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <div class="device-status-large" :class="statusClass">
              <span class="status-dot"></span>
              <span>{{ statusLabel }}</span>
            </div>
            <button class="btn btn-secondary" @click="showEditDialog = true">
              <i class="pi pi-pencil"></i> Edit
            </button>
            <button class="btn btn-primary" @click="showControlDialog = true">
              <i class="pi pi-sliders-h"></i> Control
            </button>
          </div>
        </div>
        
        <div class="detail-grid">
          <section class="card control-card">
            <div class="card-header">
              <h2>Device Control</h2>
            </div>
            <div class="card-body">
              <DeviceControlPanel
                :device="device"
                :readonly="false"
                @update="onDeviceUpdate"
              />
            </div>
          </section>
          
          <section class="card info-card">
            <div class="card-header">
              <h2>Device Information</h2>
            </div>
            <div class="card-body">
              <dl class="info-list">
                <div class="info-item">
                  <dt>Device ID</dt>
                  <dd>{{ device._id }}</dd>
                </div>
                <div class="info-item">
                  <dt>Type</dt>
                  <dd>{{ device.type }}</dd>
                </div>
                <div class="info-item">
                  <dt>Room</dt>
                  <dd>{{ device.room?.name || 'Not assigned' }}</dd>
                </div>
                <div class="info-item">
                  <dt>Order</dt>
                  <dd>{{ device.order }}</dd>
                </div>
                <div class="info-item">
                  <dt>Component Number</dt>
                  <dd>{{ device.componentNumber ? 'Set (hashed)' : 'Not set' }}</dd>
                </div>
                <div class="info-item">
                  <dt>Creator</dt>
                  <dd>{{ device.creator?.name || 'Unknown' }}</dd>
                </div>
                <div class="info-item">
                  <dt>Active</dt>
                  <dd><span class="badge" :class="device.active ? 'badge-active' : 'badge-inactive'">{{ device.active ? 'Yes' : 'No' }}</span></dd>
                </div>
                <div class="info-item">
                  <dt>Created</dt>
                  <dd>{{ formatDate(device.createdAt) }}</dd>
                </div>
                <div class="info-item">
                  <dt>Updated</dt>
                  <dd>{{ formatDate(device.updatedAt) }}</dd>
                </div>
              </dl>
              
              <div class="info-actions">
                <button class="btn btn-secondary" @click="showEditDialog = true">
                  <i class="pi pi-pencil"></i> Edit Details
                </button>
                <button class="btn btn-secondary" @click="showComponentDialog = true">
                  <i class="pi pi-key"></i> Component Number
                </button>
                <button class="btn btn-secondary" @click="toggleActivation">
                  <i :class="device.active ? 'pi pi-toggle-on' : 'pi pi-toggle-off'"></i>
                  {{ device.active ? 'Deactivate' : 'Activate' }}
                </button>
                <button class="btn btn-danger" @click="confirmDelete">
                  <i class="pi pi-trash"></i> Delete
                </button>
              </div>
            </div>
          </section>
          
          <section class="card tasks-card">
            <div class="card-header">
              <h2>Associated Tasks</h2>
              <router-link :to="`/tasks/create?device=${device._id}`" class="btn btn-primary btn-sm">
                <i class="pi pi-plus"></i> New Task
              </router-link>
            </div>
            <div class="card-body p-0">
              <TaskList
                :tasks="deviceTasks"
                :loading="tasksLoading"
                @view-task="viewTask"
              />
            </div>
          </section>
          
          <section class="card capabilities-card">
            <div class="card-header">
              <h2>Capabilities</h2>
            </div>
            <div class="card-body">
              <CapabilitiesDisplay :capabilities="device.capabilities" :type="device.type" />
            </div>
          </section>
        </div>
        
        <EditDeviceDialog
          v-model:visible="showEditDialog"
          :device="device"
          @updated="onDeviceUpdated"
        />
        
        <DeviceControlDialog
          v-model:visible="showControlDialog"
          :device="device"
        />
        
        <ComponentNumberDialog
          v-model:visible="showComponentDialog"
          :device="device"
          @updated="onComponentUpdated"
        />
        
        <ConfirmDialog
          v-model:visible="showDeleteDialog"
          message="Are you sure you want to delete this device? This action cannot be undone."
          header="Delete Device"
          icon="pi pi-exclamation-triangle"
          accept-class="btn-danger"
          @accept="deleteDevice"
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
import { useDeviceStore } from '@/stores/device'
import { useTaskStore } from '@/stores/task'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'
import DeviceControlPanel from '@/components/devices/DeviceControlPanel.vue'
import TaskList from '@/components/tasks/TaskList.vue'
import EditDeviceDialog from '@/components/devices/EditDeviceDialog.vue'
import DeviceControlDialog from '@/components/devices/DeviceControlDialog.vue'
import ComponentNumberDialog from '@/components/devices/ComponentNumberDialog.vue'
import CapabilitiesDisplay from '@/components/devices/CapabilitiesDisplay.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()
const taskStore = useTaskStore()
const toast = useToast()

const device = ref(null)
const deviceTasks = ref([])
const tasksLoading = ref(false)
const showEditDialog = ref(false)
const showControlDialog = ref(false)
const showComponentDialog = ref(false)
const showDeleteDialog = ref(false)

const deviceIcons = {
  'Light': 'pi pi-lightbulb',
  'Thermostat': 'pi pi-temperature-high',
  'Camera': 'pi pi-video',
  'Lock': 'pi pi-lock',
  'Air conditioner': 'pi pi-snowflake',
  'Fan': 'pi pi-fan',
  'Garage': 'pi pi-car',
  'Curtain': 'pi pi-window-maximize'
}

const iconClasses = {
  'Light': 'icon-yellow',
  'Thermostat': 'icon-orange',
  'Camera': 'icon-blue',
  'Lock': 'icon-purple',
  'Air conditioner': 'icon-cyan',
  'Fan': 'icon-teal',
  'Garage': 'icon-gray',
  'Curtain': 'icon-pink'
}

const deviceIcon = computed(() => deviceIcons[device.value?.type] || 'pi pi-wifi')
const iconClass = computed(() => iconClasses[device.value?.type] || 'icon-gray')

const statusClass = computed(() => {
  if (!device.value?.active) return 'inactive'
  if (device.value.status === 'offline') return 'offline'
  return device.value.status === 'on' || device.value.status === 'unlocked' ? 'online' : 'offline'
})

const statusLabel = computed(() => {
  if (!device.value?.active) return 'Inactive'
  const statusMap = {
    'on': 'Online',
    'off': 'Offline',
    'locked': 'Locked',
    'unlocked': 'Unlocked',
    'offline': 'Offline'
  }
  return statusMap[device.value?.status] || device.value?.status
})

async function loadDevice() {
  try {
    const data = await deviceStore.fetchDeviceById(route.params.id)
    device.value = data
    await loadTasks()
  } catch (error) {
    router.push('/devices')
  }
}

async function loadTasks() {
  if (!device.value) return
  tasksLoading.value = true
  try {
    const response = await taskStore.fetchTasksByDevice(device.value._id)
    deviceTasks.value = response.data || []
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    tasksLoading.value = false
  }
}

function viewTask(task) {
  router.push(`/tasks/${task._id}`)
}

function onDeviceUpdate(updatedDevice) {
  device.value = { ...device.value, ...updatedDevice }
}

function onDeviceUpdated(updatedDevice) {
  device.value = updatedDevice
  showEditDialog.value = false
  toast.success('Device updated successfully!')
}

function onComponentUpdated() {
  showComponentDialog.value = false
  loadDevice()
  toast.success('Component number updated successfully!')
}

function toggleActivation() {
  if (!device.value) return
  deviceStore.toggleDeviceActivation(device.value._id)
    .then(updated => {
      device.value = updated
      toast.success(`Device ${updated.active ? 'activated' : 'deactivated'} successfully!`)
    })
    .catch(() => {
      // Error handled in store
    })
}

function confirmDelete() {
  showDeleteDialog.value = true
}

async function deleteDevice() {
  if (!device.value) return
  
  try {
    await deviceStore.deleteDevice(device.value._id)
    toast.success('Device deleted successfully!')
    router.push('/devices')
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
  loadDevice()
})

watch(() => route.params.id, () => {
  loadDevice()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.device-detail-view {
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
    }
    
    .device-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .device-icon-large {
        width: 64px;
        height: 64px;
        border-radius: var(--border-radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
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

.device-status-large {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius);
  font-size: 0.9375rem;
  font-weight: 500;
  
  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  
  &.online { background: var(--green-50); color: var(--green-600); }
  &.online .status-dot { background: var(--green-500); }
  
  &.offline { background: var(--red-50); color: var(--red-600); }
  &.offline .status-dot { background: var(--red-500); }
  
  &.inactive { background: var(--gray-50); color: var(--gray-600); }
  &.inactive .status-dot { background: var(--gray-500); }
}

.detail-grid {
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
  
  &.badge-active { background: var(--green-100); color: var(--green-600); }
  &.badge-inactive { background: var(--red-100); color: var(--red-600); }
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
  .detail-grid {
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