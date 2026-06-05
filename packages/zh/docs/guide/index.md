# 快速开始

Firefly 当前推荐从 Go 业务服务模板开始。`go-layout` 已经接入当前主线：`go-micro v1.6.3`、`go-consul v0.3.3`、manifest-first 注册、`sidecar-agent` 托管和 `go-micro/service.Context`。

## 1. 准备工具

本地至少需要：

- Go：使用模板 `go.mod` 中声明的版本。
- Buf：生成 Protobuf 代码和 `gateway.manifest.json`。
- Wire：`go install github.com/google/wire/cmd/wire@latest`。
- Goverter：`go install github.com/jmattheis/goverter/cmd/goverter@latest`。
- `protoc-gen-gateway-manifest`：用于生成 Firefly 网关 manifest。

如果使用 Firefly CLI，可以通过 `firefly env` 检查常用工具是否可用。

## 2. 创建 Go 服务

```bash
git clone https://github.com/fireflycore/go-layout.git account-service
cd account-service
./rename_project.sh github.com/your-org/account-service
go mod tidy
```

Windows 环境可以使用仓库内的 `rename_project.bat`。

## 3. 检查启动配置

`go-layout` 当前启动配置由两份文件组成：

- `conf/bootstrap.json`：服务身份、业务端口、management 端口、sidecar-agent、logger、telemetry。
- `conf/consul.json`：Consul client 初始化配置，用于构造运行期配置 Store。

`bootstrap.json` 的主线结构如下：

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
  "sidecar_agent": {
    "base_url": "http://127.0.0.1:15010",
    "grace_period": "20s"
  }
}
```

## 4. 生成与运行

```bash
make generate
make init
make run
```

命令含义：

- `make generate`：执行 `buf generate`，生成 Protobuf 代码、`gateway.manifest.json` 和 Goverter DTO。
- `make init`：执行生成链路、`wire ./cmd/server` 和 `go mod tidy`。
- `make run`：执行 `go run ./cmd/server`。
- `make build`：执行初始化并注入构建信息后编译。

修改 ProviderSet、构造函数签名或依赖关系后，需要重新执行 `wire ./cmd/server` 或 `make init`。

## 5. 接入运行时

裸机 / IDC 阶段推荐使用：

```text
go-layout
  -> go-consul/agent
  -> sidecar-agent
  -> Envoy
  -> Consul
```

业务服务只需要通过 `go-consul/agent` 上报自身服务能力，能力来源是 `dep/protobuf/gen/gateway.manifest.json`。注册、摘流、注销、发现、负载和治理由运行时接管。

开发时可以先启动 `sidecar-agent` 标准版或完整版，再运行业务服务。部署细节见 [Docker 与本地联调](/deploy/docker) 和 [sidecar-agent](/deploy/sidecar-agent)。

## 下一步

- 阅读 [Go 项目指南](/guide/go/project-guide)。
- 理解 [当前主线](/intro/mainline)。
- 配置 [Buf 与代码生成](/deploy/buf)。
