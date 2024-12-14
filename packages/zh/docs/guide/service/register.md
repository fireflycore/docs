# 服务注册
> 所有的开发语言默认只支持ETCD为注册中心，如果使用其他的注册中心，请自行实现方法（参考etcd）

## 初始化
> /internal/data/core.go
::: code-group

```go [golang]
package data

import (
	"github.com/google/wire"
	etcd "github.com/lhdhtrc/etcd-go/pkg"
	"go-layout/internal/biz"
	"go-layout/internal/conf"
	clientv3 "go.etcd.io/etcd/client/v3"
	"gorm.io/gorm"
)

var ProviderSet = wire.NewSet(NewData, NewDemoRepo)

type Data struct {
	Etcd  *clientv3.Client
}

func NewData(bc *conf.BootstrapConf, dc *conf.DataConf) (*Data, error) {
	etcdCli, ee := etcd.New(dc.Etcd)
	if ee != nil {
		return nil, ee
	}

	return &Data{
		Etcd:  etcdCli,
	}, nil
}
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

## 注册中心
>  /internal/server/register.go
::: code-group

```go [golang]
package server

import (
	"fmt"
	micro "github.com/lhdhtrc/micro-go/pkg/core"
	"github.com/lhdhtrc/micro-go/pkg/etcd"
	demo "go-layout/dep/protobuf/gen/acme/demo/v1"
	"go-layout/internal/conf"
	"go-layout/internal/data"
	"google.golang.org/grpc"
)

func NewRegisterServer(bc *conf.BootstrapConf, d *data.Data) (micro.Register, error) {
	return etcd.NewRegister(d.Etcd, bc.Micro)
}

func NewRegisterCenterRepo(mr micro.Register) []*grpc.ServiceDesc {
	raw := []*grpc.ServiceDesc{
		&demo.DemoService_ServiceDesc,
	}

	if errs := micro.NewRegisterService(raw, mr); len(errs) != 0 {
		fmt.Println(errs)
	}

	return raw
}
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

## 注册实例
> /cmd/server/app
::: code-group

```go [golang]
package main

import (
	"fmt"
	micro "github.com/lhdhtrc/micro-go/pkg/core"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"net"
)

type App struct {
	Listener   net.Listener
	GrpcServer *grpc.Server
	Register   micro.Register
	Services   []*grpc.ServiceDesc

	Logger *zap.Logger
}

func (ist *App) Start() {
	if err := ist.GrpcServer.Serve(ist.Listener); err != nil {
		panic(err)
	}
}

func (ist *App) Stop() {
	ist.GrpcServer.Stop()
}

func NewApp(nl net.Listener, gs *grpc.Server, register micro.Register, services []*grpc.ServiceDesc, logger *zap.Logger) *App {
	register.WithRetryBefore(func() {
		fmt.Println("重试之前的函数")
	})
	register.WithRetryAfter(func() {
		micro.NewRegisterService(services, register)
		go register.SustainLease()
		fmt.Println("重试之后的函数")
	})
	go register.SustainLease()

	return &App{
		Listener:   nl,
		GrpcServer: gs,
		Register:   register,
		Services:   services,
		Logger:     logger,
	}
}

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