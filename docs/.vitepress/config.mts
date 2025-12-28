import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    plugins: [llmstxt()],
  },
  title: "Python 之美：一门语言的温柔与克制",
  description: "写给初学者与转语言者的现代 Python 读本",
  base: "/python-beauty",
  lang: "zh-CN",
  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/python-beauty/logo.svg" },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "开始阅读", link: "/preface/intro" },
      { text: "章节目录", link: "/preface/intro" },
      { text: "GitHub", link: "https://github.com/bosens-China/python-beauty" },
    ],

    logo: "/logo.svg",
    siteTitle: "Python 之美",

    sidebar: [
      {
        text: "序 · 在开始之前",
        items: [
          { text: "写在前面：为什么是 Python", link: "/preface/intro" },
          { text: "给初学者与转语言者的一封信", link: "/preface/letter" },
          { text: "如何阅读这本书", link: "/preface/how-to-read" },
          { text: "快速启动：搭建现代环境", link: "/preface/quick-start" },
          {
            text: "给 TypeScript 开发者的一封信（选读）",
            link: "/preface/salute-typescript.md",
          },
        ],
      },
      {
        text: "第一部 · 初见 —— 语言的表情",
        items: [
          { text: "第一眼的温柔", link: "/part1-first-glance/ch01-syntax" },
          { text: "名字的力量", link: "/part1-first-glance/ch02-variables" },
        ],
      },
      {
        text: "第二部 · 行走 —— 控制与节奏",
        items: [
          { text: "如果世界可以分岔", link: "/part2-walking/ch03-control" },
          { text: "重复，但不乏味", link: "/part2-walking/ch04-loops" },
          { text: "意外不是错误", link: "/part2-walking/ch05-exceptions" },
        ],
      },
      {
        text: "第三部 · 塑形 —— 组织思想的方式",
        items: [
          { text: "封装思想", link: "/part3-shaping/ch06-functions" },
          { text: "盛放数据", link: "/part3-shaping/ch07-containers" },
        ],
      },
      {
        text: "第四部 · 抽象 —— 当代码开始谈论关系",
        items: [
          { text: "类，但不只是类", link: "/part4-abstraction/ch08-classes" },
          { text: "看不见的接口", link: "/part4-abstraction/ch09-protocols" },
          {
            text: "改变行为，而非代码",
            link: "/part4-abstraction/ch10-decorators",
          },
        ],
      },
      {
        text: "第五部 · 边界 —— 与现实世界对话",
        items: [
          {
            text: "数据的形状",
            link: "/part5-boundaries/ch11-data-structures",
          },
          { text: "不相信输入", link: "/part5-boundaries/ch12-validation" },
        ],
      },
      {
        text: "第六部 · 并行 —— 时间与成本",
        items: [
          { text: "并发的真相", link: "/part6-concurrency/ch13-gil" },
          { text: "协作而非抢占", link: "/part6-concurrency/ch14-asyncio" },
        ],
      },
      {
        text: "第七部 · 工程 —— 代码不再属于你一个人",
        items: [
          { text: "组织与边界", link: "/part7-engineering/ch15-modules" },
          { text: "工具不是负担", link: "/part7-engineering/ch16-tools" },
        ],
      },
      {
        text: "终章",
        items: [{ text: "克制的力量", link: "/outro/balance" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/bosens-China/python-beauty" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 2025-present yliu",
    },

    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            },
          },
        },
      },
    },

    outline: {
      level: [2, 3],
      label: "本页目录",
    },
    // 编辑链接
    editLink: {
      pattern:
        "https://github.com/bosens-China/python-beauty/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },

    // 上次更新时间
    lastUpdated: {
      text: "最后更新于",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "medium",
      },
    },

    // 移动端菜单文字
    sidebarMenuLabel: "目录",
    returnToTopLabel: "返回顶部",
    darkModeSwitchLabel: "深色模式",
  },
});
