import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { ref, computed } from 'vue'

// See src/services/api.js — empty in dev (Vite proxies /ws), absolute when the
// client is hosted separately from the API.
const SOCKET_URL = `${import.meta.env.VITE_API_URL || ''}/ws`

class SocketService {
  constructor() {
    this.sockets = {}
    this.listeners = {}
    this.connected = ref(false)
    this.connectionState = ref('disconnected')
  }

  getAuthToken() {
    const authStore = useAuthStore()
    return authStore.token
  }

  connectUserNamespace() {
    if (this.sockets.user) return this.sockets.user
    
    const token = this.getAuthToken()
    if (!token) return null
    
    this.sockets.user = io(`${SOCKET_URL}/user`, {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    this.setupSocketEvents('user', this.sockets.user)
    return this.sockets.user
  }

  connectDeviceNamespace(componentNumber) {
    if (this.sockets.device) return this.sockets.device
    
    this.sockets.device = io(`${SOCKET_URL}/device`, {
      query: { componentNumber },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    this.setupSocketEvents('device', this.sockets.device)
    return this.sockets.device
  }

  connectRoomEspNamespace(componentNumber) {
    if (this.sockets.roomEsp) return this.sockets.roomEsp
    
    this.sockets.roomEsp = io(`${SOCKET_URL}/room-esp`, {
      query: { componentNumber },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    this.setupSocketEvents('roomEsp', this.sockets.roomEsp)
    return this.sockets.roomEsp
  }

  connectRoomUserNamespace() {
    if (this.sockets.roomUser) return this.sockets.roomUser
    
    const token = this.getAuthToken()
    if (!token) return null
    
    this.sockets.roomUser = io(`${SOCKET_URL}/room-user`, {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    this.setupSocketEvents('roomUser', this.sockets.roomUser)
    return this.sockets.roomUser
  }

  connectMqttBridgeNamespace(roomId, deviceOrder, roomPassword) {
    if (this.sockets.mqttBridge) return this.sockets.mqttBridge
    
    this.sockets.mqttBridge = io(`${SOCKET_URL}/mqtt-bridge`, {
      query: { roomId, deviceOrder, roomPassword },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    this.setupSocketEvents('mqttBridge', this.sockets.mqttBridge)
    return this.sockets.mqttBridge
  }

  setupSocketEvents(namespace, socket) {
    socket.on('connect', () => {
      console.log(`[${namespace}] Connected`)
      this.connected.value = true
      this.connectionState.value = 'connected'
      this.emit('connectionStateChange', { namespace, state: 'connected' })
    })

    socket.on('disconnect', (reason) => {
      console.log(`[${namespace}] Disconnected:`, reason)
      this.connected.value = false
      this.connectionState.value = 'disconnected'
      this.emit('connectionStateChange', { namespace, state: 'disconnected', reason })
    })

    socket.on('connect_error', (error) => {
      console.error(`[${namespace}] Connection error:`, error)
      this.connectionState.value = 'error'
      this.emit('connectionStateChange', { namespace, state: 'error', error })
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[${namespace}] Reconnected after ${attemptNumber} attempts`)
      this.connected.value = true
      this.connectionState.value = 'connected'
      this.emit('connectionStateChange', { namespace, state: 'reconnected', attemptNumber })
    })

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[${namespace}] Reconnection attempt ${attemptNumber}`)
      this.emit('connectionStateChange', { namespace, state: 'reconnecting', attemptNumber })
    })

    socket.on('error', (error) => {
      console.error(`[${namespace}] Error:`, error)
      this.emit('socketError', { namespace, error })
    })
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
    
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }

  // User namespace methods
  updateDeviceState(deviceId, state) {
    if (this.sockets.user) {
      this.sockets.user.emit('update-state', { deviceId, state })
    }
  }

  updateDeviceStateMqtt(deviceId, state) {
    if (this.sockets.user) {
      this.sockets.user.emit('update-state-mqtt', { deviceId, state })
    }
  }

  updateRoomDevicesMqtt(roomId, updates) {
    if (this.sockets.user) {
      this.sockets.user.emit('update-room-devices-mqtt', { roomId, updates })
    }
  }

  getDeviceInfo(deviceId) {
    if (this.sockets.user) {
      this.sockets.user.emit('get-device-info', { deviceId })
    }
  }

  getDeviceEspStatus(deviceId) {
    if (this.sockets.user) {
      this.sockets.user.emit('get-device-esp-status', { deviceId })
    }
  }

  // Device namespace methods
  reportDeviceState(state) {
    if (this.sockets.device) {
      this.sockets.device.emit('report-state', { state })
    }
  }

  // Room ESP namespace methods
  fetchRoomDevices() {
    if (this.sockets.roomEsp) {
      this.sockets.roomEsp.emit('fetch-room-devices')
    }
  }

  updateRoomDevices(updates) {
    if (this.sockets.roomEsp) {
      this.sockets.roomEsp.emit('update-room-devices', { updates })
    }
  }

  // Room User namespace methods
  fetchRoom(roomId) {
    if (this.sockets.roomUser) {
      this.sockets.roomUser.emit('fetch-room', { roomId })
    }
  }

  fetchUserRooms() {
    if (this.sockets.roomUser) {
      this.sockets.roomUser.emit('fetch-user-rooms')
    }
  }

  updateRoomDevicesFromUser(roomId, updates) {
    if (this.sockets.roomUser) {
      this.sockets.roomUser.emit('update-room-devices', { roomId, updates })
    }
  }

  getEspStatus(roomId) {
    if (this.sockets.roomUser) {
      this.sockets.roomUser.emit('get-esp-status', { roomId })
    }
  }

  // MQTT Bridge namespace methods
  reportMqttState(state) {
    if (this.sockets.mqttBridge) {
      this.sockets.mqttBridge.emit('report-state', { state })
    }
  }

  reportRoomState(roomId, updates) {
    if (this.sockets.mqttBridge) {
      this.sockets.mqttBridge.emit('report-room-state', { roomId, updates })
    }
  }

  disconnectAll() {
    Object.keys(this.sockets).forEach(key => {
      if (this.sockets[key]) {
        this.sockets[key].disconnect()
        this.sockets[key] = null
      }
    })
    this.connected.value = false
    this.connectionState.value = 'disconnected'
  }

  disconnect(namespace) {
    if (this.sockets[namespace]) {
      this.sockets[namespace].disconnect()
      this.sockets[namespace] = null
    }
  }

  isConnected(namespace) {
    return this.sockets[namespace]?.connected || false
  }
}

export const socketService = new SocketService()
export default socketService