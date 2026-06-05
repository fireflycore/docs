# K8s 部署

K8s 是 Firefly 的云原生目标路线。当前官方 Go 模板优先覆盖裸机 / IDC 主线；K8s 文档先给出迁移边界和服务侧约束，具体 Helm / Operator 形态会随 `go-k8s` 与 Service Mesh 集成继续补齐。

## 目标模型

```text
业务服务
  -> Kubernetes Service / EndpointSlice
  -> CoreDNS
  -> Istio / Envoy
  -> authz ext_authz
```

业务代码仍然保持同一条语义：

- 服务只表达目标 Service DNS。
- 不直接依赖注册中心 SDK。
- 不在业务层做实例发现和负载均衡。
- 入站上下文仍由 `go-micro/service.Context` 承载。

## 配置数据面

配置中心主线按部署环境选择数据源实现：

- 裸机 / IDC：`go-consul/config`。
- K8s / Istio：`go-k8s/config`。

这不是“单个二进制同时切换两套后端”，而是按部署产物选择唯一实现。业务服务应面向 `go-micro/config` 契约组织配置读取。

## Manifest 与路由

即使进入 K8s，协议驱动仍然有效：

- 业务 proto 通过 Buf 生成服务端代码。
- `protoc-gen-gateway-manifest` 生成 `gateway.manifest.json`。
- HTTP/JSON 转 gRPC 需要 descriptor set。
- route facts 仍应包含 `app_id`、`method` 和 `path`。

后续如果入口完全由 Istio IngressGateway 承接，manifest 可以继续作为接口事实和治理输入，而不是业务 HTTP handler 的替代品。

## 当前建议

- 先用 `go-layout` 固化 Service / Biz / Data 分层和 Proto 契约。
- 裸机联调完成后，再把运行时能力迁移到 K8s Service、EndpointSlice、CoreDNS 和 Istio。
- 不要在业务代码中加入只为某个注册中心服务的 discovery / LB 逻辑。
- 本地验签、service authority、OTel 传播规则应与裸机主线保持一致。
