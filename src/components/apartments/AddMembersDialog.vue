<template>
  <Dialog 
    :visible="visible" 
    header="Add Members"
    :style="{ width: '600px' }"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <div class="dialog-content">
      <p class="dialog-description">Search for users to add to this apartment</p>
      
      <div class="form-group">
        <label for="search">Search Users</label>
        <div class="search-wrapper">
          <input
            id="search"
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="Search by name or email..."
            @input="debouncedSearch"
          />
          <i class="pi pi-search search-icon" v-if="!searchQuery"></i>
          <i class="pi pi-spin pi-spinner search-icon" v-else-if="searchLoading"></i>
        </div>
      </div>
      
      <div class="search-results" v-if="searchResults.length > 0 || searchQuery">
        <div class="result-item" v-for="user in searchResults" :key="user._id">
          <div class="user-info">
            <div class="user-avatar">{{ getInitials(user.name) }}</div>
            <div>
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
          </div>
          <button
            class="btn-add"
            @click="addUser(user)"
            :disabled="isAlreadyMember(user._id) || addingUsers.includes(user._id)"
          >
            <span v-if="addingUsers.includes(user._id)"><i class="pi pi-spin pi-spinner"></i></span>
            <span v-else-if="isAlreadyMember(user._id)">Added</span>
            <span v-else><i class="pi pi-plus"></i> Add</span>
          </button>
        </div>
        <div class="no-results" v-if="searchResults.length === 0 && searchQuery && !searchLoading">
          No users found matching "{{ searchQuery }}"
        </div>
      </div>
      
      <div class="selected-users" v-if="selectedUsers.length > 0">
        <h4>Selected Users ({{ selectedUsers.length }})</h4>
        <div class="selected-list">
          <div class="selected-item" v-for="user in selectedUsers" :key="user._id">
            <div class="user-info">
              <div class="user-avatar">{{ getInitials(user.name) }}</div>
              <span>{{ user.name }}</span>
            </div>
            <button class="btn-remove" @click="removeSelected(user._id)">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="onClose">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" @click="confirmAdd" :disabled="selectedUsers.length === 0 || addingAll">
          <span v-if="addingAll"><i class="pi pi-spin pi-spinner"></i> Adding...</span>
          <span v-else>Add {{ selectedUsers.length }} Member(s)</span>
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Dialog from 'primevue/dialog'
import api from '@/services/api'

const props = defineProps({
  visible: { type: Boolean, default: false },
  apartmentId: { type: String, required: true },
  existingMembers: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'added'])

const toast = useToast()

const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const selectedUsers = ref([])
const addingUsers = ref([])
const addingAll = ref(false)
let searchTimeout = null

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

async function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  searchLoading.value = true
  try {
    const response = await api.get('/admin/dashboard/users/search-users', {
      params: {
        search: searchQuery.value,
        limit: 20,
        active: true
      }
    })
    searchResults.value = response.data.data || []
  } catch (error) {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function isAlreadyMember(userId) {
  return props.existingMembers.includes(userId) || selectedUsers.value.some(u => u._id === userId)
}

function addUser(user) {
  if (isAlreadyMember(user._id)) return
  selectedUsers.value.push(user)
}

function removeSelected(userId) {
  selectedUsers.value = selectedUsers.value.filter(u => u._id !== userId)
}

async function confirmAdd() {
  if (selectedUsers.value.length === 0) return
  
  addingAll.value = true
  const userIds = selectedUsers.value.map(u => u._id)
  addingUsers.value = userIds
  
  try {
    await api.put('/api/apartments-handler/apartments/assign-members', {
      apartmentId: props.apartmentId,
      members: userIds
    })
    emit('added')
    toast.success(`${selectedUsers.value.length} member(s) added successfully!`)
    onClose()
  } catch (error) {
    // Error handled in toast
  } finally {
    addingAll.value = false
    addingUsers.value = []
  }
}

function onClose() {
  emit('update:visible', false)
  searchQuery.value = ''
  searchResults.value = []
  selectedUsers.value = []
  addingUsers.value = []
  addingAll.value = false
  clearTimeout(searchTimeout)
}

watch(() => props.visible, (visible) => {
  if (!visible) {
    onClose()
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dialog-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
  }
}

.search-wrapper {
  position: relative;
  
  .form-input {
    padding-right: 2.5rem;
  }
  
  .search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary);
    pointer-events: none;
  }
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: var(--surface-hover);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  
  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--primary-100);
    color: var(--primary-600);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  
  .user-name {
    display: block;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-email {
    display: block;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  
  &.btn-primary {
    background: var(--primary-color);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--primary-600);
    }
  }
  
  &:disabled {
    background: var(--surface-border);
    color: var(--text-color-secondary);
    cursor: not-allowed;
  }
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.selected-users {
  h4 {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
  }
}

.selected-list {
  max-height: 150px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  margin-bottom: 0.5rem;
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-100);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
    }
  }
  
  .btn-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    
    &:hover {
      background: var(--red-50);
      color: var(--red-600);
    }
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--primary-600);
  }
}

.btn-secondary {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  
  &:hover:not(:disabled) {
    background: var(--surface-hover);
  }
}
</style>