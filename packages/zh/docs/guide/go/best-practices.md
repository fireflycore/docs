# 开发最佳实践

本文档总结了使用 Firefly Go 模板开发微服务时的最佳实践和建议。

## 1. 核心原则

### 1.1 协议驱动开发 (Schema-First)

始终先定义 API 协议（Protobuf），再编写代码。

- **禁止**直接修改 `dep/protobuf/gen` 下的代码。
- **禁止**在 Service 层手动编写复杂的参数校验逻辑，应优先使用 `protovalidate` 在 Proto 中定义规则。

### 1.2 依赖注入

所有组件依赖必须通过构造函数传递，禁止使用全局变量获取依赖。

- **正确**: `func NewDemoUseCase(repo repo.DemoRepo) *DemoUseCase`
- **错误**: 在方法内部直接调用 `data.GlobalDB` 或 `conf.GetConfig()`。

每次修改了依赖关系（如新增了 Repo 或 UseCase），都必须重新运行 `wire ./cmd/server`。

## 2. 错误处理

### 2.1 分层错误处理

- **Data 层**：返回原始错误（如 `gorm.ErrRecordNotFound`）或包装后的错误。
- **Biz 层**：根据业务逻辑处理错误。如果是业务错误（如“余额不足”），应定义专门的 Error 类型或常量。
- **Service 层**：是错误的终点。必须将所有内部错误转换为 gRPC 状态码（Status Code）和错误信息。
    - 使用 `status.Errorf(codes.NotFound, "user not found")` 返回错误。
    - 不要直接将底层的数据库错误信息暴露给前端/客户端。

### 2.2 日志记录

- **错误日志**：通常在 Service 层捕获到错误并准备返回给客户端时记录。避免在 Data、Biz、Service 层重复记录同一个错误。
- **上下文**：日志中应包含 TraceID（模板已自动集成），方便链路追踪。

## 3. 数据库与事务

### 3.1 事务管理

使用 `internal/data/transaction.go` 中提供的事务闭包。

```go
func (uc *DemoUseCase) CreateOrder(ctx context.Context, order *Order) error {
    return uc.tx.ExecTx(ctx, func(ctx context.Context) error {
        if err := uc.repo.CreateOrder(ctx, order); err != nil {
            return err
        }
        if err := uc.repo.DeductInventory(ctx, order.ItemID); err != nil {
            return err
        }
        return nil
    })
}
```

### 3.2 避免在循环中查询数据库

- **禁止**: 在 `for` 循环中执行 `repo.GetByID(id)`。
- **推荐**: 先收集所有 ID，调用 `repo.ListByIDs(ids)` 批量查询，然后在内存中映射。

## 4. 配置管理

- **环境隔离**：不同环境（Dev, Test, Prod）的配置应通过配置中心或不同的 `bootstrap.json` 管理。
- **敏感信息**：数据库密码、API Key 等敏感信息禁止直接硬编码在代码中，应通过环境变量或加密配置加载。

## 5. 代码风格

- **命名**：遵循 Go 官方命名规范。接口名以 `er` 结尾（如 `Reader`），实现类通常去掉后缀或加上 `Impl`（但在本模板中，Repo 实现通常命名为 `demoRepo`，UseCase 命名为 `DemoUseCase`）。
- **DTO 转换**：禁止在业务代码中手动进行复杂的字段拷贝，应在 `internal/biz/convert` 中定义接口并使用 `goverter` 生成。
