<template>
  <div class="admin-devices-view">
          <div class="view-header">
            <div>
              <h1>Devices</h1>
              <p class="subtitle">Manage devices</p>
            </div>
            <button class="btn btn-primary" @click="showCreateDialog = true">
              <i class="pi pi-plus"></i> Create Device
            </button>
          </div>
          
          <div class="card">
            <div class="card-body p-0">
              <DataTable
                :value="devices"
                :loading="loading"
                :paginator="true"
                :rows="10"
                :totalRecords="pagination.total"
                :rowsPerPageOptions="[10, 25, 50]"
                @page="onPageChange"
                selectionMode="single"
                :selection="selectedDevice"
                @selection-change="onSelectionChange"
              >
                <template #header>
                  <div class="table-toolbar">
                    <input 
                      type="text" 
                      placeholder="Search devices..." 
                      class="search-input"
                      v-model="searchQuery"
                      @input="debouncedSearch"
                    />
                  </div>
                </template>
                
                <Column field="name" header="Name" :style="{ width: '30%' }">
                  <template #body="slotProps">
                    <span>{{ slotProps.data.name }}</span>
                  </template>
                </Column>
                
                <Column field="type" header="Type" :style="{ width: '20%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.type" class="badge">{{ slotProps.data.type }}</span>
                    <span class="text-muted" v-else>None</span>
                  </template>
                </Column>
                
                <Column field="room" header="Room" :style="{ width: '20%' }">
                  <template #body="slotProps">
                    <div v-if="slotProps.data.room">
                      <span>{{ slotProps.data.room.name }}</span>
                    </div>
                    <span class="text-muted" v-else>None</span>
                  </template>
                </Column>
                
                <Column field="status" header="Status" :style="{ width: '12%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.active" class="badge badge-success">Active</span>
                    <span v-else class="badge badge-danger">Inactive</span>
                  </template>
                </Column>
                
                <Column field="creator" header="Creator" :style="{ width: '18%' }">
                  <template #body="slotProps">
                    <div v-if="slotProps.data.creator">
                      <span>{{ slotProps.data.creator.name || 'Unknown' }}</span>
                    </div>
                    <span class="text-muted" v-else>Unknown</span>
                  </template>
                </Column>
                
                <Column field="createdAt" header="Created" :style="{ width: '15%' }">
                  <template #body="slotProps">
                    <span>{{ formatDate(slotProps.data.createdAt) }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          
          <ConfirmDialog
            v-model:visible="showDeleteDialog"
            message="Are you sure you want to delete this device? This action cannot be undone."
            header="Delete Device"
            icon="pi pi-exclamation-triangle"
            @accept="confirmDelete"
          />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/common/DataTable.vue'
import Column from 'primevue/column'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const toast = useToast()

const devices = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const searchQuery = ref('')
const selectedDevice = ref(null)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
let searchTimeout = null

const debouncedSearch = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadDevices(1, value)
  }, 300)
}

async function loadDevices(page = 1, search = '') {
  loading.value = true
  try {
    const response = await api.get('/admin/dashboard/devices/get-all-devices', { params: { page, limit: 10, search } })
    devices.value = response.data.data || []
    pagination.value = response.data?.pagination || { total: 0, page: 1, pages: 0, limit: 10 }
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadDevices(event.page + 1, searchQuery.value)
}

function onSelectionChange(selection) {
  selectedDevice.value = selection
}

function confirmDelete() {
  if (!selectedDevice.value) return
  
  showDeleteDialog.value = false
  selectedDevice.value = null
  toast.success('Device deleted successfully!')
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadDevices()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-devices-view {
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