# 开发最佳实践

本仓库的“可执行规范”以 `@.trae/rules/core/spec-index.md` 为入口；本文档只保留经验型建议，避免与规则重复。

## 开发建议

### 1. 变更推进顺序
- 按“Proto → Service → Biz/Repo → Data → Wire/生成 → 验证”推进（以 makefile 与规则为准）。

### 2. 错误与日志
- Biz/Data 返回 Go error；Service 用 `Code/Message` 表达失败并返回 `nil` error（保持模板一致）。
- SQL/系统错误避免直接透出到 `Message`，对外返回可控文案。

### 3. 依赖与配置
- 最小化新增依赖；变更后 `go mod tidy` 并跑通 `go test ./...`、`go vet ./...`。
- 配置与密钥不入库，生产优先走配置服务。
