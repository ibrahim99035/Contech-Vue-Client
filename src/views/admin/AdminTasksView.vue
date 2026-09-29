<template>
  <div class="admin-tasks-view">
          <div class="view-header">
            <div>
              <h1>Tasks</h1>
              <p class="subtitle">Manage tasks</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body p-0">
              <DataTable
                :value="tasks"
                :loading="loading"
                :paginator="true"
                :rows="10"
                :totalRecords="pagination.total"
                :rowsPerPageOptions="[10, 25, 50]"
                @page="onPageChange"
              >
                <template #header>
                  <div class="table-toolbar">
                    <input 
                      type="text" 
                      placeholder="Search tasks..." 
                      class="search-input"
                      v-model="searchQuery"
                      @input="debouncedSearch"
                    />
                  </div>
                </template>
                
                <Column field="name" header="Name" :style="{ width: '40%' }">
                  <template #body="slotProps">
                    <span>{{ slotProps.data.name }}</span>
                  </template>
                </Column>
                
                <Column field="status" header="Status" :style="{ width: '15%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.status" :class="slotProps.data.status" class="badge"></span>
                    <span class="text-muted" v-else>None</span>
                  </template>
                </Column>
                
                <Column field="device" header="Device" :style="{ width: '25%' }">
                  <template #body="slotProps">
                    <div v-if="slotProps.data.device">
                      <span>{{ slotProps.data.device.name }}</span>
                    </div>
                    <span class="text-muted" v-else>None</span>
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

const tasks = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const searchQuery = ref('')
let searchTimeout = null

const debouncedSearch = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadTasks(1, value)
  }, 300)
}

async function loadTasks(page = 1, search = '') {
  loading.value = true
  try {
    const response = await api.get('/admin/dashboard/tasks/get-all-tasks', { params: { page, limit: 10, search } })
    tasks.value = response.data.data || []
    pagination.value = response.data?.pagination || { total: 0, page: 1, pages: 0, limit: 10 }
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadTasks(event.page + 1, searchQuery.value)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadTasks()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-tasks-view {
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