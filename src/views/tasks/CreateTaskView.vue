<template>
  <div class="create-task-view">
    <MainLayout>
      <template #default>
        <div class="create-task-view">
          <div class="view-header">
            <div>
              <h1>Create Task</h1>
              <p class="subtitle">Schedule an automation for a device</p>
            </div>
          </div>

          <form class="card task-form" @submit.prevent="submit">
            <div class="card-body">
              <div class="form-group">
                <label>Task Name *</label>
                <input v-model="form.name" class="form-input" placeholder="e.g. Turn on living room light" required />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea v-model="form.description" class="form-input" rows="2" placeholder="Optional description"></textarea>
              </div>

              <div class="form-group">
                <label>Device *</label>
                <select v-model="form.device" class="form-input" required>
                  <option value="" disabled>Select a device</option>
                  <option v-for="d in devices" :key="d._id" :value="d._id">{{ d.name }} ({{ d.type }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Timezone</label>
                <input v-model="form.timezone" class="form-input" placeholder="e.g. Asia/Amman (default UTC)" />
              </div>

              <fieldset class="form-section">
                <legend>Action *</legend>
                <div class="form-group">
                  <label>Action Type</label>
                  <select v-model="form.action.type" class="form-input">
                    <option value="status_change">Status Change</option>
                    <option value="temperature_set">Temperature Set</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Value</label>
                  <input v-model="form.action.value" class="form-input" placeholder='e.g. "on" or "22"' />
                </div>
              </fieldset>

              <fieldset class="form-section">
                <legend>Schedule *</legend>
                <div class="form-row">
                  <div class="form-group">
                    <label>Start Date *</label>
                    <input v-model="schedule.startDate" type="date" class="form-input" required />
                  </div>
                  <div class="form-group">
                    <label>Start Time *</label>
                    <input v-model="schedule.startTime" type="time" class="form-input" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Recurrence</label>
                    <select v-model="schedule.recurrence.type" class="form-input">
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div class="form-group" v-if="schedule.recurrence.type !== 'once'">
                    <label>Interval</label>
                    <input v-model.number="schedule.recurrence.interval" type="number" min="1" class="form-input" />
                  </div>
                </div>
                <div class="form-group" v-if="schedule.recurrence.type === 'weekly'">
                  <label>Days of Week (0=Sun ... 6=Sat, comma separated)</label>
                  <input v-model="weeklyDays" class="form-input" placeholder="e.g. 0,2,4" />
                </div>
              </fieldset>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="$router.back()">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{ saving ? 'Creating...' : 'Create Task' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </template>
    </MainLayout>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/task'
import { useDeviceStore } from '@/stores/device'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const deviceStore = useDeviceStore()
const toast = useToast()

const devices = ref([])
const saving = ref(false)
const weeklyDays = ref('')

const form = reactive({
  name: '',
  description: '',
  device: '',
  timezone: 'UTC',
  action: { type: 'status_change', value: '' }
})

const schedule = reactive({
  startDate: '',
  startTime: '',
  endDate: null,
  recurrence: { type: 'once', interval: 1 }
})

async function loadDevices() {
  try {
    const res = await deviceStore.fetchAllDevices({ limit: 100 })
    devices.value = res.data || []

    // Arriving from a device's "New Task" link: preselect it if it is listed.
    const wanted = route.query.device && String(route.query.device)
    if (!form.device && wanted && devices.value.some((d) => d._id === wanted || d.id === wanted)) {
      form.device = wanted
    }
  } catch (e) {
    // handled in store
  }
}

async function submit() {
  if (!form.device) {
    toast.error('Please select a device')
    return
  }
  if (!schedule.startDate || !schedule.startTime) {
    toast.error('Start date and time are required')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      device: form.device,
      timezone: form.timezone || 'UTC',
      action: { ...form.action },
      schedule: {
        // Parse the picked calendar date as UTC midnight: the server formats
        // startDate in its own (UTC) timezone to check it is in the future,
        // so local midnight would shift the date a day backwards when the
        // browser runs ahead of UTC and reject the task as already past.
        startDate: new Date(`${schedule.startDate}T00:00:00.000Z`).toISOString(),
        startTime: schedule.startTime,
        endDate: schedule.endDate,
        recurrence: {
          type: schedule.recurrence.type,
          interval: schedule.recurrence.interval || 1,
          ...(schedule.recurrence.type === 'weekly' && weeklyDays.value ? { daysOfWeek: weeklyDays.value.split(',').map(s => Number(s.trim())) } : {})
        }
      }
    }
    await taskStore.createTask(payload)
    router.push('/tasks')
  } catch (e) {
    // handled in store
  } finally {
    saving.value = false
  }
}

onMounted(loadDevices)
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.create-task-view {
  .view-header {
    margin-bottom: 1.5rem;
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 600; }
    .subtitle { margin: 0; color: var(--text-color-secondary); }
  }

  .task-form { max-width: 720px; }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 600px) { grid-template-columns: 1fr; }
  }

  .form-section {
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin: 1rem 0;

    legend {
      font-weight: 600;
      font-size: 0.9rem;
      padding: 0 0.5rem;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
  }
}
</style>