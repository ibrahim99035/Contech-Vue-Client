<template>
  <div class="task-list">
    <div class="list-header">
      <div class="task-filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select v-model="recurrenceFilter" class="filter-select">
          <option value="">All Recurrences</option>
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" @click="$emit('create-task')">
        <i class="pi pi-plus"></i> Create Task
      </button>
    </div>
    
    <div class="task-table-container" v-if="tasks.length > 0">
      <table class="task-table">
        <thead>
          <tr>
            <th style="width: 35%">Task</th>
            <th style="width: 15%">Device</th>
            <th style="width: 15%">Schedule</th>
            <th style="width: 12%">Status</th>
            <th style="width: 12%">Next Run</th>
            <th style="width: 11%"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task._id" :class="`status-${task.status}`">
            <td>
              <div class="task-info">
                <h4>{{ task.name }}</h4>
                <p v-if="task.description" class="task-description">{{ task.description }}</p>
                <span class="task-action-badge">{{ formatAction(task.action) }}</span>
              </div>
            </td>
            <td>
              <div class="device-info" v-if="task.device">
                <span class="device-name">{{ task.device.name || 'Unknown' }}</span>
                <span class="device-type">{{ task.device.type }}</span>
              </div>
              <span class="text-muted" v-else>Unknown Device</span>
            </td>
            <td>
              <div class="schedule-info">
                <span class="schedule-time">{{ formatTime(task.schedule?.startTime) }}</span>
                <span class="schedule-recurrence" :class="task.schedule?.recurrence?.type">{{ formatRecurrence(task.schedule?.recurrence) }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="task.status">{{ task.status }}</span>
            </td>
            <td>
              <span v-if="task.nextRun">{{ formatDateTime(task.nextRun) }}</span>
              <span class="text-muted" v-else>—</span>
            </td>
            <td>
              <div class="task-actions">
                <button class="btn-icon" @click.stop="$emit('view-task', task)" title="View Details">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="btn-icon" @click.stop="toggleTaskStatus(task)" :disabled="task.status !== 'active'" :title="task.status === 'active' ? 'Disable' : 'Enable'">
                  <i :class="task.status === 'active' ? 'pi pi-pause' : 'pi pi-play'"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredTasks.length === 0">
            <td colspan="6" class="text-muted no-results">
              {{ tasks.length === 0 ? 'No tasks yet.' : 'No tasks match the selected filters.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="empty-state" v-if="tasks.length === 0 && !loading">
      <i class="pi pi-clock"></i>
      <p>No tasks found</p>
      <button class="btn btn-primary btn-sm" @click="$emit('create-task')">
        Create First Task
      </button>
    </div>
    
    <div class="loading-table" v-if="loading">
      <table class="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Device</th>
            <th>Schedule</th>
            <th>Status</th>
            <th>Next Run</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 5" :key="i">
            <td><div class="skeleton-text"></div></td>
            <td><div class="skeleton-text short"></div></td>
            <td><div class="skeleton-text short"></div></td>
            <td><div class="skeleton-badge"></div></td>
            <td><div class="skeleton-text short"></div></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['view-task', 'create-task', 'toggle-status'])

const statusFilter = ref('')
const recurrenceFilter = ref('')

const filteredTasks = computed(() => {
  return props.tasks.filter(task => {
    const statusMatch = !statusFilter.value || task.status === statusFilter.value
    const recurrenceMatch = !recurrenceFilter.value || task.schedule?.recurrence?.type === recurrenceFilter.value
    return statusMatch && recurrenceMatch
  })
})

function formatAction(action) {
  if (!action) return 'No action'
  const actionLabels = {
    'status_change': 'Status Change',
    'temperature_set': 'Temperature Set',
    'other': 'Other'
  }
  return `${actionLabels[action.type] || action.type}: ${action.value}`
}

function formatRecurrence(recurrence) {
  if (!recurrence) return 'Once'
  const labels = {
    once: 'Once',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom'
  }
  return labels[recurrence.type] || recurrence.type
}

function formatTime(time) {
  if (!time) return '—'
  return time
}

function formatDateTime(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString()
}

function toggleTaskStatus(task) {
  const newStatus = task.status === 'active' ? 'cancelled' : 'active'
  emit('toggle-status', task._id, newStatus)
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.task-list {
  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  
  .task-filters {
    display: flex;
    gap: 0.75rem;
  }
  
  .filter-select {
    padding: 0.5rem 1rem;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    background: var(--surface-card);
    color: var(--text-color);
    min-width: 150px;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
}

.task-table-container {
  overflow-x: auto;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
  
  th,
  td {
    padding: 0.875rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--surface-border);
  }
  
  th {
    background: var(--surface-ground);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
  }
  
  tbody tr {
    transition: background 0.2s ease;
    
    &:hover {
      background: var(--surface-hover);
    }
    
    &.status-failed td:first-child { border-left: 3px solid var(--red-500); }
    &.status-active td:first-child { border-left: 3px solid var(--green-500); }
    &.status-completed td:first-child { border-left: 3px solid var(--blue-500); }
    &.status-cancelled td:first-child { border-left: 3px solid var(--gray-500); }
  }
}

.task-info {
  h4 {
    margin: 0 0 0.25rem;
    font-size: 0.9375rem;
    font-weight: 500;
  }
  
  .task-description {
    margin: 0 0 0.375rem;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.task-action-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: var(--primary-100);
  color: var(--primary-600);
  border-radius: var(--border-radius);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: capitalize;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  
  .device-name {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .device-type {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  
  .schedule-time {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .schedule-recurrence {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    text-transform: capitalize;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  
  &.active { background: var(--green-100); color: var(--green-600); }
  &.completed { background: var(--blue-100); color: var(--blue-600); }
  &.failed { background: var(--red-100); color: var(--red-600); }
  &.cancelled { background: var(--gray-100); color: var(--gray-600); }
}

.task-actions {
  display: flex;
  gap: 0.375rem;
  justify-content: flex-end;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text-color);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.text-muted {
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0 0 1rem;
  }
}

.loading-table {
  .skeleton-text {
    height: 1rem;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--surface-200) 25%, var(--surface-300) 50%, var(--surface-200) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    
    &.short { width: 60%; }
  }
  
  .skeleton-badge {
    width: 80px;
    height: 24px;
    border-radius: 9999px;
    background: linear-gradient(90deg, var(--surface-200) 25%, var(--surface-300) 50%, var(--surface-200) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.no-results {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
}
</style>
