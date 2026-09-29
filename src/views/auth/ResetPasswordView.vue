<template>
  <AuthLayout title="Reset Password" subtitle="Enter your new password">
    <form @submit.prevent="handleResetPassword" class="auth-form">
      <div class="form-group">
        <label for="password">New Password</label>
        <div class="password-input-wrapper">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Enter new password (min 8 characters)"
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
        <label for="confirmPassword">Confirm New Password</label>
        <div class="password-input-wrapper">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ error: form.confirmPassword && form.password !== form.confirmPassword }"
            placeholder="Confirm new password"
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
      
      <button type="submit" class="btn btn-primary btn-block" :disabled="loading || form.password !== form.confirmPassword">
        <span v-if="loading"><i class="pi pi-spin pi-spinner"></i> Resetting...</span>
        <span v-else>Reset Password</span>
      </button>
    </form>
    
    <template #footer>
      <p>Remember your password? <router-link to="/login">Sign in</router-link></p>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const token = route.params.token
const form = ref({ password: '', confirmPassword: '' })
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

async function handleResetPassword() {
  if (form.value.password !== form.value.confirmPassword) {
    toast.error('Passwords do not match')
    return
  }

  loading.value = true
  try {
    await authStore.resetPassword(token, form.value.password)
    toast.success('Password reset successfully!')
    router.push('/login')
  } catch (error) {
    // Error handled in store
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';
</style>