# 配置详解

`go-layout` 当前配置主线是：

```text
conf/bootstrap.json
  -> conf/consul.json
  -> Consul Client
  -> go-micro/config.Store
  -> LoadStoreConfig 加载 MySQL、Redis 等运行期配置
```

模板默认只装配启动期读取链路。`go-micro/config` 数据面支持 watch，但业务服务如需运行时热更新，需要自行接入 watcher 和组件重载策略。

## 引导配置

`bootstrap.json` 是服务启动时读取的第一份配置，负责描述服务自身身份、监听端口、sidecar-agent、logger 和 telemetry。

```json
{
  "app": {
    "id": "00000000-0000-0000-0000-000000000000",
    "env": "prod",
    "name": "go-layout",
    "secret": "replace-me",
    "version": "v0.0.1"
  },
  "logger": {
    "console": true,
    "remote": false
  },
  "service": {
    "name": "go-layout",
    "type": "svc",
    "namespace": "default",
    "cluster_domain": "cluster.local",
    "port": 9090,
    "weight": 100
  },
  "telemetry": {
    "otlp_endpoint": "",
    "insecure": true,
    "traces": true,
    "metrics": true,
    "logs": false
  },
  "server_port": 10500,
  "managed_port": 10501,
  "load_config_mode": "store",
  "sidecar_agent": {
    "base_url": "http://127.0.0.1:15010",
    "grace_period": "20s"
  }
}
```

## 字段说明

- `app`：应用身份、环境、密钥、版本和启动时生成的实例 ID。
- `service`：业务服务名、命名空间、集群域、默认服务端口和权重。
- `server_port`：当前进程业务 gRPC 监听端口。
- `managed_port`：当前进程自管理 HTTP 端口。
- `sidecar_agent`：本机 sidecar-agent 管理地址和优雅摘流宽限期。
- `logger`：本地 console 和远端 OTel 日志开关。
- `telemetry`：OTel collector 地址和 traces / metrics / logs 开关。

## 运行期组件配置

运行期组件配置由 `internal/conf` 中的 loader 负责读取，例如：

- `internal/conf/mysql.go`
- `internal/conf/redis.go`

这些 loader 会根据：

- `bootstrapConfig.App.Id`
- `bootstrapConfig.App.Env`
- `bootstrapConfig.App.Secret`
- 配置分组和名称

从 `go-micro/config.Store` 读取当前生效配置。

## Consul 配置

`conf/consul.json` 用于初始化 Consul client，并进一步构造 `go-micro/config.Store`。

当前模板中，Consul 是裸机 / IDC 阶段的默认运行期配置后端。云原生环境可以在后续演进中替换为 Kubernetes 适配层，但业务代码应继续面向 `go-micro/config` 契约。

## 不再推荐的旧口径

当前官方文档不再推荐：

- 使用 `load_conf_mode=local/remote` 作为模板默认配置主线
- 通过业务服务直接调用 Config Service 获取 MySQL / Redis 配置
- 在 `go-micro/config` 根包中定义业务侧 `BootstrapConfig` 接口
- 把 ETCD 注册配置写入 `bootstrap.json` 作为当前主线
