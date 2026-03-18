import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '前端工程化与架构实战（2026）',
  description: '一个仓库 = 一本书 + 一整套企业级前端体系',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '开始阅读', link: '/chapters/01-engineering' },
    ],

    sidebar: [
      {
        text: '第一篇：前端工程化体系',
        items: [
          { text: '第1章 前端工程化概述', link: '/chapters/01-engineering' },
          { text: '第2章 构建工具原理与实践', link: '/chapters/02-build-tools' },
        ],
      },
    ],

    socialLinks: [],

    footer: {
      message: '一个仓库 = 一本书 + 一整套企业级前端体系',
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一章',
      next: '下一章',
    },
  },
})
