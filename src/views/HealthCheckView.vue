<template>
  <MainLayout>
    <div class="health-check-view">
      <div class="view-container">
        <div class="view-header">
          <div>
            <h1>Server Status</h1>
            <p class="subtitle">Live data from <code>GET /health</code></p>
          </div>
          <button class="btn btn-secondary" :disabled="checking" @click="fetchHealth">
            {{ checking ? 'Checking...' : 'Refresh' }}
          </button>
        </div>

        <div v-if="errorMessage" class="health-status status-offline">
          <i class="pi pi-times-circle"></i>
          <h2>Unreachable</h2>
        </div>
        <div v-else class="health-status" :class="healthStatusClass">
          <i :class="healthIcon"></i>
          <h2>Server {{ healthStatus }}</h2>
        </div>

        <div class="health-details">
          <div class="detail-row">
            <span>Status:</span>
            <span>{{ healthStatus }}</span>
          </div>
          <div class="detail-row">
            <span>Uptime:</span>
            <span>{{ formattedUptime }}</span>
          </div>
          <div class="detail-row">
            <span>Version:</span>
            <span>{{ appVersion }}</span>
          </div>
          <div class="detail-row">
            <span>Environment:</span>
            <span>{{ environment }}</span>
          </div>
          <div class="detail-row">
            <span>Server timestamp:</span>
            <span>{{ serverTimestamp }}</span>
          </div>
          <div class="detail-row">
            <span>Checked at:</span>
            <span>{{ checkedAt }}</span>
          </div>
        </div>

        <div class="service-checks">
          <h3>Service Checks</h3>
          <p class="note">
            The server's <code>/health</code> endpoint only reports overall process health,
            so per-subsystem status is not published by the API.
          </p>
          <div v-for="check in serviceChecks" :key="check.name" class="check-item">
            <div class="check-name">{{ check.name }}</div>
            <div class="check-status" :class="check.statusClass">{{ check.status }}</div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import api from '@/services/api'

const checking = ref(false)
const errorMessage = ref('')
const health = ref(null)
const checkedAt = ref('-')

let pollTimer = null

const healthStatus = computed(() => health.value?.status || 'UNKNOWN')
const appVersion = computed(() => health.value?.version || '-')
const environment = computed(() => health.value?.environment || '-')
const uptime = computed(() => Number(health.value?.uptime || 0))
const serverTimestamp = computed(() => {
  if (!health.value?.timestamp) return '-'
  const d = new Date(health.value.timestamp)
  return Number.isNaN(d.getTime()) ? health.value.timestamp : d.toLocaleString()
})

const healthStatusClass = computed(() =>
  healthStatus.value === 'OK' ? 'status-online' : 'status-offline'
)
const healthIcon = computed(() =>
  healthStatus.value === 'OK' ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'
)

const serviceChecks = computed(() => {
  if (errorMessage.value) {
    return [{ name: 'API Gateway', status: 'Offline', statusClass: 'status-offline' }]
  }
  return [
    {
      name: 'API Gateway',
      status: healthStatus.value === 'OK' ? 'Online' : healthStatus.value,
      statusClass: healthStatus.value === 'OK' ? 'status-online' : 'status-offline'
    }
  ]
})

function formatUptime(seconds) {
  if (!seconds) return '0s'
  const total = Math.floor(seconds)
  const days = Math.floor(total / 86400)
  const hrs = Math.floor((total % 86400) / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (days > 0) return `${days}d ${hrs}h ${mins}m ${secs}s`
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

const formattedUptime = computed(() => formatUptime(uptime.value))

async function fetchHealth() {
  checking.value = true
  try {
    const response = await api.get('/health')
    health.value = response.data
    errorMessage.value = ''
  } catch (error) {
    health.value = null
    errorMessage.value = error.response
      ? `Server responded with HTTP ${error.response.status}`
      : 'Could not reach the server.'
  } finally {
    checkedAt.value = new Date().toLocaleString()
    checking.value = false
  }
}

onMounted(() => {
  fetchHealth()
  pollTimer = setInterval(fetchHealth, 30000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>


<style lang="scss" scoped>
@import '@/assets/styles/variables';

.health-check-view {
  .view-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .health-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: var(--border-radius);
    margin-bottom: 1.5rem;
    
    .status-online {
      background: var(--green-100);
      color: var(--green-800);
    }
    
    .status-offline {
      background: var(--red-100);
      color: var(--red-800);
    }
  }
  
  .health-details {
    margin-bottom: 2rem;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--surface-border);
    font-size: 0.9375rem;
    color: var(--text-color);
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .service-checks {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: var(--border-radius);
  }
  
  .check-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--surface-border);
  }
  
  .check-name {
    font-weight: 500;
  }
  
  .check-status {
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .status-online {
    background: var(--green-100);
    color: var(--green-800);
  }
  
  .status-offline {
    background: var(--red-100);
    color: var(--red-800);
  }
  
  .status-warning {
    background: var(--yellow-100);
    color: var(--yellow-800);
  }
}
</style>