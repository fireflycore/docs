import {DefaultTheme, defineConfig} from 'vitepress'

const sidebar: DefaultTheme.Sidebar = {
    "/": [
        {
            text: "简介",
            items: [
                {text: "使用前言", link: "/intro/foreword"},
                {text: "设计理念", link: "/intro/design"},
                {text: "技术架构", link: "/intro/framework"},
                {text: "支持语言", link: "/intro/lang"},
            ]
        },
        {
            text: "指南",
            items: [
                {text: "快速开始", link: "/guide/"},
                {text: "目录详解", link: "/guide/dir"},
                {text: "配置参考", link: "/guide/config"},
                {text: "Jenkins部署", link: "/guide/jenkins"},
                {text: "Docker部署", link: "/guide/docker"},
                {text: "K8S部署", link: "/guide/k8s"},
                {text: "集成Istio", link: "/guide/istio"},
            ]
        },
        {
            text: "命令行工具",
            items: [
                {text: "快速开始", link: "/cli/"},
                {text: "常用命令", link: "/cli/command"},
                {text: "配置参考", link: "/cli/config"},
            ]
        },
    ],
}

const nav: DefaultTheme.NavItem[] = [
    { text: '简介', link: '/intro/foreword', activeMatch: '^/intro/foreword' },
    {
        text: '指南',
        link: '/guide/',
        activeMatch: '^/guide|api|about/'
    },
    { text: 'CLI', link: '/cli/', activeMatch: '^/cli/' },
    {
        text: '链接',
        items: [
            { text: 'Blog', link: '/blog/', activeMatch: '^/blog/' },
            { text: '赞助', link: '/sponsor/', activeMatch: '^/sponsor/' },
            {
                items: [
                    { text: '梨花炖海棠', link: 'https://lhdht.cn/' },
                    {
                        text: 'go-layout',
                        link: 'https://github.com/fireflycore/go-layout'
                    }
                ]
            }
        ]
    },
    {
        text: '更新日志',
        items: [
            {
                text: 'Go-v0.1.0',
                link: 'https://github.com/fireflycore/go-layout/compare/v0.0.9...v0.1.0'
            }
        ]
    }
]

// https://vitepress.dev/reference/site-config
export default defineConfig({
    lang: "zh",
    title: "Firefly",
    description: "Firefly Microservice Framework",
    head: [
        ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ],
    srcDir: 'docs',
    lastUpdated: true,
    cleanUrls: true,
    locales: {
        root: { label: '简体中文' },
        en: { label: 'English', link: 'https://docs.lhdht.cn/en' }
    },
    themeConfig: {
        logo: '/logo.svg',
        outline: {
            label: '本页目录'
        },
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        lastUpdated: {
            text: "最后更新时间"
        },
        docFooter: {
            prev: '上一篇',
            next: '下一篇'
        },

        socialLinks: [
            {icon: 'github', link: 'https://github.com/fireflycore'}
        ],
        footer: {
            message: 'Released under the MIT License',
            copyright: 'Copyright © 2022-present Lhdht Powered by Firefly'
        },
        nav,
        sidebar
    },
})
