<template>
  <MainLayout>
    <template #default>
      <div class="tasks-view">
        <div class="view-header">
          <div>
            <h1>Tasks</h1>
            <p class="subtitle">Manage scheduled tasks for your devices</p>
          </div>
          <router-link to="/tasks/create" class="btn btn-primary">
            <i class="pi pi-plus"></i> Create Task
          </router-link>
        </div>
        
        <div class="card">
          <div class="card-body p-0">
            <TaskList
              :tasks="tasks"
              :loading="loading"
              @view-task="viewTask"
              @create-task="() => router.push('/tasks/create')"
              @toggle-status="toggleTaskStatus"
            />
          </div>
        </div>
      </div>
    </template>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/task'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'
import TaskList from '@/components/tasks/TaskList.vue'

const router = useRouter()
const taskStore = useTaskStore()
const toast = useToast()

const tasks = ref([])
const loading = ref(false)

async function loadTasks() {
  loading.value = true
  try {
    const response = await taskStore.fetchUserTasks()
    tasks.value = response.data || []
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

function viewTask(task) {
  router.push(`/tasks/${task._id}`)
}

async function toggleTaskStatus(taskId, newStatus) {
  try {
    await taskStore.updateTaskStatus(taskId, newStatus)
    const task = tasks.value.find(t => t._id === taskId)
    if (task) task.status = newStatus
    toast.success(`Task ${newStatus === 'active' ? 'enabled' : 'disabled'}`)
  } catch (error) {
    // Error handled in store
    loadTasks() // Reload to reset UI
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.tasks-view {
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
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  
  .card-body.p-0 {
    padding: 0;
  }
}
</style>