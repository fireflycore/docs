# sidecar-agent 部署

`sidecar-agent` 是裸机 / IDC 场景下的本机控制面代理。它连接同机业务服务、本机 Envoy、共享 Consul 和可观测组件，负责 register / drain / deregister、watch/replay、xDS、DNS、健康探测和恢复视图。

它不是配置中心、不是 north-south 全局网关，也不是完整 service mesh 平台。

## 部署模式

仓库当前保留三种模式：

| 模式 | 组成 | 适用场景 |
| :--- | :--- | :--- |
| 最小版 | `sidecar-agent` | 生产默认样例，外部提供 Consul、Envoy admin 和 OTel。 |
| 标准版 | `sidecar-agent + Consul + Envoy` | 本地开发和小团队联调。 |
| 完整版 | `sidecar-agent + Consul + Envoy + OTel Collector + Prometheus` | 完整链路和可观测验证。 |

启动命令：

```bash
cd /Users/lhdht/product/firefly/sidecar-agent
docker compose up --build -d
docker compose -f docker-compose.standard.yml up --build -d
docker compose -f docker-compose.full.yml up --build -d
```

## 关键端口

标准配置中常用端口包括：

- `18510`：sidecar-agent admin HTTP。
- `18511`：sidecar-agent xDS gRPC。
- `18502`：本机 Envoy listener。
- `19000`：Envoy admin。
- `8500`：Consul HTTP。

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

## 验收命令

```bash
curl -s http://127.0.0.1:18510/healthz
curl -s http://127.0.0.1:18510/readyz
curl -s http://127.0.0.1:18510/debug/runtime
curl -s http://127.0.0.1:18510/debug/services
curl -s http://127.0.0.1:18510/debug/xds
```

`/healthz` 只表示进程存活，`/readyz` 表示 sidecar 主链就绪。排障时优先看 `/debug/runtime` 和 `/debug/recovery`。

## 当前边界

- authz 按普通业务服务注册，`sidecar-agent` 不给它注入静态兜底地址。
- ext_authz 固定 fail-close；authz 不可达时 Envoy 请求会失败。
- `Authorization` 不作为 Firefly current 身份入口，不应配置为默认 ext_authz 透传头。
- `x-request-id` 只用于 Envoy 或日志关联；主 trace 传播使用 `traceparent`、`tracestate` 和 `baggage`。
