# Docker 与本地联调

Firefly 当前没有单一“大一统 compose”。本地联调通常按组件仓库分别启动：先启动 `sidecar-agent` 的运行时底座，再启动 Go 业务服务；如果要验证 north-south 入口，再加入 `api-gateway` 和入口 Envoy。

## 推荐顺序

```text
Consul / Envoy / OTel
  -> sidecar-agent
  -> authz
  -> go-layout 业务服务
  -> api-gateway
```

最小开发路径可以先只跑：

```text
sidecar-agent 标准版
  -> go-layout
```

## sidecar-agent compose

`sidecar-agent` 仓库提供三种 compose 模式：

```bash
cd /Users/lhdht/product/firefly/sidecar-agent

# 最小版：只启动 sidecar-agent，外部提供 Consul / Envoy / OTel
docker compose up --build -d

# 标准版：sidecar-agent + Consul + Envoy
docker compose -f docker-compose.standard.yml up --build -d

# 完整版：标准版 + OTel Collector + Prometheus
docker compose -f docker-compose.full.yml up --build -d
```

标准版适合本地开发和小团队联调。启动后至少检查：

```bash
curl -s http://127.0.0.1:18510/healthz
curl -s http://127.0.0.1:18510/readyz
curl -s http://127.0.0.1:18510/debug/runtime
```

## 运行业务服务

业务服务使用 `go-layout` 模板时，先确认：

- `conf/bootstrap.json.sidecar_agent.base_url` 指向本机 `sidecar-agent` admin 地址。
- `conf/consul.json` 指向当前联调用的 Consul。
- `dep/protobuf/gen/gateway.manifest.json` 已由 `buf generate` 生成。

然后运行：

```bash
cd /Users/lhdht/product/firefly/go-layout
make init
make run
```

业务服务启动后，`go-consul/agent` 会与本机 `sidecar-agent` 建立 watch/replay，并按 manifest 执行注册。

## api-gateway

入口网关控制面由 `api-gateway` 仓库运行：

```bash
cd /Users/lhdht/product/firefly/api-gateway
go run ./cmd/server -config conf/bootstrap.json
```

默认管理面：

```text
127.0.0.1:18610
```

默认 xDS gRPC：

```text
127.0.0.1:18611
```

默认入口 Envoy listener：

```text
0.0.0.0:18504
```

`api-gateway` 不托管 Envoy、Consul 或它们的静态启动配置，只通过 xDS、Envoy admin API 和 Consul HTTP API 协作。

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
