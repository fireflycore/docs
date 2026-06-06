# CLI 配置参考

Firefly CLI 当前没有全局配置文件。它只读取命令行参数、当前业务仓库的 `.firefly/project.yaml`、环境变量和 AWS SDK 默认凭证链。

## 本地项目配置

`firefly project init` 会生成：

```text
.firefly/project.yaml
```

典型结构：

```yaml
schema: firefly.project.v1
service:
  name: app
  app_id: app
  namespace: lhdht
  language: go
  module: github.com/fireflycore/app
bootstrap:
  file: conf/bootstrap.json
  version_path: app.version
descriptor:
  dir: dist/descriptors
  file_template: ${version}.pb
  object_key_template: ${service}/${version}.pb
  descriptor_ref_template: ${endpoint}/${bucket}/${service}/${version}.pb
  content_type: application/octet-stream
s3:
  profile: ""
  region: us-east-1
  endpoint: https://minio.local.com
  bucket: descriptor
  force_path_style: true
```

默认解析规则：

```text
version = bootstrap.file 中 version_path 指向的值
file    = descriptor.dir + descriptor.file_template
key     = descriptor.object_key_template
ref     = descriptor.descriptor_ref_template 或 descriptor.descriptor_ref
```

当前默认版本字段是 `conf/bootstrap.json` 中的 `app.version`。

## Descriptor 配置

本地 descriptor 默认路径：

```text
dist/descriptors/{version}.pb
```

S3 object key 默认：

```text
{service}/{version}.pb
```

descriptor_ref 默认可由 `s3.endpoint`、`s3.bucket`、`service` 和 `version` 推导：

```text
{endpoint}/{bucket}/{service}/{version}.pb
```

如果使用非 S3 静态资源托管，可以手动配置 `descriptor.descriptor_ref`。当前 CLI 不自动上传普通 HTTP 静态资源，只支持 S3 兼容 PutObject。

## 环境变量

`descriptor push` 支持以下环境变量：

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
