<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function openStats() {
  router.push('/archives')
}
</script>

<template>
  <button 
    class="sakura-icon-btn" 
    title="统计"
    @click="openStats"
  >
    <div i-mdi-chart-bar />
  </button>
</template>

<style scoped>
.sakura-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--sakura-navbar-item-color);
  width: 1.25em;
  height: 1.25em;
}

.sakura-icon-btn:hover {
  color: var(--sakura-color-primary);
}
</style>