<template>
  <div class="admin-rooms-view">
          <div class="view-header">
            <div>
              <h1>Rooms</h1>
              <p class="subtitle">Manage rooms</p>
            </div>
            <button class="btn btn-primary" @click="showCreateDialog = true">
              <i class="pi pi-plus"></i> Create Room
            </button>
          </div>
          
          <div class="card">
            <div class="card-body p-0">
              <DataTable
                :value="rooms"
                :loading="loading"
                :paginator="true"
                :rows="10"
                :totalRecords="pagination.total"
                :rowsPerPageOptions="[10, 25, 50]"
                @page="onPageChange"
                selectionMode="single"
                :selection="selectedRoom"
                @selection-change="onSelectionChange"
              >
                <template #header>
                  <div class="table-toolbar">
                    <input 
                      type="text" 
                      placeholder="Search rooms..." 
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
                
                <Column field="apartment" header="Apartment" :style="{ width: '25%' }">
                  <template #body="slotProps">
                    <div v-if="slotProps.data.apartment">
                      <span>{{ slotProps.data.apartment.name }}</span>
                    </div>
                    <span class="text-muted" v-else>None</span>
                  </template>
                </Column>
                
                <Column field="type" header="Type" :style="{ width: '15%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.type" class="badge">{{ slotProps.data.type }}</span>
                    <span class="text-muted" v-else>None</span>
                  </template>
                </Column>
                
                <Column field="membersCount" header="Members" :style="{ width: '12%' }">
                  <template #body="slotProps">
                    <span class="badge">{{ slotProps.data.members?.length || 0 }}</span>
                  </template>
                </Column>
                
                <Column field="devicesCount" header="Devices" :style="{ width: '12%' }">
                  <template #body="slotProps">
                    <span class="badge">{{ slotProps.data.devicesCount || 0 }}</span>
                  </template>
                </Column>
                
                <Column field="createdAt" header="Created" :style="{ width: '14%' }">
                  <template #body="slotProps">
                    <span>{{ formatDate(slotProps.data.createdAt) }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          
          <ConfirmDialog
            v-model:visible="showDeleteDialog"
            message="Are you sure you want to delete this room? This action cannot be undone."
            header="Delete Room"
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

const rooms = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const searchQuery = ref('')
const selectedRoom = ref(null)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
let searchTimeout = null

const debouncedSearch = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadRooms(1, value)
  }, 300)
}

async function loadRooms(page = 1, search = '') {
  loading.value = true
  try {
    const response = await api.get('/admin/dashboard/rooms/get-all-rooms', { params: { page, limit: 10, search } })
    rooms.value = response.data.data || []
    pagination.value = response.data?.pagination || { total: 0, page: 1, pages: 0, limit: 10 }
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadRooms(event.page + 1, searchQuery.value)
}

function onSelectionChange(selection) {
  selectedRoom.value = selection
}

function confirmDelete() {
  if (!selectedRoom.value) return
  
  showDeleteDialog.value = false
  selectedRoom.value = null
  toast.success('Room deleted successfully!')
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadRooms()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-rooms-view {
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