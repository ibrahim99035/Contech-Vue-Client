<template>
  <div class="admin-dashboard-view">
    <div class="view-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p class="subtitle">Platform overview</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i> Loading platform data...
    </div>

    <template v-else>
      <div class="stats-grid">
        <StatCard title="Total Users" :value="userStats.total" icon="pi pi-users" color="blue" />
        <StatCard title="Total Apartments" :value="apartmentStats.total" icon="pi pi-building" color="green" />
        <StatCard title="Total Rooms" :value="roomStats.total" icon="pi pi-home" color="purple" />
        <StatCard title="Total Devices" :value="deviceStats.total" icon="pi pi-wifi" color="orange" />
        <StatCard title="Active Tasks" :value="taskStats.active" icon="pi pi-clock" color="red" />
      </div>

      <div class="error" v-if="error">
        <i class="pi pi-exclamation-triangle"></i> {{ error }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import StatCard from '@/components/dashboard/StatCard.vue'

const loading = ref(false)
const error = ref('')

const userStats = ref({ total: 0 })
const apartmentStats = ref({ total: 0 })
const roomStats = ref({ total: 0 })
const deviceStats = ref({ total: 0 })
const taskStats = ref({ active: 0 })

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    const calls = {
      users: api.get('/admin/dashboard/users/user-statistics'),
      apartments: api.get('/admin/dashboard/apartments/apartment-statistics'),
      rooms: api.get('/admin/dashboard/rooms/room-statistics'),
      devices: api.get('/admin/dashboard/devices/get-device-statistics'),
      tasks: api.get('/admin/dashboard/tasks/get-task-analytics')
    }
    const results = await Promise.allSettled(Object.entries(calls).map(([k, p]) => p.then(r => [k, r])))
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        const data = res.value[1].data
        const payload = data?.data ?? data ?? {}
        // Each endpoint nests its total under its own key (userGrowth,
        // apartmentGrowth, roomGrowth, deviceGrowth); tasks answers with a
        // top-level `analytics` object instead. Reading flat keys returned 0
        // for every card even when the server had the data.
        const tasks = data?.analytics ?? payload
        const key = res.value[0]
        if (key === 'users') userStats.value = { total: num(payload?.userGrowth?.total) }
        if (key === 'apartments') apartmentStats.value = { total: num(payload?.apartmentGrowth?.total) }
        if (key === 'rooms') roomStats.value = { total: num(payload?.roomGrowth?.total) }
        if (key === 'devices') deviceStats.value = { total: num(payload?.deviceGrowth?.total) }
        if (key === 'tasks') taskStats.value = { active: num(tasks?.tasksByStatus?.active) }
      }
    })
  } catch (e) {
    error.value = 'Failed to load admin statistics.'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-dashboard-view {
  .view-header {
    margin-bottom: 1.5rem;
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 600; }
    .subtitle { margin: 0; color: var(--text-color-secondary); }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .loading-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    color: var(--text-color-secondary);
  }

  .error {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: var(--border-radius);
    background: var(--red-100);
    color: var(--red-800);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>