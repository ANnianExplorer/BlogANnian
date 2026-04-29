import type { ThemeUserConfig } from 'valaxy-theme-sakura'
import { defineValaxyConfig } from 'valaxy'

export default defineValaxyConfig<ThemeUserConfig>({
  theme: 'sakura',
  base: '/BlogANnian/',
  themeConfig: {
    ui: {
      primary: '#2563eb',
    },
    hero: {
      title: 'ANnianExplorer',
      motto: '欢迎来到我的博客',
      urls: [
        '/images/background/index.jpg',
        '/images/background/pexels-splitshire-1561.jpg',
        '/images/background/pexels-splitshire-1562.jpg',
        '/images/background/pexels-eberhardgross-858115.jpg',
      ],
      style: 'dim',
    },
    navbar: [
      {
        text: '首页',
        link: '/',
        icon: 'i-ri-home-line',
      },
      {
        text: '归档',
        link: '/archives/',
        icon: 'i-ri-archive-line',
      },
      {
        text: '分类',
        link: '/categories/',
        icon: 'i-ri-folder-line',
      },
      {
        text: '标签',
        link: '/tags/',
        icon: 'i-ri-price-tag-line',
      },
      {
        text: '关于',
        link: '/about/',
        icon: 'i-ri-user-line',
      },
    ],
    navbarOptions: {
      tools: ['toggleDark', 'search'],
      hamburgerStyle: 'uneven',
    },
    sidebar: [
      {
        text: '标签',
        link: '/tags/',
        icon: 'i-ri-price-tag-line',
      },
      {
        text: '分类',
        link: '/categories/',
        icon: 'i-ri-folder-line',
      },
      {
        text: '归档',
        link: '/archives/',
        icon: 'i-ri-archive-line',
      },
    ],
    sidebarOptions: {
      position: 'left',
      enableOnDesktop: true,
      showCounts: false,
    },
    footer: {
      since: 2025,
      powered: false,
    },
    tags: {
      rainbow: true,
    },
    postList: {
      defaultImage: '/images/background/index.jpg',
    },
  },
})