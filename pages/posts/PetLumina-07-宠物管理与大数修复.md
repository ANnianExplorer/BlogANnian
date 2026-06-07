---
title: PetLumina 07 — 宠物管理升级与 JavaScript 大数精度修复
date: 2026-05-27
tags:
  - PetLumina
  - JavaScript
  - 雪花ID
  - JSON解析
  - AI开发
categories:
  - 项目实战
cover: /BlogANnian/images/cover/petlumina/app/pet-detail.png
description: 宠物管理功能全面升级的过程中，发现并彻底解决 JavaScript 大数精度丢失问题。深入分析 Number.MAX_SAFE_INTEGER 限制、后端 Long→String 序列化、前端正则 JSON 解析方案。
---

# PetLumina 07 — 宠物管理升级与大数精度修复

> 一个「数据对不上」的 bug，引出了 JavaScript 大数精度丢失的经典问题。

## 一、问题发现

### 1.1 现象

宠物详情页的数据一直显示不正确 — 通过 ID 查询宠物，返回的却是另一个宠物的数据。

### 1.2 排查过程

```ts
// Store 中获取宠物
const pet = pets.value.find(p => p.id === id)
console.log(p.id)       // "1266893287734558720"  ← 字符串
console.log(id)          // 1266893287734558700   ← 数字，最后两位变了！
console.log(p.id === id) // false — 类型和值都不等
```

**根因：** JavaScript 的 `Number.MAX_SAFE_INTEGER` 是 `2^53 - 1 = 9007199254740991`（16 位），而雪花 ID 是 19 位数字，超出了安全范围。

### 1.3 精度丢失发生在哪个环节？

```js
// 后端返回的 JSON
{"id": 1266893287734558720}

// JavaScript JSON.parse 后
JSON.parse('{"id": 1266893287734558720}')
// { id: 1266893287734558700 }  ← 最后两位被截断了！

// Number.MAX_SAFE_INTEGER
9007199254740991  // 16 位
1266893287734558720  // 19 位 — 超出范围
```

**精度丢失发生在 `JSON.parse()` 阶段** — 不是后端的问题，不是网络传输的问题，是 JavaScript 解析 JSON 时就把数字截断了。

## 二、后端解决方案（必要但不充分）

### 2.1 Long → String 序列化

```java
// config/JsonConfig.java
@Configuration
public class JsonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            // Long 转 String 防止 JS 大数字精度丢失
            builder.serializerByType(Long.class, ToStringSerializer.instance);
            builder.serializerByType(Long.TYPE, ToStringSerializer.instance);
            // Date 全局格式化
            builder.simpleDateFormat("yyyy-MM-dd HH:mm:ss");
        };
    }
}
```

配置后，后端返回的 JSON 变成：

```json
{"id": "1266893287734558720"}  ← 有引号了，是字符串
```

### 2.2 为什么后端配置不够？

如果 `JSON.parse()` 已经执行过了（Axios 默认会自动解析），数字已经被截断为 `1266893287734558700`，此时即使后端返回的是字符串，前端拿到的也是截断后的数字。

**需要在 `JSON.parse()` 之前介入。**

## 三、前端解决方案

### 3.1 正则预处理

在 `JSON.parse()` 之前，用正则将 16+ 位数字加上引号：

```ts
// api/request.ts

/**
 * 处理 JSON 中超大数字的精度丢失问题
 * 将超过安全整数范围的数字转为字符串
 */
function parseJsonWithBigInt(jsonStr: string): any {
  const safeStr = jsonStr.replace(
    /"(?:[^"\\]|\\.)*"|(-?\d{16,}(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, num) => {
      if (num) {
        return `"${num}"`  // 数字加引号变成字符串
      }
      return match  // 字符串部分保持不变
    }
  )
  return JSON.parse(safeStr)
}
```

**正则解析：**

```
"(?:[^"\\]|\\.)*"           ← 匹配已有的字符串（跳过，不做处理）
|                            ← 或
(-?\d{16,}(?:\.\d+)?...)   ← 匹配 16+ 位的数字（转为字符串）
```

### 3.2 响应拦截器集成

```ts
// api/request.ts
request.interceptors.response.use(
  (response) => {
    let res: any

    if (typeof response.data === 'string') {
      // 直接是字符串，用自定义解析器
      try {
        res = parseJsonWithBigInt(response.data)
      } catch {
        res = response.data
      }
    } else {
      // Axios 已经 JSON.parse 过了，大数字可能已丢失精度
      // 用原始文本重新解析
      const rawText = (response as any).request?.responseText
      if (rawText) {
        try {
          res = parseJsonWithBigInt(rawText)
        } catch {
          res = response.data
        }
      } else {
        res = response.data
      }
    }

    // 业务逻辑处理
    if (res.code !== 0) {
      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res.data
  }
)
```

**关键：** 使用 `response.request.responseText` 获取原始 JSON 文本，在 `JSON.parse` 之前做正则替换。

### 3.3 Store 中的 ID 比较

```ts
// stores/user.ts
const getPetById = (id: string) => {
  // ❌ 错误 — 类型不匹配
  // return pets.value.find(p => p.id === id)

  // ✅ 正确 — 统一转为字符串比较
  return pets.value.find(p => String(p.id) === String(id))
}
```

## 四、JsonConfig 的 Date 格式化

同一个 `JsonConfig` 还配置了全局日期格式化：

```java
builder.simpleDateFormat("yyyy-MM-dd HH:mm:ss");
```

这样后端所有 `Date` 类型的字段都会序列化为 `"2026-06-07 10:30:00"` 格式，前端不需要再做格式转换。

## 五、完整的数据流

```
后端 Entity                    后端 JSON                    前端 JSON.parse               前端使用
─────────────                 ──────────                   ──────────────               ──────────
Long id                       "id": "1266...720"           parseJsonWithBigInt()        String(id)
= 1266893287734558720         (Long→String 序列化)          正则替换后 parse              = "1266...720"

Date createTime               "createTime": "2026-06..."   JSON.parse                   formatDate()
= Sat Jun 07 2026             (simpleDateFormat)           自动解析为字符串              = "2026-06-07..."
```

## 六、其他 ID 场景的处理

大数精度问题不只出现在宠物 ID，所有使用雪花 ID 的地方都要注意：

```ts
// 帖子详情
const post = await postApi.getDetail(route.params.id as string)

// 通知详情
const notification = await notificationApi.getDetail(notificationId)

// 路由参数 — :id 也是 string
router.push(`/pet/${pet.id}`)
```

## 七、总结

v2.5 完成了宠物管理升级和大数精度修复。

**核心经验：**

1. **JavaScript `Number.MAX_SAFE_INTEGER` 是 16 位** — 雪花 ID 是 19 位，必然精度丢失
2. **精度丢失发生在 `JSON.parse()` 阶段** — 后端配置 `Long→String` 是必要的，但不够
3. **正则预处理方案** — 在 `JSON.parse` 之前将大数加引号转字符串
4. **ID 比较统一用 `String()`** — `String(a) === String(b)` 万无一失
5. **从一开始就用 string 定义 ID 类型** — 如果在 Mock 阶段就用 `id: string`，后面会省很多事

---

