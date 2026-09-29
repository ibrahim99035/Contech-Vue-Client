<template>
  <div class="room-list">
    <div class="list-header" v-if="showCreateButton">
      <button class="btn btn-primary btn-sm" @click="$emit('create-room')">
        <i class="pi pi-plus"></i> Add Room
      </button>
    </div>
    
    <div class="room-grid" v-if="rooms.length > 0">
      <div 
        class="room-card" 
        v-for="room in rooms" 
        :key="room._id || room.id"
        @click="$emit('view-room', room)"
      >
        <div class="room-card-header">
          <div class="room-icon" :class="getRoomIconClass(room.type)">
            <i :class="getRoomIcon(room.type)"></i>
          </div>
          <div class="room-status" :class="room.espConnected ? 'online' : 'offline'"></div>
        </div>
        <div class="room-card-body">
          <h3>{{ room.name }}</h3>
          <div class="room-meta">
            <span><i class="pi pi-wifi"></i> {{ room.devicesCount || 0 }} devices</span>
            <span v-if="room.type"><i class="pi pi-tag"></i> {{ room.type }}</span>
          </div>
        </div>
        <div class="room-card-footer">
          <span class="room-esp-status" :class="room.espConnected ? 'connected' : 'disconnected'">
            <i class="pi" :class="room.espConnected ? 'pi-wifi' : 'pi-wifi-off'"></i>
            {{ room.espConnected ? 'ESP Online' : 'ESP Offline' }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-if="rooms.length === 0">
      <i class="pi pi-home"></i>
      <p>No rooms in this apartment</p>
      <button class="btn btn-primary btn-sm" @click="$emit('create-room')" v-if="showCreateButton">
        Create First Room
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rooms: { type: Array, default: () => [] },
  apartmentId: { type: String, required: true },
  showCreateButton: { type: Boolean, default: true }
})

defineEmits(['view-room', 'create-room'])

const roomTypeIcons = {
  'bedroom': 'pi pi-bed',
  'livingroom': 'pi pi-sofa',
  'kitchen': 'pi pi-utensils',
  'bathroom': 'pi pi-shower',
  'office': 'pi pi-briefcase',
  'garage': 'pi pi-car',
  'balcony': 'pi pi-sun',
  'basement': 'pi pi-box',
  'attic': 'pi pi-home',
  'other': 'pi pi-home'
}

const roomTypeColors = {
  'bedroom': 'icon-purple',
  'livingroom': 'icon-blue',
  'kitchen': 'icon-orange',
  'bathroom': 'icon-cyan',
  'office': 'icon-teal',
  'garage': 'icon-gray',
  'balcony': 'icon-yellow',
  'basement': 'icon-gray',
  'attic': 'icon-pink',
  'other': 'icon-gray'
}

function getRoomIcon(type) {
  return roomTypeIcons[type?.toLowerCase()] || 'pi pi-home'
}

function getRoomIconClass(type) {
  return roomTypeColors[type?.toLowerCase()] || 'icon-gray'
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.room-list {
  .list-header {
    margin-bottom: 1rem;
  }
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.room-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-2);
    transform: translateY(-2px);
  }
}

.room-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--surface-ground);
  border-bottom: 1px solid var(--surface-border);
}

.room-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  
  &.icon-purple { background: var(--purple-100); color: var(--purple-600); }
  &.icon-blue { background: var(--blue-100); color: var(--blue-600); }
  &.icon-orange { background: var(--orange-100); color: var(--orange-600); }
  &.icon-cyan { background: var(--cyan-100); color: var(--cyan-600); }
  &.icon-teal { background: var(--teal-100); color: var(--teal-600); }
  &.icon-gray { background: var(--gray-100); color: var(--gray-600); }
  &.icon-yellow { background: var(--yellow-100); color: var(--yellow-600); }
  &.icon-pink { background: var(--pink-100); color: var(--pink-600); }
}

.room-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  
  &.online { background: var(--green-500); }
  &.offline { background: var(--red-500); }
}

.room-card-body {
  padding: 1rem;
  
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
  }
}

.room-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--text-color-secondary);
  
  span {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
}

.room-card-footer {
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-top: 1px solid var(--surface-border);
}

.room-esp-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  
  &.connected {
    background: var(--green-50);
    color: var(--green-600);
  }
  
  &.disconnected {
    background: var(--red-50);
    color: var(--red-600);
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