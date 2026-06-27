# API Gateway 部署

`api-gateway` 是 Firefly 裸机场景下的 north-south API 网关控制面。它消费 Consul 中按 namespace 隔离的 route document、健康 endpoint 和 descriptor current，生成入口 Envoy xDS。

`api-gateway` 不负责签发 token、不做接口权限判断、不托管 Envoy / Consul 进程，也不替代旧 `http-gateway` 或旧 `grpc-gateway`。

## 运行入口

```bash
cd /Users/lhdht/product/firefly/api-gateway
go run ./cmd/server -config conf/bootstrap.json
```

默认管理端口：

```text
127.0.0.1:18610
```

默认 xDS gRPC 地址：

```text
127.0.0.1:18611
```

默认入口 Envoy listener：

```text
0.0.0.0:18504
```

Envoy 需要通过 ADS 访问 `xds.listen_address`，入口流量监听地址由 `xds.listener_address` 描述。

## 配置要点

`conf/bootstrap.json` 的关键段落：

```json
{
  "admin": {
    "listen_address": "127.0.0.1:18610"
  },
  "xds": {
    "listen_address": "127.0.0.1:18611",
    "node_id": "api-gateway-envoy",
    "listener_address": "0.0.0.0:18504",
    "route_name": "api-gateway-route"
  },
  "envoy": {
    "admin_address": "127.0.0.1:18505"
  },
  "consul": {
    "address": "127.0.0.1:18500",
    "datacenter": "dc1",
    "refresh_interval": "30s"
  },
  "authz": {
    "service_name": "authz",
    "service_namespace": "lhdht",
    "timeout": "200ms"
  },
  "namespaces": [
    {
      "name": "lhdht",
      "descriptor_current_key": "lhdht/api-gateway/descriptor/current",
      "routes_prefix": "lhdht/routes"
    },
    {
      "name": "story-studio",
      "descriptor_current_key": "story-studio/api-gateway/descriptor/current",
      "routes_prefix": "story-studio/routes"
    }
  ]
}
```

`authz.service_name` 和 `authz.service_namespace` 用来计算 Envoy ext_authz 要调用的普通服务 cluster。authz 没有健康实例时，下发空 EDS，Envoy 按 fail-close 处理。

## Namespace Descriptor

HTTP/JSON 转 gRPC 所需 descriptor 由 proto 项目发布。proto 项目的 `.firefly/project.yaml` 必须使用：

```yaml
project:
  type: proto
```

发布命令：

```bash
firefly descriptor publish
```

发布后，Consul KV 中的 descriptor current key 形如：

```text
{namespace}/api-gateway/descriptor/current
```

例如：

```text
lhdht/api-gateway/descriptor/current
story-studio/api-gateway/descriptor/current
```

`api-gateway` 会按 namespace 拉取 descriptor current JSON，下载并校验对应 pb。不同 proto 仓库生成的 descriptor 不会被合并成一份全局 pb，转码 route 通过 route-level typed per-filter config 绑定自己的 namespace descriptor。

## Route Document

入口路由来自 Consul 中按 namespace 隔离的 route document：

```text
{namespace}/routes/{service_app_id}/current
```

规则：

- `protocol=grpc`：`exact_paths[]` 表示 gRPC 入口事实。
- `http_routes[]`：表示 HTTP/JSON -> gRPC 转码入口，`full_method` 必须属于 `exact_paths[]`。
- 转码 route 使用该 route 所属 namespace 的 descriptor current，不再要求业务服务携带 descriptor 引用。
- `protocol=http`：表示原生 HTTP proxy，不携带 `exact_paths[]` 或 `full_method`。

`api-gateway` 会把 route document 的 `app_id` 写入 Envoy ext_authz `context_extensions.app_id`，authz 内部再映射为 `target_app_id`。

## 调试接口

```bash
curl http://127.0.0.1:18610/healthz
curl http://127.0.0.1:18610/readyz
curl http://127.0.0.1:18610/debug/runtime
curl http://127.0.0.1:18610/debug/namespaces
curl http://127.0.0.1:18610/debug/namespaces/lhdht/routes
curl http://127.0.0.1:18610/debug/namespaces/lhdht/descriptor
curl http://127.0.0.1:18610/debug/consul
curl http://127.0.0.1:18610/debug/descriptors
curl http://127.0.0.1:18610/debug/xds
curl http://127.0.0.1:18610/debug/envoy
curl -X POST http://127.0.0.1:18610/debug/reload
```

排障顺序建议：

1. 先看 `/debug/runtime` 和 `/readyz`。
2. 再看 `/debug/namespaces`、`/debug/consul`、`/debug/xds`、`/debug/envoy`。
3. 最后检查 route document、descriptor current、Consul 服务名和 authz 服务连接。

## 上线前检查

- Envoy、Consul 已由基础设施层启动，api-gateway 能访问 Envoy admin 与 Consul HTTP API。
- `namespaces[]` 已声明目标 namespace、route prefix 和 descriptor current key。
- 对应 namespace 的 proto 项目已发布 descriptor current。
- 业务服务已生成并上报 `gateway.manifest.json`，sidecar-agent 已写入 route document。
- authz / Casbin 策略已区分 HTTP 绑定和 gRPC 绑定。
- Trace 传播使用 `traceparent`、`tracestate` 和 `baggage`。
