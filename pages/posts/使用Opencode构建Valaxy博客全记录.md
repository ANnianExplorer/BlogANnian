---
title: 使用 Opencode 构建 Valaxy Sakura 主题博客全记录
date: 2025-04-30
tags:
  - Opencode
  - Valaxy
  - 博客搭建
categories:
  - 技术
cover: https://valaxy-theme-sakura.s3.bitiful.net/wallpaper-2025%2Fwallhaven-858k3j.jpg
---

# 使用 Opencode 构建 Valaxy Sakura 主题博客全记录

> 本文记录如何使用 Opencode AI 助手一步步搭建 Valaxy + Sakura 主题博客的全过程，包括环境安装、配置修改、部署上线等。

## 一、环境准备

### 1.1 检查 Node.js 环境
```bash
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v
```

### 1.2 创建项目目录并初始化
```bash
# 创建项目目录
mkdir blog && cd blog

# 初始化 valaxy 项目
npm create valaxy@latest
```

![项目结构](/images/opencode/PixPin_2026-04-30_01-42-07.png)

### 1.3 安装依赖
```bash
# 安装 valaxy
npm install valaxy

# 安装 Sakura 主题
npm install valaxy-theme-sakura

# 安装访问统计插件
npm install valaxy-addon-vercount

# 安装 TypeScript
npm install -D typescript

# 安装所有依赖
npm install
```

---

## 二、配置文件修改

### 2.1 修改 site.config.ts
```typescript
import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  url: 'https://ANnianExplorer.github.io/BlogANnian/',
  lang: 'zh-CN',
  title: 'ANnianExplorer の博客',
  subtitle: 'Welcome to my blog',
  author: {
    name: 'ANnianExplorer',
    avatar: '/images/avatar/1.png',
    intro: '一个热爱技术和二次元的开发者',
  },
  description: 'ANnianExplorer 的个人博客',
  social: [
    { name: 'GitHub', link: 'https://github.com/ANnianExplorer', icon: 'i-ri-github-line' },
    { name: 'RSS', link: '/atom.xml', icon: 'i-ri-rss-line' },
  ],
  statistics: { enable: true },
  lastUpdated: true,
})
```

### 2.2 修改 valaxy.config.ts
```typescript
import type { ThemeUserConfig } from 'valaxy-theme-sakura'
import { defineValaxyConfig } from 'valaxy'

export default defineValaxyConfig<ThemeUserConfig>({
  theme: 'sakura',
  themeConfig: {
    ui: { primary: '#2563eb' },
    hero: {
      title: 'ANnianExplorer',
      motto: '欢迎来到我的博客',
      urls: ['/images/background/index.jpg'],
      style: 'dim',
    },
    navbar: [
      { text: '首页', link: '/', icon: 'i-ri-home-line' },
      { text: '关于', link: '/about/', icon: 'i-ri-user-line' },
      { text: '归档', link: '/archives/', icon: 'i-ri-archive-line' },
      { text: '分类', link: '/categories/', icon: 'i-ri-folder-line' },
      { text: '标签', link: '/tags/', icon: 'i-ri-price-tag-line' },
    ],
    navbarOptions: { tools: ['toggleDark', 'search'] },
    sidebar: [
      { text: '标签', link: '/tags/', icon: 'i-ri-price-tag-line' },
      { text: '分类', link: '/categories/', icon: 'i-ri-folder-line' },
      { text: '归档', link: '/archives/', icon: 'i-ri-archive-line' },
    ],
    sidebarOptions: {
      position: 'left',
      enableOnDesktop: true,
    },
    footer: { since: 2025, powered: false },
    tags: { rainbow: true },
    postList: { defaultImage: '/images/background/index.jpg' },
  },
})
```

### 2.3 修改 AGENTS.md
更新 AI Agent 配置文件：
```markdown
# Valaxy Blog (Sakura Theme)

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Build SSG site

## Dependencies
- valaxy: 0.28.5
- valaxy-theme-sakura: latest
- valaxy-addon-vercount: 0.0.6
- star-markdown-css: 0.5.3
- typescript: ^5.9.3
```

---

## 三、页面配置

### 3.1 归档页 pages/archives.md
```yaml
---
title: 归档
layout: archives
cover: /images/background/index.jpg
---
```

### 3.2 分类页 pages/categories.md
```yaml
---
title: 分类
layout: categories
cover: /images/background/pexels-splitshire-1562.jpg
---
```

### 3.3 标签页 pages/tags.md
```yaml
---
title: 标签
layout: tags
cover: /images/background/pexels-eberhardgross-858115.jpg
---
```

### 3.4 关于页 pages/about.md（详细配置）
创建关于页面，包含：
- 个人简介
- 技术栈徽章（使用 for-the-badge 样式）
- GitHub 统计卡片
- 博客统计表格（动态数据）

```javascript
// 关键代码片段
import { usePostList } from 'valaxy'

const postList = usePostList()
const postCount = computed(() => postList.value?.length || 0)

// 时间格式化
function formatDateTime(d) {
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  const s = pad(d.getSeconds())
  return y + '年' + m + '月' + day + '日 ' + h + ':' + min + ':' + s
}
```

---

## 四、样式修改

### 4.1 更改主题色
- 粉色 `#ff4e6a` → 蓝色 `#2563eb`

### 4.2 关于页样式
- 标题使用 div 而非 h1/h2
- 技术栈徽章使用 flex 换行布局
- 统计表格使用不同颜色区分数值
- 所有内容居中显示

---

## 五、图片配置

### 5.1 上传图片到 public/images/
```
public/images/
├── avatar/1.png              # 头像
├── background/
│   ├── index.jpg          # 首页背景
│   ├── about.png       # 关于页背景
│   └── *.jpg          # 其他背景图
└── cover/               # 文章封面
```

### 5.2 配置各页面背景
- 首页：`valaxy.config.ts` 的 hero.urls
- 关于页：cover frontmatter
- 归档/分类/标签页：各页面的 cover

---

## 六、组件创建

### 6.1 创建侧边栏统计组件 components/SidebarStats.vue
```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSiteConfig } from 'valaxy'

const siteConfig = useSiteConfig()
const currentTime = ref('')
const runTime = ref('')

// 时间更新逻辑
function updateTime() {
  const now = new Date()
  // 计算运行时间
}
// 定时更新
onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})
</script>

<template>
  <div class="sidebar-stats">
    <!-- 统计内容 -->
  </div>
</template>
```

---

## 七、错误解决

### 7.1 图片路径问题
- 错误：使用 `/BlogANnian/images/` 前缀
- 解决：使用 `/images/` 前缀
```markdown
![图片](/images/xxx.png)  <!-- 正确 -->
![图片](/BlogANnian/images/xxx.png)  <!-- 错误 -->
```

### 7.2 frontmatter 问题
- 错误：文章缺少 title 字段
- 解决：添加完整 frontmatter
```yaml
---
title: 文章标题
date: 2025-04-30
tags: []
categories: []
cover: /images/cover/xxx.jpg
---
```

### 7.3 pnpm vs npm
- 错误：pnpm lock file not found
- 解决：workflow 使用 npm install

### 7.4 图片模块导入
- 错误：图片被当作 JS 模块导入
- 解决：图片放 public/images/，路径用 /images/

---

## 八、GitHub 部署

### 8.1 初始化 Git
```bash
git init
git add -A
git commit -m "init blog"
git remote add origin https://github.com/ANnianExplorer/BlogANnian.git
git push -u origin main
```

### 8.2 GitHub Actions 配置
创建 `.github/workflows/gh-pages.yml`:
```yaml
name: GitHub Pages
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

### 8.3 启用 GitHub Pages
- Settings → Pages → Source → GitHub Actions

![GitHub Actions 配置](/images/opencode/PixPin_2026-04-30_01-06-33.png)

---

## 九、本地调试命令

```bash
# 开发模式（热更新）
npm run dev
# 访问 http://localhost:3456

# 构建 SSG
npm run build

# 构建 SPA
npm run build:spa

# 本地预览
npm run serve
```

![开发模式](/images/opencode/PixPin_2026-04-30_01-05-48.png)

---

## 十、总结

### 10.1 关键要点
1. 图片路径：使用 `/images/` 而非 `/BlogANnian/`
2. frontmatter：必须有 title, date, tags, categories, cover
3. 本地测试：npm run build 通过后再推送
4. site.config.ts：项目仓库 URL 要加 `/BlogANnian/`

### 10.2 使用 Opencode 的优势
- 快速查找代码位置
- 自动完成配置修改
- 实时错误检测
- 批量处理文件

---

## 十一、参考文档

- 主题参考：https://sakura.wrxinyue.org/
- 官方文档：https://valaxy.site/
- GitHub：https://github.com/WRXinYue/valaxy-theme-sakura

---

> 本文使用 Opencode AI 助手辅助编写完成