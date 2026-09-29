<template>
  <AuthLayout title="Create Account" subtitle="Start managing your IoT devices today">
    <form @submit.prevent="handleRegister" class="auth-form">
      <div class="form-group">
        <label for="name">Full Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Enter your full name"
          required
          autocomplete="name"
        />
      </div>
      
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
            placeholder="Create a password (min 8 characters)"
            required
            autocomplete="new-password"
            minlength="8"
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
        <div class="password-strength" v-if="form.password">
          <div class="strength-bar">
            <div 
              class="strength-fill" 
              :class="passwordStrengthClass"
              :style="{ width: passwordStrength + '%' }"
            ></div>
          </div>
          <span class="strength-text">{{ passwordStrengthText }}</span>
        </div>
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <div class="password-input-wrapper">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ error: form.confirmPassword && form.password !== form.confirmPassword }"
            placeholder="Confirm your password"
            required
            autocomplete="new-password"
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
        <p class="error-text" v-if="form.confirmPassword && form.password !== form.confirmPassword">
          Passwords do not match
        </p>
      </div>
      
      <div class="form-group">
        <label class="checkbox-wrapper">
          <input type="checkbox" v-model="form.agreeTerms" required />
          <span>I agree to the <a href="#" @click.prevent>Terms of Service</a> and <a href="#" @click.prevent>Privacy Policy</a></span>
        </label>
      </div>
      
      <button type="submit" class="btn btn-primary btn-block" :disabled="loading || form.password !== form.confirmPassword">
        <span v-if="loading"><i class="pi pi-spin pi-spinner"></i> Creating account...</span>
        <span v-else>Create Account</span>
      </button>
      
      <div class="divider">
        <span>or sign up with</span>
      </div>
      
      <button type="button" class="btn btn-google btn-block" @click="handleGoogleLogin" :disabled="loading">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="google-icon" />
        Continue with Google
      </button>
    </form>
    
    <template #footer>
      <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { getGoogleIdToken } from '@/services/googleAuth'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})
const showPassword = ref(false)
const loading = ref(false)

const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength += 25
  if (/[A-Z]/.test(password)) strength += 25
  if (/[a-z]/.test(password)) strength += 25
  if (/[0-9]/.test(password)) strength += 12.5
  if (/[^A-Za-z0-9]/.test(password)) strength += 12.5
  return Math.min(strength, 100)
})

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value < 30) return 'weak'
  if (passwordStrength.value < 60) return 'fair'
  if (passwordStrength.value < 80) return 'good'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (!form.value.password) return ''
  if (passwordStrength.value < 30) return 'Weak password'
  if (passwordStrength.value < 60) return 'Fair password'
  if (passwordStrength.value < 80) return 'Good password'
  return 'Strong password'
})

async function handleRegister() {
  if (form.value.password !== form.value.confirmPassword) return
  
  loading.value = true
  try {
    await authStore.register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password
    })
    router.push('/dashboard')
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
    router.push('/dashboard')
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
  
  &.error {
    border-color: var(--red-500);
    
    &:focus {
      box-shadow: 0 0 0 3px var(--red-100);
    }
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

.password-strength {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.25rem;
  
  .strength-bar {
    height: 4px;
    background: var(--surface-border);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 2px;
    
    &.weak { background: var(--red-500); }
    &.fair { background: var(--orange-500); }
    &.good { background: var(--blue-500); }
    &.strong { background: var(--green-500); }
  }
  
  .strength-text {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }
}

.error-text {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: var(--red-500);
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--text-color);
  line-height: 1.4;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary-color);
    margin-top: 2px;
    flex-shrink: 0;
  }
  
  a {
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
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