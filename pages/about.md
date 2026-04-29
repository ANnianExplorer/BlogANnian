---
title: 关于
layout: page
cover: /images/background/about.png
---

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSiteConfig, usePostList } from 'valaxy'

const siteConfig = useSiteConfig()
const postList = usePostList()
const siteSince = '2025-01-01'

const postCount = computed(() => postList.value?.length || 0)

const currentTime = ref('')
const runTime = ref('')
const siteStartTime = ref('')

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatDateTime(d) {
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  const s = pad(d.getSeconds())
  return y + '年' + m + '月' + day + '日 ' + h + ':' + min + ':' + s
}

function updateTime() {
  const now = new Date()
  const start = new Date(siteSince)
  const diff = now.getTime() - start.getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  runTime.value = days + '天' + hours + '时'
  currentTime.value = formatDateTime(now)
  siteStartTime.value = formatDateTime(start)
}

let timer

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<div class="about-page" style="text-align: center;">

<div>Hi there 👋</div>
<div class="name">ANnianExplorer</div>
<div class="title">Java 开发者 × AI 应用实践者 × Agent 学习者</div>


---

<div class="section-title">技术栈</div>

<div class="tech-badges">
<img src="https://img.shields.io/badge/Java-111827?style=for-the-badge&amp;logo=openjdk&amp;logoColor=white" />
<img src="https://img.shields.io/badge/SpringBoot-16a34a?style=for-the-badge&amp;logo=springboot&amp;logoColor=white" />
<img src="https://img.shields.io/badge/SpringCloud-22c55e?style=for-the-badge&amp;logo=spring&amp;logoColor=white" />
<img src="https://img.shields.io/badge/SpringAIAlibaba-0ea5e9?style=for-the-badge" />
<img src="https://img.shields.io/badge/Redis-dc2626?style=for-the-badge&amp;logo=redis&amp;logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-1d4ed8?style=for-the-badge&amp;logo=postgresql&amp;logoColor=white" />
<img src="https://img.shields.io/badge/Docker-2563eb?style=for-the-badge&amp;logo=docker&amp;logoColor=white" />
<img src="https://img.shields.io/badge/Vue-42b883?style=for-the-badge&amp;logo=vuedotjs&amp;logoColor=white" />
<img src="https://img.shields.io/badge/RAG-7c3aed?style=for-the-badge" />
<img src="https://img.shields.io/badge/Agent-9333ea?style=for-the-badge" />
<img src="https://img.shields.io/badge/Claude_Code-f97316?style=for-the-badge" />
<img src="https://img.shields.io/badge/Cursor-111827?style=for-the-badge" />
<img src="https://img.shields.io/badge/OpenCode-0f766e?style=for-the-badge" />
<img src="https://img.shields.io/badge/GitHub_Copilot-000000?style=for-the-badge&amp;logo=github&amp;logoColor=white" />
<img src="https://img.shields.io/badge/Trae-ef4444?style=for-the-badge" />
</div>

---

<div class="section-title">GitHub 统计</div>

<div class="github-stats">
<img src="https://github-readme-stats.vercel.app/api?username=ANnianExplorer&amp;show_icons=true&amp;hide_border=true&amp;theme=transparent&amp;rank_icon=github" />
<img src="https://github-readme-stats.vercel.app/api/top-langs/?username=ANnianExplorer&amp;layout=compact&amp;hide_border=true&amp;theme=transparent" />
</div>





---

<div class="section-title">博客统计</div>

<div class="stats-table">
  <div class="stats-row">
    <div class="stats-cell label">文章</div>
    <div class="stats-cell value">{{ postCount }}</div>
  </div>
  <div class="stats-row">
    <div class="stats-cell label">访问</div>
    <div class="stats-cell value">-</div>
  </div>
  <div class="stats-row">
    <div class="stats-cell label">建站</div>
    <div class="stats-cell value">{{ siteStartTime }}</div>
  </div>
  <div class="stats-row">
    <div class="stats-cell label">运行</div>
    <div class="stats-cell value">{{ runTime }}</div>
  </div>
  <div class="stats-row">
    <div class="stats-cell label">现在</div>
    <div class="stats-cell value">{{ currentTime }}</div>
  </div>
</div>

</div>

<style>
.about-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.name {
  font-size: 2rem;
  font-weight: 700;
  color: #2563eb;
  margin: 10px 0;
}

.title {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin: 30px 0 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #2563eb;
  display: inline-block;
}

.about-page > div[align="center"] {
  margin: 20px 0;
}

.about-page img {
  vertical-align: middle;
  margin: 2px;
}

.tech-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  padding: 0 20px;
}

.tech-badges img {
  height: 28px;
}

.github-stats img {
  display: inline-block;
  margin: 10px;
  max-width: 45%;
}

/* 统计表格 */
.stats-table {
  display: table;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-collapse: collapse;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 12px;
  overflow: hidden;
}

.stats-row {
  display: table-row;
}

.stats-cell {
  display: table-cell;
  padding: 14px 20px;
  text-align: left;
}

.stats-row .label {
  color: rgba(255,255,255,0.7);
  font-size: 14px;
  width: 40%;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.stats-row .value {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  text-align: right;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.stats-row:last-child .stats-cell {
  border-bottom: none;
}

.stats-row .label {
  color: #a0a0a0;
}

.stats-row:nth-child(1) .value { color: #ff6b6b; }
.stats-row:nth-child(2) .value { color: #4ecdc4; }
.stats-row:nth-child(3) .value { color: #ffe66d; }
.stats-row:nth-child(4) .value { color: #95e1d3; }
.stats-row:nth-child(5) .value { color: #dda0dd; }

@media (max-width: 768px) {
  .stats-table {
    display: block;
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .stats-cell {
    display: block;
    padding: 0;
  }

  .stats-row .label {
    font-size: 12px;
    width: auto;
  }

  .stats-row .value {
    font-size: 14px;
    text-align: right;
  }

  .github-stats img {
    max-width: 100%;
  }
}
</style>