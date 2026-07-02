---
layout: home
title: Firefly
titleTemplate: 多语言微服务治理与 Go 服务模板
hero:
  name: Firefly
  text: 多语言微服务治理与 Go 服务模板
  tagline: 从协议、服务模板、sidecar-agent 到 API Gateway 的渐进式微服务体系
  image:
    src: /logo.svg
    alt: logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/go/project-guide
    - theme: alt
      text: 当前主线
      link: /intro/mainline
    - theme: alt
      text: 源码组织
      link: https://github.com/fireflycore/go-layout
features:
  - icon: ⚡
    title: Go 主线稳定
    details: go-layout v0.3.5 对齐 go-micro v1.6.4 与 go-consul v0.3.6，提供可直接落地的服务骨架。
  - icon: 🛠
    title: 运行时接管治理
    details: 裸机阶段由 sidecar-agent、Envoy 和 Consul 承接注册、路由、发现与授权接入，业务服务只表达自身能力和目标服务。
  - icon: 💡
    title: 协议驱动
    details: 基于 Protobuf、Buf 和 gateway manifest 管理服务能力，HTTP/JSON 转 gRPC 依赖 namespace descriptor current。
  - icon: 🚀
    title: 鉴权与上下文收敛
    details: 统一使用 Firefly authority 头、authz ext_authz 和 go-micro service.Context，避免业务层重复解析身份。
#  - icon: 🔥
#    title: 全链路日志集成
#    details: 主进程和预加载脚本支持热重载。
#  - icon: 🔌
#    title: 易于调试
#    details: 非常容易在 IDE 中调试，例如 vscode 或 webstorm。
#  - icon: 🏷️
#    title: TypeScript 装饰器
#    details: 支持 TS 装饰器和元数据特性。
#  - icon: 🔒
#    title: 源代码保护
#    details: 编译为 V8 字节码以保护源代码。
#  - icon: 📦
#    title: 开箱即用
#    details: 开箱即用支持 Typescript、Vue、React、Svelte 和 SolidJS 等。
---
