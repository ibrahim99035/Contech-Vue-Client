<template>
  <div class="admin-statistics-view">
          <div class="view-header">
            <div>
              <h1>Statistics</h1>
              <p class="subtitle">System analytics and metrics</p>
            </div>
          </div>
          
          <div class="stats-grid-large">
            <StatCard
              title="Total Users"
              :value="userStats.total"
              icon="pi pi-users"
              color="blue"
            />
            <StatCard
              title="Total Apartments"
              :value="apartmentStats.total"
              icon="pi pi-building"
              color="green"
            />
            <StatCard
              title="Total Rooms"
              :value="roomStats.total"
              icon="pi pi-home"
              color="purple"
            />
            <StatCard
              title="Total Devices"
              :value="deviceStats.total"
              icon="pi pi-wifi"
              color="orange"
            />
            <StatCard
              title="Active Tasks"
              :value="taskStatusStats.active"
              icon="pi pi-clock"
              color="red"
            />
            <StatCard
              title="Avg. Device Uptime"
              :value="performanceStats.avgUptime"
              icon="pi pi-clock"
              color="cyan"
            />
          </div>
          
          <div class="chart-grid">
            <section class="card">
              <div class="card-header">
                <h2>Device Types Distribution</h2>
              </div>
              <div class="card-body">
                <div v-for="type in deviceTypeStats" :key="type.type" class="type-stat">
                  <div class="type-name">{{ type.type }}</div>
                  <div class="type-count">
                    <span :style="{ width: type.percentage + '%' }"></span>
                    <span>{{ type.count }}</span>
                  </div>
                </div>
              </div>
            </section>
            
            <section class="card">
              <div class="card-header">
                <h2>Task Status Distribution</h2>
              </div>
              <div class="card-body">
                <div v-for="status in taskStatusStats" :key="status" class="status-stat">
                  <span :class="status" class="status-dot"></span>
                  <span>{{ status }}</span>
                  <span>{{ taskStatusStats[status] }}</span>
                </div>
              </div>
            </section>
          </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import StatCard from '@/components/dashboard/StatCard.vue'

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

// User stats
const userStats = ref({ total: 0 })
const apartmentStats = ref({ total: 0 })
const roomStats = ref({ total: 0 })
const deviceStats = ref({ total: 0, active: 0 })
const performanceStats = ref({ avgUptime: '99.9%' })
const deviceTypeStats = ref([])
const taskStatusStats = ref({
  active: 0,
  completed: 0,
  failed: 0,
  canceled: 0
})

onMounted(() => {
  loadStatistics()
})

async function loadStatistics() {
  try {
    const [usersRes, apartmentsRes, roomsRes, devicesRes, tasksRes] = await Promise.allSettled([
      api.get('/admin/dashboard/users/user-statistics'),
      api.get('/admin/dashboard/apartments/apartment-statistics'),
      api.get('/admin/dashboard/rooms/room-statistics'),
      api.get('/admin/dashboard/devices/get-device-statistics'),
      api.get('/admin/dashboard/tasks/get-task-analytics')
    ])

    const unwrap = r => (r && r.status === 'fulfilled' ? r.value.data?.data ?? r.value.data ?? {} : {})

    const users = unwrap(usersRes)
    userStats.value.total = num(users.userGrowth?.total)
    apartmentStats.value.total = num(unwrap(apartmentsRes).apartmentGrowth?.total)
    roomStats.value.total = num(unwrap(roomsRes).roomGrowth?.total)

    const devices = unwrap(devicesRes)
    deviceStats.value.total = num(devices.deviceGrowth?.total)
    deviceStats.value.active = num(devices.statusAnalysis?.activeDevices)

    const distribution = devices.deviceTypeAnalysis?.distribution ?? {}
    deviceTypeStats.value = Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: deviceStats.value.total ? Math.round((count / deviceStats.value.total) * 100) : 0
    }))

    const byStatus = tasksRes.status === 'fulfilled' ? tasksRes.value.data?.analytics?.tasksByStatus ?? {} : {}
    taskStatusStats.value = {
      active: num(byStatus.active),
      completed: num(byStatus.completed),
      failed: num(byStatus.failed),
      canceled: num(byStatus.cancelled)
    }
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-statistics-view {
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

  .stats-grid-large {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .chart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
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
    }
    
    .card-body {
      padding: 1rem 1.25rem;
    }
  }

  .type-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--surface-border);
    
    &:last-child {
      border-bottom: none;
    }
    
    .type-name {
      font-size: 0.9375rem;
      font-weight: 500;
    }
    
    .type-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      span:first-child {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--primary-100);
      }
      
      span:last-child {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }
    }
  }
  
  .status-stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--surface-border);
    
    &:last-child {
      border-bottom: none;
    }
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .status-dot.active { background: var(--green-500); }
    .status-dot.completed { background: var(--blue-500); }
    .status-dot.failed { background: var(--red-500); }
    .status-dot.canceled { background: var(--gray-500); }
    
    span:last-child {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
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
}
</style>