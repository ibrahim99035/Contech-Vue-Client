<template>
  <div class="admin-apartments-view">
          <div class="view-header">
            <div>
              <h1>Apartments</h1>
              <p class="subtitle">Manage apartments</p>
            </div>
            <button class="btn btn-primary" @click="showCreateDialog = true">
              <i class="pi pi-plus"></i> Create Apartment
            </button>
          </div>
          
          <div class="card">
            <div class="card-body p-0">
              <DataTable
                :value="apartments"
                :loading="loading"
                :paginator="true"
                :rows="10"
                :totalRecords="pagination.total"
                :rowsPerPageOptions="[10, 25, 50]"
                @page="onPageChange"
                selectionMode="single"
                :selection="selectedApartment"
                @selection-change="onSelectionChange"
              >
                <template #header>
                  <div class="table-toolbar">
                    <input 
                      type="text" 
                      placeholder="Search apartments..." 
                      class="search-input"
                      v-model="searchQuery"
                      @input="debouncedSearch"
                    />
                  </div>
                </template>
                
                <Column field="name" header="Name" :style="{ width: '30%' }">
                  <template #body="slotProps">
                    <div class="apartment-name-cell">
                      <div class="apartment-avatar">
                        <i class="pi pi-building"></i>
                      </div>
                      <span>{{ slotProps.data.name }}</span>
                    </div>
                  </template>
                </Column>
                
                <Column field="creator" header="Creator" :style="{ width: '18%' }">
                  <template #body="slotProps">
                    <div v-if="slotProps.data.creator">
                      <span>{{ slotProps.data.creator.name || 'Unknown' }}</span>
                      <span class="text-secondary">({{ slotProps.data.creator.email }})</span>
                    </div>
                    <span class="text-muted" v-else>Unknown</span>
                  </template>
                </Column>
                
                <Column field="membersCount" header="Members" :style="{ width: '10%' }">
                  <template #body="slotProps">
                    <span class="badge">{{ slotProps.data.members?.length || 0 }}</span>
                  </template>
                </Column>
                
                <Column field="roomsCount" header="Rooms" :style="{ width: '10%' }">
                  <template #body="slotProps">
                    <span class="badge">{{ slotProps.data.roomsCount || 0 }}</span>
                  </template>
                </Column>
                
                <Column field="devicesCount" header="Devices" :style="{ width: '10%' }">
                  <template #body="slotProps">
                    <span class="badge">{{ slotProps.data.devicesCount || 0 }}</span>
                  </template>
                </Column>
                
                <Column field="createdAt" header="Created" :style="{ width: '14%' }">
                  <template #body="slotProps">
                    <span>{{ formatDate(slotProps.data.createdAt) }}</span>
                  </template>
                </Column>

                <Column header="Actions" :style="{ width: '8%' }">
                  <template #body="slotProps">
                    <button
                      type="button"
                      class="btn-icon"
                      title="Delete apartment"
                      aria-label="Delete apartment"
                      @click.stop="startDelete(slotProps.data)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          
          <CreateApartmentDialog
            v-model:visible="showCreateDialog"
            @created="onApartmentCreated"
          />
          
          <ConfirmDialog
            v-model:visible="showDeleteDialog"
            message="Are you sure you want to delete this apartment? This action cannot be undone."
            header="Delete Apartment"
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
import DataTable from '@/components/common/DataTable.vue'
import Column from 'primevue/column'
import CreateApartmentDialog from '@/components/apartments/CreateApartmentDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const apartmentStore = useApartmentStore()

const apartments = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const searchQuery = ref('')
const selectedApartment = ref(null)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
let searchTimeout = null

const debouncedSearch = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadApartments(1, value)
  }, 300)
}

async function loadApartments(page = 1, search = '') {
  loading.value = true
  try {
    const response = await api.get('/admin/dashboard/apartments/all-apartments', { params: { page, limit: 10, search } })
    apartments.value = response.data.data || []
    pagination.value = response.data?.pagination || { total: 0, page: 1, pages: 0, limit: 10 }
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadApartments(event.page + 1, searchQuery.value)
}

function onSelectionChange(selection) {
  selectedApartment.value = selection
}

function onApartmentCreated() {
  showCreateDialog.value = false
  loadApartments(pagination.value.page, searchQuery.value)
}

function viewApartment(apartment) {
  router.push(`/apartments/${apartment._id}`)
}

function editApartment(apartment) {
  router.push(`/apartments/${apartment._id}`)
}

function startDelete(apartment) {
  selectedApartment.value = apartment
  showDeleteDialog.value = true
}

function confirmDelete() {
  if (!selectedApartment.value) return
  
  apartmentStore.deleteApartment(selectedApartment.value._id)
    .then(() => {
      showDeleteDialog.value = false
      selectedApartment.value = null
      loadApartments(pagination.value.page, searchQuery.value)
    })
    .catch(() => {
      // Error handled in store
    })
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadApartments()
})

watch(() => apartmentStore.apartments, (newApartments) => {
  if (newApartments.length > 0 && apartments.value.length === 0) {
    apartments.value = newApartments
  }
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
}

.admin-apartments-view {
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
  
  .apartment-name-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .apartment-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius);
      background: var(--blue-100);
      color: var(--blue-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 0.5rem;
    background: var(--primary-100);
    color: var(--primary-600);
    border-radius: var(--border-radius);
    font-size: 0.75rem;
    font-weight: 600;
  }
}
</style>