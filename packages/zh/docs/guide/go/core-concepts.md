# 核心概念与代码映射

本文档解释 `go-layout` 模板中的核心架构概念，并直接映射到项目中的具体代码文件。理解这些概念对于正确使用本模板至关重要。

## 1. DTO (Data Transfer Object)
**定义**：用于服务间通信或 API 响应的数据结构。
**在模板中的体现**：
- **来源**：通常由 `buf` 工具根据 `.proto` 文件自动生成。
- **位置**：`dep/protobuf/gen/...` (外部依赖)
- **代码示例**：
  ```go
  // dep/protobuf/gen/acme/demo/v1/demo.pb.go
  type CreateDemoRequest struct { ... }
  type Demo struct { ... }
  ```
- **使用场景**：Service 层的入参和出参；Biz 层的入参（部分）和出参。

## 2. PO (Persistent Object) / Entity
**定义**：与数据库表结构一一对应的结构体，包含 ORM 标签。
**在模板中的体现**：
- **位置**：`internal/data/entity/`
- **代码示例** (`internal/data/entity/demo.go`)：
  ```go
  type Demo struct {
      gormx.TableUUID
      Title       string `json:"title"`
      UserId      string `json:"user_id" gorm:"type:uuid;index;"`
      // ...
  }
  func (Demo) Table() string { return "demo" }
  ```
- **职责**：只负责定义数据存储格式，不包含业务逻辑。

## 3. DO (Domain Object) - 领域对象
**定义**：业务核心模型。在理想的 DDD 架构中，它应该包含业务行为。
**在模板中的策略**：
- **状态**：**可选**。
- **说明**：在 `go-layout` 的许多场景（尤其是 CRUD 服务）中，为了简化开发，我们允许 **弱化 DO**。
    - 如果业务逻辑简单，可以直接在 Biz 层使用 DTO 或 PO 进行流转。
    - 只有当业务逻辑非常复杂，且 DTO/PO 无法准确表达业务状态时，才建议在 `internal/biz/model` 中定义 DO。
- **当前示例**：虽然 `internal/biz/model/demo.go` 存在，但在 `DemoUseCase` 的实现中，大部分时候我们是在操作 DTO 或 PO。

## 4. Repo (Repository) - 仓储接口
**定义**：定义业务层对数据的访问需求，解耦业务逻辑与底层存储。
**在模板中的体现**：
- **接口定义** (`internal/biz/repo/demo.go`)：
  ```go
  type DemoRepo interface {
      CreateDemo(ctx context.Context, row *entity.Demo) error
      GetDemoList(...) *pb.DemoList
      // ...
  }
  ```
  *注意：接口定义在 Biz 层，意味着“业务层规定了它需要什么样的数据服务”。*

- **接口实现** (`internal/data/demo.go`)：
  ```go
  type demoRepo struct { data *Data }
  func (uc *demoRepo) CreateDemo(...) error { ... }
  ```
  *注意：实现在 Data 层，意味着“数据层负责满足业务层的数据需求”。*

## 5. Converter - 数据转换器
**定义**：负责在 DTO、PO、DO 之间进行数据格式转换。
**在模板中的体现**：
- **工具**：使用 `goverter` 自动生成，拒绝反射，拒绝手写重复代码。
- **定义位置**：`internal/biz/convert/`
- **代码示例** (`internal/biz/convert/demo.go`)：
  ```go
  // goverter:converter
  type DemoConvert interface {
      ToCreate(row *pb.CreateDemoRequest) *entity.Demo
  }
  ```
- **生成产物**：`dep/dto/demo.go`（由 `goverter` 生成，推荐执行 `make dto`）。

## 6. UseCase - 业务用例
**定义**：应用的核心业务逻辑编排者。
**在模板中的体现**：
- **位置**：`internal/biz/demo.go`
- **代码示例**：
  ```go
  type DemoUseCase struct {
      dto  convert.DemoConvert // 依赖转换器
      repo repo.DemoRepo       // 依赖仓储接口
  }
  ```
- **职责**：
    1. 接收 Service 传来的 DTO。
    2. 调用 Converter 转换数据。
    3. 执行业务校验（如检查余额、权限等）。
    4. 调用 Repo 进行持久化。
    5. 返回结果。
