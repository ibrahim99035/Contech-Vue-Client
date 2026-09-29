import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true, layout: 'auth' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { public: true, layout: 'auth' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { public: true, layout: 'auth' }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { public: true, layout: 'auth' }
  },
  {
    path: '/verify-email/:token',
    name: 'VerifyEmail',
    component: () => import('@/views/auth/VerifyEmailView.vue'),
    meta: { public: true, layout: 'auth' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/apartments',
    name: 'Apartments',
    component: () => import('@/views/apartments/ApartmentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/apartments/:id',
    name: 'ApartmentDetail',
    component: () => import('@/views/apartments/ApartmentDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/apartments/:apartmentId/rooms/:roomId',
    name: 'RoomDetail',
    component: () => import('@/views/rooms/RoomDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/devices',
    name: 'Devices',
    component: () => import('@/views/devices/DevicesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/devices/:id',
    name: 'DeviceDetail',
    component: () => import('@/views/devices/DeviceDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/views/tasks/TasksView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks/create',
    name: 'CreateTask',
    component: () => import('@/views/tasks/CreateTaskView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('@/views/tasks/TaskDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/subscription',
    name: 'Subscription',
    component: () => import('@/views/subscription/SubscriptionView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboardView.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/AdminUsersView.vue')
      },
      {
        path: 'apartments',
        name: 'AdminApartments',
        component: () => import('@/views/admin/AdminApartmentsView.vue')
      },
      {
        path: 'rooms',
        name: 'AdminRooms',
        component: () => import('@/views/admin/AdminRoomsView.vue')
      },
      {
        path: 'devices',
        name: 'AdminDevices',
        component: () => import('@/views/admin/AdminDevicesView.vue')
      },
      {
        path: 'tasks',
        name: 'AdminTasks',
        component: () => import('@/views/admin/AdminTasksView.vue')
      },
      {
        path: 'subscriptions',
        name: 'AdminSubscriptions',
        component: () => import('@/views/admin/AdminSubscriptionsView.vue')
      },
      {
        path: 'images',
        name: 'AdminImages',
        component: () => import('@/views/admin/AdminImagesView.vue')
      },
      {
        path: 'statistics',
        name: 'AdminStatistics',
        component: () => import('@/views/admin/AdminStatisticsView.vue')
      }
    ]
  },
  {
    path: '/sandbox',
    name: 'Sandbox',
    component: () => import('@/views/sandbox/SandboxView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/simulators',
    name: 'Simulators',
    component: () => import('@/views/simulators/SimulatorsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/health',
    name: 'HealthCheck',
    component: () => import('@/views/HealthCheckView.vue'),
    meta: { public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    try {
      await authStore.initializeAuth()
    } catch (error) {
      authStore.logout()
    }
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next({ name: 'Dashboard' })
    return
  }
  
  if (to.meta.public && authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

export default router