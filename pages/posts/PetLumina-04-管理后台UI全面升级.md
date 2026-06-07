---
title: PetLumina 04 — 管理后台 UI 全面升级（玻璃态 + 果冻动画 + 胶囊布局）
date: 2026-05-23
tags:
  - PetLumina
  - Tailwind CSS
  - 玻璃态
  - 果冻动画
  - AI开发
categories:
  - 项目实战
cover: /BlogANnian/images/cover/petlumina/web/settings.png
description: 管理后台 UI 大升级，引入三层玻璃态面板系统、果冻弹性动画、胶囊导航布局，形成统一的视觉语言。
---

# PetLumina 04 — 管理后台 UI 全面升级

> 功能完成后，开始打磨视觉体验。好的 UI 不只是好看，更是层次感和交互反馈。

## 一、设计系统概述

### 1.1 设计理念

PetLumina 的 UI 设计围绕三个关键词：

- **层次感** — 玻璃态面板系统，三层深度
- **活力感** — 果冻动画，弹性交互反馈
- **一致性** — 胶囊形状，统一的圆角语言

### 1.2 为什么需要设计系统？

没有设计系统时的问题：

- 每个组件各自写圆角、阴影、动画，风格不统一
- 改一处样式要改 N 个文件
- 新增页面时不知道用什么样式

设计系统的好处：**一套样式，全局生效，新页面开箱即用。**

## 二、玻璃态面板系统

### 2.1 三层深度定义

```css
/* glass.css — 全局引入 */

/* 第一层 — 卡片、列表项（最浅） */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* 第二层 — 侧边栏、导航（中等） */
.glass-panel-mid {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

/* 第三层 — 弹窗、模态框（最深） */
.glass-panel-deep {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}
```

### 2.2 三层深度的使用场景

```
┌─────────────────────────────────────────┐
│  第三层（弹窗）                          │
│  ┌─────────────────────────────────┐    │
│  │  背景最深，最不透明              │    │
│  │  用于：Dialog, Drawer, Toast    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  第二层（导航）                          │
│  ┌─────────┐  ┌───────────────────┐    │
│  │ 侧边栏   │  │  内容区            │    │
│  │ 背景中等  │  │                   │    │
│  └─────────┘  │  第一层（卡片）     │    │
│               │  ┌───────────────┐ │    │
│               │  │ 背景最浅       │ │    │
│               │  └───────────────┘ │    │
│               └───────────────────┘    │
└─────────────────────────────────────────┘
```

### 2.3 渐变背景

玻璃态需要渐变背景才能看出效果 — 纯白背景上 `backdrop-filter: blur()` 看不出区别。

```css
/* 管理后台内容区背景 */
.admin-content {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

/* 侧边栏背景 */
.admin-sidebar {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
}
```

## 三、果冻动画系统

### 3.1 核心贝塞尔曲线

```css
/* 果冻弹性曲线 — 关键参数 */
:root {
  --jelly-ease: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

`cubic-bezier(0.34, 1.56, 0.64, 1)` 的含义：

- 第二个参数 `1.56 > 1` — 这是产生「弹性」的关键，动画会超过目标值再回弹
- 比 `ease`（`cubic-bezier(0.25, 0.1, 0.25, 1)`）更有活力
- 比 `linear` 有节奏感

### 3.2 点击果冻效果

```css
.jelly-click {
  transition: transform 0.3s var(--jelly-ease);
  -webkit-tap-highlight-color: transparent;
}
.jelly-click:active {
  transform: scale(0.95);
}
```

**应用：** 按钮、卡片、菜单项等所有可点击元素。

### 3.3 悬浮果冻效果

```css
.jelly-hover {
  transition:
    transform 0.3s var(--jelly-ease),
    box-shadow 0.3s ease;
}
.jelly-hover:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

### 3.4 卡片常驻动态效果

```css
/* 呼吸效果 — 阴影周期性变化 */
@keyframes breathe {
  0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); }
  50% { box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12); }
}
.animate-breathe { animation: breathe 3s ease-in-out infinite; }

/* 浮动效果 — 轻微上下漂浮 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-float { animation: float 4s ease-in-out infinite; }

/* 光泽效果 — 光线扫过 */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.animate-shimmer {
  background: linear-gradient(90deg,
    transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

/* 脉动效果 — 边框脉冲 */
@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
```

## 四、胶囊导航布局

### 4.1 胶囊形状定义

```
┌──────────────────────────┐
│  ╭────────────────────╮  │
│  │  🏠 仪表盘          │  │  ← 激活态：背景色 + 字体加粗
│  ╰────────────────────╯  │
│                          │
│     👥 用户管理           │  ← 默认态：无背景
│                          │
│     🐾 宠物管理           │
│                          │
│     📋 帖子管理           │
│                          │
╰──────────────────────────╯
```

### 4.2 实现

```vue
<template v-for="item in menuItems" :key="item.path">
  <router-link
    :to="item.path"
    class="flex items-center px-4 py-2.5 mx-3 rounded-[28px] transition-all duration-300"
    :class="isActive(item.path)
      ? 'bg-primary/10 text-primary font-medium shadow-sm'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
  >
    <el-icon class="mr-3"><component :is="item.icon" /></el-icon>
    <span>{{ item.label }}</span>
  </router-link>
</template>
```

**`rounded-[28px]`** — Tailwind 的任意值语法，28px 是胶囊形状的最佳圆角值。

## 五、表格行悬浮效果

```css
.el-table .el-table__row {
  transition: all 0.2s ease;
}
.el-table .el-table__row:hover > td {
  background-color: rgba(16, 185, 129, 0.04) !important;
}
```

**设计细节：** 悬浮时用主色调的极淡色（4% 透明度），而不是灰色，保持品牌一致性。

## 六、动画性能优化

```css
/* 只对 transform 和 opacity 做动画 — 这两个属性不会触发重排 */
.jelly-hover {
  will-change: transform;
  transition: transform 0.3s var(--jelly-ease);
}

/* 避免对 width/height/margin/padding 做动画 — 会触发重排 */
```

## 七、总结

v2.2 完成了管理后台的 UI 系统升级。

**核心经验：**

1. **玻璃态三层深度** — 用 `backdrop-filter: blur()` + 不同透明度区分层级
2. **果冻动画的精髓在贝塞尔曲线** — `cubic-bezier(0.34, 1.56, 0.64, 1)` 中 `1.56 > 1` 产生弹性
3. **胶囊形状用 `rounded-[28px]`** — 统一的圆角语言让 UI 有辨识度
4. **只对 `transform` 和 `opacity` 做动画** — 性能最佳

---

