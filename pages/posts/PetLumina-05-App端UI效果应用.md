---
title: PetLumina 05 — App 端 UI 效果应用（果冻动画 + 玻璃态 + Vant 覆盖）
date: 2026-05-24
tags:
  - PetLumina
  - Vant
  - Tailwind CSS
  - 移动端适配
  - AI开发
categories:
  - 项目实战
cover: /BlogANnian/images/cover/petlumina/app/community.png
description: 将管理后台的玻璃态、果冻动画效果同步到移动端 App，适配 Vant 组件样式，处理移动端特有的触摸反馈和性能问题。
---

# PetLumina 05 — App 端 UI 效果应用

> 管理后台的视觉效果验证成功后，同步到 App 端。但移动端有移动端的特殊性。

## 一、跨端设计差异

Web 端和 App 端的交互模式完全不同，UI 效果需要做适配：

| 维度 | Web 管理端 | App 用户端 |
|---|---|---|
| 交互方式 | 鼠标 hover + click | 手指 touch |
| hover 效果 | 有意义，鼠标经过就有反馈 | **无意义** — 手指没有 hover 状态 |
| 动画触发 | hover + click 都能触发 | 只有 click/touch 能触发 |
| 性能要求 | 桌面端 CPU 足够 | 移动端 CPU 有限，blur 值要小 |
| 屏幕尺寸 | 大屏，内容密度高 | 小屏，信息要精简 |

**核心决策：** App 端去掉所有 `:hover` 效果，只保留 `:active` 触摸反馈。

## 二、App 端玻璃态实现

### 2.1 性能适配

移动端的 `backdrop-filter` 比桌面端消耗更多 GPU 资源，需要降低 blur 值：

```css
/* Web 端 — blur(20px) */
.glass-panel { backdrop-filter: blur(20px); }

/* App 端 — blur(16px)，降低 20% */
.app-glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);  /* Safari 兼容 */
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
```

### 2.2 Vant 组件覆盖

Vant 的默认样式需要覆盖以匹配设计系统：

```css
/* Vant Tabbar — 玻璃态效果 */
.van-tabbar {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
}

.van-tabbar-item--active {
  color: #10B981 !important;
}

/* Vant NavBar — 玻璃态 */
.van-nav-bar {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Vant Cell Group — 统一圆角 */
.van-cell-group--inset {
  border-radius: 16px !important;
  overflow: hidden;
}
```

**为什么用 `!important`？** Vant 组件的样式优先级很高，不用 `!important` 很难覆盖。虽然不优雅，但这是组件库覆盖的通用做法。

## 三、App 端果冻动画

### 3.1 触摸反馈

```css
.jelly-touch {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  -webkit-tap-highlight-color: transparent;  /* 去除 iOS 默认点击高亮 */
}
.jelly-touch:active {
  transform: scale(0.96);
}
```

**时长从 0.3s 改为 0.2s** — 移动端触摸反馈需要更快响应，0.3s 会有延迟感。

### 3.2 列表项进场动画

```vue
<template>
  <TransitionGroup name="list" tag="div" class="space-y-3">
    <div
      v-for="(item, index) in list"
      :key="item.id"
      class="app-glass-card p-4 jelly-touch"
      :style="{ animationDelay: `${index * 50}ms` }"
    >
      <!-- 内容 -->
    </div>
  </TransitionGroup>
</template>

<style>
.list-enter-active {
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.list-leave-active {
  animation: slideDown 0.3s ease both;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideDown {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
}
</style>
```

**`animationDelay` 逐项递增** — 列表项不是同时出现，而是依次滑入，有节奏感。

## 四、宠物详情页重写

### 4.1 业务逻辑

宠物详情页是 App 端最复杂的页面之一，包含：

1. **Hero 区域** — 宠物大头像 + 名字 + 品种
2. **统计卡片** — 体重、年龄、性别（一行三列）
3. **基本信息** — 分组展示宠物档案
4. **健康记录** — 最近的健康数据
5. **快捷操作** — 编辑、删除

### 4.2 实现

```vue
<template>
  <div class="min-h-screen bg-gradient-to-b from-green-50 to-white">
    <!-- Hero 区域 -->
    <div class="relative h-64 overflow-hidden">
      <img :src="pet.avatar" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div class="absolute bottom-4 left-4 text-white">
        <h1 class="text-2xl font-bold">{{ pet.name }}</h1>
        <p class="text-sm opacity-80">{{ pet.breed }}</p>
      </div>
      <button class="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm
                      flex items-center justify-center" @click="router.back()">
        <van-icon name="arrow-left" color="#fff" />
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="p-4 -mt-6 relative z-10">
      <div class="app-glass-card p-4">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-lg font-bold text-primary">{{ pet.weight }}kg</div>
            <div class="text-xs text-gray-500">体重</div>
          </div>
          <div>
            <div class="text-lg font-bold text-secondary">{{ calcAge(pet.birthday) }}</div>
            <div class="text-xs text-gray-500">年龄</div>
          </div>
          <div>
            <div class="text-lg font-bold">{{ pet.gender === 1 ? '♂ 公' : '♀ 母' }}</div>
            <div class="text-xs text-gray-500">性别</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 基本信息 -->
    <van-cell-group title="基本信息" inset class="mx-4">
      <van-cell title="品种" :value="pet.breed" />
      <van-cell title="生日" :value="formatDateShort(pet.birthday)" />
      <van-cell title="体重" :value="pet.weight + ' kg'" />
    </van-cell-group>
  </div>
</template>
```

## 五、滚动优化

```css
/* iOS 弹性滚动 */
.page-content {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;  /* 防止滚动穿透 */
}
```

## 六、总结

v2.2-app 和 v2.3 完成了 App 端的 UI 效果应用。

**核心经验：**

1. **移动端没有 hover** — 所有反馈靠 `:active` 触摸状态
2. **blur 值降低 20%** — 移动端 GPU 性能有限
3. **Vant 样式覆盖用 `!important`** — 不优雅但最省事
4. **动画时长缩短** — 移动端 0.2s 比 0.3s 更跟手
5. **列表项逐个进场** — `animationDelay` 递增产生节奏感

---

