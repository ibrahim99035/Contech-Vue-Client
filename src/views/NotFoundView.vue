<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1>Page Not Found</h1>
      <p class="subtitle">The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/dashboard" class="btn btn-primary">Back to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.not-found-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  padding: 2rem;

  .not-found-content {
    text-align: center;
    max-width: 480px;
  }

  .error-code {
    font-size: 5rem;
    font-weight: 700;
    color: var(--primary-color);
    line-height: 1;
    margin-bottom: 1rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }

  .subtitle {
    margin: 0 0 1.5rem;
    color: var(--text-color-secondary);
  }
}
</style>