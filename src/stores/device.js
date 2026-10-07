import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useDeviceStore = defineStore('device', () => {
  const devices = ref([])
  const currentDevice = ref(null)
  const roomDevices = ref([])
  const availableOrders = ref([])
  const loading = ref(false)
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const toast = useToast()

  const devicesList = computed(() => devices.value)
  const hasDevices = computed(() => devices.value.length > 0)

  const DEVICE_TYPES = [
    'Light',
    'Thermostat',
    'Camera',
    'Lock',
    'Air conditioner',
    'Fan',
    'Garage',
    'Curtain'
  ]

  const DEVICE_STATUSES = ['on', 'off', 'locked', 'unlocked']

  async function fetchDevicesByRoom(roomId, params = {}) {
    if (!roomId) {
      roomDevices.value = []
      return { data: [] }
    }
    loading.value = true
    try {
      const response = await api.get(`/api/device-handler/devices/room/${roomId}`, { params })
      roomDevices.value = response.data.data
      return response.data
    } catch (error) {
      toast.error('Failed to fetch devices')
      throw error
    } finally {
      loading.value = false
    }
  }

  // The server exposes no owner-level device list - devices are only reachable
  // per room - so aggregate across every room the signed-in user belongs to.
  async function fetchRoomsForUser() {
    const response = await api.get('/api/rooms-handler/rooms/user/get-all')
    const data = response.data?.data
    return Array.isArray(data) ? data : []
  }

  async function fetchAllDevices(params = {}) {
    loading.value = true
    try {
      const rooms = await fetchRoomsForUser()
      const results = await Promise.all(
        rooms.map((room) =>
          api
            .get(`/api/device-handler/devices/room/${room.id || room._id}`)
            .then((r) => (Array.isArray(r.data?.data) ? r.data.data : []))
            .catch(() => [])
        )
      )
      const merged = results.flat()
      const page = Math.max(1, Number(params.page) || 1)
      const limit = Number(params.limit) || merged.length || 1
      const start = (page - 1) * limit

      devices.value = merged.slice(start, start + limit)
      pagination.value = {
        page,
        limit,
        total: merged.length,
        totalPages: Math.max(1, Math.ceil(merged.length / limit))
      }
      return { data: devices.value, pagination: pagination.value }
    } catch (error) {
      toast.error('Failed to fetch devices')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchDeviceById(id) {
    loading.value = true
    try {
      if (!devices.value.length) {
        await fetchAllDevices({ limit: 1000 })
      }
      let found = devices.value.find((d) => d._id === id)
      if (!found) {
        const rooms = await fetchRoomsForUser()
        const results = await Promise.all(
          rooms.map((room) =>
            api
              .get(`/api/device-handler/devices/room/${room._id}`)
              .then((r) => (Array.isArray(r.data?.data) ? r.data.data : []))
              .catch(() => [])
          )
        )
        found = results.flat().find((d) => d._id === id)
      }
      if (!found) {
        const error = new Error('Device not found')
        error.response = { status: 404, data: { message: 'Device not found' } }
        throw error
      }
      currentDevice.value = found
      return found
    } catch (error) {
      toast.error('Failed to fetch device')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableOrders(roomId) {
    try {
      const response = await api.get(`/api/device-handler/devices/room/${roomId}/orders`)
      availableOrders.value = response.data.data
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch available orders')
      throw error
    }
  }

  async function fetchAvailableOrdersForDevice(roomId, deviceId) {
    try {
      const response = await api.get(`/api/device-handler/devices/room/${roomId}/orders/${deviceId}`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch available orders')
      throw error
    }
  }

  async function createDevice(data) {
    loading.value = true
    try {
      const response = await api.post('/api/device-handler/devices/create', data)
      devices.value.unshift(response.data.data)
      roomDevices.value.unshift(response.data.data)
      toast.success('Device created successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to create device')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateDeviceName(id, name) {
    loading.value = true
    try {
      const response = await api.put(`/api/device-handler/devices/${id}/update-name`, { name })
      const index = devices.value.findIndex(d => d._id === id)
      if (index !== -1) {
        devices.value[index] = response.data.data
      }
      const roomIndex = roomDevices.value.findIndex(d => d._id === id)
      if (roomIndex !== -1) {
        roomDevices.value[roomIndex] = response.data.data
      }
      if (currentDevice.value?._id === id) {
        currentDevice.value = response.data.data
      }
      toast.success('Device name updated successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to update device name')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateComponentNumber(id, componentNumber) {
    loading.value = true
    try {
      const response = await api.put(`/api/device-handler/devices/${id}/update-component-number`, { componentNumber })
      if (currentDevice.value?._id === id) {
        currentDevice.value = response.data.data
      }
      toast.success('Component number updated successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to update component number')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function assignUsersToDevice(deviceId, userIds) {
    loading.value = true
    try {
      const response = await api.put(`/api/device-handler/devices/${deviceId}/assign-users`, { userIds })
      if (currentDevice.value?._id === deviceId) {
        currentDevice.value = response.data.data
      }
      toast.success('Users assigned to device successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to assign users to device')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchDeviceUsers(deviceId) {
    try {
      const response = await api.get(`/api/device-handler/devices/get-users/device/${deviceId}`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch device users')
      throw error
    }
  }

  async function removeUserFromDevice(deviceId, userId) {
    loading.value = true
    try {
      const response = await api.put(`/api/device-handler/devices/remove-user/device/${deviceId}/user/${userId}`)
      if (currentDevice.value?._id === deviceId) {
        currentDevice.value = response.data.data
      }
      toast.success('User removed from device successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to remove user from device')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function exitDevice(deviceId) {
    loading.value = true
    try {
      await api.put(`/api/device-handler/devices/exist-device/${deviceId}`)
      roomDevices.value = roomDevices.value.filter(d => d._id !== deviceId)
      if (currentDevice.value?._id === deviceId) {
        currentDevice.value = null
      }
      toast.success('Exited device successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to exit device')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function toggleDeviceActivation(deviceId) {
    loading.value = true
    try {
      const response = await api.put(`/api/device-handler/devices/${deviceId}/toggle-activation`)
      const index = devices.value.findIndex(d => d._id === deviceId)
      if (index !== -1) {
        devices.value[index] = response.data.data
      }
      const roomIndex = roomDevices.value.findIndex(d => d._id === deviceId)
      if (roomIndex !== -1) {
        roomDevices.value[roomIndex] = response.data.data
      }
      if (currentDevice.value?._id === deviceId) {
        currentDevice.value = response.data.data
      }
      toast.success(`Device ${response.data.data.active ? 'activated' : 'deactivated'} successfully!`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to toggle device activation')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateDeviceOrder(deviceId, order) {
    loading.value = true
    try {
      const response = await api.put(`/api/device-handler/devices/${deviceId}/update-order`, { order })
      const index = devices.value.findIndex(d => d._id === deviceId)
      if (index !== -1) {
        devices.value[index] = response.data.data
      }
      const roomIndex = roomDevices.value.findIndex(d => d._id === deviceId)
      if (roomIndex !== -1) {
        roomDevices.value[roomIndex] = response.data.data
      }
      if (currentDevice.value?._id === deviceId) {
        currentDevice.value = response.data.data
      }
      toast.success('Device order updated successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to update device order')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteDevice(id) {
    loading.value = true
    try {
      await api.delete(`/api/device-handler/devices/delete/${id}`)
      devices.value = devices.value.filter(d => d._id !== id)
      roomDevices.value = roomDevices.value.filter(d => d._id !== id)
      if (currentDevice.value?._id === id) {
        currentDevice.value = null
      }
      toast.success('Device deleted successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to delete device')
      throw error
    } finally {
      loading.value = false
    }
  }

  function clearCurrentDevice() {
    currentDevice.value = null
  }

  function clearRoomDevices() {
    roomDevices.value = []
  }

  return {
    devices,
    currentDevice,
    roomDevices,
    availableOrders,
    loading,
    pagination,
    devicesList,
    hasDevices,
    DEVICE_TYPES,
    DEVICE_STATUSES,
    fetchDevicesByRoom,
    fetchAllDevices,
    fetchDeviceById,
    fetchAvailableOrders,
    fetchAvailableOrdersForDevice,
    createDevice,
    updateDeviceName,
    updateComponentNumber,
    assignUsersToDevice,
    fetchDeviceUsers,
    removeUserFromDevice,
    exitDevice,
    toggleDeviceActivation,
    updateDeviceOrder,
    deleteDevice,
    clearCurrentDevice,
    clearRoomDevices
  }
})