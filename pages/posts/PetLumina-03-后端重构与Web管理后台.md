---
title: PetLumina 03 — 后端目录重构与 Web 管理后台搭建
date: 2026-06-07
tags:
  - PetLumina
  - Element Plus
  - Spring Boot
  - 管理后台
  - AI开发
categories:
  - 项目实战
cover: /images/cover/petlumina/web/user-manage.png
description: 后端按 admin/user 分离 Controller，搭建 Vue 3 + Element Plus Web 管理后台，实现用户管理、宠物管理等基础 CRUD。
---

# PetLumina 03 — 后端目录重构与 Web 管理后台搭建

> 管理后台是运营的工具，UI 可以简单，但功能必须完整。

## 一、后端目录重构

### 1.1 为什么要重构？

v2.0 的 Controller 全部混在一起：

```
# 重构前 — 管理端和用户端接口混在同一个 Controller
controller/
├── UserController.java     # 里面既有 /api/user/login 又有 /api/admin/user/list
├── PetController.java
└── PostController.java
```

问题：

1. **权限注解混乱** — 有的方法需要 `@AuthCheck(mustRole = "admin")`，有的不需要
2. **路径前缀不统一** — 管理端 `/api/admin/` 和用户端 `/api/user/` 混在同一个类里
3. **代码可读性差** — 一个 Controller 200+ 行，找方法要翻半天

### 1.2 重构后的结构

```
controller/
├── admin/                  # 管理端 — 全部需要管理员权限
│   ├── AdminUserController.java
│   ├── AdminPetController.java
│   ├── AdminPostController.java
│   ├── AdminCommentController.java
│   ├── AdminHealthController.java
│   ├── AdminNotificationController.java
│   ├── AdminTopicController.java
│   ├── AdminLogController.java
│   └── DashboardController.java
└── user/                   # 用户端 — 只需要登录
    ├── AuthController.java     # 登录/注册
    ├── UserController.java     # 用户信息
    ├── PetController.java      # 宠物管理
    ├── PostController.java     # 帖子相关
    ├── CommentController.java  # 评论相关
    ├── NotificationController.java # 通知
    ├── HealthController.java   # 健康数据
    └── FileController.java     # 文件上传
```

### 1.3 路径规范

```java
// 管理端
@RestController
@RequestMapping("/api/v1/admin/user")
@AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
public class AdminUserController { ... }

// 用户端
@RestController
@RequestMapping("/api/v1/pet")
public class PetController { ... }
```

**管理端 Controller 上加 `@AuthCheck`，方法上就不用重复写了。**

## 二、Web 管理后台搭建

### 2.1 技术选型

```bash
npm create vite@latest pet-lumina-web -- --template vue-ts
cd pet-lumina-web
npm install element-plus@2 @element-plus/icons-vue vue-router@4 pinia axios tailwindcss@3
```

选择 Element Plus 的理由：表格（el-table）、表单（el-form）、分页（el-pagination）是管理后台的三大核心组件，Element Plus 在这三者上的成熟度最高。

### 2.2 布局设计

管理后台的经典三栏布局：侧边栏 + 顶栏 + 内容区。

```vue
<!-- layout/AdminLayout.vue -->
<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 侧边栏 -->
    <aside class="w-56 flex flex-col border-r border-gray-100"
           style="background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)">
      <div class="h-16 flex items-center px-5">
        <span class="text-xl font-bold text-primary">🐾 PetLumina</span>
      </div>
      <el-menu :default-active="route.path" router class="flex-1 border-0">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 右侧 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶栏 -->
      <header class="h-16 bg-white border-b flex items-center px-6 justify-between">
        <el-breadcrumb>
          <el-breadcrumb-item>{{ currentMenu?.label }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-dropdown>
          <el-avatar :src="userStore.avatar" size="small" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>
      <!-- 内容区 -->
      <main class="flex-1 overflow-auto p-6" style="background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)">
        <router-view />
      </main>
    </div>
  </div>
</template>
```

### 2.3 中文化

Element Plus 默认英文，必须手动配置中文：

```ts
// main.ts
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

app.use(ElementPlus, {
  locale: zhCn,  // 影响所有组件的文字：分页、日期选择器、空状态等
})
```

## 三、核心页面实现

### 3.1 用户管理页面

```vue
<template>
  <div>
    <!-- 搜索栏 -->
    <div class="mb-4 flex items-center gap-3">
      <el-input v-model="searchNickname" placeholder="搜索昵称" clearable
                @clear="fetchList" @keyup.enter="fetchList" class="w-60" />
      <el-input v-model="searchPhone" placeholder="搜索手机号" clearable
                @clear="fetchList" @keyup.enter="fetchList" class="w-60" />
      <el-button type="primary" @click="fetchList">
        <el-icon><Search /></el-icon> 搜索
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="userList" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" min-width="180" show-overflow-tooltip />
      <el-table-column label="头像" width="80">
        <template #default="{ row }">
          <el-avatar :src="row.avatar" size="small">{{ row.nickname?.[0] }}</el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" min-width="120" />
      <el-table-column prop="phone" label="手机号" min-width="140" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 1 ? 'danger' : 'info'" size="small">
            {{ row.role === 1 ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" min-width="180">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination class="mt-4 justify-end" v-model:current-page="page"
      :total="total" :page-size="pageSize"
      layout="total, prev, pager, next, jumper" @current-change="fetchList" />
  </div>
</template>
```

### 3.2 表格列宽优化

**问题：** 固定 `width` 的列在大屏上右侧留白严重。

**解决：** 将 `width` 改为 `min-width`，让列自适应填满：

```vue
<!-- ❌ 之前 — 固定宽度，右侧空白 -->
<el-table-column prop="nickname" label="昵称" width="120" />

<!-- ✅ 之后 — 最小宽度，自适应填满 -->
<el-table-column prop="nickname" label="昵称" min-width="120" />
```

## 四、后端接口实现

### 4.1 管理端用户查询

```java
// AdminUserController.java
@PostMapping("/list/page/vo")
@AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
public BaseResponse<Page<UserVO>> listUserVOByPage(@RequestBody UserQueryRequest request) {
    ThrowUtils.throwIf(request == null, ErrorCode.PARAMS_ERROR);

    long current = request.getCurrent();
    long size = request.getPageSize();

    // 构建查询条件
    QueryWrapper<User> queryWrapper = new QueryWrapper<>();
    if (StringUtils.isNotBlank(request.getNickname())) {
        queryWrapper.like("nickname", request.getNickname());
    }
    if (StringUtils.isNotBlank(request.getPhone())) {
        queryWrapper.like("phone", request.getPhone());
    }
    if (request.getRole() != null) {
        queryWrapper.eq("role", request.getRole());
    }
    queryWrapper.orderByDesc("create_time");

    Page<User> page = userService.page(new Page<>(current, size), queryWrapper);

    // Entity → VO
    Page<UserVO> voPage = new Page<>(current, size, page.getTotal());
    voPage.setRecords(page.getRecords().stream()
        .map(UserVO::objToVo)
        .collect(Collectors.toList()));

    return ResultUtils.success(voPage);
}
```

### 4.2 DTO 设计

```java
// model/dto/user/UserQueryRequest.java
@Data
public class UserQueryRequest extends PageRequest {
    private String nickname;    // 按昵称模糊搜索
    private String phone;       // 按手机号模糊搜索
    private Integer role;       // 按角色筛选
}

// common/PageRequest.java
@Data
public class PageRequest {
    protected long current = 1;
    protected long pageSize = 10;
}
```

**DTO 继承 PageRequest** — 所有分页查询的 DTO 都有 `current` 和 `pageSize`，不用每个 DTO 重复定义。

## 五、总结

v2.1 完成了后端目录规范化和管理后台基础搭建。

**核心经验：**

1. **Controller 按端分离** — admin 和 user 的 Controller 分开，权限注解加在类上，方法上不用重复
2. **Element Plus 中文化** — 别忘了 `zhCn` locale，否则分页显示 "Total 100" 而不是 "共 100 条"
3. **min-width 替代 width** — 表格列用 `min-width` 自适应，避免右侧空白
4. **DTO 继承 PageRequest** — 分页参数统一，减少重复代码

---

> 上一篇：[PetLumina 02 — 后端开发与前后端联调](/posts/PetLumina-02-后端开发与前后端联调)
> 下一篇：[PetLumina 04 — 管理后台 UI 全面升级](/posts/PetLumina-04-管理后台UI全面升级)
