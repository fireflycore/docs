# Docker 与本地联调

Firefly 当前没有单一“大一统 compose”。本地联调通常先启动 `/firefly/deploy/docker` 中的标准基础设施，再启动 `sidecar-agent`、业务服务和 `api-gateway` 等源码进程。完整组件关系见 [流量拓扑](./traffic-topology.md)。

可观测性示例栈独立放在 `/firefly/deploy/docker/observability/single`，用于验证 Firefly 输出的 logs、traces 和 metrics 可被 OTel Collector、Vector、Loki、Tempo、Prometheus 和 Grafana 消费。详细入口见 [可观测性部署](./observability.md)。

## 推荐顺序

```text
Consul / CoreDNS / Envoy / OTel
  -> sidecar-agent
  -> authz
  -> go-layout 业务服务
  -> api-gateway
```

最小开发路径可以先只跑：

```text
Consul + CoreDNS + sidecar-agent-envoy
  -> sidecar-agent
  -> go-layout
```

## Docker 基础设施

`firefly/deploy` 仓库提供标准 Docker 基础设施：

```bash
cd firefly/deploy/docker/consul
docker compose up -d

cd ../core-dns
docker compose up -d

cd ../sidecar-agent-envoy
docker compose up -d

cd ../api-gateway-envoy
docker compose up -d
```

常用基础设施端口：

| 端口 | 组件 | 用途 |
| :--- | :--- | :--- |
| `18500` | Consul | HTTP API / UI |
| `18501` | Consul | gRPC |
| `127.0.0.1:53` | CoreDNS | 节点级 Service DNS |
| `18502` | sidecar-agent-envoy | 服务到服务数据面入口 |
| `18503` | sidecar-agent-envoy | Envoy admin |
| `18504` | api-gateway-envoy | north-south HTTP/gRPC 入口 |
| `18505` | api-gateway-envoy | Envoy admin |
| `18506` | east-west-envoy | 预留跨集群入口 |
| `18507` | east-west-envoy | Envoy admin |
| `18508` | CoreDNS | health |
| `18509` | CoreDNS | ready |
| `18510` | CoreDNS | Prometheus metrics |

CoreDNS 每台业务宿主机独立运行，负责把 `*.svc.cluster.local` 解析到本机 mesh VIP；DNS 不负责透明代理，后续导流由本机 nftables 或等价运行时完成。

服务间透明调用的目标形态是：

```text
Service DNS:9090
  -> CoreDNS 返回本机 mesh VIP 127.255.0.1
  -> nftables 将 127.255.0.1:9090 导入 127.0.0.1:18502
  -> sidecar-agent-envoy 根据 authority/path 路由
```

`sidecar-agent-envoy` 的 Docker Compose 只发布 `18502/18503`。不要把 `9090` 作为 Docker 端口映射发布到 Envoy；`9090` 是服务逻辑端口，应由业务进程访问 `Service DNS:9090` 后经本机 nftables 透明导入 `18502`。

`api-gateway-envoy` 的 Docker Compose 只发布 `18504/18505`，并只读挂载 `/opt/store/api-gateway/bin/var/data/descriptor`，用于读取 `api-gateway` 运行时维护的 gRPC-JSON transcoder descriptor。

## sidecar-agent 源码进程

基础设施启动后，再启动 `sidecar-agent` 源码进程：

```bash
cd firefly/golang/sidecar-agent
go run ./cmd/server -config conf/bootstrap.json
```

启动后至少检查：

```bash
curl -s http://127.0.0.1:18600/healthz
curl -s http://127.0.0.1:18600/readyz
curl -s http://127.0.0.1:18600/debug/runtime
```

## 运行业务服务

业务服务使用 `go-layout` 模板时，先确认：

- `conf/bootstrap.json.sidecar_agent.base_url` 指向本机 `sidecar-agent` admin 地址。
- `conf/consul.json` 指向当前联调用的 Consul。
- `dep/protobuf/gen/gateway.manifest.json` 已由 `buf generate` 生成。

然后运行：

```bash
cd firefly/golang/go-layout
make init
make run
```

业务服务启动后，`go-consul/agent` 会与本机 `sidecar-agent` 建立 watch/replay，并按 manifest 执行注册。

## api-gateway

入口网关控制面由 `api-gateway` 仓库运行：

```bash
cd firefly/golang/api-gateway
go run ./cmd/server -config conf/bootstrap.json
```

源码默认监听管理面；本机访问可使用 `127.0.0.1:18610`：

```text
0.0.0.0:18610
```

源码默认监听 xDS gRPC；Envoy Docker bootstrap 通过 `host.docker.internal:18611` 访问：

```text
0.0.0.0:18611
```

默认入口 Envoy listener：

```text
0.0.0.0:18504
```

`api-gateway` 不托管 Envoy、Consul、CoreDNS 或它们的静态启动配置，只通过 xDS、Envoy admin API、Consul HTTP API 和本地 descriptor cache 协作。

如果要验证 HTTP/JSON -> gRPC 转码，先由对应 namespace 的 proto 项目发布 descriptor current：

```bash
firefly descriptor publish
```

默认 Consul KV：

```text
{namespace}/api-gateway/descriptor/current
```

## 排障入口

- `sidecar-agent`：`/debug/runtime`、`/debug/services`、`/debug/xds`。
- `api-gateway`：`/debug/runtime`、`/debug/consul`、`/debug/xds`、`/debug/envoy`。
- `go-layout`：management 端口 `/health`、`/ready`、`/info`、`/metrics`。

如果入口路由没有出现，优先检查业务服务是否生成并上报了 `gateway.manifest.json`、sidecar-agent 是否写入 `{namespace}/routes/{service_app_id}/current`，以及 proto 项目是否发布 `{namespace}/api-gateway/descriptor/current`。
