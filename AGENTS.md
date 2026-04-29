# Valaxy Blog (Sakura Theme)

## Commands
- `npm run dev` - Start dev server (http://localhost:3456)
- `npm run build` / `npm run build:ssg` - Build SSG site
- `npm run build:spa` - Build SPA version
- `npm run serve` - Preview built site

## Dependencies
- `valaxy` (0.28.5) - 博客框架核心
- `valaxy-theme-sakura` (latest) - Sakura 主题
- `valaxy-addon-vercount` (0.0.6) - 访问量统计插件
- `star-markdown-css` (0.5.3) - Markdown 文章样式
- `typescript` (^5.9.3) - TypeScript 支持

## Structure
- Content: `pages/posts/*.md`, `pages/index.md`
- Config: `site.config.ts`, `valaxy.config.ts`
- Theme: `valaxy-theme-sakura`
- Images: `public/images/`

## Pages
- 首页: `pages/index.md`
- 关于: `pages/about.md`
- 归档: `pages/archives.md` (layout: archives)
- 分类: `pages/categories.md` (layout: categories)
- 标签: `pages/tags.md` (layout: tags)

## Config
- `site.config.ts` - 站点配置（url, title, author, social）
- `valaxy.config.ts` - 主题配置（navbar, sidebar, hero, footer）

## Theme Config (valaxy.config.ts)
- 主题色: `ui.primary` (#2563eb 蓝色)
- 导航栏: navbar + navbarOptions
- 侧边栏: sidebar + sidebarOptions
- 底部栏: footer (since, powered)

## Customization
- 头像: `/images/avatar/1.png`
- 背景图: `/images/background/index.jpg`
- 关于页背景: `/images/background/about.png`
- 文章封面: `/images/cover/*.jpg`

## CI
- Uses npm (not pnpm) in GitHub Actions
- Uses GitHub Actions for deployment
- Publishes dist to GitHub Pages

## Issues & Solutions
1. 图片路径问题: 使用 `/images/` 而非 `/BlogANnian/images/`
2. frontmatter 必须完整: title, date, tags, categories, cover
3. 模块导入问题: 确保图片在 public 目录