# Firefly CLI 工具

Firefly CLI 是 Firefly 工程侧开发辅助工具，当前版本为 `v0.0.9`。它的定位很小：创建 Go 服务项目、维护本地项目元信息、推送已经构建好的 gateway descriptor。

CLI 不接管 Buf 生成、descriptor 构建、sidecar、gateway、authz、token、config、observability 或运行时联调。这些能力分别交给业务仓库 Makefile、Buf CLI、部署系统、管理后台或 AI 辅助检查。

## 安装

下载 release 二进制后放入系统 `PATH`，然后验证：

```bash
firefly --version
```

源码安装：

```bash
go install github.com/fireflycore/cli@latest
```

## 当前命令

```text
firefly create [name]
firefly project init
firefly project info
firefly project check
firefly descriptor push
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
  --service app \
  --app-id app \
  --module github.com/fireflycore/app \
  --s3-endpoint https://minio.local.com \
  --s3-bucket descriptor \
  --s3-force-path-style
```

查看解析结果：

```bash
firefly project info
```

本地静态检查：

```bash
firefly project check
```

## 推送 Descriptor

descriptor 由业务仓库 Makefile 和 Buf CLI 生成，CLI 只负责推送：

```bash
make descriptor
firefly descriptor push
```

只解析路径和计算摘要，不上传：

```bash
firefly descriptor push --dry-run
```

默认规则：

```text
version = conf/bootstrap.json 中的 app.version
file    = dist/descriptors/{version}.pb
bucket  = descriptor
key     = {service}/{version}.pb
```

真实 S3 上传需要 AWS SDK 默认凭证链、AWS profile，或显式凭证参数。
