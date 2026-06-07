---
title: PetLumina 02 — Spring Boot 后端开发与前后端联调
date: 2026-06-07
tags:
  - PetLumina
  - Spring Boot
  - MyBatis-Plus
  - Sa-Token
  - AI开发
categories:
  - 项目实战
cover: /BlogANnian/images/cover/petlumina/app/home.png
description: 使用 Spring Boot 2.7 + MyBatis-Plus 3.5 + Sa-Token 1.39 搭建后端服务，完成数据库设计、统一认证、接口规范，并与前端联调。
---

# PetLumina 02 — Spring Boot 后端开发与前后端联调

> Mock 阶段定义的数据结构，就是后端的 API 契约。按契约开发，联调零障碍。

## 一、技术选型与架构设计

### 1.1 技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|---|---|---|---|
| Spring Boot | 2.7.x | 基础框架 | 生态成熟，文档丰富 |
| MyBatis-Plus | 3.5.x | ORM | 比原生 MyBatis 简洁，内置分页/逻辑删除 |
| Sa-Token | 1.39.x | 权限认证 | 比 Spring Security 轻量，注解式鉴权 |
| MySQL | 8.0 | 数据库 | 项目规模不需要分布式数据库 |
| Redis | 7.x | 缓存 | Sa-Token 默认使用 Redis 做 Session 存储 |

### 1.2 包结构设计

```
backend/src/main/java/com/petlumina/backend/
├── annotation/         # 自定义注解
│   ├── AuthCheck.java  # 权限校验注解
│   └── RateLimiter.java# 限流注解
├── aop/                # 切面
│   ├── AuthCheckAspect.java
│   └── RedisRateLimiterAspect.java
├── common/             # 公共类
│   ├── BaseResponse.java   # 统一响应
│   ├── ResultUtils.java    # 响应工具
│   ├── PageRequest.java    # 分页请求基类
│   └── DeleteRequest.java  # 删除请求
├── config/             # 配置类
│   ├── JsonConfig.java         # JSON 序列化
│   ├── CorsFilterConfig.java   # 跨域配置
│   ├── MybatisPlusConfig.java  # MP 配置
│   ├── SaTokenConfigure.java   # Sa-Token 配置
│   └── AsyncConfig.java        # 异步配置
├── constant/           # 常量
│   ├── CosConstant.java    # COS 路径常量
│   ├── RedisConstant.java  # Redis Key 常量
│   └── UserConstant.java   # 用户角色常量
├── controller/
│   ├── admin/          # 管理端接口
│   └── user/           # 用户端接口
├── model/
│   ├── entity/         # 数据库实体
│   ├── vo/             # 视图对象（返回前端）
│   └── dto/            # 数据传输对象（接收参数）
├── mapper/             # MyBatis Mapper
├── service/            # 业务逻辑
│   └── impl/
├── manager/            # 第三方服务管理
│   └── cos/            # COS 文件管理
├── exception/          # 异常处理
└── utils/              # 工具类
```

**为什么分 `admin/` 和 `user/` 两套 Controller？**

管理端和用户端的接口路径、权限校验、数据范围完全不同。管理端需要管理员权限，用户端只需要登录。分开后，权限注解、路径前缀、业务逻辑都清晰。

## 二、数据库设计

### 2.1 核心表结构

```sql
-- 用户表
CREATE TABLE `user` (
  `id` BIGINT NOT NULL COMMENT '雪花ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(128) NOT NULL COMMENT '密码(BCrypt)',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `role` TINYINT DEFAULT 0 COMMENT '0普通用户 1管理员',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` TINYINT DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 宠物表
CREATE TABLE `pet` (
  `id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL COMMENT '宠物主人ID',
  `name` VARCHAR(50) NOT NULL COMMENT '宠物名字',
  `type` VARCHAR(20) DEFAULT NULL COMMENT '类型(cat/dog/other)',
  `breed` VARCHAR(50) DEFAULT NULL COMMENT '品种',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `birthday` DATE DEFAULT NULL COMMENT '生日',
  `weight` DECIMAL(5,2) DEFAULT NULL COMMENT '体重(kg)',
  `gender` TINYINT DEFAULT 0 COMMENT '0未知 1公 2母',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` TINYINT DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.2 设计要点

**为什么用 BIGINT 而不是 INT 做主键？**

雪花算法生成的 ID 是 19 位数字，INT 最大只有 21 亿（10 位），BIGINT 最大 9.2×10^18（19 位），刚好够用。

**为什么用 `is_delete` 逻辑删除？**

用户数据不能物理删除 — 宠物记录、健康数据、帖子等都有关联关系。物理删除会导致外键断裂、数据不一致。逻辑删除只是标记状态，数据还在。

## 三、统一响应封装

```java
// common/BaseResponse.java
@Data
public class BaseResponse<T> implements Serializable {
    private int code;       // 状态码
    private String message; // 提示信息
    private T data;         // 数据

    public BaseResponse(int code, T data, String message) {
        this.code = code;
        this.data = data;
        this.message = message;
    }

    public BaseResponse(int code, T data) {
        this(code, data, "");
    }

    public BaseResponse(ErrorCode errorCode) {
        this(errorCode.getCode(), null, errorCode.getMessage());
    }
}

// common/ResultUtils.java
public class ResultUtils {
    public static <T> BaseResponse<T> success(T data) {
        return new BaseResponse<>(0, data, "ok");
    }

    public static BaseResponse<?> error(ErrorCode errorCode) {
        return new BaseResponse<>(errorCode);
    }

    public static BaseResponse<?> error(int code, String message) {
        return new BaseResponse<>(code, null, message);
    }
}
```

**code=0 表示成功** — 和前端约定好，前端只判断 `code === 0`，其他一律为失败。

## 四、Sa-Token 认证配置

### 4.1 依赖配置

```yaml
# application.yml
sa-token:
  token-name: satoken
  timeout: 86400          # Token 有效期 24 小时
  is-concurrent: true     # 允许同一账号并发登录
  is-share: true          # 同端共享 Token
  token-style: uuid       # Token 格式
```

### 4.2 拦截器配置

```java
// config/SaTokenConfigure.java
@Configuration
public class SaTokenConfigure implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SaInterceptor(handle -> {
            // 管理端接口 — 必须管理员角色
            SaRouter.match("/api/v1/admin/**")
                .check(r -> StpUtil.checkRole("admin"));

            // 用户端接口 — 必须登录（排除登录/注册）
            SaRouter.match("/api/v1/**")
                .notMatch("/api/v1/user/login", "/api/v1/user/register")
                .check(r -> StpUtil.checkLogin());
        })).addPathPatterns("/api/**");
    }
}
```

**Sa-Token 的路由匹配比 Spring Security 简洁很多** — `SaRouter.match().check()` 一行搞定一个规则。

## 五、MyBatis-Plus 配置

### 5.1 自动填充

```java
// config/MyMetaObjectHandler.java
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createTime", Date.class, new Date());
        this.strictInsertFill(metaObject, "updateTime", Date.class, new Date());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", Date.class, new Date());
    }
}
```

### 5.2 实体类注解

```java
// model/entity/Pet.java
@Data
@TableName("pet")
public class Pet implements Serializable {

    @TableId(type = IdType.ASSIGN_ID)  // 雪花 ID
    private Long id;

    private Long userId;
    private String name;
    private String type;
    private String breed;
    private String avatar;
    private Date birthday;
    private Double weight;
    private Integer gender;

    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;

    @TableLogic              // 逻辑删除
    private Integer isDelete;
}
```

## 六、前端请求层改造

### 6.1 Axios 实例

```ts
// api/request.ts
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
})

// 请求拦截器 — 注入 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('satoken')
  if (token) {
    config.headers['satoken'] = token  // Sa-Token 的 Header 名
  }
  return config
})

// 响应拦截器 — 统一处理
request.interceptors.response.use(response => {
  const res = response.data
  if (res.code !== 0) {
    showToast(res.message || '请求失败')
    if (res.code === 40100) {      // 未登录
      localStorage.removeItem('satoken')
      window.location.hash = '#/login'
    }
    return Promise.reject(new Error(res.message))
  }
  return res.data  // 直接返回 data，不包装在 BaseResponse 中
})
```

### 6.2 接口模块化

```ts
// api/pet.ts
export const petApi = {
  getList: () => request.get('/pet/list'),
  getDetail: (id: string) => request.get('/pet/detail', { params: { id } }),
  add: (data: any) => request.post('/pet/add', data),
  update: (data: any) => request.post('/pet/update', data),
  delete: (id: string) => request.post('/pet/delete', { id }),
}
```

## 七、跨域配置

```java
// config/CorsFilterConfig.java
@Configuration
public class CorsFilterConfig {
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
```

**为什么用 `addAllowedOriginPattern("*")` 而不是 `addAllowedOrigin("*")`？**

`allowCredentials(true)` 和 `addAllowedOrigin("*")` 不能同时使用 — 这是 CORS 规范的限制。`addAllowedOriginPattern("*")` 是 Spring Boot 2.4+ 提供的替代方案。

## 八、踩坑记录

### 8.1 QueryWrapper 字段名

```java
// ❌ 错误 — 驼峰是 Java 属性名，不是数据库字段名
queryWrapper.eq("createTime", date);

// ✅ 正确 — 数据库字段是下划线
queryWrapper.eq("create_time", date);
```

MyBatis-Plus 的 `QueryWrapper` 使用的是数据库字段名，不是 Java 属性名。这个错误在后面的用户管理、宠物管理、帖子管理中反复出现。

### 8.2 Sa-Token 登录接口

```java
@PostMapping("/login")
public BaseResponse<UserVO> login(@RequestBody UserLoginRequest request) {
    // 查询用户
    User user = userService.lambdaQuery()
        .eq(User::getUsername, request.getUsername())
        .one();

    if (user == null || !BCrypt.checkpw(request.getPassword(), user.getPassword())) {
        return ResultUtils.error(ErrorCode.PARAMS_ERROR, "用户名或密码错误");
    }

    // Sa-Token 登录 — 会自动生成 Token 并写入 Redis
    StpUtil.login(user.getId());

    // 返回用户信息 + Token
    UserVO vo = UserVO.objToVo(user);
    vo.setToken(StpUtil.getTokenValue());
    return ResultUtils.success(vo);
}
```

## 九、总结

v2.0 完成了后端基础框架搭建和前后端联调。

**核心经验：**

1. **API 契约先行** — Mock 阶段定义的数据结构就是接口契约，后端按此实现
2. **统一响应格式** — `code=0` 成功，其他失败，前端只需一个判断
3. **QueryWrapper 用下划线** — 这是最常见的坑，记住就好
4. **Sa-Token 的 `SaRouter`** — 一行代码一个权限规则，比 Spring Security 简洁 10 倍

---

