<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="pi pi-home"></i>
            <span>Contech IoT</span>
          </div>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        
        <slot />
        
        <div class="auth-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-ground) 100%);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-card {
  background: var(--surface-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-2);
  padding: 2.5rem;
  border: 1px solid var(--surface-border);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
  
  .auth-logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-color);
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    
    i {
      font-size: 2rem;
    }
  }
  
  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-color);
  }
  
  p {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 0.9375rem;
  }
}

.auth-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--surface-border);
  text-align: center;
}

@media (max-width: 480px) {
  .auth-layout {
    padding: 1rem;
  }
  
  .auth-card {
    padding: 1.5rem;
  }
}
</style>