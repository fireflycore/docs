# Firefly Go 项目指南

## 项目概述

`go-layout` 是 Firefly 微服务框架的官方 Go 语言项目模板。它提供一套可直接落地的微服务骨架，默认对齐当前 Firefly Go 主线。

### 核心特性

- **标准分层架构**：清晰划分 `Service`、`Biz`、`Data` 层。
- **依赖注入**：集成 Google `Wire`，通过编译期依赖注入管理组件装配。
- **协议优先**：集成 `Buf`、`gRPC` 和 `protovalidate`。
- **配置管理**：启动时读取 `bootstrap.json` 与 `consul.json`，再通过 Consul Store 加载运行期配置。
- **统一运行托管**：通过 `go-consul/agent.Agent` 托管业务 gRPC、management 端口和 sidecar-agent watch/replay 生命周期。
- **服务上下文**：gRPC 入口注入 `go-micro/service.Context`，业务代码不再解析旧用户 metadata 模型。
- **远程调用**：通过 `go-micro/invocation` 的 DNS-only 模型发起服务间调用。
- **数据转换**：集成 `Goverter`，生成 DTO 与 Entity 转换代码。

## 快速开始

### 1. 环境准备

确保本地已安装以下工具：

- **Go**：建议使用模板 `go.mod` 中声明的版本。
- **Buf**：用于 Proto 生成。
- **Wire**：`go install github.com/google/wire/cmd/wire@latest`
- **Goverter**：`go install github.com/jmattheis/goverter/cmd/goverter@latest`

### 2. 初始化项目

```bash
git clone https://github.com/fireflycore/go-layout.git account-service
cd account-service
./rename_project.sh github.com/your-org/account-service
go mod tidy
```

### 3. 准备配置

重点检查：

- `conf/bootstrap.json`：服务身份、端口、sidecar-agent、logger、telemetry。
- `conf/consul.json`：Consul 连接信息，用于构造 `go-micro/config.Store`。

`bootstrap.json` 使用当前结构：

```json
{
  "app": {
    "id": "00000000-0000-0000-0000-000000000000",
    "env": "prod",
    "name": "go-layout",
    "secret": "replace-me",
    "version": "v0.0.1"
  },
  "service": {
    "name": "go-layout",
    "type": "svc",
    "namespace": "default",
    "cluster_domain": "cluster.local",
    "port": 9090,
    "weight": 100
  },
  "server_port": 10500,
  "managed_port": 10501,
  "sidecar_agent": {
    "base_url": "http://127.0.0.1:15010",
    "grace_period": "20s"
  }
}
```

### 4. 常用命令

```bash
make generate
make init
make run
make build
```

当前模板中：

- `make generate`：生成 Proto 和 DTO。
- `make init`：执行生成、`wire ./cmd/server` 和 `go mod tidy`。
- `make run`：直接运行 `go run ./cmd/server`。
- `make build`：执行初始化并注入构建信息。

如果修改了 ProviderSet、构造函数签名或依赖关系，必须重新执行 `wire ./cmd/server` 或 `make init`。

### 5. 管理端口

management 端口由 `managed_port` 控制，默认可暴露：

- `GET /health`
- `GET /ready`
- `GET /info`
- `GET /metrics`

`/ready` 和 `/info` 会输出 `go-consul/agent.Status` 摘要，便于排查 sidecar-agent 连接、注册重放和最近错误。

## 目录导航

- [目录结构详解](directory-structure.md)
- [核心概念说明](core-concepts.md)
- [数据流转图解](data-flow.md)
- [配置详解](configuration.md)
- [架构分层深度解析](architecture.md)
- [开发最佳实践](best-practices.md)
