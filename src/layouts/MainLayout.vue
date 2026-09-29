<template>
  <div class="main-layout">
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <i class="pi pi-home" style="font-size: 1.5rem;"></i>
          <span v-if="!sidebarCollapsed">Contech IoT</span>
        </div>
        <button 
          class="sidebar-toggle" 
          @click="sidebarCollapsed = !sidebarCollapsed"
          aria-label="Toggle sidebar"
        >
          <i :class="sidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"></i>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-section" v-if="!sidebarCollapsed">Main</li>
          <router-link 
            v-for="item in mainNavItems" 
            :key="item.name" 
            :to="{ name: item.name }"
            class="nav-item"
            :class="{ active: isActiveRoute(item.name) }"
          >
            <i :class="item.icon"></i>
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
            <span class="nav-badge" v-if="item.badge">{{ item.badge }}</span>
          </router-link>
          
          <li class="nav-section" v-if="!sidebarCollapsed && isAdmin">Admin</li>
          <template v-if="isAdmin">
            <router-link
              v-for="item in adminNavItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="nav-item"
              :class="{ active: isActiveRoute(item.name) }"
            >
              <i :class="item.icon"></i>
              <span v-if="!sidebarCollapsed">{{ item.label }}</span>
            </router-link>
          </template>
          
          <li class="nav-section" v-if="!sidebarCollapsed">Tools</li>
          <router-link 
            v-for="item in toolsNavItems" 
            :key="item.name" 
            :to="{ name: item.name }"
            class="nav-item"
            :class="{ active: isActiveRoute(item.name) }"
          >
            <i :class="item.icon"></i>
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </router-link>
        </ul>
      </nav>
      
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="user-info">
          <div class="user-avatar">
            <i class="pi pi-user"></i>
          </div>
          <div class="user-details">
            <span class="user-name">{{ authStore.user?.name }}</span>
            <span class="user-role">{{ authStore.user?.role }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="logout">
          <i class="pi pi-sign-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
    
    <div class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <button class="header-btn" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
            <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
          </button>
          <div class="notifications-dropdown">
            <button class="header-btn notification-btn" @click="showNotifications = !showNotifications">
              <i class="pi pi-bell"></i>
              <span class="notification-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
            </button>
            <div class="dropdown-menu" v-if="showNotifications">
              <div class="dropdown-header">
                <h3>Notifications</h3>
                <button
                  v-if="notifications.length > 0"
                  class="mark-all-read"
                  @click="markAllAsRead"
                >
                  Mark all as read
                </button>
              </div>
              <div class="notification-list">
                <div class="notification-item" v-for="notif in notifications" :key="notif.id">
                  <div class="notification-icon" :class="notif.type">
                    <i :class="notif.icon"></i>
                  </div>
                  <div class="notification-content">
                    <p class="notification-title">{{ notif.title }}</p>
                    <p class="notification-message">{{ notif.message }}</p>
                    <span class="notification-time">{{ formatTime(notif.time) }}</span>
                  </div>
                </div>
                <div class="notification-empty" v-if="notifications.length === 0">
                  No notifications
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)
const isDark = ref(false)
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const mainNavItems = [
  { name: 'Dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar' },
  { name: 'Apartments', label: 'Apartments', icon: 'pi pi-building' },
  { name: 'Devices', label: 'Devices', icon: 'pi pi-wifi' },
  { name: 'Tasks', label: 'Tasks', icon: 'pi pi-clock' },
  { name: 'Subscription', label: 'Subscription', icon: 'pi pi-credit-card' }
]

const adminNavItems = [
  { name: 'AdminDashboard', label: 'Dashboard', icon: 'pi pi-chart-line' },
  { name: 'AdminUsers', label: 'Users', icon: 'pi pi-users' },
  { name: 'AdminApartments', label: 'Apartments', icon: 'pi pi-building' },
  { name: 'AdminRooms', label: 'Rooms', icon: 'pi pi-home' },
  { name: 'AdminDevices', label: 'Devices', icon: 'pi pi-wifi' },
  { name: 'AdminTasks', label: 'Tasks', icon: 'pi pi-clock' },
  { name: 'AdminSubscriptions', label: 'Subscriptions', icon: 'pi pi-credit-card' },
  { name: 'AdminStatistics', label: 'Statistics', icon: 'pi pi-chart-bar' }
]

const toolsNavItems = [
  { name: 'Sandbox', label: 'Sandbox (API Testing)', icon: 'pi pi-code' },
  { name: 'Simulators', label: 'Device Simulators', icon: 'pi pi-desktop' },
  { name: 'Settings', label: 'Settings', icon: 'pi pi-cog' }
]

const isAdmin = computed(() => authStore.isAdmin)

const pageTitle = computed(() => {
  const titles = {
    Dashboard: 'Dashboard',
    Apartments: 'Apartments',
    ApartmentDetail: 'Apartment Details',
    RoomDetail: 'Room Details',
    Devices: 'Devices',
    DeviceDetail: 'Device Details',
    Tasks: 'Tasks',
    CreateTask: 'Create Task',
    TaskDetail: 'Task Details',
    Subscription: 'Subscription',
    Settings: 'Settings',
    AdminDashboard: 'Admin Dashboard',
    AdminUsers: 'User Management',
    AdminApartments: 'Apartment Management',
    AdminRooms: 'Room Management',
    AdminDevices: 'Device Management',
    AdminTasks: 'Task Management',
    AdminSubscriptions: 'Subscription Management',
    AdminStatistics: 'Statistics',
    Sandbox: 'API Sandbox',
    Simulators: 'Device Simulators',
    HealthCheck: 'Health Check'
  }
  return titles[route.name] || 'Contech IoT'
})

const isActiveRoute = (name) => {
  return route.name === name || (route.matched.some(m => m.name === name))
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark-mode', isDark.value)
  localStorage.setItem('darkMode', isDark.value)
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function markAllAsRead() {
  notifications.value.forEach(n => n.read = true)
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode === 'true') {
    isDark.value = true
    document.documentElement.classList.add('dark-mode')
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.main-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 100;
  
  &.sidebar-collapsed {
    width: 72px;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--primary-color);
    font-weight: 600;
    font-size: 1.125rem;
    white-space: nowrap;
    overflow: hidden;
    
    i {
      flex-shrink: 0;
    }
  }
}

.sidebar-toggle {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--surface-hover);
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  
  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
}

.nav-section {
  padding: 0.75rem 1rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-secondary);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
  
  i {
    font-size: 1.125rem;
    width: 1.5rem;
    text-align: center;
    flex-shrink: 0;
  }
  
  &:hover {
    background: var(--surface-hover);
    color: var(--primary-color);
  }
  
  &.active {
    background: var(--primary-50);
    color: var(--primary-color);
    font-weight: 500;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--primary-color);
    }
  }
}

.nav-badge {
  margin-left: auto;
  background: var(--primary-color);
  color: white;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-weight: 600;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-100);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
      
      .user-name {
        font-weight: 500;
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .user-role {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        text-transform: capitalize;
      }
    }
  }
  
  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.625rem 1rem;
    background: var(--surface-hover);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    color: var(--text-color);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--red-50);
      border-color: var(--red-200);
      color: var(--red-600);
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: margin-left 0.3s ease;
  
  &.expanded {
    margin-left: 0;
  }
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  position: sticky;
  top: 0;
  z-index: 50;
  
  .header-left {
    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color);
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
}

.header-btn {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--surface-hover);
  }
}

.notifications-dropdown {
  position: relative;
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    width: 360px;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-2);
    z-index: 100;
    overflow: hidden;
    
    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid var(--surface-border);
      
      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .mark-all-read {
        background: none;
        border: none;
        color: var(--primary-color);
        font-size: 0.875rem;
        cursor: pointer;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .notification-list {
      max-height: 300px;
      overflow-y: auto;
    }
  }
}

.notification-item {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
  transition: background 0.2s ease;
  
  &:hover {
    background: var(--surface-hover);
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.info { background: var(--blue-100); color: var(--blue-600); }
  &.warning { background: var(--orange-100); color: var(--orange-600); }
  &.success { background: var(--green-100); color: var(--green-600); }
  &.error { background: var(--red-100); color: var(--red-600); }
}

.notification-content {
  flex: 1;
  min-width: 0;
  
  .notification-title {
    margin: 0 0 0.25rem;
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .notification-message {
    margin: 0 0 0.25rem;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
  }
  
  .notification-time {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--red-500);
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  min-width: 16px;
  height: 16px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.notification-empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.page-content {
  flex: 1;
  padding: 1.5rem;
  background: var(--surface-ground);
}

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
    transform: translateX(-100%);
    
    &.sidebar-collapsed {
      transform: translateX(0);
      width: 260px;
    }
  }
  
  .main-content {
    margin-left: 0 !important;
  }
  
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 150;
  }
}
</style>