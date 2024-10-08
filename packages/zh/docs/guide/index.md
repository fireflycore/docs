# 快速开始

## 安装
- 下载可执行文件：https://github.com/fireflycore/cli/releases
- 将可执行文件放到任意目录，并配置全局环境变量；
- 执行`firefly version`检查是否安装成功并配置全局环境变量；

## 创建项目
- `firefly create`

## 项目配置
```yaml
system:
  app_id: 00000000-00000000-00000000 # 项目id
logger:
  console: true # 是否启用日志打印
  remote: false # 是否启用远程日志存储
micro:
  run: 0.0.0.0:1024 # 运行端口，IP最好是0.0.0.0
  dns: test.lhdht.com:80 # 网关DNS地址，用于服务之间调用，域名需要加端口号
  endpoint: 101.120.1.125:1024|192.168.1.101:1024 # 服务注册地址，外网|内网
  namespace: /microservice/firefly # 服务注册命名空间，同一个项目的命名空间尽量一致 
task:
  max_cache: 100 # 最大任务池缓存数量
  max_concurrency: 1 # 最大并发数
  min_concurrency: 0 # 最小并发数
```

## 注册中心
> 所有的开发语言默认只支持ETCD为注册中心，如果要用其他的注册中心，按照要求进行封装，可以提交仓库到至PR

::: code-group

```go [golang]
// bootstrap/setup.go

store.Use.Task = task.New(&store.Use.Config.Task)

var etcdConfig etcd.ConfigEntity
store.Use.Task.InitConfig([]string{
    // ETCD远程配置链接
}, []interface{}{
    &etcdConfig,
})
store.Use.Task.Await()

// 如果ETCD采用TLS加密通信
// store.Use.Task.InitCert("etcd", &etcdConfig.Tls)
// store.Use.Task.Await()
```

```rust [rust]
// 开发中
```

```dart [dart]
// 开发中
```

```kotlin [kotlin]
// 开发中
```

```swift [swift]
// 开发中
```

```node [node]
// 开发中
```

```php [php]
// 开发中
```

```python [python]
// 开发中
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