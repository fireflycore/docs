# 架构分层与依赖注入

本文档说明 `go-layout` 当前的分层架构、Wire 装配、配置加载和服务托管模型。

## 架构概览

依赖方向保持为：

```text
Server -> Service -> Biz <- Data
```

- `Server`：gRPC、management、sidecar-agent 运行托管。
- `Service`：RPC 入口、参数校验、读取 `service.Context`。
- `Biz`：业务用例编排，只依赖 Repo 接口。
- `Data`：Repo 实现、数据库、Redis、Consul Store。
- `Dep`：telemetry、logger、invocation 等基础设施装配。

## Wire 依赖注入

根入口在 `cmd/server/wire.go`：

```go
func wireApp() (*App, error) {
    panic(wire.Build(
        dep.ProviderSet,
        conf.ProviderSet,
        data.ProviderSet,
        dto.ProviderSet,
        biz.ProviderSet,
        service.ProviderSet,
        server.ProviderSet,
        NewApp,
    ))
}
```

每个层级通过自己的 `core.go` 暴露 ProviderSet。

新增 UseCase、Repo、Service、Server 构造函数后，需要执行：

```bash
wire ./cmd/server
```

或执行：

```bash
make init
```

## 配置主线

当前配置加载模型是：

```text
bootstrap.json
  -> BootstrapConfig
  -> consul.json
  -> Consul Client
  -> go-micro/config.Store
  -> LoadStoreConfig
```

`BootstrapConfig` 是业务服务自己的启动期聚合模型，包含：

- `app.Config`
- `kernel.Config`
- `logger.Config`
- `service.Config`
- `telemetry.Config`
- `server_port`
- `managed_port`
- `sidecar_agent`

logger 与 telemetry 不再依赖旧的统一 `BootstrapConfig` 接口，而是接收各自需要的最小输入。

## 运行托管主线

当前模板以 `go-consul/agent.Agent` 作为裸机 sidecar-agent 桥接单入口：

```text
cmd/server/main.go
  -> App.Run(ctx)
  -> AppServer.SidecarAgent.Run(ctx)
  -> Agent watch/replay
  -> Agent.ConfigureRun 中的本地 gRPC + management Serve/Shutdown
```

关键文件：

- `internal/server/register.go`：基于 `agent.ServiceOptions + grpc.ServiceDesc` 构造 `agent.Agent`。
- `internal/server/server.go`：注入业务本地 `Serve/Shutdown`，并关闭 connection manager 与 telemetry。
- `internal/server/grpc.go`：业务 gRPC server、OTel、access log、recovery、ServiceContext、gRPC health。
- `internal/server/managed.go`：management HTTP 端口，暴露 `/health`、`/ready`、`/info`、`/metrics`。

## ServiceContext

gRPC 入口默认接入：

```go
gm.NewServiceContextUnaryInterceptor(gm.ServiceContextInterceptorOptions{
    ServiceAppId:      bootstrapConfig.App.Id,
    ServiceInstanceId: bootstrapConfig.App.InstanceId,
})
```

业务入口通过：

```go
sc, ok := service.FromContext(ctx)
```

读取用户、租户、应用、服务实例等上下文。

当前规则：

- Service 层读取 `service.Context`
- Biz/Data 不解析 gRPC metadata
- 出站调用不从 `ServiceContext` 反向拼装 metadata
- 远程调用由 `go-micro/invocation` 基于当前 context 复用 metadata

## Invocation

当前远程调用基础设施集中在 `internal/dep/client.go`：

- `DNSManager`
- `ConnectionManager`
- `UnaryInvoker`
- `RemoteServiceManaged`

业务服务新增下游依赖时，应在 `internal/dep` 集中登记 `invocation.DNS`，Repo 层只绑定对应的 `RemoteServiceCaller`。

## 总结

- 启动配置由业务侧 `BootstrapConfig` 负责。
- 运行期配置通过 `go-micro/config.Store` 读取。
- 服务运行由 `go-consul/agent.Agent` 统一托管。
- 服务内上下文统一为 `go-micro/service.Context`。
- 远程调用统一走 `go-micro/invocation` DNS-only 模型。
