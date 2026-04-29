<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSiteConfig } from 'valaxy'

const siteConfig = useSiteConfig()
const siteSince = 2025

const currentTime = ref('')
const runTime = ref('')

function updateTime() {
  const now = new Date()
  const start = new Date(`${siteSince}-01-01T00:00:00`)
  const diff = now.getTime() - start.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  runTime.value = `${days}天${hours}时${minutes}分`
  
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

let timer: number

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="sidebar-stats">
    <div class="stats-section author-info">
      <img 
        v-if="siteConfig.author.avatar" 
        :src="siteConfig.author.avatar" 
        alt="avatar" 
        class="author-avatar"
      />
      <div class="author-name">{{ siteConfig.author.name }}</div>
      <div class="author-intro">{{ siteConfig.author.intro }}</div>
    </div>
    
    <div class="stats-section">
      <div class="stats-item">
        <span class="stats-icon">📝</span>
        <span class="stats-label">文章</span>
        <span class="stats-value">3</span>
      </div>
      <div class="stats-item">
        <span class="stats-icon">👁️</span>
        <span class="stats-label">访问</span>
        <span class="stats-value">--</span>
      </div>
      <div class="stats-item">
        <span class="stats-icon">📅</span>
        <span class="stats-label">建站</span>
        <span class="stats-value">{{ siteSince }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-icon">⏱️</span>
        <span class="stats-label">运行</span>
        <span class="stats-value">{{ runTime }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-icon">🕐</span>
        <span class="stats-label">现在</span>
        <span class="stats-value">{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar-stats {
  padding: 16px;
  background: var(--va-c-bg-soft, #f8f8f8);
  border-radius: 12px;
  margin: 8px;
}

.stats-section {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--va-c-divider, #eee);
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.author-info {
  text-align: center;
  
  .author-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    margin-bottom: 8px;
  }
  
  .author-name {
    font-size: 14px;
    font-weight: 600;
  }
  
  .author-intro {
    font-size: 11px;
    color: var(--va-c-text-2, #666);
    margin-top: 4px;
  }
}

.stats-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 12px;
}

.stats-icon {
  width: 20px;
  font-size: 11px;
  text-align: center;
}

.stats-label {
  flex: 1;
  color: var(--va-c-text-2, #666);
  font-size: 11px;
}

.stats-value {
  font-weight: 600;
  color: var(--va-c-brand, #ff4e6a);
  font-size: 11px;
}
</style>