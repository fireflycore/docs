# Firefly CLI 工具

Firefly 提供了一个命令行工具（CLI），用于快速初始化项目和管理微服务环境。

## 安装

### 方式一：下载二进制文件 (推荐)

1. 前往 [Releases 页面](https://github.com/fireflycore/cli/releases) 下载适合您操作系统的最新版本。
2. 解压并将二进制文件移动到系统 `PATH` 路径下（例如 `/usr/local/bin`）。
3. 验证安装：
   ```bash
   firefly version
   ```

### 方式二：源码安装

如果您已安装 Go 环境：

```bash
go install github.com/fireflycore/cli/cmd/firefly@latest
```

## 环境检查

安装完成后，可以使用 `env` 命令检查当前环境是否满足 Firefly 开发要求（如 Go, Buf, Wire 等工具是否已安装）：

```bash
firefly env
```
