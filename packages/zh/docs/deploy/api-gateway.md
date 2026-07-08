# API Gateway 部署

`api-gateway` 是 Firefly 裸机场景下的 north-south API 网关控制面。它消费 Consul 中按 namespace 隔离的 route document、健康 endpoint 和 descriptor current，生成入口 Envoy xDS。它与 `api-gateway-envoy`、`sidecar-agent` 和服务间透明导流的完整关系见 [流量拓扑](./traffic-topology.md)。

`api-gateway` 不负责签发 token、不做接口权限判断、不托管 Envoy / Consul 进程，也不替代旧 `http-gateway` 或旧 `grpc-gateway`。

## 运行入口

```bash
cd firefly/golang/api-gateway
go run ./cmd/server -config conf/bootstrap.json
```

源码默认监听管理端口；本机访问可使用 `127.0.0.1:18610`：

```text
0.0.0.0:18610
```

源码默认监听 xDS gRPC 地址；Envoy Docker bootstrap 通过 `host.docker.internal:18611` 访问：

```text
0.0.0.0:18611
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
    "listen_address": "0.0.0.0:18610"
  },
  "xds": {
    "listen_address": "0.0.0.0:18611",
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
  "descriptor": {
    "dir": "/opt/firefly/descriptor"
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

本机开发或测试环境可以按环境把 `consul.address` 改成实际 Consul 地址；以实际部署的 `conf/bootstrap.json` 为准。

`descriptor.dir` 是 `api-gateway` 与 `api-gateway-envoy` 共同可见的 descriptor 缓存根目录。首字符为 `/` 时按绝对路径使用，适合配置为 `/opt/firefly/descriptor` 这类稳定外挂目录；相对路径按 `api-gateway` 部署基目录解析，不能是 `.`、`..` 或 `../...` 逃逸路径。

`authz.service_name` 和 `authz.service_namespace` 用来计算 Envoy ext_authz 要调用的普通服务 cluster。authz 没有健康实例时，下发空 EDS，Envoy 按 fail-close 处理。

## 与 api-gateway-envoy 的关系

`api-gateway` 只控制 `api-gateway-envoy`，不控制 `sidecar-agent-envoy`。当前 Envoy bootstrap 中 `node.id` 为 `api-gateway-envoy`，静态 xDS cluster 连接宿主机 `host.docker.internal:18611`；Compose 对宿主机发布 `18504` north-south 数据面入口和 `18505` admin。

`api-gateway-envoy` 额外只读挂载 `descriptor.dir` 对应目录，例如 `/opt/firefly/descriptor`，用于读取 gRPC-JSON transcoder 所需 descriptor。该目录由宿主机上的 `api-gateway` 进程维护，Envoy 只读访问。

`api-gateway-envoy` 的 HCM 会输出 stdout JSON 访问日志，并统一写 `log_type=access`。未命中 route 的 `404/route_not_found` 不会进入 ext_authz 或 authz 服务日志，但会由该 Envoy 访问日志记录。命中 route 的请求会透传 `traceparent`、`tracestate`、`baggage` 和 `x-request-id`，用于和 authz、业务服务访问日志关联；`x-request-id` 不是业务身份输入，也不是主 trace 链路。


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

`api-gateway` 会按 namespace 拉取 descriptor current JSON，下载并校验对应 pb。不同 proto 仓库生成的 descriptor 不会被合并成一份全局 pb；每条转码 route 按 namespace 关联自己的 descriptor current。同一个 descriptor 被多条 route 使用时，`api-gateway` 只生成一份 descriptor-scoped `grpc_json_transcoder` filter，避免 Envoy 重复加载同一 descriptor。

descriptor 不只需要能解析成 `google.protobuf.FileDescriptorSet`，还必须包含 route document 中转码 route 声明的 `grpc_service`。如果 descriptor 缺少目标 proto service，`api-gateway` 会拒绝发布新 xDS 并在 `/debug/xds.snapshot_error` 暴露错误，避免把必然被 Envoy RDS NACK 的配置下发给 `api-gateway-envoy`。

## Route Document

入口路由来自 Consul 中按 namespace 隔离的 route document：

```text
{namespace}/routes/{service_app_id}/current
```

规则：

- `protocol=grpc`：`exact_paths[]` 表示 gRPC 入口事实。
- `http_routes[]`：表示 HTTP/JSON -> gRPC 转码入口，`full_method` 必须属于 `exact_paths[]`。
- 转码 route 使用该 route 所属 namespace 的 descriptor current，不再要求业务服务携带 descriptor 引用；descriptor current 必须覆盖该 route 的 proto service。
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
3. 最后检查 route document、descriptor current、Consul 服务名和 authz 服务连接；若 `/debug/xds.snapshot_error` 提示 service 不在 descriptor 中，先重新发布 namespace descriptor current。

## 上线前检查

- Envoy、Consul 已由基础设施层启动，api-gateway 能访问 Envoy admin 与 Consul HTTP API。
- `namespaces[]` 已声明目标 namespace、route prefix 和 descriptor current key。
- 对应 namespace 的 proto 项目已发布 descriptor current，且 `/debug/descriptors` 中的 `grpc_services` 覆盖所有转码 route。
- 业务服务已生成并上报 `gateway.manifest.json`，sidecar-agent 已写入 route document。
- authz / Casbin 策略已区分 HTTP 绑定和 gRPC 绑定。
- Trace 传播使用 `traceparent`、`tracestate` 和 `baggage`。
