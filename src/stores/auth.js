import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const toast = useToast()

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userRole = computed(() => user.value?.role || null)

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    }
  }

  function setUser(userData) {
    user.value = userData
  }

  async function login(credentials) {
    loading.value = true
    try {
      const response = await api.post('/api/auth/login', credentials)
      const { token: newToken, ...userData } = response.data.data
      setToken(newToken)
      setUser(userData)
      toast.success('Welcome back!')
      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    try {
      // The server's register endpoint returns only { success, message } - it
      // issues no token. It also requires `role` in the body (the User model
      // declares it required with no default) and refuses role 'admin'.
      const payload = { role: 'customer', ...userData }
      if (payload.role === 'admin') payload.role = 'customer'

      const response = await api.post('/api/auth/register', payload)
      const serverMessage = response.data?.message || 'Account created successfully!'

      // Register does not authenticate, so sign in immediately with the same
      // credentials to obtain a token.
      const loginResponse = await api.post('/api/auth/login', {
        email: payload.email,
        password: payload.password
      })
      const { token: newToken, ...registeredUser } = loginResponse.data.data
      setToken(newToken)
      setUser(registeredUser)
      toast.success(serverMessage)
      return { success: true, user: registeredUser }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function googleLogin(authResult) {
    loading.value = true
    try {
      const response = await api.post('/api/auth/google-login', {
        code: authResult.code,
        code_verifier: authResult.codeVerifier
      })
      const { token: newToken, ...userData } = response.data.data
      setToken(newToken)
      setUser(userData)
      toast.success('Welcome!')
      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(email) {
    loading.value = true
    try {
      await api.post('/api/auth/forgot-password', { email })
      toast.success('Password reset email sent!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(token, password) {
    loading.value = true
    try {
      // Server route is PUT /api/auth/reset-password with { resetToken, newPassword }
      // (not POST /reset-password/:token with { password, confirmPassword }).
      await api.put('/api/auth/reset-password', {
        resetToken: token,
        newPassword: password
      })
      toast.success('Password reset successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function verifyEmail(token) {
    loading.value = true
    try {
      // The activation link carries a JWT in the URL, and the server consumes it
      // here: PUT /api/auth/activate-email with { token }.
      // GET /api/auth/verify is a *protected* status check and cannot activate
      // anything, so calling it would only ever report the current flag.
      const { data } = await api.put('/api/auth/activate-email', { token })

      if (user.value) {
        user.value = { ...user.value, emailActivated: true }
      }
      toast.success(data?.message || 'Email verified successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updatePassword(currentPassword, newPassword) {
    loading.value = true
    try {
      // Server expects { oldPassword, newPassword }
      await api.put('/api/auth/update-password', {
        oldPassword: currentPassword,
        newPassword
      })
      toast.success('Password updated successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password update failed'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function checkGoogleLink() {
    const response = await api.get('/api/auth/check-google-link')
    return response.data.data
  }

  async function unlinkGoogle() {
    loading.value = true
    try {
      await api.delete('/api/auth/unlink-google')
      toast.success('Google account unlinked!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to unlink Google account'
      toast.error(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchUserProfile() {
    const response = await api.get('/api/auth/me')
    setUser(response.data.data)
    return response.data.data
  }

  async function initializeAuth() {
    if (!token.value) return false
    
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const decoded = jwtDecode(token.value)
      
      if (decoded.exp * 1000 < Date.now()) {
        logout()
        return false
      }
      
      await fetchUserProfile()
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  function logout() {
    user.value = null
    setToken(null)
    toast.info('Logged out successfully')
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    userRole,
    login,
    register,
    googleLogin,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updatePassword,
    checkGoogleLink,
    unlinkGoogle,
    fetchUserProfile,
    initializeAuth,
    logout,
    setToken,
    setUser
  }
})