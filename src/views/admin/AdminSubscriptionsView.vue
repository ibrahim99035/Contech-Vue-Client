<template>
  <div class="admin-subscriptions-view">
          <div class="view-header">
            <div>
              <h1>Subscriptions</h1>
              <p class="subtitle">Manage subscription plans</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h2>Subscription Plans</h2>
            </div>
            <div class="card-body">
              <div v-if="plans.length > 0">
                <table class="plan-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Billing Cycle</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="plan in plans" :key="plan._id">
                      <td>{{ plan.name }}</td>
                      <td>{{ plan.price }}</td>
                      <td>{{ plan.billingCycle }}</td>
                      <td>
                        <span v-if="plan.status === 'active'" class="badge badge-success">Active</span>
                        <span v-else class="badge badge-danger">Inactive</span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-primary">Edit</button>
                        <button class="btn btn-sm btn-danger">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-state">
                <i class="pi pi-tag"></i>
                <p>No subscription plans yet</p>
                <button class="btn btn-primary mt-2">Create First Plan</button>
              </div>
            </div>
          </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const toast = useToast()

const plans = ref([])
const loading = ref(false)
let searchTimeout = null

const debouncedSearch = (value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchPlans()
  }, 300)
}

async function fetchPlans() {
  loading.value = true
  try {
    const response = await api.get('/api/subscription/plans')
    plans.value = response.data.data || []
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  fetchPlans()
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-subscriptions-view {
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

  .plan-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  
  .plan-table th,
  .plan-table td {
    padding: 0.75rem 1rem;
    border: 1px solid var(--surface-border);
    text-align: left;
  }
  
  .plan-table th {
    background: var(--primary-100);
    color: var(--primary-600);
    font-size: 0.875rem;
  }
  
  .plan-table td {
    background: var(--surface-card);
  }
  
  .plan-table tbody tr {
    transition: background 0.2s ease;
    
    &:hover {
      background: var(--surface-hover);
    }
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
}
</style>