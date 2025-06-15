# 配置参考
> 相关目录
- `/internal/conf/*`
- `/conf/*`

## 引导配置
```json
// /conf/bootstrap.json
{
  // 环境
  "env": "prod",
  // 运行端口
  "port": 10500,
  // 应用id
  "app_id": "00000000-0000-0000-0000-00000000000",
  // 应用secret
  "app_secret": "UnkK/F+1+6aFV9Gz4lCX1se05+jpmueX",
  // 用用版本
  "version": "v0.0.1",
  // 配置加载方式
  "load_conf_mode": "local",
  // 微服务配置
  "micro": {
    // 微服务注册空间
    "namespace": "/microservice/firefly",
    // 网卡配置
    "network": {
      // 网卡SN
      "sn": "main-network",
      // 网卡内网地址
      "internal": "192.168.1.100:10600",
      // 网卡外网地址
      "external": "112.112.112.112:10600"
    },
    // 内核
    "kernel": {
      // 内核版本
      "version": "v0.1.8"
    },
    // 最大重试次数
    "max_retry": 5,
    // 心跳间隔
    "ttl": 5
  },
  // 网关配置
  "gateway": {
    // 网卡配置
    "network": {
      // 网卡内网地址
      "sn": "main-network",
      // 网卡内网地址
      "internal": "192.168.1.100:10600",
      // 网卡外网地址
      "external": "112.112.112.112:10600"
    }
  },
  // 日志配置
  "logger": {
    // 控制台输出日志
    "console": true,
    // 远程日志存储
    "remote": false
  }
}
```

