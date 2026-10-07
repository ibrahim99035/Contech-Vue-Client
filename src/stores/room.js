import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useRoomStore = defineStore('room', () => {
  const rooms = ref([])
  const currentRoom = ref(null)
  const userRooms = ref([])
  const loading = ref(false)
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const toast = useToast()

  const roomsList = computed(() => rooms.value)
  const hasRooms = computed(() => rooms.value.length > 0)

  async function fetchRoomsByApartment(apartmentId, params = {}) {
    loading.value = true
    try {
      const response = await api.get(`/api/rooms-handler/rooms/apartment/${apartmentId}`, { params })
      // This endpoint returns data: { rooms: [...], apartment: {...} }, not a
      // bare array — assigning data directly left `rooms` an object with no
      // length, so every "Failed to fetch rooms" / empty-list read failed.
      rooms.value = response.data.data.rooms || []
      if (response.data.pagination) {
        pagination.value = response.data.pagination
      }
      return response.data
    } catch (error) {
      toast.error('Failed to fetch rooms')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchUserRooms(params = {}) {
    loading.value = true
    try {
      const response = await api.get('/api/rooms-handler/rooms/user/get-all', { params })
      userRooms.value = response.data.data
      return response.data
    } catch (error) {
      toast.error('Failed to fetch user rooms')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchRoomById(id, apartmentId = null) {
    loading.value = true
    try {
      // The apartment endpoint returns the richest room shape (id, type,
      // espConnected, users...), so prefer it when we know the apartment.
      // Fetching rooms into the wrong array (userRooms) and searching by _id
      // while list endpoints return `id` made direct/reload navigation to a
      // room fail with "Room not found" and hit /devices/room/undefined.
      if (apartmentId) {
        await fetchRoomsByApartment(apartmentId)
      } else if (!rooms.value.length) {
        await fetchUserRooms()
      }
      const pool = [...rooms.value, ...userRooms.value]
      const found = pool.find(r => (r._id || r.id) === id)
      if (!found) {
        const error = new Error('Room not found')
        error.response = { status: 404, data: { message: 'Room not found' } }
        throw error
      }
      if (!found._id && found.id) {
        found._id = found.id
      }
      currentRoom.value = found
      return found
    } catch (error) {
      toast.error('Failed to fetch room')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createRoom(data) {
    loading.value = true
    try {
      const response = await api.post('/api/rooms-handler/rooms/create', data)
      // The endpoint nests the document under data.room; reading data directly
      // pushed a { room: {...} } wrapper into the list instead of the room.
      const room = response.data.data.room
      rooms.value.unshift(room)
      userRooms.value.unshift(room)
      toast.success('Room created successfully!')
      return room
    } catch (error) {
      toast.error('Failed to create room')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateRoomName(id, name) {
    loading.value = true
    try {
      const response = await api.put(`/api/rooms-handler/rooms/${id}/update-name`, { name })
      const index = rooms.value.findIndex(r => r._id === id)
      if (index !== -1) {
        rooms.value[index] = response.data.data
      }
      const userIndex = userRooms.value.findIndex(r => r._id === id)
      if (userIndex !== -1) {
        userRooms.value[userIndex] = response.data.data
      }
      if (currentRoom.value?._id === id) {
        currentRoom.value = response.data.data
      }
      toast.success('Room updated successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to update room')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateRoomPassword(id, roomPassword) {
    loading.value = true
    try {
      const response = await api.put(`/api/rooms-handler/rooms/${id}/update-password`, { newPassword: roomPassword })
      if (currentRoom.value?._id === id) {
        currentRoom.value = response.data.data
      }
      toast.success('Room password updated successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to update room password')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function addUsersToRoom(id, userIds) {
    loading.value = true
    try {
      const response = await api.put(`/api/rooms-handler/rooms/${id}/add-users`, { userIds })
      if (currentRoom.value?._id === id) {
        currentRoom.value = response.data.data
      }
      toast.success('Users added to room successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to add users to room')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function removeUserFromRoom(roomId, userId) {
    loading.value = true
    try {
      const response = await api.put(`/api/rooms-handler/rooms/remove-user/${roomId}`, { userIds: [userId] })
      if (currentRoom.value?._id === roomId) {
        currentRoom.value = response.data.data
      }
      toast.success('User removed from room successfully!')
      return response.data.data
    } catch (error) {
      toast.error('Failed to remove user from room')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function exitRoom(id) {
    loading.value = true
    try {
      await api.put(`/api/rooms-handler/rooms/exit-room/${id}`)
      rooms.value = rooms.value.filter(r => r._id !== id)
      userRooms.value = userRooms.value.filter(r => r._id !== id)
      if (currentRoom.value?._id === id) {
        currentRoom.value = null
      }
      toast.success('Exited room successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to exit room')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteRoom(id) {
    loading.value = true
    try {
      await api.delete(`/api/rooms-handler/rooms/delete/${id}`)
      rooms.value = rooms.value.filter(r => r._id !== id)
      userRooms.value = userRooms.value.filter(r => r._id !== id)
      if (currentRoom.value?._id === id) {
        currentRoom.value = null
      }
      toast.success('Room deleted successfully!')
      return { success: true }
    } catch (error) {
      toast.error('Failed to delete room')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchRoomUsers(id) {
    try {
      const response = await api.get(`/api/rooms-handler/rooms/get-users/${id}`)
      return response.data.data
    } catch (error) {
      toast.error('Failed to fetch room users')
      throw error
    }
  }

  function clearCurrentRoom() {
    currentRoom.value = null
  }

  return {
    rooms,
    currentRoom,
    userRooms,
    loading,
    pagination,
    roomsList,
    hasRooms,
    fetchRoomsByApartment,
    fetchUserRooms,
    fetchRoomById,
    createRoom,
    updateRoomName,
    updateRoomPassword,
    addUsersToRoom,
    removeUserFromRoom,
    exitRoom,
    deleteRoom,
    fetchRoomUsers,
    clearCurrentRoom
  }
})