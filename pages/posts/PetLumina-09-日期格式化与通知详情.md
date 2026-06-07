---
title: PetLumina 09 — 全局日期格式化与通知详情完善（v2.7 收官）
date: 2026-06-04
tags:
  - PetLumina
  - 日期格式化
  - 通知详情
  - Vue 3
  - AI开发
categories:
  - 项目实战
cover: /BlogANnian/images/cover/petlumina/app/profile.png
description: 统一前后端日期格式，完善通知详情功能，App 端未读通知数管理，路由初始化优化。v2.7 版本收官。
---

# PetLumina 09 — 日期格式化与通知详情完善

> 最后一公里的打磨 — 细节决定用户体验。

## 一、日期格式不统一的问题

### 1.1 问题现象

项目中多处日期显示不一致：

| 来源 | 显示效果 | 问题 |
|---|---|---|
| 后端 Date 字段 | `2026-06-03 10:30:00` | ✅ 已通过 JsonConfig 格式化 |
| 前端 new Date() | `Tue Jun 03 2026 00:00:00 GMT+0800` | ❌ 原始字符串 |
| 前端日期选择器 | `2026-6-3` | ❌ 缺少前导零 |
| 手动拼接 | `2026/06/03` | ❌ 分隔符不统一 |

### 1.2 后端已做处理

```java
// config/JsonConfig.java
builder.simpleDateFormat("yyyy-MM-dd HH:mm:ss");
```

后端所有 `Date` 字段都格式化为 `yyyy-MM-dd HH:mm:ss`。但前端自己生成的日期（如 `new Date()`、日期选择器的值）不受后端控制。

### 1.3 前端统一方案

在两个前端项目中分别添加 `utils/format.ts`：

```ts
/**
 * 格式化日期为 yyyy-MM-dd HH:mm:ss
 * 统一处理 null/undefined/无效日期
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 格式化为短日期 yyyy-MM-dd
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return String(date)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
```

**关键设计：**

- `padStart(2, '0')` — 保证个位数前面有前导零（`6` → `06`）
- `isNaN(d.getTime())` — 比 `isNaN(d)` 更可靠，`new Date('abc')` 会返回 Invalid Date
- 返回 `'-'` 而不是空字符串 — 空日期显示 `-` 比空白更明确

## 二、全局替换

### 2.1 涉及的文件

所有显示日期的地方都需要替换：

```vue
<!-- ❌ 之前 — 直接显示原始值 -->
<span>{{ item.createTime }}</span>

<!-- ✅ 之后 — 通过 formatDate 格式化 -->
<span>{{ formatDate(item.createTime) }}</span>
```

涉及文件清单：

- `Notifications.vue` — 通知列表和详情
- `PetDetail.vue` — 宠物详情的生日、创建时间
- `HealthRecords.vue` — 健康记录的时间戳
- `Dashboard.vue` — 仪表盘的统计时间
- `Home.vue` — 首页提醒日期
- 管理后台所有 `el-table-column` 中的日期列

### 2.2 管理后台表格中的日期

```vue
<el-table-column label="注册时间" min-width="180">
  <template #default="{ row }">
    {{ formatDate(row.createTime) }}
  </template>
</el-table-column>
```

## 三、首页提醒日期修复

首页的「今日提醒」和「明日提醒」使用 `new Date()` 生成日期，格式不统一：

```vue
<template>
  <div class="app-glass-card p-4 mb-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-sm text-gray-500">今日提醒</div>
        <div class="font-medium">{{ formatDateShort(new Date()) }}</div>
      </div>
      <van-icon name="clock-o" class="text-orange-500 text-xl" />
    </div>
  </div>
</template>
```

## 四、通知详情功能完善

### 4.1 App 端通知详情弹窗

使用 Teleport + slide-up 过渡动画，实现从底部滑出的详情面板：

```vue
<Teleport to="body">
  <Transition name="slide-up">
    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-end justify-center">
      <!-- 遮罩层 -->
      <div class="absolute inset-0 bg-black/30" @click="closeDetail" />

      <!-- 内容面板 -->
      <div class="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[80vh] overflow-auto">
        <div class="p-5 pb-8">
          <!-- 拖拽手柄 -->
          <div class="flex justify-center mb-4">
            <div class="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          <!-- 加载中 -->
          <div v-if="detailLoading" class="flex justify-center py-10">
            <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>

          <!-- 详情内容 -->
          <template v-else-if="selectedNotification">
            <div class="flex items-center gap-3 mb-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold"
                    :class="getTypeColor(selectedNotification.type)">
                {{ getTypeLabel(selectedNotification.type) }}
              </span>
              <span class="text-xs text-gray-500">
                {{ formatDate(selectedNotification.createTime) }}
              </span>
            </div>

            <h2 class="text-xl font-bold mb-4">{{ selectedNotification.title }}</h2>

            <div class="bg-gray-50 rounded-2xl p-5 mb-6">
              <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {{ selectedNotification.content }}
              </p>
            </div>

            <button @click="closeDetail"
                    class="w-full py-3 bg-primary text-white rounded-2xl font-bold">
              我知道了
            </button>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

### 4.2 点击通知 → 标记已读 → 打开详情

```ts
const openDetail = async (notification: Notification) => {
  // 1. 标记已读
  if (notification.isRead === 0) {
    await notificationApi.markAsRead(notification.id)
    notification.isRead = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    userStore.unreadNotifications = Math.max(0, userStore.unreadNotifications - 1)
  }

  // 2. 获取详情
  detailLoading.value = true
  showDetail.value = true
  try {
    const detail = await notificationApi.getDetail(notification.id)
    selectedNotification.value = detail || notification
  } catch {
    selectedNotification.value = notification  // 降级使用列表数据
  } finally {
    detailLoading.value = false
  }
}
```

**设计细节：** 获取详情失败时降级使用列表数据，不会白屏。

## 五、未读通知数管理

### 5.1 Store 中维护

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const unreadNotifications = ref(0)

  const fetchUnreadNotifications = async () => {
    try {
      const count = await notificationApi.unreadCount()
      unreadNotifications.value = count || 0
    } catch (e) {
      console.error('获取未读通知数失败', e)
    }
  }

  const init = async () => {
    // ... 其他初始化
    await fetchUnreadNotifications()
  }

  return { unreadNotifications, fetchUnreadNotifications, init }
})
```

### 5.2 路由守卫中初始化

```ts
// router/index.ts
let storeInitialized = false

router.beforeEach(async (to, from, next) => {
  if (!storeInitialized) {
    const userStore = useUserStore()
    await userStore.init()
    storeInitialized = true
  }
  next()
})
```

**`storeInitialized` 标记** — 只在第一次路由跳转时初始化一次，避免每次路由变化都重复请求。

## 六、发布 v2.7

```bash
git add .
git commit -m "fix: 前端日期格式化 + 首页提醒日期修复 + 通知详情"
git tag v2.7
git push origin main --tags
```

## 七、总结 — 从 v1.0 到 v2.7

| 版本 | 核心内容 | 关键技术点 |
|---|---|---|
| v1.0 | App 端 Mock 开发 | Vite + Vue 3 + Vant + Tailwind CSS |
| v2.0 | 后端开发与前后端联调 | Spring Boot + MyBatis-Plus + Sa-Token |
| v2.1 | 后端重构 + Web 管理后台 | Element Plus + 中文化 |
| v2.2 | 管理后台 UI 全面升级 | 玻璃态 + 果冻动画 + 胶囊布局 |
| v2.3 | 卡片常驻动态效果 | 呼吸/浮动/光泽/脉动 |
| v2.4 | 图片上传全链路 | COS 路径分类 + Magic Byte 验证 |
| v2.5 | 宠物管理升级 + 大数修复 | 正则 JSON 解析 + 字符串 ID |
| v2.6 | 通知系统 + 搜索修复 | 广播机制 + 已读副本 + 参数对齐 |
| v2.7 | 日期格式化 + 通知详情 | formatDate + Teleport 弹窗 |

### 整个开发过程的核心教训

1. **Mock 阶段的数据结构就是 API 契约** — 定好类型，后端按此实现
2. **雪花 ID 从一开始就用 string** — 避免后面大数精度修复的痛苦
3. **`BeanUtils.copyProperties` 只复制共有字段** — VO 缺字段会数据静默丢失
4. **前后端参数名必须对齐** — 一个不匹配，功能就不生效
5. **广播通知用 `user_id=0`** — 一条记录搞定，不需要 N 条副本
6. **Magic Byte 比扩展名可靠** — 文件头的二进制标识无法伪造
7. **`formatDate()` 是基础设施** — 从一开始就统一日期格式

---

