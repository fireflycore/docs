# Istio 集成

Istio 是 Firefly 云原生规模化阶段的主要服务治理承接方。当前文档说明集成边界：业务服务保持 `go-layout` 分层和 `go-micro` 上下文模型，流量治理、入口鉴权和服务发现逐步由 Istio / Envoy 承接。

## 集成目标

```text
Client
  -> Istio IngressGateway
  -> Envoy ext_authz
  -> authz
  -> Service Sidecar
  -> Go 业务服务
```

核心原则：

- 业务服务不把网关逻辑写进 Service 层。
- 鉴权数据面继续使用标准 Envoy ext_authz。
- route facts 继续为 `app_id`、`method`、`path`。
- Firefly 身份入口继续是 `x-firefly-user-authority`、`x-firefly-service-authority` 和 `x-firefly-authz-sign`。
- Trace 使用 W3C Trace Context：`traceparent`、`tracestate`、`baggage`。

## authz

在 Istio 中，authz 可以作为 External Authorization 服务接入。它的职责不变：

- 校验用户 authority 和服务 authority。
- 执行 Casbin 判定。
- allow 后写入普通上下文和短 TTL `x-firefly-authz-sign`。
- 不签发用户 token 或服务 token。

如果 authz 不可达，推荐保持 fail-close。生产环境应通过多实例、健康检查和清晰的错误监控保证可用性。

## 业务服务

Go 业务服务继续使用：

- `gm.NewServiceContextUnaryInterceptor` 构造 `service.Context`。
- 可选 `authz_verification` 加载 Ed25519 公钥并本地验签。
- `go-micro/invocation` 统一处理出站 metadata 白名单、用户 authority 透传和 service authority 覆盖。

## 迁移注意

- 不要把裸机场景的 `sidecar-agent` admin API 直接带入 Pod 内作为必需依赖。
- 不要恢复业务服务直接操作注册中心 SDK 的旧模式。
- 原 `api-gateway` 中与 north-south 入口相关的能力，在 Istio 模式下应映射到 IngressGateway、VirtualService、EnvoyFilter 或等价平台能力。
- manifest 和 descriptor 仍可作为接口事实、转码和治理输入。
