# Jenkins 流水线

Firefly Go 服务的 CI/CD 应围绕协议生成、依赖注入、测试、构建和部署前检查组织。下面示例以 `go-layout` 派生服务为基准。

## 推荐阶段

```text
checkout
  -> tool check
  -> buf generate
  -> goverter
  -> wire
  -> go mod tidy check
  -> go test
  -> build
  -> image
  -> deploy
```

## 核心命令

```bash
make generate
wire ./cmd/server
go mod tidy
go test ./...
make build
```

`make init` 已经包含生成、Wire 和 `go mod tidy`，但 CI 中建议把关键步骤拆开，便于定位失败点。

## Jenkinsfile 示例

```groovy
pipeline {
  agent any

  stages {
    stage('Generate') {
      steps {
        sh 'buf generate'
        sh 'goverter gen ./internal/biz/convert'
      }
    }

    stage('Wire') {
      steps {
        sh 'wire ./cmd/server'
      }
    }

    stage('Test') {
      steps {
        sh 'go mod tidy'
        sh 'go test ./...'
      }
    }

    stage('Build') {
      steps {
        sh 'make build'
      }
    }
  }
}
```

## 部署前检查

- `dep/protobuf/gen/gateway.manifest.json` 已生成并随构建产物发布。
- 对应 namespace 的 proto 项目已发布 descriptor current，例如 `{namespace}/api-gateway/descriptor/current`。
- `conf/bootstrap.json` 中的 `app.id`、`service.name`、`service.namespace` 和端口符合目标环境。
- 裸机场景中，目标节点已部署 `sidecar-agent` 和 Envoy。
- 如果启用本地 authz 验签，`authz_verification` 必须能加载正确的 Ed25519 公钥。

## 不建议

- 不在 CI 中手写 route JSON 替代 manifest。
- 不把旧 `Authorization` 当作 Firefly 身份主线做联调断言。
- 不跳过 `wire`，否则构造函数或 ProviderSet 的变更可能在部署后才暴露。
