<template>
  <MainLayout>
    <template #default>
      <div class="dashboard-view">
        <div class="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p class="subtitle">Overview of your IoT ecosystem</p>
          </div>
          <div class="header-actions">
            <router-link to="/apartments" class="btn btn-primary">
              <i class="pi pi-plus"></i> New Apartment
            </router-link>
          </div>
        </div>
        
        <div class="stats-grid">
          <StatCard
            title="Apartments"
            :value="apartmentStats.total"
            icon="pi pi-building"
            color="blue"
            trend="+2 this month"
            trendUp
          />
          <StatCard
            title="Rooms"
            :value="roomStats.total"
            icon="pi pi-home"
            color="green"
            trend="+5 this month"
            trendUp
          />
          <StatCard
            title="Devices"
            :value="deviceStats.total"
            icon="pi pi-wifi"
            color="purple"
            :trend="`${deviceStats.online} online`"
            :trendUp="deviceStats.online > deviceStats.offline"
          />
          <StatCard
            title="Active Tasks"
            :value="taskStats.active"
            icon="pi pi-clock"
            color="orange"
            trend="Scheduled"
          />
        </div>
        
        <div class="dashboard-grid">
          <section class="card">
            <div class="card-header">
              <h2>Recent Apartments</h2>
              <router-link to="/apartments" class="view-all">View All</router-link>
            </div>
            <div class="card-body">
              <div class="apartment-list" v-if="recentApartments.length > 0">
                <div 
                  class="apartment-item" 
                  v-for="apt in recentApartments" 
                  :key="apt._id"
                  @click="navigateToApartment(apt._id)"
                >
                  <div class="apartment-icon">
                    <i class="pi pi-building"></i>
                  </div>
                  <div class="apartment-info">
                    <h3>{{ apt.name }}</h3>
                    <p>{{ apt.roomsCount || 0 }} rooms · {{ apt.devicesCount || 0 }} devices</p>
                  </div>
                  <i class="pi pi-chevron-right"></i>
                </div>
              </div>
              <div class="empty-state" v-else>
                <i class="pi pi-building"></i>
                <p>No apartments yet</p>
                <router-link to="/apartments" class="btn btn-primary btn-sm">Create Apartment</router-link>
              </div>
            </div>
          </section>
          
          <section class="card">
            <div class="card-header">
              <h2>Recent Tasks</h2>
              <router-link to="/tasks" class="view-all">View All</router-link>
            </div>
            <div class="card-body">
              <div class="task-list" v-if="recentTasks.length > 0">
                <div 
                  class="task-item" 
                  v-for="task in recentTasks" 
                  :key="task._id"
                >
                  <div class="task-status" :class="task.status"></div>
                  <div class="task-info">
                    <h3>{{ task.name }}</h3>
                    <p>{{ formatTaskSchedule(task.schedule) }}</p>
                  </div>
                  <span class="task-device">{{ task.device?.name || 'Unknown Device' }}</span>
                </div>
              </div>
              <div class="empty-state" v-else>
                <i class="pi pi-clock"></i>
                <p>No tasks scheduled</p>
                <router-link to="/tasks/create" class="btn btn-primary btn-sm">Create Task</router-link>
              </div>
            </div>
          </section>
        </div>
        
        <div class="dashboard-grid">
          <section class="card full-width">
            <div class="card-header">
              <h2>Device Status Overview</h2>
            </div>
            <div class="card-body">
              <div class="device-status-grid">
                <DeviceTypeStat 
                  v-for="type in deviceTypeStats" 
                  :key="type.type"
                  :type="type.type"
                  :total="type.total"
                  :online="type.online"
                  :offline="type.offline"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApartmentStore } from '@/stores/apartment'
import { useRoomStore } from '@/stores/room'
import { useDeviceStore } from '@/stores/device'
import { useTaskStore } from '@/stores/task'
import MainLayout from '@/layouts/MainLayout.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DeviceTypeStat from '@/components/dashboard/DeviceTypeStat.vue'

const router = useRouter()
const apartmentStore = useApartmentStore()
const roomStore = useRoomStore()
const deviceStore = useDeviceStore()
const taskStore = useTaskStore()

const recentApartments = ref([])
const recentTasks = ref([])
const apartmentStats = ref({ total: 0 })
const roomStats = ref({ total: 0 })
const deviceStats = ref({ total: 0, online: 0, offline: 0 })
const taskStats = ref({ active: 0 })
const deviceTypeStats = ref([])

async function loadDashboardData() {
  try {
    const [apartmentsRes, roomsRes, devicesRes, tasksRes] = await Promise.allSettled([
      apartmentStore.fetchApartments({ limit: 5 }),
      roomStore.fetchUserRooms({ limit: 10 }),
      deviceStore.fetchAllDevices({ limit: 20 }),
      taskStore.fetchUserTasks({ limit: 10 })
    ])
    
    if (apartmentsRes.status === 'fulfilled') {
      recentApartments.value = apartmentsRes.value.data || []
      apartmentStats.value.total = apartmentsRes.value.pagination?.total || recentApartments.value.length
    }
    
    if (roomsRes.status === 'fulfilled') {
      roomStats.value.total = roomsRes.value.data?.length || 0
    }
    
    if (devicesRes.status === 'fulfilled') {
      const devices = devicesRes.value.data || []
      deviceStats.value.total = devicesRes.value.pagination?.total || devices.length
      deviceStats.value.online = devices.filter(d => d.active && d.status !== 'offline').length
      deviceStats.value.offline = devices.filter(d => !d.active || d.status === 'offline').length
      
      // Group by type
      const typeMap = {}
      devices.forEach(d => {
        if (!typeMap[d.type]) {
          typeMap[d.type] = { type: d.type, total: 0, online: 0, offline: 0 }
        }
        typeMap[d.type].total++
        if (d.active && d.status !== 'offline') {
          typeMap[d.type].online++
        } else {
          typeMap[d.type].offline++
        }
      })
      deviceTypeStats.value = Object.values(typeMap)
    }
    
    if (tasksRes.status === 'fulfilled') {
      recentTasks.value = tasksRes.value.data || []
      taskStats.value.active = recentTasks.value.filter(t => t.status === 'active').length
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

function navigateToApartment(id) {
  router.push(`/apartments/${id}`)
}

function formatTaskSchedule(schedule) {
  if (!schedule) return 'No schedule'
  const { startTime, recurrence } = schedule
  const recurrenceLabels = {
    once: 'Once',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom'
  }
  return `${startTime} · ${recurrenceLabels[recurrence?.type] || 'Once'}`
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.dashboard-view {
  .dashboard-header {
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
    
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  
  .full-width {
    grid-column: 1 / -1;
  }
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
    
    .view-all {
      font-size: 0.875rem;
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .card-body {
    padding: 1rem 1.25rem;
  }
}

.apartment-list,
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.apartment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: var(--surface-hover);
  }
  
  .apartment-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius);
    background: var(--blue-100);
    color: var(--blue-600);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .apartment-info {
    flex: 1;
    min-width: 0;
    
    h3 {
      margin: 0 0 0.125rem;
      font-size: 0.9375rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    p {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
    }
  }
  
  i:last-child {
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  transition: background 0.2s ease;
  
  &:hover {
    background: var(--surface-hover);
  }
  
  .task-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    
    &.active { background: var(--green-500); }
    &.completed { background: var(--blue-500); }
    &.failed { background: var(--red-500); }
    &.cancelled { background: var(--gray-500); }
  }
  
  .task-info {
    flex: 1;
    min-width: 0;
    
    h3 {
      margin: 0 0 0.125rem;
      font-size: 0.9375rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    p {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
    }
  }
  
  .task-device {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius);
    white-space: nowrap;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0 0 1rem;
  }
}

.device-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    
    .header-actions {
      justify-content: flex-start;
    }
  }
}
</style>