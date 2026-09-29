<template>
  <AuthLayout title="Forgot Password" subtitle="Enter your email to receive a password reset link">
    <form @submit.prevent="handleForgotPassword" class="auth-form">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-input"
          placeholder="Enter your registered email"
          required
          autocomplete="email"
        />
      </div>
      
      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        <span v-if="loading"><i class="pi pi-spin pi-spinner"></i> Sending...</span>
        <span v-else>Send Reset Link</span>
      </button>
    </form>
    
    <template #footer>
      <p>Remember your password? <router-link to="/login">Sign in</router-link></p>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({ email: '' })
const loading = ref(false)

async function handleForgotPassword() {
  loading.value = true
  try {
    await authStore.forgotPassword(form.value.email)
    toast.success('If the email exists, a reset link has been sent')
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