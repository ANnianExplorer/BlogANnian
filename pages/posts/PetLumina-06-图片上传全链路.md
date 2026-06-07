---
title: PetLumina 06 — 图片上传全链路（COS 存储 + Magic Byte 验证 + 路径分类）
date: 2026-05-26
tags:
  - PetLumina
  - 腾讯云COS
  - 文件上传
  - 安全验证
  - AI开发
categories:
  - 项目实战
cover: /BlogANnian/images/cover/petlumina/web/add-pet.png
description: 实现完整的文件上传链路：前端上传 → 后端接收 → 魔数校验 → 临时文件 → COS 上传 → 返回 URL。深入分析 Magic Byte 验证原理和 COS 路径分类设计。
---

# PetLumina 06 — 图片上传全链路

> 文件上传看似简单，但安全性和可靠性有很多细节需要注意。

## 一、整体架构

```
前端选择文件
    │
    ▼
后端接收 MultipartFile
    │
    ▼
校验：后缀 + MIME + Magic Byte  ← 三重验证
    │
    ▼
保存到临时文件
    │
    ▼
上传到腾讯云 COS
    │
    ▼
返回可访问的 URL
    │
    ▼
删除临时文件
```

**为什么要三重验证？**

- **后缀名** — 最基础，但可以随便改 `.exe` → `.jpg`
- **MIME 类型** — 浏览器发送的 Content-Type，可以伪造
- **Magic Byte** — 文件头的二进制标识，无法伪造（除非真的把文件改成合法格式）

## 二、腾讯云 COS 封装

### 2.1 CosManager 实现

```java
// manager/cos/CosManager.java
@Slf4j
@Component
public class CosManager {

    @Value("${cos.secretId}")
    private String secretId;

    @Value("${cos.secretKey}")
    private String secretKey;

    @Value("${cos.bucket}")
    private String bucket;

    @Value("${cos.region}")
    private String region;

    @Value("${cos.host:}")     // 自定义域名，可选
    private String host;

    private COSClient cosClient;

    @PostConstruct
    public void init() {
        if (secretId == null || secretId.startsWith("your_")) {
            log.warn("COS 凭证未配置，文件上传功能不可用");
            return;
        }
        COSCredentials credentials = new BasicCOSCredentials(secretId, secretKey);
        ClientConfig clientConfig = new ClientConfig(new Region(region));
        clientConfig.setHttpProtocol(HttpProtocol.https);  // 强制 HTTPS
        cosClient = new COSClient(credentials, clientConfig);
    }

    /**
     * 上传文件（InputStream 方式）
     */
    public String upload(String key, InputStream inputStream) {
        checkClient();
        PutObjectRequest request = new PutObjectRequest(bucket, key, inputStream, null);
        cosClient.putObject(request);
        return buildUrl(key);
    }

    /**
     * 上传文件（File 方式）
     */
    public String uploadFile(String key, File file) {
        checkClient();
        PutObjectRequest request = new PutObjectRequest(bucket, key, file);
        cosClient.putObject(request);
        return buildUrl(key);
    }

    /**
     * 构建访问 URL
     * 优先使用自定义域名，否则使用默认 COS 域名
     */
    private String buildUrl(String key) {
        if (host != null && !host.isEmpty()) {
            return host + "/" + key;
        }
        return String.format("https://%s.cos.%s.myqcloud.com/%s",
                bucket, region, key);
    }
}
```

**`@PostConstruct` 初始化** — COSClient 是线程安全的，初始化一次即可，不用每次请求都创建。

**`buildUrl` 自定义域名** — 配置了自定义域名（如 `cdn.petlumina.com`）时优先使用，否则用默认的 COS 域名。

## 三、路径分类设计

### 3.1 常量定义

```java
// constant/CosConstant.java
public interface CosConstant {
    String AVATAR_USER = "avatar/user";     // 用户头像
    String AVATAR_PET  = "avatar/pet";      // 宠物头像
    String POST_IMAGE  = "post/image";      // 帖子图片
    String PET_IMAGE   = "pet/image";       // 宠物照片
    String LOG_IMAGE   = "log/image";       // 生活记录图片
    String COMMON      = "common";          // 通用文件
}
```

### 3.2 为什么按路径分类？

```
bucket/
├── avatar/
│   ├── user/          ← 用户头像
│   │   ├── a1b2c3d4.jpg
│   │   └── e5f6g7h8.png
│   └── pet/           ← 宠物头像
│       ├── i9j0k1l2.jpg
│       └── ...
├── post/
│   └── image/         ← 帖子图片
├── pet/
│   └── image/         ← 宠物相册
├── log/
│   └── image/         ← 生活记录
└── common/            ← 通用文件
```

**分类的好处：**

1. **管理方便** — 在 COS 控制台可以按目录批量操作
2. **CDN 缓存策略** — 不同目录可以设置不同的缓存规则（头像缓存 30 天，帖子图片缓存 7 天）
3. **权限控制** — 未来可以对不同目录设置不同的访问权限

## 四、Magic Byte 文件验证

### 4.1 原理

每种文件格式都在文件头部有固定的「魔数」标识：

```
JPEG 文件头:  FF D8 FF E0 (或 FF D8 FF E1)
              └─┘ └─┘ └─┘
              固定标识，无法伪造

PNG 文件头:   89 50 4E 47 0D 0A 1A 0A
                          ──────────
                          ‰PNG + 换行符 + EOF

GIF 文件头:   47 49 46 38
                          ──
                          GIF8

WebP 文件头:  52 49 46 46 xx xx xx xx 57 45 42 50
                          ──────────
                          RIFF + 文件大小 + WEBP
```

### 4.2 实现代码

```java
// FileController.java
private void validateImageMagicBytes(MultipartFile file) {
    try {
        byte[] header = new byte[8];
        int readBytes = file.getInputStream().read(header);
        ThrowUtils.throwIf(readBytes < 3, ErrorCode.PARAMS_ERROR, "文件内容过短");

        String hex = bytesToHex(header).toUpperCase(Locale.ROOT);

        boolean isJpeg = hex.startsWith("FFD8FF");
        boolean isPng  = hex.startsWith("89504E47");
        boolean isWebp = hex.startsWith("52494646");  // RIFF
        boolean isGif  = hex.startsWith("47494638");  // GIF8

        ThrowUtils.throwIf(!(isJpeg || isPng || isWebp || isGif),
                ErrorCode.PARAMS_ERROR, "文件内容不是有效的图片格式");
    } catch (BusinessException e) {
        throw e;
    } catch (IOException e) {
        throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件校验失败");
    }
}

private String bytesToHex(byte[] bytes) {
    StringBuilder sb = new StringBuilder();
    for (byte b : bytes) {
        sb.append(String.format("%02X", b));
    }
    return sb.toString();
}
```

### 4.3 完整的三重验证流程

```java
@PostMapping("/upload/image")
public BaseResponse<String> uploadImage(@RequestPart("file") MultipartFile file,
                                        @RequestParam(required = false, defaultValue = CosConstant.COMMON) String category) {
    // 1. 基础校验
    ThrowUtils.throwIf(file == null || file.isEmpty(), ErrorCode.PARAMS_ERROR, "文件不能为空");
    ThrowUtils.throwIf(file.getSize() > MAX_FILE_SIZE, ErrorCode.PARAMS_ERROR, "图片大小不能超过5MB");

    // 2. 后缀名校验
    String suffix = getFileSuffixSafe(file.getOriginalFilename());
    ThrowUtils.throwIf(!ALLOWED_IMAGE_SUFFIX.contains(suffix),
            ErrorCode.PARAMS_ERROR, "仅支持 jpg/jpeg/png/gif/webp 格式");

    // 3. MIME 类型校验
    String contentType = file.getContentType();
    ThrowUtils.throwIf(!ALLOWED_IMAGE_TYPES.contains(contentType),
            ErrorCode.PARAMS_ERROR, "文件类型不合法");

    // 4. Magic Byte 校验 — 最关键的一步
    validateImageMagicBytes(file);

    // 5. 生成 COS key 并上传
    String key = category + "/" + UUID.randomUUID().toString().replace("-", "") + "." + suffix;

    File tempFile = null;
    try {
        tempFile = File.createTempFile("upload_", "." + suffix);
        file.transferTo(tempFile);
        String url = cosManager.uploadFile(key, tempFile);
        return ResultUtils.success(url);
    } catch (Exception e) {
        throw new BusinessException(ErrorCode.OPERATION_ERROR, "文件上传失败");
    } finally {
        deleteTempFile(tempFile);  // 临时文件必须删除
    }
}
```

## 五、前端上传组件

```vue
<template>
  <van-uploader v-model="fileList" :max-count="1" :after-read="afterRead" :before-read="beforeRead" />
</template>

<script setup lang="ts">
const beforeRead = (file: File) => {
  // 前端预校验 — 节省后端资源
  const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  if (!isImage) {
    showToast('只能上传图片文件')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过 5MB')
    return false
  }
  return true
}

const afterRead = async (file: any) => {
  const formData = new FormData()
  formData.append('file', file.file)
  formData.append('category', 'pet/image')  // 指定存储路径

  try {
    const url = await fileApi.uploadImage(formData)
    emit('upload', url)
  } catch (e) {
    showToast('上传失败')
  }
}
</script>
```

## 六、常见问题排查

### 6.1 上传成功但访问 403

**原因：** COS 存储桶权限设置为「私有读写」。

**解决：** 在 COS 控制台将权限改为「公有读私有写」。

### 6.2 上传成功但访问 404

**原因：** COS 域名配置错误，或者自定义域名未绑定。

**检查：**
1. `cos.host` 配置是否正确
2. 自定义域名是否已绑定到存储桶
3. CDN 是否已刷新

### 6.3 跨域上传失败

**原因：** 前端直接上传到 COS 时，需要配置 CORS。

**解决：** 在 COS 控制台 → 基础配置 → 跨域访问 CORS，添加前端域名。

## 七、总结

v2.4 完成了完整的文件上传链路。

**核心经验：**

1. **三重验证** — 后缀 + MIME + Magic Byte，缺一不可
2. **Magic Byte 是最可靠的验证** — 文件头的二进制标识无法伪造
3. **路径分类存储** — `category/UUID.ext` 结构清晰，方便管理
4. **临时文件必须删除** — `finally` 块中删除，否则服务器磁盘会爆
5. **COS 权限配置** — 「公有读私有写」是 Web 场景的标准配置

---

