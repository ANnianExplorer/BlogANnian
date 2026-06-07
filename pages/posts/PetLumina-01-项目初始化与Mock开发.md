---
title: PetLumina 01 — 项目初始化与 App 端 Mock 开发
date: 2026-05-20
tags:
  - PetLumina
  - Vue 3
  - Vant
  - Tailwind CSS
  - AI开发
categories:
  - 项目实战
cover: /BlogANnian/images/cover/petlumina/app/login.png
description: 从零搭建 PetLumina 移动端项目，使用 Vite + Vue 3 + Vant 4 + Tailwind CSS 3，以 Mock 数据驱动完成所有页面开发。
---

# PetLumina 01 — 项目初始化与 App 端 Mock 开发

> 好的开始是成功的一半。Mock 阶段就把数据结构和 UI 模式定好，后面联调会省很多事。

## 一、技术选型分析

选择 Vue 3 + Vant 4 + Tailwind CSS 3 的组合，核心考量：

| 技术 | 选型理由 |
|---|---|
| Vue 3.5 | Composition API + `<script setup>` 代码更简洁 |
| Vant 4 | 移动端组件库成熟度最高，Tabbar/NavBar/Form 等开箱即用 |
| Tailwind CSS 3 | 原子化 CSS，快速实现自定义样式，和 Vant 不冲突 |
| Pinia 2 | 替代 Vuex，TypeScript 支持更好，API 更简洁 |
| Axios | 请求库，拦截器机制方便统一处理 Token 和错误 |

## 二、项目结构设计

### 2.1 初始化命令

```bash
npm create vite@latest pet-lumina-app -- --template vue-ts
cd pet-lumina-app
npm install vant@4 tailwindcss@3 vue-router@4 pinia axios
npx tailwindcss init -p
```

### 2.2 目录规划

```
pet-lumina-app/
├── src/
│   ├── api/              # 接口层
│   │   ├── request.ts    # Axios 实例 + 拦截器
│   │   ├── user.ts       # 用户相关接口
│   │   ├── pet.ts        # 宠物相关接口
│   │   ├── post.ts       # 帖子相关接口
│   │   └── notification.ts # 通知相关接口
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── router/           # 路由
│   ├── stores/           # Pinia 状态
│   │   └── user.ts       # 用户状态（登录态、宠物列表、未读通知）
│   ├── utils/            # 工具函数
│   │   └── format.ts     # 日期格式化
│   ├── views/            # 页面
│   │   ├── home/         # 首页
│   │   ├── pet/          # 宠物模块
│   │   ├── post/         # 社区帖子
│   │   ├── schedule/     # 日程提醒 + 通知
│   │   └── user/         # 个人中心
│   ├── types/            # TypeScript 类型定义
│   ├── App.vue
│   └── main.ts
├── public/
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

**设计思考：**

- `api/` 按业务模块拆分文件，而不是一个巨大的 `api.ts`，方便后期维护
- `stores/user.ts` 集中管理用户状态，包括宠物列表和未读通知数，避免多个页面重复请求
- `types/` 单独管理类型定义，API 和 VO 的类型统一维护

## 三、Tailwind CSS 配置

```js
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',       // 绿色主色调 — 代表生命力
        secondary: '#6366F1',     // 紫色辅助色
        'surface': '#FAFAFA',
        'on-surface': '#1C1B1F',
      },
      // 自定义间距
      padding: {
        'container': '16px',
      }
    }
  }
}
```

**色彩选择逻辑：** 宠物类 App 用绿色系（生机、健康）作为主色调，配合紫色（活力）作为辅助色，避免大面积使用红色（焦虑感）。

## 四、Mock 数据策略

### 4.1 为什么 Mock？

后端尚未开发，但 UI 不能等。Mock 数据的核心价值：

1. **定义数据结构** — 前端先定好接口返回的数据格式，后端按此开发
2. **UI 开发效率** — 不依赖后端就能完成所有页面
3. **交互验证** — 列表翻转、详情跳转、表单提交等交互可以提前验证

### 4.2 Mock 数据结构设计

```ts
// types/index.ts
export interface Pet {
  id: string              // 雪花 ID，用 string 防精度丢失
  userId: string
  name: string            // 宠物名字
  type: 'cat' | 'dog' | 'other'
  breed: string           // 品种
  avatar: string          // 头像 URL
  birthday: string        // 生日 YYYY-MM-DD
  weight: number          // 体重 kg
  gender: number          // 0未知 1公 2母
}

export interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    nickname: string
    avatar: string
  }
  images: string[]        // 图片列表
  likes: number
  comments: number
  createTime: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  content: string
  isRead: number          // 0未读 1已读
  status: number          // 0草稿 1已发布
  relatedId?: string      // 广播已读记录指向原通知
  createTime: string
}
```

**关键设计决策：**

- `id` 用 `string` 而不是 `number` — 这是为了应对后面会遇到的 JavaScript 大数精度丢失问题（v2.5 详细讲）
- `Notification` 的 `userId=0` 表示广播通知 — 这个设计在 v2.6 通知系统中发挥了关键作用

## 五、核心页面实现

### 5.1 底部导航栏

```vue
<!-- App.vue -->
<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <router-view />
    <van-tabbar v-model="active" route class="backdrop-blur-xl bg-white/85">
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="friends-o" to="/community">社区</van-tabbar-item>
      <van-tabbar-item icon="add-o" to="/add">记录</van-tabbar-item>
      <van-tabbar-item icon="bell" to="/schedule" :badge="unreadCount || ''">日程</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
```

**设计细节：** 通知标签使用 `badge` 展示未读数量，空字符串时不显示角标。

### 5.2 首页布局

首页分为四个区域：宠物卡片轮播、日程提醒、快捷入口、最近动态。

```vue
<template>
  <div class="min-h-screen bg-gradient-to-b from-green-50 to-white">
    <van-nav-bar title="PetLumina" fixed placeholder />

    <!-- 宠物卡片轮播 -->
    <van-swipe :loop="false" class="mx-4 mt-4 rounded-2xl h-40">
      <van-swipe-item v-for="pet in pets" :key="pet.id">
        <div class="bg-white p-4 h-full flex items-center shadow-sm">
          <img :src="pet.avatar" class="w-20 h-20 rounded-full object-cover" />
          <div class="ml-4">
            <div class="text-xl font-bold">{{ pet.name }}</div>
            <div class="text-gray-500 text-sm">{{ pet.breed }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ pet.weight }}kg · {{ pet.gender === 1 ? '公' : '母' }}</div>
          </div>
        </div>
      </van-swipe-item>
    </van-swipe>

    <!-- 快捷入口 -->
    <div class="grid grid-cols-4 gap-4 px-4 mt-6">
      <div v-for="entry in quickEntries" :key="entry.label"
           class="flex flex-col items-center jelly-touch">
        <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <van-icon :name="entry.icon" class="text-primary text-xl" />
        </div>
        <span class="text-xs mt-2">{{ entry.label }}</span>
      </div>
    </div>

    <!-- 今日提醒 -->
    <div class="mx-4 mt-6">
      <div class="text-lg font-bold mb-3">今日提醒</div>
      <div v-for="reminder in todayReminders" :key="reminder.id"
           class="bg-white rounded-xl p-3 mb-2 flex items-center shadow-sm">
        <van-icon name="clock-o" class="text-orange-500 mr-3" />
        <div>
          <div class="text-sm font-medium">{{ reminder.title }}</div>
          <div class="text-xs text-gray-400">{{ reminder.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
```

## 六、路由配置

```ts
// router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('@/views/home/Home.vue') },
  { path: '/community', component: () => import('@/views/post/Community.vue') },
  { path: '/add', component: () => import('@/views/home/AddRecord.vue') },
  { path: '/schedule', component: () => import('@/views/schedule/Schedule.vue') },
  { path: '/notifications', component: () => import('@/views/schedule/Notifications.vue') },
  { path: '/user', component: () => import('@/views/user/UserCenter.vue') },
  { path: '/pet/:id', component: () => import('@/views/pet/PetDetail.vue') },
  { path: '/login', component: () => import('@/views/user/Login.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })  // 路由切换回到顶部
})

export default router
```

**选择 Hash 模式的原因：** H5 应用打包成 APK 后，Hash 模式兼容性最好，不需要服务器配置。

## 七、总结

v1.0 完成了项目骨架搭建和所有页面的 Mock 开发。

**核心经验：**

1. **Mock 数据结构就是 API 契约** — 前端先定义好类型，后端按此实现，联调时零沟通成本
2. **id 用 string** — 19 位雪花 ID 超出 JS 安全整数范围，从一开始就在类型定义中用 string
3. **Pinia Store 集中管理状态** — 用户登录态、宠物列表、未读通知数放在 userStore 中，避免页面间重复请求
4. **Vant 的 Tabbar badge** — 通知未读数直接用 badge 展示，不需要自己实现角标

---

