# API Gateway 部署

`api-gateway` 是 Firefly 裸机场景下的 north-south API 网关控制面。它消费 `sidecar-agent` 写入 Consul 的 route document、健康 endpoint 和 `descriptor_ref`，生成入口 Envoy xDS。

`api-gateway` 不负责签发 token、不做接口权限判断、不托管 Envoy / Consul 进程，也不替代旧 `http-gateway` 或旧 `grpc-gateway`。

## 运行入口

```bash
cd /Users/lhdht/product/firefly/api-gateway
go run ./cmd/server -config conf/bootstrap.json
```

默认管理端口：

```text
127.0.0.1:18080
```

默认 xDS gRPC 地址：

```text
127.0.0.1:18081
```

Envoy 需要通过 ADS 访问 `xds.listen_address`，入口流量监听地址由 `xds.listener_address` 描述。

## 配置要点

`conf/bootstrap.json` 的关键段落：

```json
{
  "admin": {
    "listen_address": "127.0.0.1:18080"
  },
  "xds": {
    "listen_address": "127.0.0.1:18081",
    "node_id": "api-gateway-dev",
    "listener_address": "0.0.0.0:10080",
    "route_name": "api-gateway-route"
  },
  "envoy": {
    "admin_address": "127.0.0.1:19000"
  },
  "consul": {
    "address": "127.0.0.1:8500",
    "datacenter": "dc1",
    "refresh_interval": "30s"
  },
  "authz": {
    "service_name": "authz",
    "service_namespace": "lhdht",
    "timeout": "200ms"
  }
}
```

`authz.service_name` 和 `authz.service_namespace` 用来计算 Envoy ext_authz 要调用的普通服务 cluster。authz 没有健康实例时，下发空 EDS，Envoy 按 fail-close 处理。

## Route Document

入口路由来自 Consul 中的 route document：

- `protocol=grpc`：`exact_paths[]` 表示 gRPC 入口事实。
- `http_routes[]`：表示 HTTP/JSON -> gRPC 转码入口，`full_method` 必须属于 `exact_paths[]`。
- 存在转码 route 时必须提供 HTTP/HTTPS `descriptor_ref`。
- `protocol=http`：表示原生 HTTP proxy，不携带 `exact_paths[]`、`full_method` 或 `descriptor_ref`。

`api-gateway` 会把 route document 的 `app_id` 写入 Envoy ext_authz `context_extensions.app_id`，authz 内部再映射为 `target_app_id`。

## 调试接口

```bash
curl http://127.0.0.1:18080/healthz
curl http://127.0.0.1:18080/readyz
curl http://127.0.0.1:18080/debug/runtime
curl http://127.0.0.1:18080/debug/consul
curl http://127.0.0.1:18080/debug/descriptors
curl http://127.0.0.1:18080/debug/xds
curl http://127.0.0.1:18080/debug/envoy
curl -X POST http://127.0.0.1:18080/debug/reload
```

排障顺序建议：

1. 先看 `/debug/runtime` 和 `/readyz`。
2. 再看 `/debug/consul`、`/debug/xds`、`/debug/envoy`。
3. 最后检查 route document、`descriptor_ref`、Consul 服务名和 authz 服务连接。

## 上线前检查

- Envoy、Consul 已由基础设施层启动，api-gateway 能访问 Envoy admin 与 Consul HTTP API。
- 健康实例 meta 中存在 `route_config_ref`，且对应 KV 可读取。
- 转码 route 的 descriptor 可下载、可解析、可合并。
- authz / Casbin 策略已区分 HTTP 绑定和 gRPC 绑定。
- Trace 传播使用 `traceparent`、`tracestate` 和 `baggage`。
