---
title: 智谱大模型实现文生视频案例
date: 2025-10-18
tags:
  - AI
  - 视频
categories:
  - 技术
cover: https://valaxy-theme-sakura.s3.bitiful.net/wallpaper-2025%2Fwallhaven-858k3j.jpg
---

# 智谱大模型实现文生视频案例

>随着大模型的愈发成熟，从最开始的文本对话到文生图，再到现在的多模态，让人不得不感慨AI大模型的强大与便捷。本文将介绍在实际使用智谱AI完成视频生成的案例，记录自己的编程经历😋😋😋
>
>声明：代码只做参考，毕竟每个人的想法不同，提供思路能帮助到大家就行

## 1、🔦调研

我在之前调用API做过文本对话和Prompt调优生成内容这些实例，所以想再尝试一下文生视频的Demo，然后就去调研了一下比较热的几个平台

- *阿里*👋：https://bailian.console.aliyun.com/?spm=5176.29597918.J_C-NDPSQ8SFKWB4aef8i6I.1.1ff37b085DA5ui&tab=doc#/doc/?type=model&url=2873061（阿里属于是最熟悉的了）

  ![image-20251018124753051](/images/image-20251018124753051.png)

- *可灵👋：*https://klingai.com/cn/dev/model/video（完全付费，一次性付清，有钱可尝试，画面生成的确实挺好的）

- *扣子👋：*https://www.volcengine.com/docs/82379/1366799

  >费用

  https://www.volcengine.com/docs/82379/1544106?redirect=1#%E8%A7%86%E9%A2%91%E7%94%9F%E6%88%90%E6%A8%A1%E5%9E%8B

- *智谱👋：*https://docs.bigmodel.cn/cn/guide/models/video-generation/cogvideox-2（这个是付费的CogVideoX-3、CogVideoX-2、Vidu 2）

  - 下面是免费的
  - https://docs.bigmodel.cn/cn/guide/models/free/cogvideox-flash



🍔🍔🍔本着节省的原则吧（实则是没钱）

我最后选了智谱的   **cogvideox-flash**

## 2、👀查看API开发文档

查看 **cogvideox-flash**的接口文档

### 2.1 [生成视频(异步)](https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E7%94%9F%E6%88%90%E8%A7%86%E9%A2%91%E5%BC%82%E6%AD%A5) 

![image-20251018125650377](/images/image-20251018125650377.png)

我需要用的请求参数如下（初步实现）：

```java
model
prompt
size
request_id
aspect-ratio
```

响应参数

```json
{
  "model": "<string>",
  "id": "<string>",
  "request_id": "<string>",
  "task_status": "<string>"
}
```

### 2.2 [查询异步结果](https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E6%9F%A5%E8%AF%A2%E5%BC%82%E6%AD%A5%E7%BB%93%E6%9E%9C)

![image-20251018130200012](/images/image-20251018130200012.png)

我需要的返回响应是

```typescript
export interface VideoResultResponse {
  taskId: string  // 用于唯一标识视频生成任务
  taskStatus: string // 用于在前端展示认为状态
  videoUrl?: string // 用于视频的展示
  usage?: {
    [key: string]: number  // 所用token的记录
  }
}
```



## 3、🔧编写代码

>我最初的想法就是使用HTTP的形式去构造请求
>
>埋个伏笔（这样写比较麻烦🙅‍♂️ 🙅‍♂️ 🙅‍♂️ 🙅‍♂️ ）

### 3.1 服务端代码

#### 3.1.1 配置需要

[进入API使用指南](https://docs.bigmodel.cn/cn/api/introduction#java-sdk)

![image-20251018130925383](/images/image-20251018130925383.png)

引入依赖

```java
<dependency>
    <groupId>ai.z.openapi</groupId>
    <artifactId>zai-sdk</artifactId>
    <version>0.0.6</version>
</dependency>
```

根据文档构建自己的AI配置类**VideoAIConfig**

```java
@Data
@Configuration
@ConfigurationProperties(prefix = "zhipu")
public class VideoAIConfig {
	private String apiKey;
	@Bean
	public ZhipuAiClient zhipuAiClient() {
		return ZhipuAiClient.builder()
				.apiKey(apiKey)
				.build();
	}
}
```

这里的apiKey通过spring的自动装配，需要在applicant.yaml中写入apikey

![image-20251018131103807](/images/image-20251018131103807.png)

关于怎么获取apikey ----> [点击这里](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)

#### 3.1.2 请求与响应

准备工作就绪，下面是开码 🙇‍♀️ 🙇 🙇‍♂️

分别编写请求类、视频生成结果响应类和任务结果响应类

```java
@Data
@Getter
@Setter
public class VisionRequest {
    private String prompt;   // 文本提示
    private String image;// 图像Base64字符串（可带前缀）
}
```

```java
@Data
public class VideoResultResponse {
    private String taskId;
    private String taskStatus;
    private String videoUrl;
    private Map<String, Object> usage;
}
```

```java
@Data
public class VideoTaskResponse {
    private String taskId;
    private String taskStatus;
}
```

#### 3.1.3 服务类

```java
public interface VideoGenerationService {
	VideoTaskResponse generateVideo(GenerateVideoRequest request);

	VideoResultResponse getTaskResult(String taskId);
}
```

>很直观的可以看见代码量很多
>
>- 首先是生成方法
>
>  - 这里的构建HTTP请求用的是HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
>
>  - 构建POST请求没有用官网的那个HttpResponse，而是改用了RestTemplate
>
>    ```java
>    ResponseEntity<String> response = restTemplate.postForEntity(
>    					"https://open.bigmodel.cn/api/paas/v4/videos/generations",
>    					entity,
>    					String.class
>    			);
>    ```
>
>    - JsonNode jsonResponse = objectMapper.readTree(response.getBody());在 Java 中解析 JSON 响应
>
>- 再就是查询任务结果方法
>
>  - 查询任务进程状态，直到获取完整的结果（有id和视频URL）
>
>    - 这个是因为我在前端做了轮询来查看生成状态（也是为了展示进度条）
>
>    - ```text
>      用户调用 generateVideo() 发起视频生成请求
>      系统开始轮询任务状态（每3秒一次）
>      根据任务状态更新进度条
>      任务完成后停止轮询，并将结果添加到视频列表
>      提供 recentVideos getter 获取最近生成的视频
>      ```
>
>  - // 根据API文档，视频结果在video_result数组中，需要对此数组做额外的解析，只需要数组第一个结果就行
>
>- 对任务进度的显示参数做改变和对视频size的字符串做精确处理

```java
@Service
@RequiredArgsConstructor
public class VideoGenerationServiceImpl implements VideoGenerationService {

	private final VideoAIConfig videoAIConfig;
	private final RestTemplate restTemplate;

	/**
	 * 生成视频任务
	 */
	@Override
	public VideoTaskResponse generateVideo(GenerateVideoRequest request) {
		try {
			// 构建请求体
			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("model", "cogvideox-flash");
			requestBody.put("prompt", request.getPrompt());

			// 处理尺寸参数
			if (request.getSize() != null) {
				String[] dimensions = parseSize(request.getSize());
				requestBody.put("size", dimensions[0] + "x" + dimensions[1]);
				requestBody.put("aspect_ratio", calculateAspectRatio(dimensions[0], dimensions[1]));
			}

			// 设置请求头
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			headers.setBearerAuth(videoAIConfig.getApiKey());

			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

			// 发送POST请求
			ResponseEntity<String> response = restTemplate.postForEntity(
					"https://open.bigmodel.cn/api/paas/v4/videos/generations",
					entity,
					String.class
			);

			if (response.getStatusCode() == HttpStatus.OK) {
				ObjectMapper objectMapper = new ObjectMapper();
				JsonNode jsonResponse = objectMapper.readTree(response.getBody());
				VideoTaskResponse taskResponse = new VideoTaskResponse();
				taskResponse.setTaskId(jsonResponse.get("id").asText());
				taskResponse.setTaskStatus(jsonResponse.get("task_status").asText());
				return taskResponse;
			} else {
				throw new RuntimeException("Video generation failed: " + response.getStatusCode());
			}
		} catch (Exception e) {
			throw new RuntimeException("Error generating video: " + e.getMessage(), e);
		}
	}
	/**
	 * 查询任务结果
	 */
	@Override
	public VideoResultResponse getTaskResult(String taskId) {
		try {
			// 设置请求头
			HttpHeaders headers = new HttpHeaders();
			headers.setBearerAuth(videoAIConfig.getApiKey());

			HttpEntity<String> entity = new HttpEntity<>(headers);

			// 发送GET请求
			ResponseEntity<String> response = restTemplate.exchange(
					"https://open.bigmodel.cn/api/paas/v4/async-result/" + taskId,
					HttpMethod.GET,
					entity,
					String.class
			);

			if (response.getStatusCode() == HttpStatus.OK) {
				ObjectMapper objectMapper = new ObjectMapper();
				JsonNode jsonResponse = objectMapper.readTree(response.getBody());

				VideoResultResponse result = new VideoResultResponse();

				// 安全地获取字段值
				if (jsonResponse.has("id") && !jsonResponse.get("id").isNull()) {
					result.setTaskId(jsonResponse.get("id").asText());
				}else if (jsonResponse.has("task_id") && !jsonResponse.get("task_id").isNull()) {
					result.setTaskId(jsonResponse.get("task_id").asText());
				} else {
					// 使用传入的taskId作为fallback
					result.setTaskId(taskId);
				}

				// 在解析 taskStatus 时使用转换
				if (jsonResponse.has("task_status") && !jsonResponse.get("task_status").isNull()) {
					result.setTaskStatus(convertTaskStatus(jsonResponse.get("task_status").asText()));
				} else {
					result.setTaskStatus("UNKNOWN");
				}
				// 根据API文档，视频结果在video_result数组中
				if (jsonResponse.has("video_result") && jsonResponse.get("video_result").isArray()) {
					JsonNode videoResultArray = jsonResponse.get("video_result");
					if (videoResultArray.size() > 0) {
						JsonNode firstVideo = videoResultArray.get(0);
						if (firstVideo.has("url") && !firstVideo.get("url").isNull()) {
							result.setVideoUrl(firstVideo.get("url").asText());
						}
					}
				}

				return result;
			} else {
				throw new RuntimeException("Get task result failed: " + response.getStatusCode());
			}
		} catch (Exception e) {
			throw new RuntimeException("Error getting task result: " + e.getMessage(), e);
		}
	}
}
```

```java
// 添加状态转换方法
	private String convertTaskStatus(String status) {
		switch (status) {
			case "PROCESSING":
				return "RUNNING";
			case "SUCCESS":
				return "SUCCEEDED";
			case "FAIL":
				return "FAILED";
			default:
				return status;
		}
	}

	/**
     * 解析尺寸字符串 "1280*720" -> ["1280", "720"]
     */
    private String[] parseSize(String size) {
        return size.split("\\*");
    }

    /**
     * 计算宽高比
     */
    private String calculateAspectRatio(String width, String height) {
        int w = Integer.parseInt(width);
        int h = Integer.parseInt(height);
        if (w > h) {
            return "16:9";
        } else if (h > w) {
            return "9:16";
        } else {
            return "1:1";
        }
    }
```

这里声明一下前端的尺寸参数

```typescript
// 视频尺寸选项
const videoSizes = [
  { 
    label: '16:9', 
    value: '1280*720',
    icon: 'material-symbols:aspect-ratio' 
  },
  { 
    label: '9:16', 
    value: '720*1280',
    icon: 'material-symbols:aspect-ratio' 
  },
  { 
    label: '1:1', 
    value: '960*960',
    icon: 'material-symbols:aspect-ratio' 
  },
  { 
    label: '3:4', 
    value: '832*1088',
    icon: 'material-symbols:aspect-ratio' 
  },
  { 
    label: '4:3', 
    value: '1088*832',
    icon: 'material-symbols:aspect-ratio' 
  }
]
```

#### 3.1.4 接口

```java
@RestController
@RequestMapping("/video")
@RequiredArgsConstructor
public class VideoModelController {

	@Resource
    private VideoGenerationService videoGenerationService;
    
    /**
     * 生成视频
     */
    @PostMapping("/generate")
    public R<VideoTaskResponse> generateVideo(@RequestBody GenerateVideoRequest request) {
		if (ObjectUtils.isEmpty(request)) {
			return R.failed("视频生成请求参不存在");
		}
		VideoTaskResponse response = videoGenerationService.generateVideo2(request);
		return R.ok(response);
    }
    
    /**
     * 查询任务结果
     */
    @GetMapping("/task/{taskId}")
    public R<VideoResultResponse> getTaskResult(@PathVariable String taskId) {
		if (ObjectUtils.isEmpty(taskId)) {
			return R.failed("查询视频生成任务的Id不存在");
		}
		VideoResultResponse response = videoGenerationService.getTaskResult2(taskId);
		return R.ok(response);
    }
}
```



### 3.2 前端代码

这个部分本人对于前端确实不太熟练，是结合着大模型一起做的，大家可以自己去diy自己的前端，代码太多就不完全展示了。

>视频展示的逻辑示例代码 vue 内置的 video 组件来完成

```typescript
<!-- 视频展示 -->
        <div v-else-if="videoStore.generatedVideos.length > 0 && videoStore.generatedVideos[0].videoUrl" class="w-full h-full">
          <video
              :src="videoStore.generatedVideos[0].videoUrl"
              class="w-full h-full rounded-lg"
              controls
          />
        </div>
```

>就展示一下轮询的 TS 代码吧

```typescript
/**
     * 开始轮询任务结果
     */
    startPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }

      this.pollingInterval = window.setInterval(async () => {
        if (!this.currentTaskId) return

        try {
          const result = await videoService.getTaskResult(this.currentTaskId)
          this.currentTaskStatus = result.taskStatus as TaskStatus

          // 更新进度百分比
          this.updateProgressPercentage()

          if ((result.taskStatus === TaskStatus.SUCCEEDED || result.taskStatus === 'SUCCESS') && result.videoUrl) {
            // 任务成功，停止轮询
            this.stopPolling()
            // 将新生成的视频添加到列表开头
            this.generatedVideos.unshift(result)
            // 重置任务状态和进度
            this.currentTaskStatus = null
            this.progressPercentage = 100
          } else if ([TaskStatus.FAILED, TaskStatus.CANCELED, TaskStatus.UNKNOWN, 'FAIL'].includes(result.taskStatus as TaskStatus)) {
            // 任务失败，停止轮询
            this.stopPolling()
            this.error = TaskStatusText[result.taskStatus as TaskStatus] || '任务执行失败'
            // 重置任务状态
            this.currentTaskStatus = null
            this.progressPercentage = 0
          }
        } catch (error) {
          console.error('获取任务结果失败:', error)
          // 停止轮询并设置错误状态
          this.stopPolling()
          this.error = '获取任务状态失败'
          this.currentTaskStatus = TaskStatus.FAILED
        }
      }, 3000) // 缩短轮询间隔到3秒以提供更及时的反馈
    },
```

>这里的更新进度百分比就是我利用状态来定义进度条的依据---简单定义

```typescript
/**
     * 更新进度百分比
     */
    updateProgressPercentage() {
      switch (this.currentTaskStatus) {
        case TaskStatus.PENDING:
          this.progressPercentage = 10
          break
        case TaskStatus.RUNNING:
          // 在RUNNING状态下逐步增加进度，但不超过90%
          this.progressPercentage = Math.min(this.progressPercentage + 5, 90)
          break
        case TaskStatus.SUCCEEDED:
          this.progressPercentage = 100
          break
        case TaskStatus.FAILED:
        case TaskStatus.CANCELED:
        case TaskStatus.UNKNOWN:
          this.progressPercentage = 0
          break
        default:
          break
      }
    }
  },
```



## 4、😃展示效果

![image-20251018143652929](/images/image-20251018143652929.png)

![image-20251018143715266](/images/image-20251018143715266.png)

>当然最后的结果很抽象，毕竟是免费的模型💡🎉💡🎉💡🎉

![image-20251018144208516](/images/image-20251018144208516.png)



## 5、🚀改进

>前面提到，通过HTTP的后端请求代码太冗余了，所以我就再研究了一下开发文档，写了第二版的代码，使用[JAVA-SDK](https://docs.bigmodel.cn/cn/guide/develop/java/introduction)，可以先去链接的网址看看

### 5.1 开始改版

>由于相应的配置类和请求响应类都不需要做出改变，所以就只需要更改服务类即可。先分块讲一下，后面会补充完整代码（同时我还是继续沿用了convertTaskStatus和calculateAspectRatio这些处理的私有方法）

定义私有成员变量

```java
private ZhipuAiClient client;
//client：ZhipuAI客户端实例，用于调用智谱AI相关API服务两者都采用依赖注入方式初始化
```

抽象出获取智谱客户端的方法

```java
// 添加延迟初始化方法
	private ZhipuAiClient getZhipuAiClient() {
		if (client == null) {
			synchronized (this) {
				client = ZhipuAiClient.builder()
						.apiKey(videoConfig.getApiKey())
						.build();
			}
		}
		return client;
	}
```

>大家可能会疑惑为什么这里会有同步锁🔒，别急，保留悬念

#### 5.1.1 generateVideo2 生成视频2

> 这里对于视频请求的请求体构建以及创建视频请求和响应都是通过智谱AI的内置方法完成的，省去了很多HTTP的复杂配置
>
> - VideoCreateParams.builder()完成请求体
> - client.videos().videoGenerations(req);得到响应结果

```java
@Override
	public VideoTaskResponse generateVideo2(GenerateVideoRequest request) {
		try {
			// 3.创建视频生成请求体
			ZhipuAiClient client = getZhipuAiClient();
			// 先处理尺寸参数
			String[] dimensions = parseSize(request.getSize());

			// 创建视频生成请求
			VideoCreateParams req = VideoCreateParams.builder()
					.model("cogvideox-flash")
					.prompt(request.getPrompt())
					.size(dimensions[0] + "x" + dimensions[1])
					.aspectRatio(calculateAspectRatio(dimensions[0], dimensions[1]))
					.build();
			VideosResponse response = client.videos().videoGenerations(req);

			log.info("视频生成任务ID: {}", response.getData().getId());
			log.info("generateVideo2视频生成结果: {}", response.getData().getVideoResult());

			// 4.构造任务响应
			if (response.isSuccess()) {
				VideoTaskResponse taskResponse = new VideoTaskResponse();
				taskResponse.setTaskId(response.getData().getId());
				taskResponse.setTaskStatus(convertTaskStatus(response.getData().getTaskStatus()));
				return taskResponse;
			} else {
				throw new RuntimeException("视频生成失败: " + response.getCode());
			}
		} catch (Exception e) {
			throw new RuntimeException("生成视频错误: " + e.getMessage(), e);
		}
	}
```

#### 5.1.2  getTaskResult2 查询任务结果2

>就是获取和封装返回响应的代码，以及校验（这个校验也是让我遇到了bug）

```java
@Override
	public VideoResultResponse getTaskResult2(String taskId) {
		try {
			// 查询视频生成接口
			// 调用SDK的异步结果查询接口
			// 获取视频结果
			VideosResponse response = client.videos().videoGenerationsResult(taskId);
			VideoResultResponse result = new VideoResultResponse();
			// 即使 response 不为空，也要检查 data 是否存在
			if (response != null && response.getData() != null) {
				// 使用传入的 taskId 作为 fallback
				if (response.getData().getId() != null) {
					result.setTaskId(response.getData().getId());
				} else {
					result.setTaskId(taskId);
				}
				// 设置任务状态
				if (response.getData().getTaskStatus() != null) {
					result.setTaskStatus(convertTaskStatus(response.getData().getTaskStatus()));
				} else {
					result.setTaskStatus("UNKNOWN");
				}
				// 设置视频URL
				if (response.getData().getVideoResult() != null && !response.getData().getVideoResult().isEmpty() &&
						response.getData().getVideoResult().get(0) != null) {
					result.setVideoUrl(response.getData().getVideoResult().get(0).getUrl());
				}
			} else {
				// 如果没有获取到数据，至少保留 taskId
				result.setTaskId(taskId);
				result.setTaskStatus("UNKNOWN");
			}
			if (result.getVideoUrl() != null) {
				log.info("getTaskResult2视频生成结果: {}", result);
			}
			return result;
		} catch (Exception e) {
			throw new RuntimeException("查询任务结果错误: " + e.getMessage(), e);
		}
	}
```

### 5.2 对比

相较于3.1的代码，服务端的代码是不是精简了许多！😍😍😍😍

```
省去了很多构建的代码，基本上第二种就是.builder()简化了
```

（可能还有更好的办法，哈哈哈哈哈如果有，希望大家可以多多私信我或者留言评论🥰😁🥰😁🥰😁🥰😁）

```
以getTaskResult2和getTaskResult为例展示
1、实现方式不同
getTaskResult: 使用 HTTP REST API 调用方式，通过 RestTemplate 直接发送HTTP请求
getTaskResult2: 使用 SDK封装 方式，通过 ZhipuAiClient 客户端调用
2、调用接口不同
getTaskResult: 调用智谱AI的异步结果查询接口 https://open.bigmodel.cn/api/paas/v4/async-result/{taskId}
getTaskResult2: 调用SDK封装的 client.videos().videoGenerationsResult(taskId) 方法
3、错误处理差异
getTaskResult: 手动解析JSON响应，有详细的状态码和字段检查
getTaskResult2: 依赖SDK的错误处理机制，相对简洁
4、代码复杂度
getTaskResult: 代码较长，需要手动处理HTTP请求、JSON解析、字段映射等
getTaskResult2: 代码简洁，利用SDK自动处理序列化和反序列化
5、维护性
getTaskResult: 更多手动处理逻辑，维护成本较高
getTaskResult2: 使用SDK标准化处理，维护性更好
总的来说，getTaskResult2 是更现代化和推荐的实现方式
```



## 6、🥶优化

>这里揭晓一下为啥我在5的下面说有同步锁🔒，现在和大家讲一讲step1

### 6.1 step1

先看图，你会发现什么？？

**ps：这里不要看数据库的log，因为我后面将配置类取消换成在数据库里面配置大模型的相关参数了**

![image-20251018154904805](/images/image-20251018154904805.png)

=发送生成请求=

![image-20251018152440769](/images/image-20251018152440769.png)

>是不是发现了因为前端的轮询，ZAI总是在初始化，那不对啊，重复创建多个相同的 ZhipuAiClient 实例造成资源浪费（如果不小心对client中的apikey做出改变，还会造成token的变化，要是用的付费的可就完蛋喽，等着收到欠费通知吧，哈哈哈）

所以优化这一个step，就加上了同步锁，**它确保了 client 实例的单例模式和线程安全初始化**。

```java
if (client == null) {
			synchronized (this) {
				client = ZhipuAiClient.builder()
						.apiKey(videoConfig.getApiKey())
						.build();
			}
		}
```

>```
>1.单例模式设计ZhipuAiClient 采用单例模式，通过 synchronized 确保只创建一个实例,即使多个线程并发访问，也只会初始化一次 client
>2.apiKey 在 ZhipuAiClient 初始化时配置一次,后续调用 client.videos().videoGenerations() 或 client.videos().videoGenerationsResult() 时使用同一个token
>3.线程安全保证synchronized 块防止重复初始化,确保所有线程共享同一个 client 实例和 apiKey
>因此，正确的同步机制实际上保护了资源，避免了不必要的重复创建和token 浪费。
>```

### 6.2 step2

最开始时，我对getTaskResult2()方法做简单处理

```java
public VideoResultResponse getTaskResult(String taskId) {
    try {
       VideosResponse response = client.videos().videoGenerationsResult(taskId);
        VideoResultResponse result = new VideoResultResponse();
        result.setTaskId(response.getData().getId());                               result.setTaskStatus(convertTaskStatus(response.getData().getTaskStatus()));
        // 设置视频URL（如果存在）
        if (response.getData().getVideoResult() != null && 
            !response.getData().getVideoResult().isEmpty()) {
            result.setVideoUrl(response.getData().getVideoResult().get(0).getUrl());
        }
        return result;
    } catch (Exception e) {
        throw new RuntimeException("查询任务结果错误: " + e.getMessage(), e);
    }
}
```

>但是当我生成视频时，出现taskId为空？？？

```json
响应这个结果
{ 
    "code": 0, 
    "msg": null, 
    "data": { 
        "taskId": null, 
        "taskStatus": null, 
        "videoUrl": "https://maas-watermark-prod.cn-wlcb.ufileos.com/1760530711780_watermark.mp4?UCloudPublicKey=TOKEN_75a9ae85-4f15-4045-940f-e94c0f82ae90&Signature=1%2B9dp2JhSJtdiL53QPaUgkNgyuA%3D&Expires=1760617111", 
        "usage": null 
    }, 
    "ok": true 
}
```

>从返回结果看，问题可能出现在以下几个方面：
>数据字段映射问题：VideosResponse 对象中的 taskId 和 taskStatus 字段可能没有正确映射
>空值检查逻辑：在判断字段是否为空时可能过于严格
>SDK版本兼容性：使用的 SDK 版本可能与智谱AI接口返回的数据结构不完全匹配

**做出修改**

```java
@Override
public VideoResultResponse getTaskResult2(String taskId) {
    try {
        VideosResponse response = client.videos().videoGenerationsResult(taskId);
        
        VideoResultResponse result = new VideoResultResponse();
        
        // 即使 response 不为空，也要检查 data 是否存在
        if (response != null && response.getData() != null) {
            // 使用传入的 taskId 作为 fallback
            if (response.getData().getId() != null) {
                result.setTaskId(response.getData().getId());
            } else {
                result.setTaskId(taskId);
            }
            
            // 设置任务状态
            if (response.getData().getTaskStatus() != null) {
                result.setTaskStatus(convertTaskStatus(response.getData().getTaskStatus()));
            } else {
                result.setTaskStatus("UNKNOWN");
            }
            
            // 设置视频URL
            if (response.getData().getVideoResult() != null && 
                !response.getData().getVideoResult().isEmpty() &&
                response.getData().getVideoResult().get(0) != null) {
                result.setVideoUrl(response.getData().getVideoResult().get(0).getUrl());
            }
        } else {
            // 如果没有获取到数据，至少保留 taskId
            result.setTaskId(taskId);
            result.setTaskStatus("UNKNOWN");
        }
        
        return result;
    } catch (Exception e) {
        log.error("查询任务结果错误, taskId: {}", taskId, e);
        throw new RuntimeException("查询任务结果错误: " + e.getMessage(), e);
    }
}
```

>这样通过校验之后，返回的结果就正确了



### 6.3 step3 ？？

我想加一个step，就是我上面提到的数据库，如果我用数据库来完成对智谱参数的使用，那么我在没有使用私有变量+同步锁的方式，就会多次查询数据库，这个是不可取的，因为在任务量太多的情况下会极度加重数据库的压力！

再一个想说的就是我为什么加同步锁，因为我想抽出client作为私有变量，让他在方法中只调用一次，而如果不加异步锁的话，就会导致项目启动错误❌️（这个情况是我联合使用了数据库）

```
类字段在实例创建时就会初始化,此时Spring容器可能还未完全初始化完成,
modelInfoMapper 等依赖可能还未注入完成（因为我是通过modelInfoMapper查询的model信息）所以如果client先被初始化，然而数据库还没查到信息就会出错！！！getZhipuAiClient() 方法依赖于 getApiKey()，getApiKey() 又依赖于 modelInfoMapper
在构造函数执行期间调用这些方法可能导致未初始化的依赖访问，导致整个Bean初始化失败
所以加入同步锁，先注入modelInfoMapper，再查数据库，最后生成实例
```

```java
@Resource
private ModelInfoMapper modelInfoMapper;

private ZhipuAiClient client;
```

```java
private ZhipuAiClient getZhipuAiClient() {
		LambdaQueryWrapper<ModelInfoEntity> query = Wrappers.lambdaQuery(ModelInfoEntity.class)
				.eq(ModelInfoEntity::getModelType, ModelType.TTVLLM)
				.last("LIMIT 1");
		ModelInfoEntity modelInfo = modelInfoMapper.selectOne(query);
		if (ObjectUtils.isEmpty(modelInfo)) {
			throw new RuntimeException("未找到对应的模型信息");
		}
		if (client == null) {
			synchronized (this) {
				client = ZhipuAiClient.builder()
						.apiKey(modelInfo.getApiKey())
						.build();
			}
		}
		return client;
	}
```



## 7、🎉结语

想把每个问题都讲清楚，写一次文章还是不太容易，希望能够帮助到更多人，也是对自己操作的回顾与反思。

![63b4e6706164969c09ae26abca83e6c4](/images/63b4e6706164969c09ae26abca83e6c4.jpg)
