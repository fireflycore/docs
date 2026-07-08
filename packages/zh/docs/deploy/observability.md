# 可观测性部署

Firefly 的可观测性链路负责框架层遥测事实的产生、传输、存储组合和示例展示，覆盖 OTel / W3C Trace Context、logs、traces、metrics、Collector、Prometheus、Loki、Tempo、Grafana、Alertmanager 以及基础设施探测入口。

生产查询聚合、租户与应用隔离、告警运营、后台 API 和权限治理不属于 Firefly 框架能力，应由上层生态服务承接。

## 事实源

可执行部署资产位于：

```text
firefly/deploy/docker/observability
```

当前可执行资产只落地到：

```text
firefly/deploy/docker/observability/single
```

`multi/` 当前只保留多机、跨网络或分层部署的目录说明，尚未放置可执行编排文件。文档站只同步框架级结构、端口、数据流和接入口径，不保存 compose、config、dashboard 或 rules 的副本。

## 单机组件

`single/` 使用组件独立目录，每个中间件都有自己的 `docker-compose.yaml`，不依赖共享 `.env`、`env_file` 或 `${VAR}` 变量插值。

| 层级 | 组件 | 职责 |
| :--- | :--- | :--- |
| 采集入口 | OTel Collector | 接收 OTLP traces / logs / metrics，处理后导出到 Tempo、Vector 和 Prometheus |
| 日志转发 | Vector | 接收 Collector 转发的 OTLP logs，做结构化转换、低基数标签归一化、2GiB disk buffer 和 Loki 写入 |
| 存储 | Loki / Tempo / Prometheus | 分别存储日志、Trace 和指标 |
| 展示与告警 | Grafana / Alertmanager / webhook-adapter | 示例面板、告警状态和企业微信 webhook 适配 |
| 基础设施观测 | node-exporter / cAdvisor / blackbox-exporter / process-exporter / CoreDNS metrics | 宿主机、容器、外部探测、裸机进程和节点级 DNS 指标 |

## 启动顺序

```bash
cd firefly/deploy/docker/observability/single

docker network create observability-net

docker compose -f ./loki/docker-compose.yaml up -d
docker compose -f ./vector/docker-compose.yaml up -d
docker compose -f ./tempo/docker-compose.yaml up -d
docker compose -f ./webhook-adapter/docker-compose.yaml up -d
docker compose -f ./blackbox-exporter/docker-compose.yaml up -d
docker compose -f ./cadvisor/docker-compose.yaml up -d
docker compose -f ./node-exporter/docker-compose.yaml up -d
docker compose -f ./process-exporter/docker-compose.yaml up -d
docker compose -f ./prometheus/docker-compose.yaml up -d
docker compose -f ./alertmanager/docker-compose.yaml up -d
docker compose -f ./grafana/docker-compose.yaml up -d
docker compose -f ./otel-collector/docker-compose.yaml up -d
```

Windows PowerShell 可先运行：

```powershell
./create-network.ps1
```

## 端口规划

| 端口 | 组件 | 用途 |
| :--- | :--- | :--- |
| `10901` | OTel Collector | OTLP gRPC |
| `10902` | OTel Collector | OTLP HTTP |
| `10903` | OTel Collector | Collector metrics |
| `10904` | OTel Collector | Collector health |
| `10905` | Loki | Loki HTTP API |
| `10906` | Tempo | Tempo HTTP API |
| `10907` | Prometheus | Web UI / API |
| `10908` | Alertmanager | Web UI / API |
| `10909` | Grafana | Web UI |
| `10910` | node-exporter | Linux host metrics，host network |
| `10911` | cAdvisor | Container metrics |
| `10912` | blackbox-exporter | External probe metrics |
| `10913` | process-exporter | Bare-metal process metrics |

`vector` 和 `webhook-adapter` 只在 `observability-net` 内部网络中暴露，不占用宿主机端口。

CoreDNS metrics 由 `firefly/deploy/docker/core-dns` 暴露在宿主机 `18510`，Prometheus 通过 `host.docker.internal:18510` 抓取。它属于基础设施 DNS 组件，不占用观测栈自身 `109xx` 端口段。

## 数据流

业务服务遥测：

```text
gRPC / HTTP services
  -> OTel Collector
     |- traces  -> Tempo
     |- logs    -> Vector -> Loki
     `- metrics -> Prometheus
```

Firefly 控制面遥测：

```text
sidecar-agent / api-gateway
  |- logs/traces -> OTel Collector -> Loki / Tempo
  `- metrics     -> admin /metrics -> Prometheus firefly-control-plane job
```

Envoy 数据面访问日志：

```text
api-gateway-envoy / sidecar-agent-envoy
  -> Envoy OpenTelemetry access logger
  -> OTLP/gRPC
  -> OTel Collector
  -> Vector
  -> Loki
```

基础设施指标：

```text
Linux host          -> node-exporter     -> Prometheus
bare-metal process  -> process-exporter  -> Prometheus
container runtime   -> cAdvisor          -> Prometheus
Service DNS         -> CoreDNS           -> Prometheus
external probe      -> blackbox-exporter -> Prometheus
```

当前 Collector 配置使用 `memory_limiter`、`resourcedetection`、tail sampling 和分类型 batch。日志默认导出到 `otlp_grpc/vector`；仅在临时排障时切换到 `otlp_http/loki` 直写 Loki。

Vector 会把 `service`、`service_namespace`、`log_type`、`level`、`env`、`component`、`envoy_role`、`host_ip`、`instance`、`cluster`、`zone`、`response_code_class`、`request_kind`、`route_status` 作为 Loki 低基数 label；`app_id`、`path`、`x_request_id`、`traceId`、`spanId`、`user_agent` 等高基数字段保留在日志 JSON 字段中，不作为 Loki label，避免 stream 基数膨胀。租户维度后续通过全局唯一 `app_id` 反查，不在日志链路兜底写入 `tenant_id=unknown`。

访问日志统一使用 `log_type=access`。业务服务和 authz 的访问日志继续由现有 `go-micro` accesslogger 中间件通过 OTLP 写入；`api-gateway-envoy` 和 `sidecar-agent-envoy` 的访问日志由 HCM OpenTelemetry access logger 通过 OTLP/gRPC 写入 Collector，再经 Vector 归一化到同一 Loki。Envoy 与服务之间通过 `traceparent`、`tracestate`、`baggage`、`traceId`、`spanId` 和 `x_request_id` 串联，不额外拆分日志类型。

Tempo 2.10 的 Grafana Traces Drilldown / TraceQL metrics 依赖 metrics-generator 的 `local-blocks` processor；service graph / span metrics 仍 remote_write 到 Prometheus，当前单机配置默认不启用 `flush_to_storage`。

## Prometheus 目标

Prometheus 主配置中包含这些关键 job：

| job | 来源 | 说明 |
| :--- | :--- | :--- |
| `otel-collector` | static config | Collector 自身指标 |
| `vector` | static config | Vector 接收、buffer 和 Loki sink 指标 |
| `firefly-control-plane` | file_sd | `sidecar-agent`、`api-gateway` 等控制面 admin `/metrics` |
| `grpc-services` | file_sd | 业务 gRPC 服务管理端口 `/metrics` |
| `process-exporter` | static config | 裸机业务服务和控制面进程级资源 |
| `coredns` | static config | 节点级 Service DNS 指标 |
| `blackbox-http` | blackbox exporter | Grafana、Prometheus、Loki、Tempo、Alertmanager、Collector health 探测 |

业务服务目标维护在：

```text
prometheus/config/file_sd/grpc-services.yaml
```

示例：

```yaml
- targets: ["host.docker.internal:10501"]
  labels:
    service_name: config
    service_namespace: lhdht
    app_id: 01973348-008b-7800-b709-56d552df1ef7
```

Firefly 控制面目标维护在：

```text
prometheus/config/file_sd/control-plane-services.yaml
```

示例：

```yaml
- targets: ["host.docker.internal:18600"]
  labels:
    service_name: sidecar-agent
    service_namespace: firefly
    component: control-plane
```

## Grafana

默认入口：

```text
http://127.0.0.1:10909
```

默认账号为 `admin`，默认密码为 `changeme`。

Grafana provisioning 当前加载：

- `Prometheus`：指标，默认数据源。
- `Loki`：日志，配置 `traceId` / `spanId` Derived Fields，可跳转 Tempo。
- `Tempo`：Trace，配置 service map、node graph 和 Loki 反查。
- `AlertManager`：Prometheus Alertmanager 告警状态。

当前面板覆盖 Linux 主机、容器、Prometheus、Blackbox、Loki / Vector 日志管道、Firefly 控制面、CoreDNS、`api-gateway-envoy`、`sidecar-agent-envoy` 和 LHDHT 业务服务总览。LHDHT 业务面板是生态消费示例，不表示 Firefly 承接 LHDHT 查询聚合、权限隔离或运营 API。

容器内存面板用于观察运行态趋势。判断当前占用时优先看 `Last`，`Max` 表示所选时间范围内曾经出现过的峰值；发布、重启或 xDS 配置异常恢复后，较长时间范围内的 `Max` 仍可能保留旧峰值。需要和服务器当前值对齐时，可用 Prometheus instant query、`docker stats` 和组件 admin memory 接口交叉确认：

```promql
max by (name) (container_memory_rss{name="api-gateway-envoy"})
max by (name) (container_memory_working_set_bytes{name="api-gateway-envoy"})
```

## 服务接入

同一 Docker network 内的服务使用：

```text
otel-collector:4317
```

宿主机或外部进程直连当前 single 栈时使用：

```text
127.0.0.1:10901
```

如果每台业务机部署本机 OTel Collector Agent，则业务服务继续使用：

```text
127.0.0.1:4317
```

多机或跨网络采集推荐形态是：

```text
service -> local OTel Collector Agent -> mTLS -> central Collector / Gateway
```

跨公网或跨网段时不要直接把中心 Collector 的 `4317/4318` 对公网全开放；应通过 mTLS、网关、IP 白名单、限流和证书轮换治理写入链路。

## 健康检查

```bash
curl http://localhost:10904/
curl http://localhost:10905/ready
curl http://localhost:10906/ready
curl http://localhost:10907/-/healthy
curl http://localhost:10908/-/healthy
curl http://localhost:10909/api/health
curl http://localhost:10910/metrics
curl http://localhost:10911/healthz
curl http://localhost:10912/-/healthy
curl http://localhost:10913/metrics
curl http://localhost:18510/metrics
```

Prometheus reload：

```bash
curl -X POST http://localhost:10907/-/reload
```

最近 10 分钟关键日志：

```bash
docker compose -f ./otel-collector/docker-compose.yaml logs --since=10m otel-collector
docker compose -f ./vector/docker-compose.yaml logs --since=10m vector
docker compose -f ./prometheus/docker-compose.yaml logs --since=10m prometheus
docker compose -f ./alertmanager/docker-compose.yaml logs --since=10m alertmanager
docker compose -f ./process-exporter/docker-compose.yaml logs --since=10m process-exporter
```

## 镜像版本

镜像版本以 `firefly/deploy/docker/observability/single/*/docker-compose.yaml` 为准。

| 组件 | 镜像 |
| :--- | :--- |
| OTel Collector | `otel/opentelemetry-collector-contrib:0.151.0` |
| Vector | `timberio/vector:0.55.0-debian` |
| Loki | `grafana/loki:3.6.10` |
| Tempo | `grafana/tempo:2.10.5` |
| Prometheus | `prom/prometheus:v3.11.3` |
| Alertmanager | `prom/alertmanager:v0.32.1` |
| webhook-adapter | `bougou/alertmanager-webhook-adapter:v1.1.11` |
| Grafana | `grafana/grafana:12.4.3` |
| node-exporter | `prom/node-exporter:v1.11.1` |
| cAdvisor | `gcr.io/cadvisor/cadvisor:v0.55.1` |
| blackbox-exporter | `prom/blackbox-exporter:v0.28.0` |
| process-exporter | `ncabatoff/process-exporter:latest` |

`process-exporter` 当前仍使用 `latest`，长期测试或生产化前应改成固定 tag。
