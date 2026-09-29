<template>
  <div class="simulators-view">
    <MainLayout>
      <template #default>
        <div class="simulators-view">
          <div class="view-header">
            <div>
              <h1>Simulators</h1>
              <p class="subtitle">WebSocket simulator clients</p>
            </div>
          </div>

          <div class="simulator-cards">
            <div class="sim-card">
              <div class="sim-header"><i class="pi pi-user"></i><h3>User Simulator</h3></div>
              <div class="sim-body">
                <p class="muted">Namespace <code>/ws/user</code> — JWT authenticated</p>
                <div class="connection-state" :class="connState.user">
                  <span class="dot"></span>{{ connLabel(connState.user) }}
                </div>
                <div class="sim-actions">
                  <button class="btn btn-primary btn-sm" :disabled="!isJwt" @click="connectUser">Connect</button>
                  <button class="btn btn-secondary btn-sm" :disabled="connState.user !== 'connected'" @click="toggleDevice('user')">Toggle Device</button>
                  <button class="btn btn-secondary btn-sm" :disabled="connState.user !== 'connected'" @click="getInfo('user')">Device Info</button>
                </div>
                <p v-if="!isJwt" class="hint">Requires login (JWT). Use the Device/Room simulators below otherwise.</p>
              </div>
            </div>

            <div class="sim-card">
              <div class="sim-header"><i class="pi pi-chip"></i><h3>Device Simulator</h3></div>
              <div class="sim-body">
                <p class="muted">Namespace <code>/ws/device</code> — component number auth</p>
                <div class="form-group">
                  <label>Component Number</label>
                  <input v-model="deviceComponentNumber" class="form-input" placeholder="e.g. 1234ABC" @keyup.enter="connectDevice" />
                </div>
                <div class="connection-state" :class="connState.device">
                  <span class="dot"></span>{{ connLabel(connState.device) }}
                </div>
                <div class="sim-actions">
                  <button class="btn btn-primary btn-sm" :disabled="!deviceComponentNumber" @click="connectDevice">Connect</button>
                  <button class="btn btn-secondary btn-sm" :disabled="connState.device !== 'connected'" @click="reportState('device')">Report State</button>
                </div>
              </div>
            </div>

            <div class="sim-card">
              <div class="sim-header"><i class="pi pi-wifi"></i><h3>Room ESP Simulator</h3></div>
              <div class="sim-body">
                <p class="muted">Namespace <code>/ws/room-esp</code> — component number auth</p>
                <div class="form-group">
                  <label>Component Number (any device in room)</label>
                  <input v-model="roomEspComponentNumber" class="form-input" placeholder="e.g. 1234ABC" @keyup.enter="connectRoomEsp" />
                </div>
                <div class="connection-state" :class="connState.roomEsp">
                  <span class="dot"></span>{{ connLabel(connState.roomEsp) }}
                </div>
                <div class="sim-actions">
                  <button class="btn btn-primary btn-sm" :disabled="!roomEspComponentNumber" @click="connectRoomEsp">Connect</button>
                  <button class="btn btn-secondary btn-sm" :disabled="connState.roomEsp !== 'connected'" @click="fetchDevices('roomEsp')">Fetch Room Devices</button>
                </div>
              </div>
            </div>

            <div class="sim-card">
              <div class="sim-header"><i class="pi pi-user-circle"></i><h3>Room User Simulator</h3></div>
              <div class="sim-body">
                <p class="muted">Namespace <code>/ws/room-user</code> — JWT authenticated</p>
                <div class="form-group">
                  <label>Room ID</label>
                  <input v-model="roomId" class="form-input" placeholder="e.g. 6aa3d24893126debc778a8b9" @keyup.enter="connectRoomUser" />
                </div>
                <div class="connection-state" :class="connState.roomUser">
                  <span class="dot"></span>{{ connLabel(connState.roomUser) }}
                </div>
                <div class="sim-actions">
                  <button class="btn btn-primary btn-sm" :disabled="!isJwt" @click="connectRoomUser">Connect</button>
                  <button class="btn btn-secondary btn-sm" :disabled="connState.roomUser !== 'connected' || !roomId" @click="fetchRoom('roomUser')">Fetch Room</button>
                </div>
              </div>
            </div>

            <div class="sim-card">
              <div class="sim-header"><i class="pi pi-sitemap"></i><h3>MQTT Bridge Simulator</h3></div>
              <div class="sim-body">
                <p class="muted">Namespace <code>/ws/mqtt-bridge</code></p>
                <div class="form-group">
                  <label>Room ID</label>
                  <input v-model="mqttRoomId" class="form-input" placeholder="Room ID" />
                </div>
                <div class="form-group">
                  <label>Device Order (1-6)</label>
                  <input v-model="mqttDeviceOrder" class="form-input" placeholder="1-6" />
                </div>
                <div class="form-group">
                  <label>Room Password</label>
                  <input v-model="mqttRoomPassword" class="form-input" type="password" placeholder="If room has one" />
                </div>
                <div class="connection-state" :class="connState.mqttBridge">
                  <span class="dot"></span>{{ connLabel(connState.mqttBridge) }}
                </div>
                <div class="sim-actions">
                  <button class="btn btn-primary btn-sm" :disabled="!mqttRoomId || !mqttDeviceOrder" @click="connectMqttBridge">Connect</button>
                  <button class="btn btn-secondary btn-sm" :disabled="connState.mqttBridge !== 'connected'" @click="reportState('mqttBridge')">Report State</button>
                </div>
              </div>
            </div>
          </div>

          <section class="event-log card">
            <div class="card-header">
              <h2>Event Log</h2>
              <button class="btn btn-sm btn-secondary" @click="clearLog">Clear</button>
            </div>
            <div class="card-body">
              <div v-if="events.length === 0" class="empty-log">No events yet — connect a simulator to see live events.</div>
              <div v-for="(e, i) in events" :key="i" class="log-entry" :class="e.kind">
                <span class="log-time">{{ e.time }}</span>
                <span class="log-ns">{{ e.ns }}</span>
                <span class="log-body">{{ e.body }}</span>
              </div>
            </div>
          </section>
        </div>
      </template>
    </MainLayout>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import socketService from '@/services/socket'
import MainLayout from '@/layouts/MainLayout.vue'

const authStore = useAuthStore()
const isJwt = computed(() => !!authStore.token)

const deviceComponentNumber = ref('')
const roomEspComponentNumber = ref('')
const roomId = ref('')
const mqttRoomId = ref('')
const mqttDeviceOrder = ref('')
const mqttRoomPassword = ref('')

const connState = reactive({
  user: 'idle',
  device: 'idle',
  roomEsp: 'idle',
  roomUser: 'idle',
  mqttBridge: 'idle'
})

const events = ref([])

function connLabel(state) {
  return { idle: 'Idle', connecting: 'Connecting...', connected: 'Connected', error: 'Error', disconnected: 'Disconnected' }[state] || state
}

function log(ns, kind, msg) {
  events.value.unshift({ time: new Date().toLocaleTimeString(), ns, kind, body: msg })
  if (events.value.length > 100) events.value.pop()
}

function watchSocket(ns, socket) {
  if (!socket) return
  socket.on('connect', () => { connState[ns] = 'connected'; log(ns, 'success', 'connected') })
  socket.on('disconnect', () => { connState[ns] = 'disconnected'; log(ns, 'warn', 'disconnected') })
  socket.on('connect_error', (e) => { connState[ns] = 'error'; log(ns, 'error', `connect_error: ${e.message}`) })

  // Generic catch-all for data events (excluding control events)
  const control = ['connect', 'disconnect', 'connect_error', 'reconnect', 'reconnect_attempt']
  const rawListeners = socket._callbacks || {}
  // Register a catch-all via listener to display payloads
  const register = () => {
    const emitted = socket.emit
    socket.emit = function (event, ...args) {
      // (optional) track outgoing
      return emitted.apply(this, [event, ...args])
    }
  }
  register()

  // Common data events by namespace
  const map = {
    user: ['state-updated', 'state-update', 'device-info', 'device-esp-status-response', 'task-update', 'mqtt-state-update-sent', 'mqtt-room-update-sent', 'error'],
    device: ['state-update', 'task-update', 'state-reported', 'error'],
    roomEsp: ['room-devices', 'room-update-results', 'room-state-changed', 'room-devices-updated', 'error'],
    roomUser: ['room-details', 'user-rooms', 'esp-status-response', 'room-devices-updated', 'room-esp-status-updated', 'error'],
    mqttBridge: ['mqtt-bridge-connected', 'state-reported', 'room-state-reported', 'error']
  }
  ;(map[ns] || []).forEach((evt) => {
    socket.on(evt, (payload) => log(ns, evt === 'error' ? 'error' : 'info', `${evt}: ${JSON.stringify(payload)}`))
  })
}

function connectUser() {
  if (socketService.sockets.user) {
    log('user', 'warn', 'already connected'); return
  }
  const s = socketService.connectUserNamespace()
  if (!s) { log('user', 'error', 'no auth token — log in first'); return }
  watchSocket('user', s)
}

function connectDevice() {
  socketService.disconnect('device')
  const s = socketService.connectDeviceNamespace(deviceComponentNumber.value)
  watchSocket('device', s)
}

function connectRoomEsp() {
  socketService.disconnect('roomEsp')
  const s = socketService.connectRoomEspNamespace(roomEspComponentNumber.value)
  watchSocket('roomEsp', s)
}

function connectRoomUser() {
  if (socketService.sockets.roomUser) { log('roomUser', 'warn', 'already connected'); return }
  const s = socketService.connectRoomUserNamespace()
  if (!s) { log('roomUser', 'error', 'no auth token — log in first'); return }
  watchSocket('roomUser', s)
}

function connectMqttBridge() {
  socketService.disconnect('mqttBridge')
  const s = socketService.connectMqttBridgeNamespace(mqttRoomId.value, mqttDeviceOrder.value, mqttRoomPassword.value)
  watchSocket('mqttBridge', s)
}

// Action helpers
function toggleDevice() { socketService.updateDeviceState('test-device-id', 'on'); log('user', 'info', 'update-state sent (deviceId=test-device-id, state=on)') }
function getInfo() { socketService.getDeviceInfo('test-device-id'); log('user', 'info', 'get-device-info sent') }
function reportState(ns) {
  if (ns === 'device') { socketService.reportDeviceState('on'); log('device', 'info', 'report-state sent (state=on)') }
  if (ns === 'mqttBridge') { socketService.reportMqttState('on'); log('mqttBridge', 'info', 'report-state sent (state=on)') }
}
function fetchDevices() { socketService.fetchRoomDevices(); log('roomEsp', 'info', 'fetch-room-devices sent') }
function fetchRoom() { socketService.fetchRoom(roomId.value); log('roomUser', 'info', `fetch-room sent (${roomId.value})`) }

function clearLog() { events.value = [] }
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.simulators-view {
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

  .simulator-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    max-width: 1400px;
    margin: 0 auto 2rem;
  }

  .sim-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    overflow: hidden;

    .sim-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.9rem 1.25rem;
      background: var(--primary-100);
      color: var(--primary-600);

      h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    }

    .sim-body { padding: 1.25rem; }

    .muted { color: var(--text-color-secondary); font-size: 0.85rem; margin: 0 0 0.75rem; code { background: var(--surface-ground); padding: 0.1rem 0.3rem; border-radius: 4px; } }
    .hint { font-size: 0.8rem; color: var(--orange-600); margin: 0.75rem 0 0; }
  }

  .connection-state {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    margin-bottom: 0.75rem;
    background: var(--surface-ground);

    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gray-500); }
    &.connected .dot { background: var(--green-500); }
    &.connecting .dot { background: var(--orange-500); }
    &.error .dot { background: var(--red-500); }
    &.disconnected .dot { background: var(--gray-500); }
  }

  .sim-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

  .event-log {
    max-width: 1400px;
    margin: 0 auto;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      h2 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    }

    .empty-log { color: var(--text-color-secondary); font-style: italic; }

    .log-entry {
      display: flex;
      gap: 0.75rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--surface-border);
      font-size: 0.85rem;
      font-family: monospace;
      word-break: break-word;

      &:last-child { border-bottom: none; }

      .log-time { color: var(--text-color-secondary); flex-shrink: 0; }
      .log-ns { font-weight: 700; color: var(--primary-color); flex-shrink: 0; min-width: 70px; }

      &.success .log-body { color: var(--green-600); }
      &.error .log-body { color: var(--red-600); }
      &.warn .log-body { color: var(--orange-600); }
    }
  }
}
</style>