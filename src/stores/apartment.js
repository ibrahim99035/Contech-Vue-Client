import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useApartmentStore = defineStore('apartment', () => {
  const apartments = ref([])
  const currentApartment = ref(null)
  const loading = ref(false)
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const toast = useToast()

  const apartmentsList = computed(() => apartments.value)
  const hasApartments = computed(() => apartments.value.length > 0)

  async function fetchApartments(params = {}) {
    loading.value = true
    try {
      const response = await api.get('/api/apartments-handler/apartments/member', { params })
      apartments.value = response.data.data
      if (response.data.pagination) {
        pagination.value = response.data.pagination
      }
      return response.data
    } catch (error) {
      toast.error('Failed to fetch apartments')
      throw error
    } finally {
      loading.value = false
    }
  }

  // There is no GET /apartments/:id endpoint, so this resolves from the cached
  // list. Callers that just mutated something (room added, members changed) must
  // pass { force: true } or they will keep rendering the pre-mutation snapshot.
  async function fetchApartmentById(id, options = {}) {
    loading.value = true
    try {
      if (options.force || !apartments.value.length) {
        await fetchApartments()
      }
      const found = apartments.value.find(a => a._id === id)
      if (!found) {
        const error = new Error('Apartment not found')
        error.response = { status: 404, data: { message: 'Apartment not found' } }
        throw error
      }
      currentApartment.value = found
      return found
    } catch (error) {
      toast.error('Failed to fetch apartment')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createApartment(data) {
    loading.value = true
    try {
      const response = await api.post('/api/apartments-handler/apartments/create-apartment', data)
      apartments.value.unshift(response.data.data)
      toast.success('Apartment created successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to create apartment')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateApartmentName(id, name) {
    loading.value = true
    try {
      const response = await api.put('/api/apartments-handler/apartments/update-name', { apartmentId: id, name })
      const index = apartments.value.findIndex(a => a._id === id)
      if (index !== -1) {
        apartments.value[index] = response.data.data
      }
      if (currentApartment.value?._id === id) {
        currentApartment.value = response.data.data
      }
      toast.success('Apartment updated successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to update apartment')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function assignMembers(id, memberIds) {
    loading.value = true
    try {
      const response = await api.put('/api/apartments-handler/apartments/assign-members', {
        apartmentId: id,
        members: memberIds
      })
      if (currentApartment.value?._id === id) {
        currentApartment.value = response.data.data
      }
      toast.success('Members assigned successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to assign members')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function removeMember(apartmentId, memberId) {
    loading.value = true
    try {
      const response = await api.delete(
        `/api/apartments-handler/apartments/remover-member/${apartmentId}/${memberId}`
      )
      if (currentApartment.value?._id === apartmentId) {
        currentApartment.value = response.data.data
      }
      toast.success('Member removed successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to remove member')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function exitApartment(id) {
    loading.value = true
    try {
      await api.put(`/api/apartments-handler/apartments/${id}/exit`)
      apartments.value = apartments.value.filter(a => a._id !== id)
      if (currentApartment.value?._id === id) {
        currentApartment.value = null
      }
      toast.success('Exited apartment successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to exit apartment')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteApartment(id) {
    loading.value = true
    try {
      await api.delete(`/api/apartments-handler/apartments/delete/${id}`)
      apartments.value = apartments.value.filter(a => a._id !== id)
      if (currentApartment.value?._id === id) {
        currentApartment.value = null
      }
      toast.success('Apartment deleted successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to delete apartment')
      throw error
    } finally {
      loading.value = false
    }
  }

  function clearCurrentApartment() {
    currentApartment.value = null
  }

  return {
    apartments,
    currentApartment,
    loading,
    pagination,
    apartmentsList,
    hasApartments,
    fetchApartments,
    fetchApartmentById,
    createApartment,
    updateApartmentName,
    assignMembers,
    removeMember,
    exitApartment,
    deleteApartment,
    clearCurrentApartment
  }
})