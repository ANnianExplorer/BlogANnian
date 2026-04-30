---
title: 🧹正确升级opencode（完整流程）
date: 2026-04-20
tags:
  - 版本更新
  - opencode
categories:
  - AI
cover: /BlogANnian/images/cover/openeUpdate.png
description: 🧹 一键修复 + 正确升级 opencode（完整流程）
---

# 🧹 一键修复 + 正确升级 opencode（完整流程）

## 🔴 Step 1：删除污染配置（关键）

```
del C:\Users\ASUS\.npmrc
```

------

## 🔴 Step 2：恢复官方 npm 源

```
npm config set registry https://registry.npmjs.org/
```

------

## 🔴 Step 3：清理 npm 缓存

```
npm cache clean --force
```

------

## 🔴 Step 4：检查 Node 环境（nvm）

```
node -v
npm -v
```

------

## 🔴 Step 5：删除旧版本 opencode

```
npm uninstall -g opencode-ai
```

------

## 🔴 Step 6：安装最新版本（关键）

```
npm install -g opencode-ai@1.14.30
```

------

## 🔴 Step 7：验证结果

```
opencode --version
```

------

# ⚠️ 如果还不行（备用方案）

### 👉 强制最新安装

```
npm install -g opencode-ai@latest
```

------

### 👉 检查 npm 是否被污染

```
npm config get registry
```

必须是：

```
https://registry.npmjs.org/
```

------

### 👉 查看 opencode 实际来源

```
where opencode
```

------

# 🧠 一张图理解问题本质

你之前的问题其实是三层叠加：

```
❌ .npmrc 淘宝镜像（已废弃）
❌ npm 缓存旧包
❌ global 包版本残留
```

------

# 🚀 最终正确状态（目标）

执行完后你应该看到：

```
opencode --version
→ 1.14.30
```

------

# 💡 最重要一句话（记住这个）

> **以后 npm 全局工具更新 = 先清 .npmrc + 用官方源 + 再 reinstall**