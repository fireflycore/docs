# CLI 配置参考

目前 Firefly CLI 主要通过命令行参数进行交互，暂无复杂的全局配置文件。

未来版本计划支持 `~/.firefly/config.yaml` 来持久化存储一些用户偏好设置，例如：
- 默认的模板仓库地址
- 默认的作者信息
- 代理设置等

## 环境变量

CLI 支持以下环境变量：

- `FIREFLY_HOME`: 指定 Firefly 的工作主目录（默认为 `~/.firefly`）。
- `FIREFLY_DEBUG`: 设置为 `true` 开启调试日志。
