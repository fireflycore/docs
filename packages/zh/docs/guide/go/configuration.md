# 配置详解

`go-layout` 的配置系统设计灵活，支持从本地文件加载或远程配置服务加载。

## 引导配置 (Bootstrap)

一切始于 `conf/bootstrap.json`。这是服务启动时读取的第一个文件，定义了服务的核心属性和“如何加载其他配置”。

### 示例配置

```json
{
  // 运行环境: dev, test, prod
  "env": "prod",
  // 服务运行端口
  "port": 10500,
  // 应用唯一标识 (UUID)
  "app_id": "00000000-0000-0000-0000-00000000000",
  // 应用名称
  "app_name": "go-layout",
  // 应用密钥 (用于鉴权)
  "app_secret": "UnkK/F+1+6aFV9Gz4lCX1se05+jpmueX",
  // 应用版本号
  "version": "v0.0.1",
  // 配置加载模式: local (本地文件) 或 remote (远程配置中心)
  "load_conf_mode": "local",
  
  // 微服务注册配置 (ETCD)
  "micro": {
    // 命名空间
    "namespace": "/microservice/firefly",
    // 网络配置
    "network": {
      "sn": "main-network",
      "internal": "192.168.1.100:10600",
      "external": "112.112.112.112:10600"
    },
    // 内核版本信息
    "kernel": {
      "version": "v0.3.1"
    },
    // 负载均衡权重
    "weight": 100,
    // 最大重试次数
    "max_retry": 5,
    // 心跳间隔 (秒)
    "ttl": 5
  },
  
  // 网关配置 (如果作为网关使用)
  "gateway": {
    "network": {
      "sn": "main-network",
      "internal": "192.168.1.100:10600",
      "external": "112.112.112.112:10600"
    }
  },
  
  // 日志配置
  "logger": {
    "console": true,  // 是否输出到控制台
    "remote": false   // 是否发送到远程日志服务
  }
}
```

### 字段说明

- **load_conf_mode**: 控制后续配置（如 MySQL, Redis）的加载方式。
    - `local`: 从本地 `internal/conf/` 目录下的 JSON 文件加载。
    - `remote`: 通过 `micro` 配置连接配置中心，获取配置内容。

## 业务配置

业务组件的配置（如 MySQL, Redis, Etcd）通常由 `internal/conf` 包中的 Loader 加载。

例如 `internal/conf/mysql.go` 定义了 MySQL 配置的结构和加载逻辑。

```go
type MysqlConf struct {
    Write *MysqlBaseConf `json:"write"`
    Read  *MysqlBaseConf `json:"read"`
}
```

在 `local` 模式下，你需要确保本地存在对应的配置文件（通常不提交到 Git，或者是示例文件）。
