<template>
  <AuthLayout title="Welcome Back" subtitle="Sign in to your Contech IoT account">
    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-input"
          placeholder="Enter your email"
          required
          autocomplete="email"
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <div class="password-input-wrapper">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Enter your password"
            required
            autocomplete="current-password"
          />
          <button
            type="button"
            class="password-toggle"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
          >
            <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
      </div>
      
      <div class="form-row">
        <label class="checkbox-wrapper">
          <input type="checkbox" v-model="form.remember" />
          <span>Remember me</span>
        </label>
        <router-link to="/forgot-password" class="forgot-link">Forgot password?</router-link>
      </div>
      
      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        <span v-if="loading"><i class="pi pi-spin pi-spinner"></i> Signing in...</span>
        <span v-else>Sign In</span>
      </button>
      
      <div class="divider">
        <span>or continue with</span>
      </div>
      
      <button type="button" class="btn btn-google btn-block" @click="handleGoogleLogin" :disabled="loading">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="google-icon" />
        Continue with Google
      </button>
    </form>
    
    <template #footer>
      <p>Don't have an account? <router-link to="/register">Sign up</router-link></p>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { getGoogleIdToken } from '@/services/googleAuth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  password: '',
  remember: false
})
const showPassword = ref(false)
const loading = ref(false)

const redirect = route.query.redirect || '/dashboard'

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(form.value)
    router.push(redirect)
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  loading.value = true
  try {
    const idToken = await getGoogleIdToken()
    await authStore.googleLogin(idToken)
    router.push(redirect)
  } catch (error) {
    toast.error(error.message || 'Google login failed')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
  }
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  font-size: 1rem;
  color: var(--text-color);
  background: var(--surface-ground);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-100);
  }
  
  &::placeholder {
    color: var(--text-color-secondary);
  }
}

.password-input-wrapper {
  position: relative;
  
  .form-input {
    padding-right: 3rem;
  }
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--text-color);
  }
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color);
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary-color);
  }
}

.forgot-link {
  font-size: 0.875rem;
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  
  &:hover:not(:disabled) {
    background: var(--primary-600);
  }
}

.btn-block {
  width: 100%;
}

.btn-google {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  
  &:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  
  .google-icon {
    width: 20px;
    height: 20px;
  }
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--surface-border);
  }
}
</style>