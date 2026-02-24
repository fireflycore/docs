# buf-cli配置
> buf cli管理proto，可采用远程插件/本地插件来生成grpc代码;
>
> 具体服务则通过`buf.gen.yaml`来控制所需生成的proto文件;
> 
> 所有的proto文件都应在一个仓库进行管理;

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
`buf login` 登陆之后，使用`buf push`将代码存到buf仓库中

## buf.gen.yaml 

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
inputs:
  - module: buf.build/firefly/demo:main
    types:
      - acme.config.v1
      - acme.logger.access.v1
      - acme.logger.server.v1
      - acme.logger.operation.v1
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

执行`buf generate`生成服务端/客户端代码
