# Valaxy Blog (Sakura Theme)

## Commands
- `npm run dev` - Start dev server
- `npm run build` / `npm run build:ssg` - Build SSG site
- `npm run build:spa` - Build SPA version

## Structure
- Content: `pages/posts/*.md`, `pages/index.md`
- Config: `site.config.ts`, `valaxy.config.ts`
- Theme: `valaxy-theme-sakura`

## CI
- Uses pnpm in GitHub Actions
- Publishes `dist` to GitHub Pages