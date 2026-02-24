# 技术架构

Firefly 提供了一套完整的微服务技术栈，涵盖了从网关到存储的各个环节。

## 架构全景图

```mermaid
graph TD
    User[用户/客户端] --> Gateway[API 网关]
    Gateway -->|gRPC/HTTP| ServiceA[服务 A (Go)]
    Gateway -->|gRPC/HTTP| ServiceB[服务 B (Rust)]
    
    subgraph Infrastructure [基础设施]
        Registry[服务注册与发现 (Etcd)]
        Config[配置中心 (Etcd/Consul)]
        Observability[可观测性 (OpenTelemetry)]
    end
    
    ServiceA --> Registry
    ServiceB --> Registry
    ServiceA --> Config
    ServiceB --> Config
    
    ServiceA --> DB[(MySQL/PostgreSQL)]
    ServiceA --> Cache[(Redis)]
    
    ServiceB --> DB
```

## 核心组件

### 1. 通信协议
-   **内部通信**：默认使用 **gRPC**。它基于 HTTP/2，性能高效，支持双向流，且有完善的 IDL (Protobuf) 支持。
-   **外部接口**：支持通过 gRPC-Gateway 或自定义 HTTP Server 暴露 RESTful API。

### 2. 服务治理
-   **注册与发现**：默认集成 **Etcd**。服务启动时自动注册节点信息，调用方通过客户端负载均衡器获取健康节点。
-   **负载均衡**：客户端侧负载均衡（Client-side LB），支持轮询、加权轮询等策略。
-   **熔断与限流**：集成常用的熔断器和限流器，保护服务免受雪崩效应影响。

### 3. 配置管理
-   **引导配置**：本地 `bootstrap.json` 定义服务的基础属性（环境、端口、配置中心地址）。
-   **动态配置**：支持从配置中心（如 Etcd）动态加载业务配置，无需重启服务即可调整参数。

### 4. 数据存储
-   **ORM**：Go 版本默认集成 **GORM**，支持 MySQL, PostgreSQL, SQLite 等主流数据库。
-   **Cache**：默认集成 **go-redis**，提供高性能的缓存支持。
-   **数据转换**：集成 **Goverter**，在编译期生成 DTO 与 Entity 之间的高性能转换代码。

### 5. 开发工具链
-   **Buf**：现代化的 Protobuf 管理工具，用于 lint、格式化和生成代码。
-   **Wire**：Go 语言的编译期依赖注入工具。
-   **Protovalidate**：基于 Protobuf 选项的参数校验框架，自动生成校验逻辑。

## 多语言支持策略

Firefly 的核心架构是语言无关的。只要遵循相同的协议标准，不同语言实现的服务可以无缝协作。

-   **Go**: `go-layout` (Stable) - 官方推荐的生产级实现。
-   **Rust**: (Planning) - 面向对性能和内存安全有极致要求的场景。
-   **Node.js / Python**: (Planning) - 面向快速开发和脚本胶水层。
