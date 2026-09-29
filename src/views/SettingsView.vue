<template>
  <MainLayout>
    <div class="settings-view">
      <div class="view-header">
        <div>
          <h1>Settings</h1>
          <p class="subtitle">User account and application settings</p>
        </div>
      </div>

      <div class="settings-sections">
        <div class="settings-section profile">
          <div class="section-header">
            <i class="pi pi-user"></i>
            <h3>Profile</h3>
          </div>
          <div class="section-body">
            <div class="form-group">
              <label>Name</label>
              <input type="text" class="form-input" :value="displayName" readonly disabled />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-input" :value="displayEmail" readonly disabled />
            </div>
            <div class="form-group">
              <label>Role</label>
              <input type="text" class="form-input" :value="displayRole" readonly disabled />
            </div>
            <p class="field-hint">
              The server does not expose a profile-update endpoint, so these values are
              read-only. An administrator can change your role via
              <code>PUT /admin/dashboard/users/update-user-role/:id</code>.
            </p>
          </div>
        </div>

        <div class="settings-section security">
          <div class="section-header">
            <i class="pi pi-lock"></i>
            <h3>Security</h3>
          </div>
          <div class="section-body">
            <div class="form-group">
              <label>Current Password</label>
              <input
                type="password"
                class="form-input"
                placeholder="Enter current password"
                v-model="passwordForm.currentPassword"
                autocomplete="current-password"
              />
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input
                type="password"
                class="form-input"
                placeholder="Enter new password"
                v-model="passwordForm.newPassword"
                autocomplete="new-password"
              />
            </div>
            <div class="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                class="form-input"
                placeholder="Confirm new password"
                v-model="passwordForm.confirmPassword"
                autocomplete="new-password"
              />
            </div>
            <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
            <button
              class="btn btn-danger btn-w-100"
              :disabled="changingPassword"
              @click="handleChangePassword"
            >
              {{ changingPassword ? 'Updating...' : 'Change Password' }}
            </button>
          </div>
        </div>

        <div class="settings-section notifications">
          <div class="section-header">
            <i class="pi pi-bell"></i>
            <h3>Notifications</h3>
          </div>
          <div class="section-body">
            <p class="field-hint">
              These preferences are stored in this browser only &mdash; the server has no
              notification-preference endpoint.
            </p>
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="email-notifications"
                v-model="emailNotifications"
              />
              <label class="form-check-label" for="email-notifications">
                Email notifications
              </label>
            </div>
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="push-notifications"
                v-model="pushNotifications"
              />
              <label class="form-check-label" for="push-notifications">
                Push notifications
              </label>
            </div>
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="task-notifications"
                v-model="taskNotifications"
              />
              <label class="form-check-label" for="task-notifications">
                Task completion notifications
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section api">
          <div class="section-header">
            <i class="pi pi-code"></i>
            <h3>API Access</h3>
          </div>
          <div class="section-body">
            <p>
              The server does not issue standalone API keys. Requests authenticate with the
              JWT issued by <code>POST /api/auth/login</code>, which is valid for 24 hours.
            </p>
            <div class="api-tokens">
              <div class="token-item">
                <span class="token-id">Current session token</span>
                <span class="token-value">{{ maskedToken }}</span>
                <button class="btn btn-sm btn-secondary" @click="copyToken">Copy</button>
              </div>
              <div v-if="tokenExpiry" class="token-item">
                <span class="token-id">Expires</span>
                <span class="token-value">{{ tokenExpiry }}</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-block" @click="handleLogout">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEYS = {
  emailNotifications: 'pref_email_notifications',
  pushNotifications: 'pref_push_notifications',
  taskNotifications: 'pref_task_notifications'
}

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const displayName = computed(() => authStore.user?.name || '')
const displayEmail = computed(() => authStore.user?.email || '')
const displayRole = computed(() => authStore.user?.role || '')

const emailNotifications = ref(localStorage.getItem(STORAGE_KEYS.emailNotifications) !== 'false')
const pushNotifications = ref(localStorage.getItem(STORAGE_KEYS.pushNotifications) !== 'false')
const taskNotifications = ref(localStorage.getItem(STORAGE_KEYS.taskNotifications) !== 'false')

// Persist each preference to localStorage. The source must be the specific ref
// instance: reading `ref.value` here would dereference the imported `ref`
// function (which has no .value), leaving the watcher with a non-reactive
// source and nothing ever being saved.
for (const [preference, key] of [
  [emailNotifications, STORAGE_KEYS.emailNotifications],
  [pushNotifications, STORAGE_KEYS.pushNotifications],
  [taskNotifications, STORAGE_KEYS.taskNotifications]
]) {
  watch(
    preference,
    (value) => localStorage.setItem(key, String(value)),
    { immediate: true }
  )
}

const changingPassword = ref(false)
const passwordError = ref('')
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const maskedToken = computed(() => {
  const t = authStore.token
  if (!t) return 'No active session'
  return `${t.slice(0, 12)}…${t.slice(-8)}`
})

const tokenExpiry = computed(() => {
  const t = authStore.token
  if (!t) return null
  try {
    const { exp } = jwtDecode(t)
    if (!exp) return null
    return new Date(exp * 1000).toLocaleString()
  } catch {
    return null
  }
})

async function handleChangePassword() {
  passwordError.value = ''

  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    passwordError.value = 'Please fill in both the current and new password.'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'The new passwords do not match.'
    return
  }
  if (passwordForm.newPassword === passwordForm.currentPassword) {
    passwordError.value = 'The new password must be different from the current one.'
    return
  }

  changingPassword.value = true
  try {
    await authStore.updatePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    passwordError.value = error.response?.data?.message || 'Could not update the password.'
  } finally {
    changingPassword.value = false
  }
}

async function copyToken() {
  if (!authStore.token) {
    toast.error('No active session to copy.')
    return
  }
  try {
    await navigator.clipboard.writeText(authStore.token)
    toast.success('Token copied to clipboard.')
  } catch {
    toast.error('Clipboard access was blocked by the browser.')
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.settings-view {
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

  .settings-sections {
    max-width: 1200px;
    margin: 0 auto;
  }

  .settings-section {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--surface-border);
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .section-body {
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    color: var(--text-color);
  }

  .form-input {
    width: 100%;
    padding: 0.5rem 1rem;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    font-size: 0.9375rem;
    color: var(--text-color);
    background: var(--surface-ground);
    transition: all 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-100);
  }

  .form-input:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .form-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: var(--text-color);
  }

  .form-check-input {
    width: 16px;
    height: 16px;
    accent-color: var(--primary-color);
  }

  .field-hint {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
  }

  .field-error {
    margin: 0.25rem 0 0.75rem;
    font-size: 0.8125rem;
    color: var(--red-500, #ef4444);
  }

  code {
    font-family: monospace;
    font-size: 0.8125em;
    background: var(--surface-ground);
    padding: 0.1em 0.35em;
    border-radius: 3px;
  }

  .api-tokens {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
  }

  .token-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--surface-border);
    font-size: 0.875rem;
  }

  .token-id {
    color: var(--text-color-secondary);
    font-size: 0.75rem;
  }

  .token-value {
    color: var(--primary-color);
    font-family: monospace;
    word-break: break-all;
  }

  .btn-w-100 {
    width: 100%;
  }

  .btn-block {
    width: 100%;
    margin-top: 1rem;
  }
}
</style>
