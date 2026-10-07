import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([])
  const userTasks = ref([])
  const deviceTasks = ref([])
  const assignedTasks = ref([])
  const currentTask = ref(null)
  const taskAnalytics = ref(null)
  const loading = ref(false)
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const toast = useToast()

  const tasksList = computed(() => tasks.value)
  const hasTasks = computed(() => tasks.value.length > 0)

  const TASK_STATUSES = ['active', 'completed', 'failed', 'cancelled']
  const RECURRENCE_TYPES = ['once', 'daily', 'weekly', 'monthly', 'yearly', 'custom']
  const ACTION_TYPES = ['status_change', 'temperature_set', 'other']

  // The task routes do not share one envelope: my-tasks returns
  // { data: [...] }, by-device/assigned/filter return { tasks }, detail and
  // update return { task }, and create returns { data: { task } }. Read
  // whichever key is present instead of assuming data.
  function asTaskArray(body) {
    const list = Array.isArray(body?.data) ? body.data : body?.tasks
    return Array.isArray(list) ? list : []
  }

  function asTask(body) {
    return body?.task || body?.data?.task || (body?.data?._id ? body.data : null)
  }

  function errorMessage(error, fallback) {
    const detail = error?.response?.data?.error ?? error?.response?.data?.message
    if (Array.isArray(detail)) return detail.join(', ')
    if (typeof detail === 'string' && detail) return detail
    return fallback
  }

  async function fetchAllTasks(params = {}) {
    loading.value = true
    try {
      const response = await api.get('/api/task-handler/tasks/user/my-tasks', { params })
      tasks.value = asTaskArray(response.data)
      if (response.data.pagination) {
        pagination.value = response.data.pagination
      }
      return response.data
    } catch (error) {
      toast.error('Failed to fetch tasks')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchUserTasks(params = {}) {
    loading.value = true
    try {
      const response = await api.get('/api/task-handler/tasks/user/my-tasks', { params })
      userTasks.value = asTaskArray(response.data)
      return response.data
    } catch (error) {
      toast.error('Failed to fetch user tasks')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTasksByDevice(deviceId, params = {}) {
    loading.value = true
    try {
      const response = await api.get(`/api/task-handler/tasks/get-tasks/device/${deviceId}`, { params })
      deviceTasks.value = asTaskArray(response.data)
      return response.data
    } catch (error) {
      toast.error('Failed to fetch device tasks')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchAssignedTasks(params = {}) {
    loading.value = true
    try {
      const response = await api.get('/api/task-handler/tasks/user/assigned', { params })
      assignedTasks.value = asTaskArray(response.data)
      return response.data
    } catch (error) {
      toast.error('Failed to fetch assigned tasks')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTaskById(taskId) {
    loading.value = true
    try {
      const response = await api.get(`/api/task-handler/tasks/get-task/${taskId}`)
      currentTask.value = asTask(response.data)
      return currentTask.value
    } catch (error) {
      toast.error('Failed to fetch task')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTaskAnalytics() {
    loading.value = true
    try {
      const response = await api.get('/admin/dashboard/tasks/get-task-analytics')
      taskAnalytics.value = response.data.data
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch task analytics')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createTask(data) {
    loading.value = true
    try {
      const response = await api.post('/api/task-handler/tasks/create-task', data)
      const created = asTask(response.data)
      if (created) {
        tasks.value.unshift(created)
        userTasks.value.unshift(created)
      }
      toast.success('Task created successfully!')
      return created
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to create task'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateTaskDetails(taskId, data) {
    loading.value = true
    try {
      const response = await api.put(`/api/task-handler/tasks/update/${taskId}/details`, data)
      const updated = asTask(response.data)
      const index = tasks.value.findIndex(t => t._id === taskId)
      if (index !== -1) {
        tasks.value[index] = updated
      }
      const userIndex = userTasks.value.findIndex(t => t._id === taskId)
      if (userIndex !== -1) {
        userTasks.value[userIndex] = updated
      }
      if (currentTask.value?._id === taskId) {
        currentTask.value = updated
      }
      toast.success('Task updated successfully!')
      return updated
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to update task'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateTaskSchedule(taskId, schedule) {
    loading.value = true
    try {
      const response = await api.put(`/api/task-handler/tasks/${taskId}/schedule/update`, { schedule })
      const updated = asTask(response.data)
      const index = tasks.value.findIndex(t => t._id === taskId)
      if (index !== -1) {
        tasks.value[index] = updated
      }
      const userIndex = userTasks.value.findIndex(t => t._id === taskId)
      if (userIndex !== -1) {
        userTasks.value[userIndex] = updated
      }
      if (currentTask.value?._id === taskId) {
        currentTask.value = updated
      }
      toast.success('Task schedule updated successfully!')
      return updated
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to update task schedule'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateTaskStatus(taskId, status) {
    loading.value = true
    try {
      const response = await api.put(`/api/task-handler/tasks/${taskId}/status`, { status })
      const updated = asTask(response.data)
      const index = tasks.value.findIndex(t => t._id === taskId)
      if (index !== -1) {
        tasks.value[index] = updated
      }
      const userIndex = userTasks.value.findIndex(t => t._id === taskId)
      if (userIndex !== -1) {
        userTasks.value[userIndex] = updated
      }
      if (currentTask.value?._id === taskId) {
        currentTask.value = updated
      }
      toast.success(`Task status updated to ${status}`)
      return updated
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to update task status'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function addNotificationRecipient(taskId, userId) {
    loading.value = true
    try {
      const response = await api.put(`/api/task-handler/tasks/${taskId}/notifications/add-recepiant`, { userId })
      const updated = asTask(response.data)
      if (currentTask.value?._id === taskId) {
        currentTask.value = updated
      }
      toast.success('Notification recipient added!')
      return updated
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to add notification recipient'))
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteTask(taskId) {
    loading.value = true
    try {
      await api.delete(`/api/task-handler/tasks/delete-task/${taskId}`)
      tasks.value = tasks.value.filter(t => t._id !== taskId)
      userTasks.value = userTasks.value.filter(t => t._id !== taskId)
      deviceTasks.value = deviceTasks.value.filter(t => t._id !== taskId)
      assignedTasks.value = assignedTasks.value.filter(t => t._id !== taskId)
      if (currentTask.value?._id === taskId) {
        currentTask.value = null
      }
      toast.success('Task deleted successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to delete task')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function filterTasks(filters = {}) {
    loading.value = true
    try {
      const response = await api.get('/api/task-handler/tasks/filter', { params: filters })
      return response.data
    } catch (error) {
      toast.error('Failed to filter tasks')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTasksByStatus(status) {
    loading.value = true
    try {
      const response = await api.get(`/admin/dashboard/tasks/get-tasks-by-status/${status}`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch tasks by status')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTasksByRecurrence(type) {
    loading.value = true
    try {
      const response = await api.get(`/admin/dashboard/tasks/get-tasks-by-recurrence/${type}`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch tasks by recurrence')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTasksByUser(userId) {
    loading.value = true
    try {
      const response = await api.get(`/admin/dashboard/tasks/get-tasks-by-user/${userId}`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch tasks by user')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchOverdueTasks() {
    loading.value = true
    try {
      const response = await api.get('/admin/dashboard/tasks/get-overdue-tasks')
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch overdue tasks')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTasksScheduledToday(timezone) {
    loading.value = true
    try {
      const response = await api.get('/admin/dashboard/tasks/get-tasks-scheduled-today', {
        params: { timezone }
      })
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch tasks scheduled today')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTasksWithHistory() {
    loading.value = true
    try {
      const response = await api.get('/admin/dashboard/tasks/get-tasks-with-history')
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch tasks with history')
      throw error
    } finally {
      loading.value = false
    }
  }

  function clearCurrentTask() {
    currentTask.value = null
  }

  return {
    tasks,
    userTasks,
    deviceTasks,
    assignedTasks,
    currentTask,
    taskAnalytics,
    loading,
    pagination,
    tasksList,
    hasTasks,
    TASK_STATUSES,
    RECURRENCE_TYPES,
    ACTION_TYPES,
    fetchAllTasks,
    fetchUserTasks,
    fetchTasksByDevice,
    fetchAssignedTasks,
    fetchTaskById,
    fetchTaskAnalytics,
    createTask,
    updateTaskDetails,
    updateTaskSchedule,
    updateTaskStatus,
    addNotificationRecipient,
    deleteTask,
    filterTasks,
    fetchTasksByStatus,
    fetchTasksByRecurrence,
    fetchTasksByUser,
    fetchOverdueTasks,
    fetchTasksScheduledToday,
    fetchTasksWithHistory,
    clearCurrentTask
  }
})