import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useSubscriptionStore = defineStore('subscription', () => {
  const plans = ref([])
  const currentSubscription = ref(null)
  const userPayments = ref([])
  const features = ref([])
  const coupons = ref([])
  const loading = ref(false)
  const toast = useToast()

  const availablePlans = computed(() => plans.value.filter(p => p.status === 'active'))
  const hasSubscription = computed(() => !!currentSubscription.value)

  async function fetchPlans() {
    loading.value = true
    try {
      const response = await api.get('/api/subscription/plans')
      plans.value = response.data.data
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch subscription plans')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchPlanById(id) {
    loading.value = true
    try {
      const response = await api.get(`/api/subscription/plans/${id}`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch plan')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchMySubscription() {
    loading.value = true
    try {
      const response = await api.get('/api/subscription/my')
      currentSubscription.value = response.data.data
      return response.data.data
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch subscription')
      }
      currentSubscription.value = null
      throw error
    } finally {
      loading.value = false
    }
  }

  async function subscribe(planId) {
    loading.value = true
    try {
      const response = await api.post('/api/subscription', { subscriptionPlanId: planId })
      currentSubscription.value = response.data.data
      toast.success('Subscribed successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to subscribe')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function cancelSubscription(reason) {
    loading.value = true
    try {
      await api.delete('/api/subscription', { data: { cancellationReason: reason } })
      currentSubscription.value = null
      toast.success('Subscription cancelled successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to cancel subscription')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createPayment(data) {
    loading.value = true
    try {
      const response = await api.post('/api/subscription/payments', data)
      userPayments.value.unshift(response.data.data)
      toast.success('Payment recorded successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to record payment')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchUserPayments(userId) {
    loading.value = true
    try {
      const response = await api.get(`/api/subscription/payments/${userId}`)
      userPayments.value = response.data.data
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch payments')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchFeatures() {
    loading.value = true
    try {
      const response = await api.get('/api/subscription/features')
      features.value = response.data.data
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch features')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function validateCoupon(code) {
    loading.value = true
    try {
      const response = await api.get(`/api/subscription/coupons/validate/${code}`)
      return response.data.data
    } catch (error) {
      toast.error('Invalid coupon code')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchCoupons() {
    loading.value = true
    try {
      const response = await api.get('/api/subscription/coupons')
      coupons.value = response.data.data
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch coupons')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createCoupon(data) {
    loading.value = true
    try {
      const response = await api.post('/api/subscription/coupons', data)
      coupons.value.unshift(response.data.data)
      toast.success('Coupon created successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to create coupon')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createPlan(data) {
    loading.value = true
    try {
      const response = await api.post('/api/subscription/plans', data)
      plans.value.push(response.data.data)
      toast.success('Plan created successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to create plan')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updatePlan(id, data) {
    loading.value = true
    try {
      const response = await api.put(`/api/subscription/plans/${id}`, data)
      const index = plans.value.findIndex(p => p._id === id)
      if (index !== -1) {
        plans.value[index] = response.data.data
      }
      toast.success('Plan updated successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to update plan')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deletePlan(id) {
    loading.value = true
    try {
      await api.delete(`/api/subscription/plans/${id}`)
      plans.value = plans.value.filter(p => p._id !== id)
      toast.success('Plan deleted successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to delete plan')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchAdminActivities() {
    loading.value = true
    try {
      const response = await api.get('/api/subscription/admin-activities')
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch admin activities')
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    plans,
    currentSubscription,
    userPayments,
    features,
    coupons,
    loading,
    availablePlans,
    hasSubscription,
    fetchPlans,
    fetchPlanById,
    fetchMySubscription,
    subscribe,
    cancelSubscription,
    createPayment,
    fetchUserPayments,
    fetchFeatures,
    validateCoupon,
    fetchCoupons,
    createCoupon,
    createPlan,
    updatePlan,
    deletePlan,
    fetchAdminActivities
  }
})