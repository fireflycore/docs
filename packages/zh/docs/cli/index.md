# Firefly CLI 工具

Firefly CLI 是 Firefly 工程侧开发辅助工具，当前版本为 `v0.1.4`。它负责创建 Go 服务项目、维护 `.firefly/project.yaml`，并在 proto 项目中生成、上传和发布 api-gateway descriptor current。

CLI 不接管 sidecar、gateway、authz、token、config、observability 或运行时联调。业务服务项目只表达服务身份、生成 gateway manifest 和发布 route facts；HTTP/JSON 转 gRPC 所需 descriptor 由对应 namespace 的 proto 项目发布。

## 安装

下载 release 二进制后放入系统 `PATH`，然后验证：

```bash
firefly --version
```

源码安装：

```bash
go install github.com/fireflycore/cli/cmd/firefly@v0.1.4
```

## 当前命令

```text
firefly create [name]
firefly project init
firefly project info
firefly project check
firefly descriptor build
firefly descriptor push
firefly descriptor publish
```

`firefly --help` 会额外显示 Cobra 默认的 `completion` 和 `help` 命令。

## 快速创建项目

推荐直接传项目名：

```bash
firefly create cms
```

默认行为：

```text
project dir      = ./cms
template         = github.com/fireflycore/go-layout latest tag
language         = go
Go module        = cms
app.id           = cms
service.name     = cms
project.type     = service
```

指定 module 和 Firefly 身份：

```bash
firefly create cms \
  --module github.com/fireflycore/cms \
  --app-id cms \
  --service cms
```

固定模板版本：

```bash
firefly create cms \
  --template-version v0.3.5 \
  --module github.com/fireflycore/cms
```

如果不传项目名，`firefly create` 会使用轻量 stdin prompt 询问 `Project name`。脚本和 CI 中应使用位置参数或 `--name`，并加上 `--non-interactive`。

## 项目元信息

在业务服务仓库中初始化 `.firefly/project.yaml`：

```bash
firefly project init \
  --type service \
  --service app \
  --app-id app \
  --namespace lhdht \
  --module github.com/fireflycore/app
```

在 proto 仓库中初始化 `.firefly/project.yaml`：

```bash
firefly project init \
  --type proto \
  --namespace lhdht \
  --proto-repo lhdht/backend/proto \
  --proto-source . \
  --proto-version v0.0.1 \
  --consul-address http://127.0.0.1:18500 \
  --s3-endpoint https://minio.local.com \
  --s3-bucket descriptor \
  --s3-force-path-style
```

`project.type` 只支持 `service` 和 `proto`。proto 项目类型直接写 `proto`，不要写成 `proto_repo`；`proto_repo` 只作为 descriptor current JSON 中的来源元数据字段。

proto 项目不定义 `service` 或 `bootstrap` 配置块；descriptor 路径模板按 namespace/repo/version 推导，不使用 `${service}` 或 `${app_id}`。

业务服务项目不写入 `descriptor` 或 `s3` 配置块；descriptor/S3 参数只对 `project.type: proto` 的 proto 仓库生效。

查看解析结果：

```bash
firefly project info
```

本地静态检查：

```bash
firefly project check
```

## 发布 Descriptor

proto 项目负责发布 namespace canonical descriptor：

```bash
firefly descriptor publish
```

该命令会调用 Buf 生成 whole-repo descriptor，上传版本化 pb 与 current pb，并写入 Consul KV：

```text
{namespace}/api-gateway/descriptor/current
```

只生成本地 pb：

```bash
firefly descriptor build
```

只上传已有 pb：

```bash
firefly descriptor push
```

只解析路径和计算摘要，不上传对象、不写 Consul：

```bash
firefly descriptor publish --dry-run
```

默认规则：

```text
version      = proto.version
file         = dep/protobuf/gen/{namespace}/{version}.pb
current_file = dep/protobuf/gen/{namespace}/current.pb
bucket       = descriptor
key          = {namespace}/{version}.pb
current_key  = {namespace}/current.pb
consul_kv    = {namespace}/api-gateway/descriptor/current
```

真实 S3 上传需要 AWS SDK 默认凭证链、AWS profile，或显式凭证参数。
