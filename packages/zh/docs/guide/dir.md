# 项目结构
```sh
/go-layout
├── .run // goland 运行文件
├── cmd // 项目入口
|  └── server
|     ├── app.go // 应用实例，可以自定义服务实例
|     ├── main.go
|     ├── wire.go // wire来维护依赖注入
|     └── wire_gen.go
├── conf
|  └── bootstrap.json
├── dep // 生成的依赖文件
├── internal  // 内部不对外暴露的代码，业务逻辑都在这下面
|  ├── biz    // 业务逻辑的组装层，类似DDD的domain层，data类似DDD的repo，而repo接口在这里定义，使用依赖倒置的原则。
|  |  ├── core.go
|  |  └── demo.go
|  ├── conf   // 项目配置
|  |  ├── bootstrap.go
|  |  ├── core.go
|  |  └── data.go
|  ├── data   // 业务数据访问，包含cache，db等封装，实现了biz的repo接口。在这里会把data与dao混装在一起，data偏重业务的含义，它主要做的是将领域对象重新拿出来
|  |  ├── core.go
|  |  └── demo.go
|  ├── plugin // 其他依赖在这里实现，通过wire倒装到具体需要的地方
|  |  ├── core.go
|  |  └── logger.go
|  ├── server // 服务实例的相关代码
|  |  ├── core.go
|  |  ├── grpc.go
|  |  ├── register.go // 服务注册
|  |  └── server.go
|  └── service // 实现了api定义的服务层，类似DDD的application层，处理DTO到biz领域实体的转换（DTO->DO），同时协同各类biz交互，但是不应处理复杂逻辑
|     ├── core.go
|     ├── demo.dto.go
|     ├── demo.go
|     └── remote.go // 远程调用服务的实例化
├── LICENSE
├── README.md
├── buf.gen.yaml    // buf cli配置文件
├── go.mod
├── go.sum
└── run.sh          // 服务部署shell脚本

```