<template>
  <div class="subscription-view">
    <MainLayout>
      <template #default>
        <div class="subscription-view">
          <div class="view-header">
            <div>
              <h1>Subscription</h1>
              <p class="subtitle">Manage your plan and billing</p>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <i class="pi pi-spin pi-spinner"></i> Loading plans...
          </div>

          <template v-else>
            <div v-if="currentSubscription" class="current-plan card">
              <div class="card-body">
                <h2>Current Plan</h2>
                <p><strong>{{ currentSubscription.planName || currentSubscription.subscriptionPlan?.name || 'Active' }}</strong></p>
                <p class="text-secondary">
                  Status: <span class="badge">{{ currentSubscription.status }}</span>
                </p>
                <button class="btn btn-danger" :disabled="cancelling" @click="cancelSubscription">
                  {{ cancelling ? 'Cancelling...' : 'Cancel Subscription' }}
                </button>
              </div>
            </div>

            <div class="plans-grid">
              <div
                v-for="plan in plans"
                :key="plan._id"
                class="plan-card card"
                :class="{ active: currentSubscription?.subscriptionPlan?._id === plan._id || currentSubscription?.planName === plan.name }"
              >
                <div class="card-body">
                  <h3 class="plan-name">{{ plan.name }}</h3>
                  <div class="plan-price">
                    <span class="amount">${{ plan.price }}</span>
                    <span class="cycle">/ {{ plan.billingCycle || 'month' }}</span>
                  </div>
                  <p class="plan-desc text-secondary">{{ plan.description }}</p>
                  <button
                    class="btn btn-primary btn-block"
                    :disabled="subscribing"
                    @click="subscribeTo(plan)"
                  >
                    {{ isCurrentPlan(plan) ? 'Current Plan' : 'Subscribe' }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </MainLayout>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSubscriptionStore } from '@/stores/subscription'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'

const subscriptionStore = useSubscriptionStore()
const toast = useToast()

const loading = ref(false)
const subscribing = ref(false)
const cancelling = ref(false)

const plans = computed(() => subscriptionStore.plans)
const currentSubscription = computed(() => subscriptionStore.currentSubscription)

function isCurrentPlan(plan) {
  return (
    currentSubscription.value?.subscriptionPlan?._id === plan._id ||
    currentSubscription.value?.planName === plan.name
  )
}

async function subscribeTo(plan) {
  if (isCurrentPlan(plan)) return
  subscribing.value = true
  try {
    await subscriptionStore.subscribe(plan._id)
    toast.success(`Subscribed to ${plan.name}`)
  } catch (e) {
    // handled in store
  } finally {
    subscribing.value = false
  }
}

async function cancelSubscription() {
  cancelling.value = true
  try {
    await subscriptionStore.cancelSubscription('User cancelled from UI')
  } catch (e) {
    // handled in store
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.allSettled([subscriptionStore.fetchPlans(), subscriptionStore.fetchMySubscription()])
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.subscription-view {
  .view-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;

    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 600; }
    .subtitle { margin: 0; color: var(--text-color-secondary); }
  }

  .loading-state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    color: var(--text-color-secondary);
  }

  .current-plan {
    margin-bottom: 2rem;

    h2 { margin: 0 0 0.5rem; font-size: 1.1rem; }
    p { margin: 0.25rem 0; }
  }

  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
    max-width: 1100px;
  }

  .plan-card {
    &.active {
      border-color: var(--primary-color);
      box-shadow: var(--shadow-2);
    }

    .plan-name { margin: 0 0 0.5rem; text-transform: capitalize; font-size: 1.25rem; }
    .plan-price {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
      .amount { font-size: 2rem; font-weight: 700; color: var(--primary-color); }
      .cycle { color: var(--text-color-secondary); }
    }
    .plan-desc { font-size: 0.875rem; margin-bottom: 1rem; }
  }

  .badge {
    display: inline-flex;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--green-100);
    color: var(--green-800);
  }
}
</style>