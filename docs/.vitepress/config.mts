import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Python 之美：写给初学者的语言精华",
  description: "现代类型视角的 Python 入门",
  base: "/python-beauty",
  lang: "zh-CN",
  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/python-beauty/logo.svg" },
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "开始阅读", link: "/intro" },
      { text: "章节目录", link: "/ch01-env" },
      // 如果你有 GitHub 仓库，可以在这里加链接
      { text: "GitHub", link: "https://github.com/bosens-China/python-beauty" },
    ],

    logo: "/logo.svg",
    siteTitle: "Python 之美",

    sidebar: [
      {
        text: "序言",
        items: [{ text: "写在前面", link: "/intro" }],
      },
      {
        text: "第一部分：初见之美 —— 类型的基石",
        // collapsed: false,
        items: [
          { text: "Python 3.12 新纪元与环境搭建", link: "/ch01-env" },
          { text: "变量与基本数据类型", link: "/ch02-types" },
          { text: "容器与泛型基础", link: "/ch03-containers" },
          {
            text: "Pythonic 之道 —— 推导式与正则",
            link: "/ch04-pythonic",
          },
        ],
      },
      {
        text: "第二部分：逻辑之美 —— 结构与工程",
        // collapsed: false,
        items: [
          { text: "控制流与类型收窄", link: "/ch05-control" },
          { text: "函数 —— 代码的契约", link: "/ch06-functions" },
          {
            text: "模块与工程化 —— 组织你的代码",
            link: "/ch07-modules",
          },
        ],
      },
      {
        text: "第三部分：结构之美 —— 面向对象与数据模型",
        // collapsed: false,
        items: [
          { text: "类与面向对象 (OOP)", link: "/ch08-oop" },
          { text: "数据建模与 IO 边界", link: "/ch09-data-modeling" },
          { text: "协议 (Protocols)", link: "/ch10-protocols" },
        ],
      },
      {
        text: "第四部分：抽象之美 —— 泛型与防御性编程",
        // collapsed: false,
        items: [
          { text: "现代泛型 (Generics)", link: "/ch11-generics" },
          { text: "防御性编程与类型安全", link: "/ch12-robustness" },
          { text: "装饰器 (Decorators)", link: "/ch13-decorators" },
          { text: "上下文管理器", link: "/ch14-context" },
        ],
      },
      {
        text: "第五部分：生态之美 —— 成本、并发与实战",
        // collapsed: false,
        items: [
          {
            text: "并发的抉择 —— 成本与模型",
            link: "/ch15-concurrency-cost",
          },
          { text: "异步编程 (AsyncIO)", link: "/ch16-asyncio" },
          {
            text: "实战生态 —— Pydantic 与 FastAPI",
            link: "/ch17-fastapi",
          },
        ],
      },
      {
        text: "结语",
        items: [{ text: "Python 的平衡之道", link: "/outro" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/bosens-China/python-beauty" },
    ],

    // 页脚
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025 Python 之美",
    },

    // 本地搜索配置
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

    // 右侧大纲（页面内导航）
    outline: {
      level: [2, 3], // 显示 h2 和 h3
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
