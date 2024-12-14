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

## 项目打包

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