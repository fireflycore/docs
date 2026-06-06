# 常用命令

本文按当前 `v0.0.9` 代码说明 Firefly CLI 命令。

## `firefly create`

创建新的 Go 业务服务项目。

```bash
firefly create [name]
```

常用参数：

| 参数 | 说明 |
| :--- | :--- |
| `[name]` | 项目目录名，推荐日常使用，例如 `firefly create cms`。 |
| `--name` | 项目目录名；与位置参数二选一。 |
| `--language` | 当前只支持 `go`，默认 `go`。 |
| `--template-version` | `go-layout` 模板版本，默认 `latest`。 |
| `--module` | Go module 名，默认等于项目名。 |
| `--app-id` | Firefly app id，默认等于项目名。 |
| `--service` | 服务名，默认等于项目名。 |
| `--non-interactive` | 禁用 stdin prompt，适合脚本和 CI。 |

示例：

```bash
firefly create cms \
  --module github.com/fireflycore/cms \
  --app-id cms \
  --service cms \
  --non-interactive
```

模板固定来自 `github.com/fireflycore/go-layout`。`--template-version latest` 会读取模板仓库 tag，并选择最新语义化版本。

## `firefly project init`

在当前业务仓库生成 `.firefly/project.yaml`。

```bash
firefly project init \
  --service app \
  --app-id app \
  --namespace lhdht \
  --module github.com/fireflycore/app \
  --s3-endpoint https://minio.local.com \
  --s3-bucket descriptor \
  --s3-force-path-style
```

常用参数：

| 参数 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `--service` | 当前目录名 | 服务名。 |
| `--app-id` | service | Firefly app id。 |
| `--namespace` | `lhdht` | 服务命名空间。 |
| `--module` | `go.mod` | Go module 名。 |
| `--bootstrap-file` | `conf/bootstrap.json` | 启动配置文件。 |
| `--version-path` | `app.version` | 版本字段路径。 |
| `--descriptor-dir` | `dist/descriptors` | descriptor 输出目录。 |
| `--file-template` | `${version}.pb` | 本地 descriptor 文件名模板。 |
| `--object-key-template` | `${service}/${version}.pb` | S3 object key 模板。 |
| `--descriptor-ref-template` | 空 | descriptor_ref URL 模板。 |
| `--descriptor-ref` | 空 | 固定 descriptor_ref。 |
| `--content-type` | `application/octet-stream` | 上传 content type。 |
| `--s3-region` | `us-east-1` | S3 region。 |
| `--s3-bucket` | `descriptor` | S3 bucket。 |
| `--s3-force-path-style` | `false` | 使用 path-style 地址。 |
| `--overwrite` | `false` | 覆盖已有 `.firefly/project.yaml`。 |

如果设置了 `--s3-endpoint` 且没有显式 descriptor_ref，CLI 会默认生成：

```text
${endpoint}/${bucket}/${service}/${version}.pb
```

## `firefly project info`

展示当前项目元信息、服务版本、descriptor 本地路径、object key、descriptor_ref，以及 go.mod 中可读取到的 Firefly 依赖版本。

```bash
firefly project info
```

示例输出：

```text
config: .firefly/project.yaml
service: app
app_id: app
namespace: lhdht
language: go
module: github.com/fireflycore/app
version: v0.0.1
descriptor.file: dist/descriptors/v0.0.1.pb
descriptor.object_key: app/v0.0.1.pb
descriptor_ref: https://minio.local.com/descriptor/app/v0.0.1.pb
dependencies:
  go-consul: v0.3.3
  go-micro: v1.6.3
```

## `firefly project check`

执行本地静态检查，不连接运行时组件。

```bash
firefly project check
```

检查范围：

- `.firefly/project.yaml`
- `go.mod`
- `Makefile` / `makefile`
- `buf.yaml`
- `buf.gen.yaml`
- `gateway.manifest.json` 常见生成位置
- `conf/bootstrap.json` 中的服务版本
- `dist/descriptors/{version}.pb`
- S3 endpoint、bucket、可见凭证来源

它不会连接 sidecar、gateway、authz、token 服务、配置中心或观测系统。

## `firefly descriptor push`

推送已经存在的 descriptor 文件到 S3 兼容对象存储。

```bash
firefly descriptor push
```

只解析和计算摘要，不上传：

```bash
firefly descriptor push --dry-run
```

常用参数：

| 参数 | 说明 |
| :--- | :--- |
| `--file` | descriptor 文件路径，默认从项目配置和服务版本推导。 |
| `--bucket` | S3 bucket，覆盖项目配置或 `FIREFLY_S3_BUCKET`。 |
| `--key` | S3 object key，默认 `{service}/{version}.pb`。 |
| `--endpoint` | S3 兼容 endpoint，覆盖项目配置或 `FIREFLY_S3_ENDPOINT`。 |
| `--region` | S3 region，覆盖 `AWS_REGION` 或项目配置。 |
| `--profile` | AWS shared config profile。 |
| `--force-path-style` | 使用 S3 path-style 地址。 |
| `--descriptor-ref` | 覆盖命令最终打印的 descriptor_ref。 |
| `--access-key-id` | 显式 S3 access key id。 |
| `--secret-access-key` | 显式 S3 secret access key。 |
| `--session-token` | STS 临时凭证 session token。 |
| `--dry-run` | 不上传，只解析路径和计算 sha256。 |

输出包括：

```text
file
size
sha256
bucket
key
descriptor_ref
pushed
```

## `firefly --version`

查看 CLI 版本：

```bash
firefly --version
```

当前输出：

```text
firefly version v0.0.9
```
