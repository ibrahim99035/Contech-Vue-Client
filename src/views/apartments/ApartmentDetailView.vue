<template>
  <MainLayout>
    <template #default>
      <div class="apartment-detail-view" v-if="apartment">
        <div class="detail-header">
          <div class="header-left">
            <router-link to="/apartments" class="back-link">
              <i class="pi pi-arrow-left"></i>
            </router-link>
            <div>
              <h1>{{ apartment.name }}</h1>
              <p class="subtitle">{{ apartment.members?.length || 0 }} members · {{ apartment.roomsCount || 0 }} rooms · {{ apartment.devicesCount || 0 }} devices</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" @click="showEditDialog = true">
              <i class="pi pi-pencil"></i> Edit
            </button>
            <button class="btn btn-primary" @click="showCreateRoomDialog = true">
              <i class="pi pi-plus"></i> Add Room
            </button>
          </div>
        </div>
        
        <div class="stats-row">
          <StatCard title="Rooms" :value="apartment.roomsCount || 0" icon="pi pi-home" color="blue" />
          <StatCard title="Devices" :value="apartment.devicesCount || 0" icon="pi pi-wifi" color="green" />
          <StatCard title="Members" :value="apartment.members?.length || 0" icon="pi pi-users" color="purple" />
          <StatCard title="Active Tasks" :value="activeTasksCount" icon="pi pi-clock" color="orange" />
        </div>
        
        <div class="detail-tabs">
          <ul class="tab-nav" role="tablist">
            <li role="presentation">
              <button 
                role="tab" 
                :class="{ active: activeTab === 'rooms' }"
                @click="activeTab = 'rooms'"
              >
                <i class="pi pi-home"></i> Rooms
              </button>
            </li>
            <li role="presentation">
              <button 
                role="tab" 
                :class="{ active: activeTab === 'members' }"
                @click="activeTab = 'members'"
              >
                <i class="pi pi-users"></i> Members
              </button>
            </li>
            <li role="presentation">
              <button 
                role="tab" 
                :class="{ active: activeTab === 'devices' }"
                @click="activeTab = 'devices'"
              >
                <i class="pi pi-wifi"></i> Devices
              </button>
            </li>
            <li role="presentation">
              <button 
                role="tab" 
                :class="{ active: activeTab === 'tasks' }"
                @click="activeTab = 'tasks'"
              >
                <i class="pi pi-clock"></i> Tasks
              </button>
            </li>
          </ul>
          
          <div class="tab-panels">
            <div role="tabpanel" v-show="activeTab === 'rooms'">
              <RoomList 
                :rooms="apartment.rooms || []"
                :apartment-id="apartment._id"
                @view-room="viewRoom"
                @create-room="showCreateRoomDialog = true"
              />
            </div>
            
            <div role="tabpanel" v-show="activeTab === 'members'">
              <MemberList
                :members="apartment.members || []"
                :creator-id="apartment.creator?._id || apartment.creator"
                :apartment-id="apartment._id"
                @remove-member="removeMember"
              />
            </div>
            
            <div role="tabpanel" v-show="activeTab === 'devices'">
              <DeviceList
                :devices="allDevices"
                :loading="devicesLoading"
                @view-device="viewDevice"
              />
            </div>
            
            <div role="tabpanel" v-show="activeTab === 'tasks'">
              <TaskList
                :tasks="apartmentTasks"
                :loading="tasksLoading"
                @view-task="viewTask"
              />
            </div>
          </div>
        </div>
        
        <EditApartmentDialog
          v-model:visible="showEditDialog"
          :apartment="apartment"
          @updated="onApartmentUpdated"
        />
        
        <CreateRoomDialog
          v-model:visible="showCreateRoomDialog"
          :apartment-id="apartment._id"
          @created="onRoomCreated"
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
import { useApartmentStore } from '@/stores/apartment'
import { useRoomStore } from '@/stores/room'
import { useDeviceStore } from '@/stores/device'
import { useTaskStore } from '@/stores/task'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import RoomList from '@/components/apartments/RoomList.vue'
import MemberList from '@/components/apartments/MemberList.vue'
import DeviceList from '@/components/devices/DeviceList.vue'
import TaskList from '@/components/tasks/TaskList.vue'
import EditApartmentDialog from '@/components/apartments/EditApartmentDialog.vue'
import CreateRoomDialog from '@/components/rooms/CreateRoomDialog.vue'

const route = useRoute()
const router = useRouter()
const apartmentStore = useApartmentStore()
const roomStore = useRoomStore()
const deviceStore = useDeviceStore()
const taskStore = useTaskStore()
const toast = useToast()

const apartment = ref(null)
const activeTab = ref('rooms')
const showEditDialog = ref(false)
const showCreateRoomDialog = ref(false)
const allDevices = ref([])
const devicesLoading = ref(false)
const apartmentTasks = ref([])
const tasksLoading = ref(false)

const activeTasksCount = computed(() => {
  return apartmentTasks.value.filter(t => t.status === 'active').length
})

async function loadApartment() {
  try {
    const data = await apartmentStore.fetchApartmentById(route.params.id, { force: true })
    apartment.value = data
    
    // Load devices for all rooms in this apartment
    await loadDevices()
    
    // Load tasks for this apartment
    await loadTasks()
  } catch (error) {
    router.push('/apartments')
  }
}

async function loadDevices() {
  devicesLoading.value = true
  try {
    const rooms = apartment.value.rooms || []
    const devicePromises = rooms.map(room => 
      deviceStore.fetchDevicesByRoom(room._id || room)
    )
    const results = await Promise.allSettled(devicePromises)
    allDevices.value = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.data || [])
  } catch (error) {
    console.error('Failed to load devices:', error)
  } finally {
    devicesLoading.value = false
  }
}

async function loadTasks() {
  tasksLoading.value = true
  try {
    const response = await taskStore.fetchUserTasks({ limit: 20 })
    // Filter tasks for devices in this apartment
    const deviceIds = new Set(allDevices.value.map(d => d._id))
    apartmentTasks.value = (response.data || []).filter(t => 
      deviceIds.has(t.device?._id || t.device)
    )
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    tasksLoading.value = false
  }
}

function viewRoom(room) {
  router.push(`/apartments/${apartment.value._id}/rooms/${room._id || room}`)
}

function viewDevice(device) {
  router.push(`/devices/${device._id}`)
}

function viewTask(task) {
  router.push(`/tasks/${task._id}`)
}

function onApartmentUpdated(updatedApartment) {
  apartment.value = updatedApartment
  showEditDialog.value = false
  toast.success('Apartment updated successfully!')
}

function onRoomCreated() {
  showCreateRoomDialog.value = false
  loadApartment()
  toast.success('Room created successfully!')
}

function removeMember(memberId) {
  apartmentStore.removeMember(apartment.value._id, memberId)
    .then(() => {
      loadApartment()
      toast.success('Member removed successfully!')
    })
    .catch(() => {
      // Error handled in store
    })
}

onMounted(() => {
  loadApartment()
})

watch(() => route.params.id, () => {
  loadApartment()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.apartment-detail-view {
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
      gap: 0.75rem;
    }
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-tabs {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  
  .tab-nav {
    display: flex;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-ground);
    overflow-x: auto;
    
    li {
      flex-shrink: 0;
    }
    
    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: var(--text-color-secondary);
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      
      &:hover {
        color: var(--text-color);
        background: var(--surface-hover);
      }
      
      &.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        background: var(--surface-card);
      }
    }
  }
  
  .tab-panels {
    padding: 1.5rem;
  }
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
  .detail-header {
    flex-direction: column;
    align-items: stretch;
    
    .header-actions {
      justify-content: flex-start;
    }
  }
  
  .tab-nav button {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}
</style>