---
title: PetLumina 00 — 项目成果展示：AI 驱动的宠物生活管理平台
date: 2026-06-07
tags:
  - PetLumina
  - Vue 3
  - Spring Boot
  - AI开发
  - 全栈开发
categories:
  - 项目实战
cover: /images/cover/petlumina/web/dashboard.png
description: PetLumina 宠物生活管理平台完整成果展示，涵盖用户端 App、Web 管理后台、Java 后端服务三端架构。
---

# PetLumina 00 — 项目成果展示：AI 驱动的宠物生活管理平台

> 本系列记录 PetLumina 从零到一的完整开发过程，全程使用 AI 辅助编码。

## 一、项目概览

PetLumina 是一个宠物生活管理平台，帮助宠物主人管理宠物档案、记录健康数据、社区互动、日程提醒等。项目采用前后端分离架构，包含三个独立的子系统：

| 子系统 | 技术栈 | 说明 |
|---|---|---|
| **用户端 App** | Vue 3.5 + Vant 4.9 + Tailwind CSS 3.4 + Pinia 2.3 | 移动端 H5 应用，可打包 APK |
| **Web 管理后台** | Vue 3.5 + Element Plus 2.8 + Tailwind CSS 4.3 + ECharts 5.6 | 管理员使用的 Web 后台 |
| **后端服务** | Spring Boot 2.7 + MyBatis-Plus 3.5 + Sa-Token 1.39 + MySQL 8.0 | Java 后端 API 服务 |

## 二、功能模块

### 2.1 用户端 App

![首页](/images/cover/petlumina/app/home.png)

- **宠物档案管理**：添加/编辑宠物信息，头像上传，类型选择（猫/狗/其他）
- **健康数据追踪**：体重、体温、疫苗、驱虫记录的导入和查看
- **社区互动**：发帖、点赞、评论、话题参与
- **生活记录**：日常喂养、散步、美容等生活日志
- **日程提醒**：疫苗提醒、驱虫提醒、体检提醒等
- **通知系统**：接收系统公告和个性化提醒

### 2.2 Web 管理后台

![数据概览](/images/cover/petlumina/web/dashboard.png)

- **数据概览**：用户增长、宠物统计、活跃度趋势的可视化仪表盘
- **用户管理**：用户列表、搜索、详情查看、状态管理
- **宠物管理**：宠物列表、详情查看、主人信息关联
- **内容审核**：帖子管理、评论管理、违规内容处理
- **健康数据**：健康记录查看、数据统计
- **通知管理**：发布/编辑/删除系统通知，发布状态切换
- **系统设置**：基础配置管理

### 2.3 后端服务

- **统一认证**：Sa-Token 实现登录鉴权、角色权限控制
- **文件上传**：腾讯云 COS 存储，支持路径分类、魔数校验
- **数据持久化**：MyBatis-Plus ORM，雪花 ID 主键，逻辑删除
- **接口规范**：统一响应封装，全局异常处理，参数校验

## 三、技术架构图

```
┌─────────────────────────────────────────────────────────┐
│                      客户端                               │
│  ┌──────────────────┐    ┌──────────────────┐           │
│  │   App (Vue 3)     │    │  Web Admin (Vue 3)│           │
│  │   Vant + Tailwind │    │  Element Plus     │           │
│  └────────┬─────────┘    └────────┬─────────┘           │
│           │                       │                      │
└───────────┼───────────────────────┼──────────────────────┘
            │  HTTP / JSON           │
            ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Spring Boot 后端                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Sa-Token    │  │ MyBatis-Plus│  │ COS Manager │     │
│  │ 认证鉴权    │  │ 数据持久化  │  │ 文件存储    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│           │               │               │              │
└───────────┼───────────────┼───────────────┼──────────────┘
            ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌──────────┐
      │  Redis  │    │  MySQL  │    │ 腾讯COS  │
      │  缓存   │    │  数据库 │    │ 文件存储 │
      └─────────┘    └─────────┘    └──────────┘
```

## 四、App 端页面展示

| 页面 | 截图 |
|---|---|
| 登录页 | ![登录](/images/cover/petlumina/app/login.png) |
| 首页 | ![首页](/images/cover/petlumina/app/home.png) |
| 宠物详情 | ![宠物详情](/images/cover/petlumina/app/pet-detail.png) |
| 宠物社区 | ![社区](/images/cover/petlumina/app/community.png) |
| 话题详情 | ![话题](/images/cover/petlumina/app/topic-detail.png) |
| 饮食健康 | ![饮食](/images/cover/petlumina/app/diet-health.png) |
| 导入健康数据 | ![导入](/images/cover/petlumina/app/health-import.png) |
| 生活记录 | ![记录](/images/cover/petlumina/app/life-log.png) |
| 新增提醒 | ![提醒](/images/cover/petlumina/app/add-reminder.png) |
| 个人中心 | ![个人中心](/images/cover/petlumina/app/profile.png) |

## 五、Web 管理后台页面展示

| 页面 | 截图 |
|---|---|
| 数据概览 | ![仪表盘](/images/cover/petlumina/web/dashboard.png) |
| 用户管理 | ![用户](/images/cover/petlumina/web/user-manage.png) |
| 宠物管理 | ![宠物](/images/cover/petlumina/web/pet-manage.png) |
| 添加宠物 | ![添加](/images/cover/petlumina/web/add-pet.png) |
| 健康数据 | ![健康](/images/cover/petlumina/web/health-data.png) |
| 帖子详情 | ![帖子](/images/cover/petlumina/web/post-detail.png) |
| 话题管理 | ![话题](/images/cover/petlumina/web/topic-manage.png) |
| 违规管理 | ![违规](/images/cover/petlumina/web/violation-manage.png) |
| 系统设置 | ![设置](/images/cover/petlumina/web/settings.png) |

## 六、版本迭代历程

| 版本 | 核心内容 | 关键技术点 |
|---|---|---|
| v1.0 | App 端 Mock 开发 | Vite + Vue 3 + Vant + Tailwind CSS |
| v2.0 | 后端开发与前后端联调 | Spring Boot + MyBatis-Plus + Sa-Token |
| v2.1 | 后端重构 + Web 管理后台 | Element Plus + 管理后台布局 |
| v2.2 | 管理后台 UI 全面升级 | 玻璃态 + 果冻动画 + 胶囊布局 |
| v2.3 | 卡片常驻动态效果 | 呼吸/浮动/光泽/脉动动画 |
| v2.4 | 图片上传全链路 | COS 路径分类 + Magic Byte 验证 |
| v2.5 | 宠物管理升级 + 大数修复 | JavaScript 大数精度丢失解决方案 |
| v2.6 | 通知系统 + 搜索修复 | 广播机制 + 已读状态管理 |
| v2.7 | 日期格式化 + 通知详情 | 全局日期统一 + Teleport 弹窗 |

## 七、项目源码

- 前端 App：`pet-lumina-app/`
- 管理后台：`pet-lumina-web/`
- 后端服务：`backend/`

---

> 下一篇：[PetLumina 01 — 项目初始化与 App 端 Mock 开发](/posts/PetLumina-01-项目初始化与Mock开发)
