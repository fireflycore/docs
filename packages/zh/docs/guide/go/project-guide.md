# Firefly Go 项目指南

## 项目概述

`go-layout` 是 **Firefly 微服务框架** 的官方 Go 语言项目模板。它不仅仅是一个代码骨架，更是一套经过生产环境验证的最佳实践集合。

本模板旨在为开发者提供一个**开箱即用**、**结构清晰**、**易于扩展**的微服务起点。它预置了微服务开发所需的通用基础设施，让开发者能够专注于业务逻辑的实现。

### 核心特性

- **标准分层架构**：基于 DDD（领域驱动设计）思想，清晰划分 `Service` (接口)、`Biz` (业务)、`Data` (数据) 层。
- **依赖注入**：完全集成 Google `Wire`，实现编译期依赖注入，保证代码的模块化和可测试性。
- **协议优先**：集成 `Buf` 和 `gRPC`，通过 Proto 定义驱动开发，自动生成接口代码和验证逻辑 (`protovalidate`)。
- **配置管理**：支持本地文件 (`bootstrap.json`) 和远程配置服务 (Config Service)，统一管理多环境配置。
- **数据转换**：集成 `Goverter`，自动生成高效的 DTO <-> PO/DO 转换代码，拒绝反射。
- **统一基础设施**：预置了 `GORM` (MySQL), `Redis`, `Logger` 等常用组件的封装和最佳配置。
- **示例模块**：内置完整的 `Demo` 模块，展示了从 API 定义到数据库存储的完整链路，作为开发的参考范本。

## 快速开始

### 1. 环境准备

确保本地已安装以下工具：

- **Go** (>= 1.25.1)
- **Buf** (用于 Proto 管理): `npm install -g @bufbuild/buf` 或参考官方文档
- **Wire** (用于依赖注入): `go install github.com/google/wire/cmd/wire@latest`
- **Goverter** (用于数据转换): `go install github.com/jmattheis/goverter/cmd/goverter@latest`
- **Protoc-Gen-Go** 相关插件 (参考 `buf.gen.yaml`)

### 2. 初始化项目

假设你要创建一个名为 `account-service` 的新服务：

1. **克隆模板**
   ```bash
   git clone https://github.com/fireflycore/go-layout.git account-service
   cd account-service
   rm -rf .git  # 移除模板的 git 历史
   git init     # 初始化新仓库
   ```

2. **重命名模块**
   建议使用提供的脚本进行重命名（将 `go-layout` 替换为你的模块名）：
   
   **Linux / macOS:**
   ```bash
   ./rename_project.sh github.com/your-org/account-service
   ```
   
   **Windows:**
   ```cmd
   .\rename_project.bat github.com/your-org/account-service
   ```

3. **清理示例代码**
   `Demo` 模块仅供参考。在熟悉架构后，你可以：
   - 删除 `internal/biz/demo.go`, `internal/biz/model/demo.go`, `internal/biz/repo/demo.go`
   - 删除 `internal/data/demo.go`, `internal/data/entity/demo.go`
   - 删除 `internal/service/demo.go`
   - 删除 `internal/biz/convert/demo.go`
   - **注意**：删除后需要重新运行 `wire ./cmd/server`（或执行 `make init`）生成依赖注入代码。

### 3. 运行服务

```bash
# 最省心的方式（推荐）：一条命令完成生成与运行
make run
```

`make run` 会依次执行 `buf generate`、`goverter`、`wire ./cmd/server`、`go mod tidy`，然后运行 `cmd/server/main.go`。

如果你需要分步执行，可参考 `makefile` 中的 `init/generate/dto` 目标。

## 工具链指南

### Buf (Protobuf 管理)

本项目不直接包含 `.proto` 文件，而是假设 Proto 定义在独立的仓库中管理（推荐做法）。
- `buf.gen.yaml`: 定义了如何从 Proto 生成 Go 代码。
- **生成代码**：通常通过 CI/CD 管道或脚本执行 `buf generate`，生成的代码位于 `dep/protobuf/gen`。

### Wire (依赖注入)

- **入口**：`cmd/server/wire.go`
- **各层 Provider**：每个层级 (`internal/biz`, `internal/data`, `internal/service` 等) 都有一个 `core.go`，定义了该层的 `ProviderSet`。
- **新增组件**：当你新增一个 Repo 或 Service 时，记得将其构造函数加入到对应层的 `core.go` 中，然后执行 `wire ./cmd/server`（或 `make init`）。

### Goverter (数据转换)

- **定义**：在 `internal/biz/convert` 中定义接口。
- **生成**：在项目根目录运行 `make dto`（等价于 `goverter gen ./internal/biz/convert`）。生成代码位于 `dep/dto/`，通过 `internal/dto` 适配为 Biz 层依赖的接口。

## 目录导航

- [目录结构详解](directory-structure.md)
- [核心概念说明](core-concepts.md)
- [数据流转图解](data-flow.md)
- [架构分层深度解析](architecture.md)
- [开发最佳实践](best-practices.md)
