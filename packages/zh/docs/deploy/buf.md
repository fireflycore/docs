# Buf 与代码生成

Buf 用于管理 Protobuf、生成 gRPC 代码，并在 Go 主线中配合 `protoc-gen-gateway-manifest` 生成 Firefly 网关 manifest。业务服务的服务能力以 `dep/protobuf/gen/gateway.manifest.json` 为准。

[buf cli docs](https://buf.build/docs/introduction)

## buf.yaml
```yaml
version: v2
name: buf.build/firefly/guide # 将创建的仓库地址填写到这里
lint:
  use:
    - STANDARD
  except:
    - FIELD_NOT_REQUIRED
    - PACKAGE_NO_IMPORT_CYCLE
  disallow_comment_ignores: true
breaking:
  use:
    - FILE
  except:
    - EXTENSION_NO_DELETE
    - FIELD_SAME_DEFAULT
```
`buf login` 登录之后，可使用 `buf push` 将 proto 推送到 Buf module。

## Go 服务 buf.gen.yaml

::: code-group

```yaml [golang]
version: v2
managed:
  enabled: true
  disable:
    - file_option: go_package
      module: buf.build/googleapis/googleapis
    - file_option: go_package
      module: buf.build/bufbuild/protovalidate
    - file_option: go_package
      module: buf.build/grpc-ecosystem/grpc-gateway
  override:
    - file_option: go_package_prefix
      value: go-layout/dep/protobuf/gen
plugins:
  - remote: buf.build/grpc/go
    out: dep/protobuf/gen
    opt: paths=source_relative
  - remote: buf.build/protocolbuffers/go
    out: dep/protobuf/gen
    opt: paths=source_relative
  - local: protoc-gen-gateway-manifest
    out: dep/protobuf/gen
    # gateway manifest 是单文件聚合产物，必须让 Buf 一次性把所有待生成 proto 传给插件。
    strategy: all
    opt:
      - include_package_prefix=acme.demo.
inputs:
  - module: buf.build/firefly/demo:main
    types:
      - acme.auth.token.v1
      - acme.config.v1
      - acme.demo.v1
```

```yaml [rust]
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/community/neoeinstein-prost
    out: dep/protobuf/gen
    opt:
      - compile_well_known_types
      - extern_path=.google.protobuf=::pbjson_types
  - remote: buf.build/community/neoeinstein-prost-serde
    out: dep/protobuf/gen
  - remote: buf.build/community/neoeinstein-tonic
    out: dep/protobuf/gen
    opt:
      - compile_well_known_types
      - extern_path=.google.protobuf=::pbjson_types
inputs:
  - module: buf.build/firefly/guide:main
```

```yaml [dart]
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/protocolbuffers/dart
    out: dep/protobuf/gen
inputs:
  - module: buf.build/firefly/guide:main
```

```yaml [kotlin]
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/grpc/kotlin
    out: dep/protobuf/gen
    opt: paths=source_relative
  - remote: buf.build/protocolbuffers/kotlin
    out: dep/protobuf/gen
inputs:
  - module: buf.build/firefly/guide:main
```

```yaml [swift]
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/grpc/swift
    out: dep/protobuf/gen
  - remote: buf.build/apple/swift
    out: dep/protobuf/gen
inputs:
  - module: buf.build/firefly/guide:main
```

```yaml [node]
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/bufbuild/es
    out: dep/protobuf/gen
  - remote: buf.build/bufbuild/knit-ts
    out: dep/protobuf/gen
  - remote: buf.build/connectrpc/query-es
    out: dep/protobuf/gen
  - remote: buf.build/community/timostamm-protobuf-ts
    out: dep/protobuf/gen
inputs:
  - module: buf.build/bufbuild/protovalidate
  - module: buf.build/googleapis/googleapis
    types:
      - google.api
  - module: buf.build/firefly/demo:main
    types:
      - acme.config.v1
      - acme.logger.access.v1
      - acme.logger.server.v1
      - acme.logger.operation.v1
      - acme.demo.v1
```

```yaml [php]
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/grpc/php
    out: dep/protobuf/gen
  - remote: buf.build/protocolbuffers/php
    out: dep/protobuf/gen
inputs:
  - module: buf.build/firefly/guide:main
```

```yaml [python]
version: v2
managed:
  enabled: true
plugins:
  - remote: buf.build/grpc/python
    out: dep/protobuf/gen
  - remote: buf.build/protocolbuffers/python
    out: dep/protobuf/gen
inputs:
  - module: buf.build/firefly/guide:main
```

:::

执行 `buf generate` 会生成服务端 / 客户端代码和 `gateway.manifest.json`。

## Manifest 生成规则

- `protoc-gen-gateway-manifest` 必须配置 `strategy: all`，否则 Buf 按目录多次调用插件时会生成重复的 `gateway.manifest.json`。
- `include_package_prefix` 只应覆盖当前业务服务拥有的 proto 包；依赖服务 proto 可以生成 client，但不能注册成当前服务能力。
- 业务服务 manifest 不维护 api-gateway 转码 descriptor 发布主线；HTTP/JSON -> gRPC 所需 descriptor 由对应 namespace 的 proto 项目发布。
- 没有 `google.api.http` 标注的方法会进入 `services[].methods`，但不会进入 `routes[]`，也不会自动合成 HTTP path。

## Proto 项目 Descriptor

proto 仓库需要初始化为 Firefly proto 项目：

```yaml
project:
  type: proto
```

发布 namespace canonical descriptor：

```bash
firefly descriptor publish
```

默认写入的 Consul KV：

```text
{namespace}/api-gateway/descriptor/current
```

api-gateway 会按 namespace 拉取 descriptor current 并绑定到对应转码 route，不会把不同 proto 仓库生成的 descriptor 合并成一份全局 pb。
