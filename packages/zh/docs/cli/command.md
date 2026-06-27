# 常用命令

本文按当前 `v0.1.3` 代码说明 Firefly CLI 命令。

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

在当前仓库生成 `.firefly/project.yaml`。

业务服务项目：

```bash
firefly project init \
  --type service \
  --service app \
  --app-id app \
  --namespace lhdht \
  --module github.com/fireflycore/app
```

proto 项目：

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

常用参数：

| 参数 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `--type` | `service` | 项目类型，只支持 `service` 或 `proto`。 |
| `--service` | 当前目录名 | 业务服务名。 |
| `--app-id` | service | Firefly app id。 |
| `--namespace` | `lhdht` | 服务或 proto 项目的 namespace。 |
| `--module` | `go.mod` | Go module 名。 |
| `--proto-repo` | 空 | proto-only，proto 来源标识，例如 `lhdht/backend/proto`。 |
| `--proto-module` | 空 | proto-only，Buf module 名或本地 module 标识。 |
| `--proto-source` | `.` | proto-only，proto 项目执行 `buf build` 的来源。 |
| `--proto-version` | `v0.0.1` | proto-only，proto descriptor 发布版本。 |
| `--descriptor-dir` | `dep/protobuf/gen` | proto-only，descriptor 输出目录。 |
| `--file-template` | 按 proto 项目推导 | proto-only，本地版本化 descriptor 文件名模板。 |
| `--current-file-template` | `${namespace}/current.pb` | proto-only，本地 current descriptor 文件名模板。 |
| `--object-key-template` | `${namespace}/${version}.pb` | proto-only，S3 object key 模板。 |
| `--current-object-key-template` | `${namespace}/current.pb` | proto-only，current S3 object key 模板。 |
| `--descriptor-current-key` | `${namespace}/api-gateway/descriptor/current` | proto-only，写入 Consul KV key。 |
| `--content-type` | `application/octet-stream` | proto-only，descriptor 上传 content type。 |
| `--consul-address` | 空 | proto-only，Consul HTTP API 地址。 |
| `--s3-region` | `us-east-1` | proto-only，S3 region。 |
| `--s3-bucket` | `descriptor` | proto-only，S3 bucket。 |
| `--s3-force-path-style` | `false` | proto-only，使用 path-style 地址。 |
| `--overwrite` | `false` | 覆盖已有 `.firefly/project.yaml`。 |

业务服务项目不写入 `descriptor` 或 `s3` 配置块；descriptor/S3 参数只对 `--type proto` 的 proto 仓库有意义。proto 项目类型直接写 `--type proto`，不要写成 `proto_repo`。

## `firefly project info`

展示当前项目元信息、版本，以及 go.mod 中可读取到的 Firefly 依赖版本。只有 proto 项目会展示 descriptor 路径、S3 object key 和 descriptor current key。

```bash
firefly project info
```

业务服务项目示例输出：

```text
config: .firefly/project.yaml
project.type: service
service: app
app_id: app
namespace: lhdht
language: go
module: github.com/fireflycore/app
version: v0.0.1
dependencies:
  go-consul: v0.3.3
  go-micro: v1.6.3
```

proto 项目示例输出：

```text
config: .firefly/project.yaml
project.type: proto
namespace: lhdht
proto.repo: lhdht/backend/proto
proto.source: .
version: v0.0.1
descriptor.file: dep/protobuf/gen/lhdht/v0.0.1.pb
descriptor.object_key: lhdht/v0.0.1.pb
descriptor.current_file: dep/protobuf/gen/lhdht/current.pb
descriptor.current_object_key: lhdht/current.pb
descriptor.current_key: lhdht/api-gateway/descriptor/current
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
- proto 项目的本地 descriptor 输出路径、S3 endpoint、bucket 和可见凭证来源

它不会连接 sidecar、gateway、authz、token 服务、配置中心或观测系统。

## `firefly descriptor build`

在 `project.type: proto` 的 proto 项目中调用 Buf 生成 whole-repo descriptor。

```bash
firefly descriptor build
```

常用参数：

| 参数 | 说明 |
| :--- | :--- |
| `--version` | 覆盖 `proto.version`。 |
| `--source` | 覆盖 `proto.source`。 |
| `--out` | 覆盖版本化 descriptor 输出文件。 |
| `--buf` | Buf CLI 路径，默认 `buf`。 |

## `firefly descriptor push`

在 `project.type: proto` 的 proto 项目中推送已经存在的 descriptor 文件到 S3 兼容对象存储。

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
| `--file` | descriptor 文件路径，默认从 proto 项目配置和版本推导。 |
| `--current-file` | current descriptor 文件路径。 |
| `--bucket` | S3 bucket，覆盖项目配置或 `FIREFLY_S3_BUCKET`。 |
| `--key` | S3 object key，默认 `{namespace}/{version}.pb`。 |
| `--current-key` | current S3 object key，默认 `{namespace}/current.pb`。 |
| `--endpoint` | S3 兼容 endpoint，覆盖项目配置或 `FIREFLY_S3_ENDPOINT`。 |
| `--region` | S3 region，覆盖 `AWS_REGION` 或项目配置。 |
| `--profile` | AWS shared config profile。 |
| `--force-path-style` | 使用 S3 path-style 地址。 |
| `--descriptor-ref` | 覆盖命令最终打印的 versioned descriptor URL。 |
| `--current-descriptor-ref` | 覆盖命令最终打印的 current descriptor URL。 |
| `--access-key-id` | 显式 S3 access key id。 |
| `--secret-access-key` | 显式 S3 secret access key。 |
| `--session-token` | STS 临时凭证 session token。 |
| `--skip-current-object` | 不上传 current descriptor 对象。 |
| `--dry-run` | 不上传，只解析路径和计算 sha256。 |

输出包括：

```text
project.type
namespace
version
file
current_file
size
sha256
bucket
key
current_key
descriptor.versioned_ref
descriptor.current_ref
```

## `firefly descriptor publish`

在 `project.type: proto` 的 proto 项目中完成 build、push 和 Consul current 发布。

```bash
firefly descriptor publish
```

只解析路径、构建结果和 current JSON，不上传对象、不写 Consul：

```bash
firefly descriptor publish --dry-run
```

常用参数：

| 参数 | 说明 |
| :--- | :--- |
| `--source` | 覆盖 `proto.source`。 |
| `--out` | 覆盖版本化 descriptor 输出文件。 |
| `--buf` | Buf CLI 路径，默认 `buf`。 |
| `--skip-build` | 使用已有本地 descriptor 文件。 |
| `--skip-consul` | 不写 Consul descriptor current KV。 |
| `--consul-address` | 覆盖项目配置中的 Consul HTTP API 地址。 |
| `--source-revision` | 写入 descriptor current JSON 的源码版本。 |

写入的 Consul key 默认为：

```text
{namespace}/api-gateway/descriptor/current
```

## `firefly --version`

查看 CLI 版本：

```bash
firefly --version
```

当前输出：

```text
firefly version v0.1.3
```
