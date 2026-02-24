# 常用命令

## `create`

创建一个新的 Firefly 微服务项目。

```bash
firefly create [project-name]
```

- **参数**:
  - `project-name`: (可选) 项目名称。如果不提供，将在交互模式中输入。

- **示例**:
  ```bash
  firefly create my-service
  ```

## `version`

查看当前 CLI 工具的版本信息。

```bash
firefly version
```

## `env`

检查本地开发环境的依赖工具安装情况。

```bash
firefly env
```

它会检查以下工具是否存在：
- `go`
- `buf`
- `wire`
- `protoc`
