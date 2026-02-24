# 架构分层与依赖注入

本文档深入解析 `go-layout` 的分层架构实现细节，特别是 **Wire 依赖注入** 和 **配置管理** 在本模板中的具体落地方式。

## 架构概览

遵循整洁架构 (Clean Architecture) 原则，依赖方向由外向内：
`Server` -> `Service` -> `Biz` (核心) <- `Data`

但为了工程实现的便利性，我们在物理目录结构上做了一些适配，通过 Go 的 `interface` 和 `Wire` 来管理依赖。

## 依赖注入 (Wire) 详解

`go-layout` 深度集成了 Google Wire，通过依赖注入管理各个组件的生命周期。理解这一点对于在模板中新增功能至关重要。

### 1. 依赖树的构建
依赖树的根节点在 `cmd/server/wire.go`。

```go
// cmd/server/wire.go
func wireApp() (*App, error) {
    panic(wire.Build(
        dep.ProviderSet,
        conf.ProviderSet,
        data.ProviderSet,
        dto.ProviderSet,
        biz.ProviderSet,
        service.ProviderSet,
        server.ProviderSet,
        NewApp,
    ))
}
```

### 2. 各层 ProviderSet
每个层级目录下都有一个 `core.go`，定义了该层对外提供的组件集合。

*   **`internal/data/core.go`**:
    ```go
    var ProviderSet = wire.NewSet(
        NewEtcd,
        NewRedis,
        NewMysql,
        NewData,

        NewConfigRepo,
        NewLoggerRepo,

        NewDemoRepo,
    )
    ```

*   **`internal/biz/core.go`**:
    ```go
    var ProviderSet = wire.NewSet(
        NewDemoUseCase, // 注册 DemoUseCase
        // 新增的 UseCase 在这里注册
    )
    ```

*   **`internal/service/core.go`**:
    ```go
    var ProviderSet = wire.NewSet(
        NewConfigCenterRemoteService,
        NewAccessLoggerRemoteService,
        NewServerLoggerRemoteService,
        NewOperationLoggerRemoteService,

        NewDemoService,
    )
    ```

### 3. 如何新增依赖
当你创建了一个新的 Repo (`UserRepo`) 和 UseCase (`UserUseCase`) 时：
1.  在 `internal/data/core.go` 中添加 `NewUserRepo`。
2.  在 `internal/biz/core.go` 中添加 `NewUserUseCase`。
3.  在 `internal/service/core.go` 中添加 `NewUserService`。
4.  执行 `wire ./cmd/server`（或 `make init`）重新生成 `wire_gen.go`。

## 配置管理实现

`go-layout` 的配置系统设计灵活，支持从本地文件开发，无缝切换到远程配置服务生产。

### 1. 引导配置 (Bootstrap)
一切始于 `conf/bootstrap.json`。这是服务启动时读取的第一个文件，定义了“如何加载其他配置”。

```json
{
  "env": "dev",
  "port": 8080,
  "app_id": "demo-service",
  "load_conf_mode": "local",  // local: 读本地文件; remote: 读 Config Service
  "micro": { ... },           // 服务注册发现配置
  "logger": { ... }           // 日志配置
}
```

### 2. 配置加载器 (Conf Loader)
位于 `internal/conf/`。
例如 `mysql.go` 定义了如何加载 MySQL 配置：
- **Local 模式**：读取 `conf/mysql.json`（仓库默认仅提供 `bootstrap.json`，其余组件配置文件需要按需补齐）。
- **Remote 模式**：根据 `bootstrap.json` 中的配置，调用远程 **Config Service** (gRPC) 获取 Key 为 `mysql` 的配置内容。
- **注意**：目前配置仅在服务启动时加载，**不支持热更新**。

### 3. 在代码中使用配置
配置加载后，通常通过依赖注入传递给 Data 层。
例如 `internal/data/data.go`:

```go
func NewMysql(bootstrapConf *conf.BootstrapConf, mysqlConf *gorme.MysqlConf, ...) (*gorme.MysqlDB, error) {
    // Wire 自动注入加载好的 mysqlConf
    return gorme.NewMysql(mysqlConf, ...)
}
```

## 总结
- **Wire** 粘合了所有层级，修改组件依赖关系后必须重新生成。
- **Bootstrap** 决定了环境和配置加载方式。
- **Conf Loader** 实现了配置的统一管理（local/remote），配置仅在启动时加载，不支持热更新。
