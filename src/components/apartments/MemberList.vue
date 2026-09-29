<template>
  <div class="member-list">
    <div class="list-header">
      <button class="btn btn-primary btn-sm" @click="showAddMembersDialog = true">
        <i class="pi pi-user-plus"></i> Add Members
      </button>
    </div>
    
    <div class="member-table-container" v-if="members.length > 0">
      <table class="member-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th style="width: 60px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member._id || member.id">
            <td>
              <div class="member-info">
                <div class="member-avatar">
                  {{ getInitials(member.name || member.email) }}
                </div>
                <span>{{ member.name || 'Unknown' }}</span>
              </div>
            </td>
            <td>{{ member.email }}</td>
            <td>
              <span class="role-badge" :class="getRoleClass(member)">
                {{ getRoleLabel(member) }}
              </span>
            </td>
            <td>{{ formatDate(member.createdAt || member.joinedAt) }}</td>
            <td>
              <button 
                class="btn-icon btn-danger" 
                @click.stop="confirmRemove(member)"
                :disabled="isCreator(member)"
                :title="isCreator(member) ? 'Cannot remove creator' : 'Remove member'"
              >
                <i class="pi pi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="empty-state" v-if="members.length === 0">
      <i class="pi pi-users"></i>
      <p>No members in this apartment</p>
      <button class="btn btn-primary btn-sm" @click="showAddMembersDialog = true">
        Add Members
      </button>
    </div>
    
    <AddMembersDialog
      v-model:visible="showAddMembersDialog"
      :apartment-id="apartmentId"
      :existing-members="members.map(m => m._id || m.id)"
      @added="onMembersAdded"
    />
    
    <ConfirmDialog
      v-model:visible="showRemoveDialog"
      :message="`Remove ${memberToRemove?.name || 'this member'} from the apartment?`"
      header="Remove Member"
      icon="pi pi-exclamation-triangle"
      @accept="removeMemberConfirmed"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import AddMembersDialog from '@/components/apartments/AddMembersDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const props = defineProps({
  members: { type: Array, default: () => [] },
  creatorId: { type: String, required: true },
  apartmentId: { type: String, required: true }
})

const emit = defineEmits(['remove-member'])

const toast = useToast()
const showAddMembersDialog = ref(false)
const showRemoveDialog = ref(false)
const memberToRemove = ref(null)

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleLabel(member) {
  if (member._id === props.creatorId || member.id === props.creatorId) return 'Creator'
  if (member.role === 'admin') return 'Admin'
  return 'Member'
}

function getRoleClass(member) {
  if (member._id === props.creatorId || member.id === props.creatorId) return 'creator'
  if (member.role === 'admin') return 'admin'
  return 'member'
}

function isCreator(member) {
  return member._id === props.creatorId || member.id === props.creatorId
}

function confirmRemove(member) {
  if (isCreator(member)) return
  memberToRemove.value = member
  showRemoveDialog.value = true
}

function removeMemberConfirmed() {
  if (!memberToRemove.value) return
  
  const memberId = memberToRemove.value._id || memberToRemove.value.id
  emit('remove-member', memberId)
  showRemoveDialog.value = false
  memberToRemove.value = null
}

function onMembersAdded() {
  showAddMembersDialog.value = false
  toast.success('Members added successfully!')
}

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString()
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.member-list {
  .list-header {
    margin-bottom: 1rem;
  }
}

.member-table-container {
  overflow-x: auto;
}

.member-table {
  width: 100%;
  border-collapse: collapse;
  
  th,
  td {
    padding: 0.875rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--surface-border);
  }
  
  th {
    background: var(--surface-ground);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
  }
  
  tbody tr:hover {
    background: var(--surface-hover);
  }
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  .member-avatar {
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
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &.creator { background: var(--purple-100); color: var(--purple-600); }
  &.admin { background: var(--blue-100); color: var(--blue-600); }
  &.member { background: var(--green-100); color: var(--green-600); }
}

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
  
  &.btn-danger {
    color: var(--text-color-secondary);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    margin: 0 0 1rem;
  }
}
</style>