# 配置参考
> 相关目录
- `/internal/conf/*`
- `/conf/*`

## 引导配置
```json
// /conf/bootstrap.json
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