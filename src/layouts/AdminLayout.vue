<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <i class="pi pi-shield"></i>
        <span v-if="!sidebarCollapsed">Admin Panel</span>
      </div>
      
      <nav class="sidebar-nav">
        <ul>
          <li class="nav-section" v-if="!sidebarCollapsed">Dashboard</li>
          <router-link 
            v-for="item in navItems" 
            :key="item.name" 
            :to="{ name: item.name }"
            class="nav-link"
            :class="{ active: $route.name === item.name }"
          >
            <i :class="item.icon"></i>
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </router-link>
        </ul>
      </nav>
      
      <button class="collapse-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <i :class="sidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"></i>
      </button>
    </aside>
    
    <div class="admin-main" :class="{ expanded: sidebarCollapsed }">
      <header class="admin-header">
        <div class="header-left">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <router-link to="/dashboard" class="btn btn-secondary btn-sm">
            <i class="pi pi-arrow-left"></i>
            <span>Back to App</span>
          </router-link>
        </div>
      </header>
      
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)

const navItems = [
  { name: 'AdminDashboard', label: 'Overview', icon: 'pi pi-chart-line' },
  { name: 'AdminUsers', label: 'Users', icon: 'pi pi-users' },
  { name: 'AdminApartments', label: 'Apartments', icon: 'pi pi-building' },
  { name: 'AdminRooms', label: 'Rooms', icon: 'pi pi-home' },
  { name: 'AdminDevices', label: 'Devices', icon: 'pi pi-wifi' },
  { name: 'AdminTasks', label: 'Tasks', icon: 'pi pi-clock' },
  { name: 'AdminSubscriptions', label: 'Subscriptions', icon: 'pi pi-credit-card' },
  { name: 'AdminImages', label: 'Images', icon: 'pi pi-image' },
  { name: 'AdminStatistics', label: 'Analytics', icon: 'pi pi-chart-bar' }
]

const pageTitle = computed(() => {
  const titles = {
    AdminDashboard: 'Dashboard Overview',
    AdminUsers: 'User Management',
    AdminApartments: 'Apartment Management',
    AdminRooms: 'Room Management',
    AdminDevices: 'Device Management',
    AdminTasks: 'Task Management',
    AdminSubscriptions: 'Subscription Management',
    AdminImages: 'Image Management',
    AdminStatistics: 'Analytics & Statistics'
  }
  return titles[route.name] || 'Admin Panel'
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--surface-ground);
}

.admin-sidebar {
  width: 260px;
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 100;
  
  &.collapsed {
    width: 72px;
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  color: var(--primary-color);
  font-weight: 700;
  font-size: 1.125rem;
  white-space: nowrap;
  overflow: hidden;
  
  i {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  
  ul {
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

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s ease;
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

.collapse-toggle {
  position: absolute;
  bottom: 1rem;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color);
  box-shadow: var(--shadow-1);
  z-index: 10;
  
  &:hover {
    background: var(--surface-hover);
  }
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: margin-left 0.3s ease;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  position: sticky;
  top: 0;
  z-index: 50;
  
  .header-left h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
}

.admin-content {
  flex: 1;
  padding: 1.5rem;
}

@media (max-width: 1024px) {
  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    z-index: 200;
    
    &.collapsed {
      transform: translateX(0);
      width: 260px;
    }
  }
  
  .admin-main {
    margin-left: 0 !important;
  }
}
</style>