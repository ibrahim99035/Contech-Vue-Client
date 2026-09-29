<template>
  <AuthLayout title="Verify Email" subtitle="Please wait while we verify your email address">
    <div class="verify-content">
      <div class="verify-icon" :class="status">
        <i :class="icon"></i>
      </div>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      
      <div class="verify-actions" v-if="status === 'success'">
        <router-link to="/login" class="btn btn-primary">Sign In</router-link>
      </div>
      
      <div class="verify-actions" v-if="status === 'error'">
        <router-link to="/register" class="btn btn-primary">Create Account</router-link>
        <router-link to="/login" class="btn btn-secondary">Sign In</router-link>
      </div>
      
      <div class="verify-loading" v-if="status === 'pending'">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const token = route.params.token
const status = ref('pending')
const title = ref('Verifying...')
const message = ref('Please wait while we verify your email address.')
const icon = ref('pi pi-spin pi-spinner')

onMounted(async () => {
  try {
    await authStore.verifyEmail(token)
    status.value = 'success'
    title.value = 'Email Verified!'
    message.value = 'Your email has been successfully verified. You can now sign in to your account.'
    icon.value = 'pi pi-check-circle'
  } catch (error) {
    status.value = 'error'
    title.value = 'Verification Failed'
    message.value = 'The verification link is invalid or has expired. Please request a new one.'
    icon.value = 'pi pi-times-circle'
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.verify-content {
  text-align: center;
  padding: 2rem 0;
  
  .verify-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 2.5rem;
    
    &.pending {
      background: var(--blue-100);
      color: var(--blue-600);
    }
    
    &.success {
      background: var(--green-100);
      color: var(--green-600);
    }
    
    &.error {
      background: var(--red-100);
      color: var(--red-600);
    }
  }
  
  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  p {
    margin: 0 0 2rem;
    color: var(--text-color-secondary);
    line-height: 1.6;
  }
  
  .verify-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .verify-loading {
    font-size: 2.5rem;
    color: var(--primary-color);
  }
}
</style>