# 项目目录结构详解

本文档说明 `go-layout` 当前目录结构和各目录职责。

## 根目录概览

```markdown
├── cmd/
│   └── server/
│       ├── main.go             # 程序入口，创建根 ctx 并监听退出信号
│       ├── app.go              # 应用根对象，进入 agent.Agent.Run(ctx)
│       ├── wire.go             # Wire 注入定义
│       └── wire_gen.go         # Wire 生成代码，可能被 .gitignore 忽略但本地编译需要
├── conf/
│   ├── bootstrap.json          # 启动引导配置
│   └── consul.json             # Consul 连接配置，用于创建配置 Store
├── dep/
│   ├── dto/                    # Goverter 生成代码
│   └── protobuf/gen/           # Buf 生成代码
├── docs/                       # 项目内文档
├── internal/
│   ├── biz/                    # 业务用例与 Repo 接口
│   ├── conf/                   # Bootstrap 与组件配置加载
│   ├── data/                   # Repo 实现与数据源初始化
│   ├── dep/                    # telemetry/logger/invocation 等基础设施装配
│   ├── dto/                    # DTO 转换器注入适配
│   ├── server/                 # gRPC、management、sidecar-agent 托管
│   └── service/                # gRPC Service 实现
├── buf.gen.yaml
├── go.mod
└── makefile
```

## internal/biz

业务逻辑层。

- `convert/`：定义 DTO 与 Entity 转换接口。
- `model/`：可选领域对象。
- `repo/`：定义 Repo 接口和事务接口。
- `core.go`：Wire ProviderSet。
- `demo.go`：示例 UseCase。

Biz 层只依赖 Repo 接口，不依赖 Data 层具体实现。

## internal/data

数据访问层。

- `entity/`：GORM entity。
- `data.go`：数据库、Redis、Consul Store 初始化。
- `demo.go`：Repo 实现。
- `transaction.go`：事务支持。
- `core.go`：Wire ProviderSet。

## internal/service

gRPC 应用服务层。

- 执行 `protovalidate.Validate(req)`。
- 读取 `go-micro/service.Context`。
- 调用 Biz 层。
- 按当前 Proto 语义返回响应与 error。

Service 层不再手工解析 gRPC metadata。

## internal/server

服务启动和运行托管层。

- `grpc.go`：业务 gRPC server，挂接 OTel、recovery、access log、ServiceContext 和 gRPC health。
- `managed.go`：management HTTP server，暴露 `/health`、`/ready`、`/info`、`/metrics`。
- `register.go`：基于 `agent.ServiceOptions + grpc.ServiceDesc` 创建 `go-consul/agent.Agent`。
- `server.go`：创建 `AppServer`，通过 `Agent.ConfigureRun` 注入本地 `Serve/Shutdown`。
- `build_info.go`：构建信息。
- `core.go`：Wire ProviderSet。

## internal/conf

配置加载层。

- `bootstrap.go`：加载 `BootstrapConfig`，补齐 app/kernel/service/sidecar 默认值。
- `consul.go`：读取 `conf/consul.json`。
- `mysql.go`、`redis.go`：从 `go-micro/config.Store` 加载运行期组件配置。
- `utils.go`：本地 JSON 读取和加密 payload 解码工具。

## internal/dep

基础设施适配层。

- `client.go`：创建 invocation DNSManager、ConnectionManager、UnaryInvoker、RemoteServiceManaged。
- `telemetry.go`：从 `BootstrapConfig` 映射 `telemetry.Resource` 并创建 providers。
- `core.go`：Wire ProviderSet。

## 开发者修改指南

| 任务 | 涉及目录/文件 | 说明 |
| :--- | :--- | :--- |
| 新增 API | `dep/protobuf/gen` -> `internal/service` | 先更新 Proto 生成代码，再实现 Service。 |
| 新增业务逻辑 | `internal/biz` | 创建 UseCase，定义 Repo 接口。 |
| 新增数据库表 | `internal/data/entity` -> `internal/data` | 定义 Entity，实现 Repo。 |
| 新增配置项 | `internal/conf` | 修改 `BootstrapConfig` 或新增配置 loader。 |
| 新增远程服务依赖 | `internal/dep/client.go` -> `internal/data/rs_*.go` | 在 dep 集中登记 DNS，Repo 绑定 caller。 |
| 修改依赖注入 | 各层 `core.go` -> `cmd/server/wire.go` | 修改后执行 `wire ./cmd/server`。 |
| 排查运行链路 | `cmd/server` + `internal/server` | 从 `agent.Agent`、management 端口和 sidecar 状态入手。 |
