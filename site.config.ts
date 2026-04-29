import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  url: 'https://ANnianExplorer.github.io/BlogANnian',
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
    {
      name: 'GitHub',
      link: 'https://github.com/ANnianExplorer',
      icon: 'i-ri-github-line',
      color: '#6e5494',
    },
    {
      name: 'RSS',
      link: '/atom.xml',
      icon: 'i-ri-rss-line',
      color: 'orange',
    },
  ],
  statistics: {
    enable: true,
  },
  lastUpdated: true,
})