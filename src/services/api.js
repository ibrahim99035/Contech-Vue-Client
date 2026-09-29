import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Call sites already carry their own path prefix (`/api/...` or
// `/admin/dashboard/...`), so this is the origin only — never include `/api`
// here or every request would get it twice.
//
// Leave VITE_API_URL empty to stay same-origin (works under `vite dev`, which
// proxies /api, /ws, /health and /admin/dashboard to the local server). Set it
// when the client is served from a different host than the API.
const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
})

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const initialized = await authStore.initializeAuth()
        if (!initialized || !authStore.token) {
          authStore.logout()
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`
        return api(originalRequest)
      } catch (refreshError) {
        authStore.logout()
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api