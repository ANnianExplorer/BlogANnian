---
title: PetLumina 08 — 通知系统与搜索功能修复（广播机制 + 已读状态 + 参数对齐）
date: 2026-06-07
tags:
  - PetLumina
  - 通知系统
  - 广播机制
  - 搜索功能
  - AI开发
categories:
  - 项目实战
cover: /images/cover/petlumina/web/health-data.png
description: 实现完整的通知系统：Admin 发布广播通知 → 用户接收 → 已读状态管理。修复所有页面的搜索筛选功能，解决前后端参数名不匹配问题。
---

# PetLumina 08 — 通知系统与搜索功能修复

> 通知系统的核心难点不是 CRUD，而是广播机制和已读状态的设计。

## 一、通知系统架构设计

### 1.1 需求分析

- 管理员发布系统公告 → 所有用户可见
- 用户查看通知详情
- 未读/已读状态管理
- 发布/取消发布状态管理

### 1.2 广播方案对比

| 方案 | 实现方式 | 优点 | 缺点 |
|---|---|---|---|
| **方案 A：广播模板** | 一条 `user_id=0` 的记录代表广播 | 简单，一条记录 | 已读状态需要额外处理 |
| 方案 B：用户副本 | 发布时给每个用户创建一条记录 | 已读状态简单 | 用户多时数据爆炸 |
| 方案 C：消息队列 | 用 MQ 推送给每个用户 | 实时性好 | 架构复杂 |

**选择方案 A** — PetLumina 的用户规模不需要消息队列，广播模板 + 个人已读副本是最优解。

### 1.3 数据库设计

```sql
CREATE TABLE `notification` (
  `id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL COMMENT '0=系统广播，其他=指定用户',
  `type` VARCHAR(20) DEFAULT 'system' COMMENT '通知类型',
  `title` VARCHAR(100) NOT NULL,
  `content` TEXT,
  `is_read` TINYINT DEFAULT 0 COMMENT '0未读 1已读',
  `status` TINYINT DEFAULT 1 COMMENT '0草稿 1已发布',
  `related_id` BIGINT DEFAULT NULL COMMENT '广播已读记录指向原通知的ID',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` TINYINT DEFAULT 0,
  PRIMARY KEY (`id`)
);
```

**`related_id` 的作用：** 当用户阅读广播通知时，创建一条个人记录（`user_id=当前用户`），通过 `related_id` 指向原广播记录。查询未读时，排除已有个人记录的广播。

## 二、管理端通知 CRUD

### 2.1 发布通知（广播）

```java
// AdminNotificationController.java
@PostMapping("/add")
@AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
public BaseResponse<Boolean> addNotification(@RequestBody NotificationAddRequest request) {
    ThrowUtils.throwIf(request == null, ErrorCode.PARAMS_ERROR);
    ThrowUtils.throwIf(request.getTitle() == null || request.getTitle().isEmpty(),
            ErrorCode.PARAMS_ERROR, "标题不能为空");

    // user_id=0 表示广播，status=1 表示已发布
    notificationService.createNotification(
        0L,                        // userId=0 → 广播
        request.getType(),
        request.getTitle(),
        request.getContent(),
        null                       // relatedId=null → 这是原始通知
    );
    return ResultUtils.success(true);
}
```

### 2.2 切换发布状态

```java
@PostMapping("/toggle-status")
@AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
public BaseResponse<Boolean> toggleStatus(@RequestBody NotificationToggleRequest request) {
    ThrowUtils.throwIf(request == null || request.getId() == null, ErrorCode.PARAMS_ERROR);
    ThrowUtils.throwIf(request.getStatus() != 0 && request.getStatus() != 1,
            ErrorCode.PARAMS_ERROR, "状态值无效");

    // lambdaUpdate 直接更新 status 字段，不需要先查后改
    boolean result = notificationService.lambdaUpdate()
            .eq(Notification::getId, request.getId())
            .set(Notification::getStatus, request.getStatus())
            .update();

    return ResultUtils.success(result);
}
```

**为什么用 `lambdaUpdate()` 而不是 `updateById()`？**

`updateById()` 会更新所有非 null 字段，如果前端传了额外字段可能会误更新。`lambdaUpdate()` 只更新指定字段，更安全。

### 2.3 VO 缺失字段的坑

**问题：** 前端通知的 `status` 一直是 `undefined`。

**排查过程：**

```java
// NotificationVO.java — 之前没有 status 字段
@Data
public class NotificationVO {
    private Long id;
    private String title;
    private String content;
    private Integer type;
    // ← 缺少 status！
    private Date createTime;
}
```

**根因：** `BeanUtils.copyProperties(source, target)` 只复制两个类**都有**的字段。Entity 有 `status`，但 VO 没有，所以拷贝后 VO 的 `status` 是 null，JSON 序列化时被忽略。

**修复：** 在 VO 中添加 `status` 字段：

```java
@Data
public class NotificationVO {
    private Long id;
    private Long userId;
    private String type;
    private String title;
    private String content;
    private Integer isRead;
    private Integer status;      // ← 加上这个！
    private Long relatedId;
    private Date createTime;

    public static NotificationVO objToVo(Notification notification) {
        if (notification == null) return null;
        NotificationVO vo = new NotificationVO();
        BeanUtils.copyProperties(notification, vo);
        return vo;
    }
}
```

**教训：** `BeanUtils.copyProperties` 的隐式行为很容易导致数据静默丢失。每次新增 Entity 字段时，要同步检查 VO 是否需要添加。

## 三、用户端通知功能

### 3.1 通知查询

```java
// NotificationController.java
@PostMapping("/list/page")
public BaseResponse<Page<NotificationVO>> listNotificationVOByPage(
        @RequestBody NotificationQueryRequest request,
        HttpServletRequest httpRequest) {
    User loginUser = userService.getLoginUser(httpRequest);

    // 查询：用户自己的通知 + 广播通知
    QueryWrapper<Notification> queryWrapper = new QueryWrapper<>();
    queryWrapper.and(w -> w.eq("user_id", loginUser.getId()).or().eq("user_id", 0));
    queryWrapper.eq("status", 1);  // 只查已发布
    queryWrapper.orderByDesc("create_time");

    Page<Notification> page = notificationService.page(
        new Page<>(request.getCurrent(), request.getPageSize()), queryWrapper);

    // Entity → VO
    Page<NotificationVO> voPage = new Page<>(request.getCurrent(), request.getPageSize(), page.getTotal());
    voPage.setRecords(page.getRecords().stream()
        .map(NotificationVO::objToVo)
        .collect(Collectors.toList()));

    return ResultUtils.success(voPage);
}
```

**SQL 等价：**

```sql
SELECT * FROM notification
WHERE (user_id = #{currentUserId} OR user_id = 0)
  AND status = 1
  AND is_delete = 0
ORDER BY create_time DESC
LIMIT #{pageSize} OFFSET #{offset}
```

### 3.2 广播通知的已读机制

```java
@PostMapping("/read/{id}")
public BaseResponse<Boolean> markAsRead(@PathVariable long id,
                                        HttpServletRequest httpRequest) {
    User loginUser = userService.getLoginUser(httpRequest);
    Notification notification = notificationService.getById(id);

    // 广播通知 — 创建个人已读副本
    if (notification.getUserId() != null && notification.getUserId() == 0) {
        Notification personalCopy = new Notification();
        personalCopy.setUserId(loginUser.getId());    // 当前用户
        personalCopy.setType(notification.getType());
        personalCopy.setTitle(notification.getTitle());
        personalCopy.setContent(notification.getContent());
        personalCopy.setIsRead(1);                     // 标记已读
        personalCopy.setStatus(1);
        personalCopy.setRelatedId(notification.getId()); // 指向原通知
        notificationService.save(personalCopy);
        return ResultUtils.success(true);
    }

    // 个人通知 — 直接标记已读
    boolean result = notificationService.markAsRead(id, loginUser);
    return ResultUtils.success(result);
}
```

**为什么广播通知不能直接改 `is_read`？**

广播通知只有一条记录（`user_id=0`），如果直接改 `is_read=1`，所有用户都会变成已读。所以需要创建一条个人副本记录。

### 3.3 App 端通知详情弹窗

```vue
<template>
  <!-- 通知列表 -->
  <div v-for="item in notifications" :key="item.id"
       @click="openDetail(item)"
       class="glass-card p-4 rounded-2xl flex items-start gap-4"
       :class="{ 'opacity-60': item.isRead === 1 }">
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold truncate">{{ item.title }}</h3>
        <span v-if="item.isRead === 0" class="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
      </div>
      <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ item.content }}</p>
      <p class="text-[11px] text-gray-400 mt-2">{{ formatDate(item.createTime) }}</p>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="showDetail" class="fixed inset-0 z-50 flex items-end justify-center">
        <div class="absolute inset-0 bg-black/30" @click="closeDetail" />
        <div class="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[80vh] overflow-auto">
          <div class="p-5">
            <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />
            <h2 class="text-xl font-bold mb-4">{{ detail.title }}</h2>
            <div class="text-sm text-gray-500 mb-4">{{ formatDate(detail.createTime) }}</div>
            <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ detail.content }}</div>
            <button @click="closeDetail" class="w-full py-3 bg-primary text-white rounded-2xl mt-6">
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

## 四、搜索功能修复

### 4.1 问题描述

多个页面的搜索功能不生效 — 前端输入关键词后点搜索，返回的还是全量数据。

### 4.2 根因分析

前端发送的参数名和后端 DTO 的字段名不匹配：

```ts
// 前端 — 之前
await adminApi.getUsers({ searchText: '张三' })
// 发送: { "searchText": "张三" }

// 后端 DTO
public class UserQueryRequest extends PageRequest {
    private String nickname;  // ← 后端期望 nickname，不是 searchText
    private String phone;
}
```

`searchText` 在 DTO 中没有对应的字段，被 Spring 自动忽略，查询条件为空。

### 4.3 解决方案

**方案 A：后端适配前端（推荐）** — 在 DTO 中添加 `searchText` 字段，后端逻辑中同时搜索多个字段。

**方案 B：前端适配后端** — 前端按后端字段名发送参数。

最终选择方案 A，在后端统一处理：

```java
// 帖子查询 — 支持按作者名搜索
if (StringUtils.isNotBlank(request.getAuthorName())) {
    // 先根据昵称查用户
    List<User> users = userService.lambdaQuery()
        .like(User::getNickname, request.getAuthorName())
        .list();

    if (!users.isEmpty()) {
        List<Long> userIds = users.stream()
            .map(User::getId)
            .collect(Collectors.toList());
        queryWrapper.in("author_id", userIds);
    } else {
        return new Page<>();  // 没有匹配的作者，返回空
    }
}
```

### 4.4 评论管理搜索

```java
// 评论搜索 — 同时搜索内容和用户昵称
if (StringUtils.isNotBlank(request.getSearchText())) {
    queryWrapper.and(wrapper ->
        wrapper.like("content", request.getSearchText())
            .or().in("user_id", getUserIdsByNickname(request.getSearchText()))
    );
}
```

## 五、总结

v2.6 完成了通知系统和搜索修复。

**核心经验：**

1. **广播用 `user_id=0`** — 一条记录覆盖所有用户，不需要 N 条副本
2. **已读用个人副本 + `related_id`** — 不能改原记录，否则影响所有用户
3. **`BeanUtils.copyProperties` 只复制共有字段** — VO 缺字段 → 数据静默丢失
4. **`lambdaUpdate()` 比 `updateById()` 安全** — 只更新指定字段
5. **前后端参数名必须对齐** — 一个不匹配，搜索永远不生效

---

> 上一篇：[PetLumina 07 — 宠物管理与大数修复](/posts/PetLumina-07-宠物管理与大数修复)
> 下一篇：[PetLumina 09 — 日期格式化与通知详情完善](/posts/PetLumina-09-日期格式化与通知详情)
