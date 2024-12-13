# 服务注册
> 所有的开发语言默认只支持ETCD为注册中心，如果要用其他的注册中心，按照要求进行封装，可以提交仓库到至PR

## 注册中心

::: code-group

```go [golang]
// internal/data/core.go 实例化etcd客户端
// internal/server/register.go // 实例化注册中心，将服务注册到注册中心

store.Use.Task = task.New(&store.Use.Config.Task)

var etcdConfig etcd.ConfigEntity
store.Use.Task.InitConfig([]string{
    // ETCD远程配置链接
}, []interface{}{
    &etcdConfig,
})
store.Use.Task.Await()

// 如果ETCD采用TLS加密通信
// store.Use.Task.InitCert("etcd", &etcdConfig.Tls)
// store.Use.Task.Await()
// 开发中
```

```rust [rust]
// 开发中
```

```dart [dart]
// 开发中
```

```kotlin [kotlin]
// 开发中
```

```swift [swift]
// 开发中
```

```node [node]
// 开发中
```

```php [php]
// 开发中
```

```python [python]
// 开发中
```

:::