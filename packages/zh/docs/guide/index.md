# 快速开始

## 安装
- 下载可执行文件：https://github.com/fireflycore/cli/releases
- 将可执行文件放到任意目录，并配置全局环境变量；
- 执行`firefly version`检查是否安装成功并配置全局环境变量；

## 创建项目
- `firefly create`

## 项目配置
```json
// conf/bootstrap.json
{
  "micro": {
    "mode": true,
    "app_id": "00000000-0000-0000-0000-00000000000", // 应用id，服务唯一标识
    "namespace": "/microservice", // 命名空间
    "max_retry": 5, // 服务心跳最大重试次数
    "ttl": 5, // 心跳间隔

    "network": "main-network", // 网络唯一标识，用于网关负载时的调用逻辑
    "outer_net_addr": "113.112.111.110:10000", // 外网访问地址
    "internal_net_addr": "192.168.1.100:10000" // 内网访问地址
  },
  "gateway": {
    "network": "main-network", // 网关组网唯一标识，用于网关负载时的调用逻辑
    "outer_net_addr": "113.112.111.110:10001", // 网关外网调用地址
    "internal_net_addr": "192.168.1.101:10001" // 网关内网调用地址
  },
  "server": {
    "grpc_port": 10000, // grpc 服务端口
  },
  "logger": {
    "console": true, // 是否开启日志打印
    "remote": false // 是否开启远程日志
  },
  "task": {
    "max_cache": 100, // 任务池最大缓存数量
    "max_concurrency": 1, // 处理任务最大并发
    "min_concurrency": 0 // 处理任务最小并发
  },
  "data_conf_file": [
    "https://demo.com/config/etcd.config.json", // etcd 配置文件，默认是远程地址，如果要从本地加载，请修改具体方法
    "https://demo.com/config/mysql.config.json" // mysql 配置文件，默认时远程地址，如果要从本地架子啊，请修改具体方法
  ]
}
```

## 运行项目

::: code-group
```shell [golang]
- 执行`go mod tidy`初始化项目依赖
- 执行`buf generate`生成项目依赖的proto文件代码
- 执行`wire ./cmd/server`生成依赖注入
- 执行`go run ./cmd/server/main.go`运行项目
```

```shell [rust]
- 开发中
```

```shell [dart]
- 开发中
```

```shell [kotlin]
- 开发中
```

```shell [swift]
- 开发中
```

```shell [node]
- 开发中
```

```shell [php]
- 开发中
```

```shell [python]
- 开发中
```
:::


## 创建buf存储仓库
> 当然也可以在本地创建一个目录来存放grpc的proto，这里演示一下用buf cli来管理grpc的proto文件。

[buf cli docs](https://buf.build/docs/introduction)

buf.yaml（buf cli 仓库配置）
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
buf.gen.yaml (生成代码配置)

::: code-group

```yaml [golang]
version: v2
managed:
  enabled: true
  disable:
    - file_option: go_package
      module: buf.build/googleapis/googleapis
  override:
    - file_option: go_package_prefix
      value: go-layout # 实际的项目名称
plugins:
  - remote: buf.build/grpc/go # 远程插件配置，对应的也有本地插件配置
    out: dep/protobuf/gen
    opt: paths=source_relative
  - remote: buf.build/protocolbuffers/go
    out: dep/protobuf/gen
    opt: paths=source_relative
inputs:
  - module: buf.build/firefly/guide:main # buf cli仓库地址; 对应的也有本地存储配置，具体参考buf cli文档
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
  - remote: buf.build/connectrpc/es
    out: gen
  - remote: buf.build/bufbuild/es
    out: gen
  - remote: buf.build/bufbuild/knit-ts
    out: gen
  - remote: buf.build/community/timostamm-protobuf-ts
    out: dep/protobuf/gen
inputs:
  - module: buf.build/firefly/guide:main
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


## 运行

::: code-group

```sh [golang]
go run main.go
```

```sh [rust]
# 暂未开发
```

```sh [dart]
# 暂未开发
```

```sh [kotlin]
# 暂未开发
```

```sh [swift]
# 暂未开发
```

```sh [node]
# 暂未开发
```

```sh [php]
# 暂未开发
```

```sh [python]
# 暂未开发
```

:::

## 打包

::: code-group

```sh [golang]
go build -ldflags "-s -w"
```

```sh [rust]
# 暂未开发
```

```sh [dart]
# 暂未开发
```

```sh [kotlin]
# 暂未开发
```

```sh [swift]
# 暂未开发
```

```sh [node]
# 暂未开发
```

```sh [php]
# 暂未开发
```

```sh [python]
# 暂未开发
```

:::