# 当前主线

本文概括 Firefly 官方文档当前采用的实现基线。更细的设计材料来自 `backend/design/current` 文档，落地事实以各 Firefly 仓库当前代码为准。

## 版本基线

Go 业务服务模板当前主线是：

```text
go-layout v0.3.5
go-micro v1.6.4
go-consul v0.3.6
```

控制面组件 `sidecar-agent` 与 `api-gateway` 当前直接依赖 `go-micro v1.6.4`。它们分别通过本机 admin API、Envoy xDS 和 Consul HTTP API 承接控制面事实，不直接引入 `go-consul`。

`api-gateway`、`authz` 等独立组件可能处于不同依赖版本，阅读文档时不要把 Go 业务服务模板的版本号直接套到所有仓库。官方指南会在组件页说明各自职责和运行入口。

## 主链路

```text
业务 proto
  -> buf generate
  -> dep/protobuf/gen/gateway.manifest.json
  -> go-consul/agent
  -> sidecar-agent
  -> Consul service 与 route document
  -> api-gateway / sidecar-agent 编译 Envoy xDS
  -> Envoy ext_authz 调用 authz
  -> authz allow 后注入普通上下文与 x-firefly-authz-sign
  -> go-micro middleware 构造 service.Context
  -> Service / Biz / Data
```

这条链路里，业务服务不直接管理注册中心 SDK，不自己做实例发现和负载均衡，也不从 gRPC 描述反推 HTTP route。服务能力以 `gateway.manifest.json` 为准。

## 组件职责

- `go-layout`：Go 业务服务模板，负责 Service / Biz / Data 分层、Wire 装配、启动配置、gRPC 入口、management 端口和示例依赖。
- `go-micro`：公共上下文、中间件、invocation、配置契约、telemetry、service authority 管理等基础库。
- `go-consul/agent`：裸机业务服务与本机 `sidecar-agent` 的桥接层，读取 manifest 并执行 register / drain / deregister / watch。
- `sidecar-agent`：裸机本机控制面，写 Consul service 与 route document，维护本机 Envoy xDS、健康探测和恢复视图。
- `CoreDNS`：节点级 DNS 基础设施，解析 `*.svc.cluster.local` 到本机 mesh VIP；透明导流由 nftables 和 Envoy 承担。
- `api-gateway`：north-south 入口网关控制面，消费 Consul route document、健康 endpoint 与 namespace descriptor current，生成入口 Envoy xDS。
- `authz`：Envoy ext_authz 数据面授权服务，校验 Firefly authority，执行 Casbin 判定，签发短 TTL `x-firefly-authz-sign`。

## 身份入口

Firefly current 身份入口只有：

```text
x-firefly-user-authority
x-firefly-service-authority
x-firefly-authz-sign
```

`Authorization` 不再作为 Firefly 身份入口。OTel / W3C Trace Context 是追踪主线，默认传播 `traceparent`、`tracestate` 和 `baggage`；`x-request-id` 只作为 Envoy 或日志关联 ID。

权限匹配的核心元组是：

```text
invoke_app_id + method + path + target_app_id
```

route document 中的 `app_id` 表示 route 所属服务应用，authz 内部再映射为 `target_app_id`。

## 不再推荐

以下内容只应出现在历史文档或迁移说明中，不应作为新项目入口：

- 业务服务直接依赖注册中心 SDK 做 discovery / LB。
- 从 `RawServices`、`grpc.ServiceDesc` 或手写清单推导 HTTP route。
- 使用 `Authorization`、`x-firefly-authz-context` 或旧 `authz-context` 作为 Firefly 身份主线。
- 把 Config 服务作为业务服务高频运行期配置读取代理。
- 在 `bootstrap.json` 中恢复旧 `micro`、`gateway`、`data_conf_file` 配置结构。
