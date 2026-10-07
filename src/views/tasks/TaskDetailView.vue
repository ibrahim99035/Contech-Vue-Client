<template>
  <div class="task-detail-view">
    <MainLayout>
      <template #default>
        <div class="task-detail-view">
          <div class="view-header">
            <div>
              <h1>Task Details</h1>
              <p class="subtitle">{{ task?.name || 'Loading...' }}</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" @click="router.push('/tasks')">Back</button>
              <button class="btn btn-danger" :disabled="deleting" @click="confirmDelete">Delete</button>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <i class="pi pi-spin pi-spinner"></i> Loading task...
          </div>

          <div v-else-if="task" class="detail-grid">
            <section class="card">
              <div class="card-header"><h2>Overview</h2></div>
              <div class="card-body">
                <div class="detail-row"><span>Status</span><span class="badge" :class="task.status">{{ task.status }}</span></div>
                <div class="detail-row"><span>Device</span><span>{{ task.device?.name || 'Unknown' }}</span></div>
                <div class="detail-row"><span>Timezone</span><span>{{ task.timezone || 'UTC' }}</span></div>
                <div class="detail-row"><span>Action</span><span>{{ actionSummary }}</span></div>
                <div class="detail-row"><span>Created</span><span>{{ formatDate(task.createdAt) }}</span></div>
              </div>
            </section>

            <section class="card">
              <div class="card-header"><h2>Schedule</h2></div>
              <div class="card-body" v-if="task.schedule">
                <div class="detail-row"><span>Start</span><span>{{ task.schedule.startDate ? formatDate(task.schedule.startDate) : '—' }} {{ task.schedule.startTime || '' }}</span></div>
                <div class="detail-row"><span>Recurrence</span><span>{{ task.schedule.recurrence?.type || 'once' }}<template v-if="task.schedule.recurrence?.interval"> (every {{ task.schedule.recurrence.interval }})</template></span></div>
                <div v-if="task.schedule.recurrence?.daysOfWeek?.length" class="detail-row">
                  <span>Days</span><span>{{ task.schedule.recurrence.daysOfWeek.join(', ') }}</span>
                </div>
              </div>
              <div class="card-body text-muted" v-else>No schedule</div>
            </section>

            <section class="card">
              <div class="card-header">
                <h2>Status Controls</h2>
              </div>
              <div class="card-body">
                <div class="status-buttons">
                  <button
                    v-for="s in statuses"
                    :key="s"
                    class="btn btn-sm"
                    :class="s === task.status ? 'btn-primary' : 'btn-secondary'"
                    :disabled="updatingStatus"
                    @click="setStatus(s)"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </template>
    </MainLayout>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/task'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const confirm = useConfirm()
const toast = useToast()

const task = ref(null)
const loading = ref(false)
const updatingStatus = ref(false)
const deleting = ref(false)
const statuses = ['active', 'completed', 'failed', 'cancelled']

const actionSummary = computed(() => {
  if (!task.value?.action) return '—'
  return `${task.value.action.type}: ${task.value.action.value ?? ''}`
})

async function load() {
  loading.value = true
  try {
    task.value = await taskStore.fetchTaskById(route.params.id)
  } catch (e) {
    // handled in store
  } finally {
    loading.value = false
  }
}

async function setStatus(s) {
  if (s === task.value.status) return
  updatingStatus.value = true
  try {
    await taskStore.updateTaskStatus(task.value._id, s)
    toast.success(`Task marked as ${s}`)
    task.value.status = s
  } catch (e) {
    // handled in store
  } finally {
    updatingStatus.value = false
  }
}

function confirmDelete() {
  confirm.require({
    message: 'Delete this task permanently?',
    header: 'Delete Task',
    icon: 'pi pi-exclamation-triangle',
    accept: deleteTask
  })
}

async function deleteTask() {
  deleting.value = true
  try {
    await taskStore.deleteTask(task.value._id)
    toast.success('Task deleted')
    router.push('/tasks')
  } catch (e) {
    // handled in store
  } finally {
    deleting.value = false
  }
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString() : '—'
}

onMounted(load)
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.task-detail-view {
  .view-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;

    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 600; }
    .subtitle { margin: 0; color: var(--text-color-secondary); }

    .header-actions { display: flex; gap: 0.5rem; }
  }

  .loading-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    color: var(--text-color-secondary);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    max-width: 1100px;
  }

  .card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      h2 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    }
    .card-body { padding: 1rem 1.25rem; }
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--surface-border);
    font-size: 0.9rem;
    &:last-child { border-bottom: none; }
    span:first-child { color: var(--text-color-secondary); }
  }

  .badge {
    display: inline-flex;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
    &.active { background: var(--green-100); color: var(--green-800); }
    &.completed { background: var(--blue-100); color: var(--blue-600); }
    &.failed { background: var(--red-100); color: var(--red-800); }
    &.cancelled { background: var(--gray-100); color: var(--gray-600); }
  }

  .status-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
}
</style>