<template>
  <div class="admin-images-view">
          <div class="view-header">
            <div>
              <h1>Images</h1>
              <p class="subtitle">Manage background images for the image model</p>
            </div>
            <button class="btn btn-primary" @click="openCreate">
              <i class="pi pi-plus"></i> Upload Image
            </button>
          </div>

          <div class="stats-row" v-if="statsLoaded">
            <div class="stat-card">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">Total Images</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: var(--green-600)">{{ stats.active }}</div>
              <div class="stat-label">Active</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: var(--red-600)">{{ stats.inactive }}</div>
              <div class="stat-label">Inactive</div>
            </div>
            <div class="stat-card" v-for="t in stats.byType" :key="t._id">
              <div class="stat-value">{{ t.count }}</div>
              <div class="stat-label">{{ formatType(t._id) }}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-body p-0">
              <DataTable
                :value="images"
                :loading="loading"
                :paginator="true"
                :rows="10"
                :totalRecords="pagination.total"
                :rowsPerPageOptions="[10, 25, 50]"
                @page="onPageChange"
                selectionMode="single"
                :selection="selectedImage"
                @selection-change="onSelectionChange"
              >
                <template #header>
                  <div class="table-toolbar">
                    <input
                      type="text"
                      placeholder="Search images..."
                      class="search-input"
                      v-model="searchQuery"
                      @input="debouncedSearch"
                    />
                    <select class="type-filter" v-model="typeFilter" @change="loadImages(1)">
                      <option value="">All types</option>
                      <option v-for="t in TYPES" :key="t" :value="t">{{ formatType(t) }}</option>
                    </select>
                  </div>
                </template>

                <Column field="url" header="Image" :style="{ width: '18%' }">
                  <template #body="slotProps">
                    <img
                      :src="slotProps.data.url"
                      :alt="slotProps.data.title || slotProps.data.type"
                      class="thumb"
                      loading="lazy"
                    />
                  </template>
                </Column>

                <Column field="type" header="Type" :style="{ width: '15%' }">
                  <template #body="slotProps">
                    <span class="badge">{{ formatType(slotProps.data.type) }}</span>
                  </template>
                </Column>

                <Column field="title" header="Title" :style="{ width: '20%' }">
                  <template #body="slotProps">
                    <span>{{ slotProps.data.title || 'Untitled' }}</span>
                  </template>
                </Column>

                <Column field="tags" header="Tags" :style="{ width: '17%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.tags && slotProps.data.tags.length" class="text-muted">
                      {{ slotProps.data.tags.join(', ') }}
                    </span>
                    <span class="text-muted" v-else>None</span>
                  </template>
                </Column>

                <Column field="isActive" header="Status" :style="{ width: '10%' }">
                  <template #body="slotProps">
                    <span v-if="slotProps.data.isActive" class="badge badge-success">Active</span>
                    <span v-else class="badge badge-danger">Inactive</span>
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

          <div class="action-row" v-if="selectedImage">
            <div class="selected-label">
              Selected: <strong>{{ selectedImage.title || selectedImage.type }}</strong>
            </div>
            <div class="action-buttons">
              <button class="btn btn-secondary" @click="openEdit">
                <i class="pi pi-pencil"></i> Edit
              </button>
              <button class="btn btn-danger" @click="showDeleteDialog = true">
                <i class="pi pi-trash"></i> Delete
              </button>
            </div>
          </div>

          <Dialog
            v-model:visible="showFormDialog"
            :header="editingImage ? 'Edit Image' : 'Upload Image'"
            :style="{ width: '600px' }"
            :modal="true"
          >
            <form @submit.prevent="handleSubmit" class="dialog-form">
              <div class="form-group">
                <label for="image-file">Image File</label>
                <input
                  id="image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="form-input"
                  @change="onFileChange"
                />
                <small class="form-hint" v-if="editingImage">
                  Leave empty to keep the current file.
                </small>
              </div>

              <div class="form-group">
                <label for="image-type">Type</label>
                <select id="image-type" v-model="form.type" class="form-input" required>
                  <option value="" disabled>Select a type...</option>
                  <option v-for="t in TYPES" :key="t" :value="t">{{ formatType(t) }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="image-title">Title</label>
                <input id="image-title" v-model="form.title" class="form-input" placeholder="Image title" />
              </div>

              <div class="form-group">
                <label for="image-description">Description</label>
                <textarea
                  id="image-description"
                  v-model="form.description"
                  class="form-input"
                  rows="3"
                  placeholder="Description"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="image-tags">Tags (comma separated)</label>
                <input id="image-tags" v-model="form.tagsText" class="form-input" placeholder="modern, minimal, dark" />
              </div>

              <div class="form-group" v-if="editingImage">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="form.isActive" />
                  Active (visible in app)
                </label>
              </div>

              <div class="dialog-actions">
                <button type="button" class="btn btn-secondary" @click="closeForm">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <span v-if="submitting"><i class="pi pi-spin pi-spinner"></i> Saving...</span>
                  <span v-else>{{ editingImage ? 'Update' : 'Upload' }}</span>
                </button>
              </div>
            </form>
          </Dialog>

          <ConfirmDialog
            v-model:visible="showDeleteDialog"
            message="Are you sure you want to delete this image? It will also be removed from cloud storage."
            header="Delete Image"
            icon="pi pi-exclamation-triangle"
            @accept="confirmDelete"
          />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/common/DataTable.vue'
import Column from 'primevue/column'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Dialog from 'primevue/dialog'

const router = useRouter()
const toast = useToast()

const TYPES = ['living_room', 'bedroom', 'kitchen', 'bathroom', 'dining_room', 'office', 'garage']

const images = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
const searchQuery = ref('')
const typeFilter = ref('')
const selectedImage = ref(null)

const stats = ref({ total: 0, active: 0, inactive: 0, byType: [] })
const statsLoaded = ref(false)

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingImage = ref(null)
const submitting = ref(false)
const form = ref({})
const selectedFile = ref(null)

let searchTimeout = null

const debouncedSearch = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadImages(1, value)
  }, 300)
}

function formatType(type) {
  return type ? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown'
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

async function loadStats() {
  try {
    const response = await api.get('/api/images/analytics/stats')
    stats.value = response.data.data || { total: 0, active: 0, inactive: 0, byType: [] }
    statsLoaded.value = true
  } catch (error) {
    console.log('[AdminImages] loadStats failed:', error.response?.data || error.message)
    toast.error('Failed to load image statistics')
  }
}

async function loadImages(page = 1, search = '') {
  loading.value = true
  try {
    const params = { page, limit: 10, search }
    if (typeFilter.value) params.type = typeFilter.value
    const response = await api.get('/api/images/list', { params })
    images.value = response.data.data || []
    pagination.value = {
      ...response.data.pagination,
      page: response.data.pagination?.current || page,
      totalPages: response.data.pagination?.pages || 1
    }
    console.log('[AdminImages] loaded', images.value.length, 'images')
  } catch (error) {
    console.log('[AdminImages] loadImages failed:', error.response?.data || error.message)
    toast.error('Failed to load images')
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadImages(event.page + 1, searchQuery.value)
}

function onSelectionChange(selection) {
  selectedImage.value = selection
}

function openCreate() {
  editingImage.value = null
  form.value = { type: '', title: '', description: '', tagsText: '', isActive: true }
  selectedFile.value = null
  showFormDialog.value = true
}

function openEdit() {
  if (!selectedImage.value) return
  editingImage.value = selectedImage.value
  form.value = {
    type: selectedImage.value.type || '',
    title: selectedImage.value.title || '',
    description: selectedImage.value.description || '',
    tagsText: (selectedImage.value.tags || []).join(', '),
    isActive: selectedImage.value.isActive !== false
  }
  selectedFile.value = null
  showFormDialog.value = true
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null
  console.log('[AdminImages] file selected:', selectedFile.value?.name)
}

function closeForm() {
  showFormDialog.value = false
  editingImage.value = null
  selectedFile.value = null
  form.value = {}
}

function buildFormData() {
  const fd = new FormData()
  fd.append('type', form.value.type)
  if (form.value.title) fd.append('title', form.value.title)
  if (form.value.description) fd.append('description', form.value.description)
  if (form.value.tagsText) fd.append('tags', form.value.tagsText)
  if (editingImage.value) fd.append('isActive', form.value.isActive)
  if (selectedFile.value) fd.append('image', selectedFile.value)
  return fd
}

async function handleSubmit() {
  if (!form.value.type) {
    toast.error('Please select an image type')
    return
  }
  if (!editingImage.value && !selectedFile.value) {
    toast.error('Please choose a file to upload')
    return
  }

  const target = editingImage.value
  const url = target
    ? `/api/images/update/${target._id}`
    : '/api/images/upload/new'

  submitting.value = true
  try {
    const response = target
      ? await api.put(url, buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } })
      : await api.post(url, buildFormData(), { headers: { 'Content-Type': 'multipart/form-data' } })

    console.log('[AdminImages]', target ? 'update' : 'upload', 'response:', response.data)
    toast.success(target ? 'Image updated successfully!' : 'Image uploaded successfully!')
    closeForm()
    loadImages(pagination.value.page || 1, searchQuery.value)
    loadStats()
  } catch (error) {
    console.log('[AdminImages] submit failed:', error.response?.data || error.message)
    toast.error(error.response?.data?.message || 'Failed to save image')
  } finally {
    submitting.value = false
  }
}

async function confirmDelete() {
  if (!selectedImage.value) return
  const id = selectedImage.value._id
  showDeleteDialog.value = false
  try {
    const response = await api.delete(`/api/images/remove/${id}`)
    console.log('[AdminImages] delete response:', response.data)
    toast.success(response.data.message || 'Image deleted successfully!')
    selectedImage.value = null
    loadImages(1, searchQuery.value)
    loadStats()
  } catch (error) {
    console.log('[AdminImages] delete failed:', error.response?.data || error.message)
    toast.error(error.response?.data?.message || 'Failed to delete image')
  }
}

onMounted(() => {
  loadStats()
  loadImages()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-images-view {
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

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;

    .stat-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem 1.25rem;

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.1;
      }

      .stat-label {
        margin-top: 0.25rem;
        font-size: 0.85rem;
        color: var(--text-color-secondary);
      }
    }
  }

  .table-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
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

    .type-filter {
      padding: 0.5rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      background: var(--surface-card);
      color: var(--text-color);

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }
  }

  .thumb {
    width: 72px;
    height: 48px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid var(--surface-border);
    display: block;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 0.5rem;
    border-radius: var(--border-radius);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge-success {
    background: var(--green-100);
    color: var(--green-800);
  }

  .badge-danger {
    background: var(--red-100);
    color: var(--red-800);
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.25rem;
    padding: 1rem 1.25rem;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    flex-wrap: wrap;

    .selected-label {
      font-size: 0.925rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }
  }

  .dialog-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      label {
        font-size: 0.85rem;
        font-weight: 500;
      }

      .form-input {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--surface-border);
        border-radius: var(--border-radius);
        font-size: 0.925rem;
        background: var(--surface-card);
        color: var(--text-color);
        width: 100%;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-100);
        }
      }

      textarea.form-input {
        resize: vertical;
      }

      .form-hint {
        font-size: 0.8rem;
        color: var(--text-color-secondary);
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      cursor: pointer;

      input[type='checkbox'] {
        width: 18px;
        height: 18px;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  }
}
</style>