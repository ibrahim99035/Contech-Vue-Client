<template>
  <div class="admin-users-view">
          <div class="view-header">
            <div>
              <h1>Users</h1>
              <p class="subtitle">Manage system users</p>
            </div>
            <button class="btn btn-primary" @click="showCreateDialog = true">
              <i class="pi pi-plus"></i> Create User
            </button>
          </div>
          
          <div class="card">
            <div class="card-body p-0">
              <DataTable
                :value="users"
                :loading="loading"
                :paginator="true"
                :rows="10"
                :totalRecords="pagination.total"
                :rowsPerPageOptions="[10, 25, 50]"
                @page="onPageChange"
                selectionMode="single"
                :selection="selectedUser"
                @selection-change="onSelectionChange"
              >
                <template #header>
                  <div class="table-toolbar">
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      class="search-input"
                      v-model="searchQuery"
                      @input="debouncedSearch"
                    />
                  </div>
                </template>
                
                <Column field="name" header="Name" :style="{ width: '24%' }">
                  <template #body="slotProps">
                    <span>{{ slotProps.data.name }}</span>
                  </template>
                </Column>
                
                <Column field="email" header="Email" :style="{ width: '30%' }">
                  <template #body="slotProps">
                    <span>{{ slotProps.data.email }}</span>
                  </template>
                </Column>
                
                <Column field="role" header="Role" :style="{ width: '12%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.role" class="badge">{{ slotProps.data.role }}</span>
                    <span class="text-muted" v-else>None</span>
                  </template>
                </Column>
                
                <Column field="active" header="Status" :style="{ width: '10%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.active" class="badge badge-success">Active</span>
                    <span v-else class="badge badge-danger">Inactive</span>
                  </template>
                </Column>
                
                <Column field="createdAt" header="Created" :style="{ width: '16%' }">
                  <template #body="slotProps">
                    <span>{{ formatDate(slotProps.data.createdAt) }}</span>
                  </template>
                </Column>

                <Column header="Actions" :style="{ width: '8%' }">
                  <template #body="slotProps">
                    <button
                      type="button"
                      class="btn-icon"
                      title="Delete user"
                      aria-label="Delete user"
                      :disabled="isCurrentUser(slotProps.data)"
                      @click.stop="startDelete(slotProps.data)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          
          <ConfirmDialog
            v-model:visible="showDeleteDialog"
            message="Are you sure you want to delete this user? This action cannot be undone."
            header="Delete User"
            icon="pi pi-exclamation-triangle"
            @accept="confirmDelete"
          />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useApartmentStore } from '@/stores/apartment'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/common/DataTable.vue'
import Column from 'primevue/column'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const apartmentStore = useApartmentStore()
const authStore = useAuthStore()
const toast = useToast()

const users = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const searchQuery = ref('')
const selectedUser = ref(null)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
let searchTimeout = null

const debouncedSearch = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers(1, value)
  }, 300)
}

async function loadUsers(page = 1, search = '') {
  loading.value = true
  try {
    const response = await api.get('/admin/dashboard/users/search-users', {
      params: { page, limit: 10, search }
    })
    users.value = response.data.data || []
    pagination.value = response.data?.pagination || { total: 0, page: 1, pages: 0, limit: 10 }
  } catch (error) {
    users.value = []
    // Error handled below / shown in the UI
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadUsers(event.page + 1, searchQuery.value)
}

function onSelectionChange(selection) {
  selectedUser.value = selection
}

function viewUser(id) {
  router.push(`/users/${id}`)
}

function editUser(user) {
  // Could open edit dialog
}

function isCurrentUser(user) {
  const me = authStore.user
  if (!me || !user) return false
  return String(user._id || user.id) === String(me._id || me.id)
}

function startDelete(user) {
  selectedUser.value = user
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!selectedUser.value) return

  const target = selectedUser.value
  try {
    await api.delete(`/admin/dashboard/users/delete-account/${target._id || target.id}`)
    showDeleteDialog.value = false
    selectedUser.value = null
    toast.success(`User ${target.name} deleted successfully!`)
    loadUsers(pagination.value.page, searchQuery.value)
  } catch (error) {
    const message = error?.response?.data?.message
    toast.error(typeof message === 'string' ? message : 'Failed to delete user')
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadUsers()
})

watch(() => apartmentStore.apartments, (newApartments) => {
  // Watcher for apartment store changes
}, { immediate: true })
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

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
    background: var(--red-50);
    color: var(--red-600);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.admin-users-view {
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

  .table-toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--surface-border);
    
    .search-input {
      width: 300px;
      padding: 0.5rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      
      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-100);
      }
    }
  }
}
</style>