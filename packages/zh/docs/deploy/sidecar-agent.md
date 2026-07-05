# sidecar-agent 部署

`sidecar-agent` 是裸机 / IDC 场景下的本机控制面代理。它连接同机业务服务、本机 Envoy、共享 Consul 和可观测组件，负责 register / drain / deregister、watch/replay、xDS、健康探测和恢复视图。它与 CoreDNS、nftables 和两个 Envoy 的完整关系见 [流量拓扑](./traffic-topology.md)。

它通过 Envoy admin `/ready` 观察外部 Envoy 状态；默认探测间隔为 `2s`，只影响 readiness 摘要，不参与每次业务请求转发。

它不是配置中心、不是 north-south 全局网关，也不是完整 service mesh 平台。

## 部署模式

当前推荐把基础设施和源码进程分开部署：

| 类型 | 组成 | 说明 |
| :--- | :--- | :--- |
| Docker 基础设施 | Consul、CoreDNS、sidecar-agent-envoy | 来自 `/firefly/deploy/docker` |
| 源码进程 | `sidecar-agent` | 从 `/firefly/golang/sidecar-agent` 构建运行 |
| 可观测组件 | OTel Collector、Prometheus 等 | 按环境需要独立启动 |

启动命令：

```bash
cd firefly/golang/sidecar-agent
go run ./cmd/server -config conf/bootstrap.json
```

## 关键端口

标准配置中常用端口包括：

- `18600`：sidecar-agent admin HTTP。
- `18601`：sidecar-agent xDS gRPC。
- `18502`：本机 Envoy listener。
- `18503`：本机 Envoy admin。
- `127.0.0.1:53`：节点级 CoreDNS DNS 入口。
- `18508/18509`：CoreDNS health / ready。
- `18510`：CoreDNS Prometheus metrics。
- `18500`：Consul HTTP。

实际开放策略以仓库的 `PORTS.md` 和部署配置为准。

## 业务服务接入

业务服务通过 `go-consul/agent` 与本机 `sidecar-agent` 交互：

```text
go-layout
  -> go-consul/agent
  -> POST /register
  -> GET /watch
  -> POST /drain
  -> POST /deregister
```

服务能力来源是业务构建产物中的 `dep/protobuf/gen/gateway.manifest.json`。`sidecar-agent` 会把服务注册事实和 route document 写入 Consul，供东西向 Envoy 和 `api-gateway` 消费。

## 数据面协作

`sidecar-agent` 只控制 `sidecar-agent-envoy`，不控制 `api-gateway-envoy`。当前 Envoy bootstrap 中 `node.id` 为 `sidecar-agent-envoy`，静态 xDS cluster 连接宿主机 `host.docker.internal:18601`；Compose 对宿主机发布 `18502` 数据面入口和 `18503` admin。

服务间透明调用由 CoreDNS 和 nftables 把 `*.svc.cluster.local:9090` 导入本机 `sidecar-agent-envoy:18502`：

```text
Service DNS:9090
  -> CoreDNS 返回 127.255.0.1
  -> nftables redirect 到 127.0.0.1:18502
  -> sidecar-agent-envoy 根据 xDS 转发到真实 endpoint
```

## 验收命令

```bash
curl -s http://127.0.0.1:18600/healthz
curl -s http://127.0.0.1:18600/readyz
curl -s http://127.0.0.1:18600/debug/runtime
curl -s http://127.0.0.1:18600/debug/services
curl -s http://127.0.0.1:18600/debug/xds
```

`/healthz` 只表示进程存活，`/readyz` 表示 sidecar 主链就绪。排障时优先看 `/debug/runtime` 和 `/debug/recovery`。

## 当前边界

- authz 按普通业务服务注册，`sidecar-agent` 不给它注入静态兜底地址。
- `sidecar-agent` 不提供 DNS server；节点级 DNS 由 CoreDNS 承担，透明导流由 nftables 和 Envoy 承担。
- ext_authz 固定 fail-close；authz 不可达时 Envoy 请求会失败。
- `Authorization` 不作为 Firefly current 身份入口，不应配置为默认 ext_authz 透传头。
- `x-request-id` 只用于 Envoy 或日志关联；主 trace 传播使用 `traceparent`、`tracestate` 和 `baggage`。
