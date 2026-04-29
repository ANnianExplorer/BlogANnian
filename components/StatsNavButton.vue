<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToStats() {
  router.push('/archives')
}
</script>

<template>
  <button @click="goToStats" class="stats-nav-btn" title="统计">
    📊
  </button>
</template>

<style scoped>
.stats-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
}
</style>