# CLI 配置参考

Firefly CLI 当前没有全局配置文件。它读取命令行参数、当前仓库的 `.firefly/project.yaml`、环境变量和 AWS SDK 默认凭证链。

## 本地项目配置

`firefly project init` 会生成：

```text
.firefly/project.yaml
```

业务服务项目示例：

```yaml
schema: firefly.project.v1
project:
  type: service
service:
  name: app
  app_id: app
  namespace: lhdht
  language: go
  module: github.com/fireflycore/app
bootstrap:
  file: conf/bootstrap.json
  version_path: app.version
```

业务服务项目只生成 gateway manifest 和 route document facts，不生成或上传 api-gateway HTTP 转码 descriptor pb，也不写入 `descriptor` 或 `s3` 配置块。

proto 项目示例：

```yaml
schema: firefly.project.v1
project:
  type: proto
proto:
  namespace: lhdht
  repo: lhdht/backend/proto
  source: .
  version: v0.0.1
descriptor:
  dir: dep/protobuf/gen
  file_template: ${namespace}/${version}.pb
  current_file_template: ${namespace}/current.pb
  object_key_template: ${namespace}/${version}.pb
  current_object_key_template: ${namespace}/current.pb
  content_type: application/octet-stream
consul:
  address: http://127.0.0.1:18500
  descriptor_current_key: ${namespace}/api-gateway/descriptor/current
s3:
  profile: ""
  region: us-east-1
  endpoint: https://minio.local.com
  bucket: descriptor
  force_path_style: true
```

`project.type` 只支持 `service` 和 `proto`。proto 项目类型直接写 `proto`，不要写成 `proto_repo`。

proto 项目不定义 `service` 或 `bootstrap` 配置块；descriptor 路径模板按 namespace/repo/version 推导，不使用 `${service}` 或 `${app_id}`。

## 解析规则

业务服务项目默认版本字段是 `conf/bootstrap.json` 中的 `app.version`。proto 项目默认使用 `proto.version`。

proto 项目的 descriptor 默认解析规则：

```text
version      = proto.version
file         = descriptor.dir + descriptor.file_template
current_file = descriptor.dir + descriptor.current_file_template
key          = descriptor.object_key_template
current_key  = descriptor.current_object_key_template
current_ref  = s3://{bucket}/{current_key}
consul_kv    = consul.descriptor_current_key
```

`firefly descriptor publish` 会把 descriptor current JSON 写入 Consul KV，例如：

```json
{
  "schema": "firefly.api_gateway.descriptor.v1",
  "namespace": "lhdht",
  "version": "v0.0.1",
  "ref": "s3://descriptor/lhdht/v0.0.1.pb",
  "current_ref": "s3://descriptor/lhdht/current.pb",
  "sha256": "hex-encoded-sha256",
  "proto_repo": "lhdht/backend/proto",
  "source_revision": "git-sha-or-tag",
  "published_at": "2026-06-24T00:00:00Z"
}
```

这里的 `proto_repo` 是来源元数据字段，不是 project type。

## 环境变量

`descriptor push` 和 `descriptor publish` 支持以下环境变量：

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
AWS_REGION=us-east-1
AWS_DEFAULT_REGION=us-east-1
AWS_PROFILE=...
FIREFLY_S3_ENDPOINT=https://minio.local.com
FIREFLY_S3_BUCKET=descriptor
FIREFLY_S3_FORCE_PATH_STYLE=true
```

优先级：

```text
显式命令参数
  -> 环境变量
  -> .firefly/project.yaml
  -> AWS SDK 默认凭证链
```

说明：

- `AWS_SESSION_TOKEN` 用于 STS 临时凭证。
- MinIO 等自建对象存储通常需要 `FIREFLY_S3_FORCE_PATH_STYLE=true` 或 `--force-path-style`。
- CLI 不负责申请 STS，只消费外部已经下发的凭证。

## 缓存目录

`firefly create` 会缓存 `go-layout` 模板。缓存根目录来自系统用户缓存目录，子目录名为 `firefly`，模板按仓库名和 tag 隔离。

CLI 当前不读取 `FIREFLY_HOME` 或 `FIREFLY_DEBUG` 作为全局配置。

## TUI 扩展边界

当前 CLI 不引入 Charmbracelet / Bubble Tea TUI，只保留轻量 stdin prompt 和 flag。

后续如需 TUI，应作为独立展示层接入：

```text
internal/prompt
```

约束：

- TUI 只负责收集和确认输入。
- TUI 不负责模板拉取、文件替换、项目写入或 descriptor 上传。
- `firefly create cms`、`--name`、`--non-interactive` 等脚本化入口必须继续可用。
