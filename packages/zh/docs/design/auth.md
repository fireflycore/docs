# 认证/授权设计

## 服务-API资源
- service[app_id, app_secret] -> invoke[AuthService.GenerateServiceToken] -> invoke[AppService.SyncApi interface];
- 服务通过[app_id, app_secret] -> 调用[AuthService.GenerateServiceToken]获取[service token] -> 调用[AppService.SyncApi interface]将服务自身的接口同步到[AppService.Api]中

## 客户端-API-计费
- user -> client[app_id]login[user token] -> grpc-gateway -> log invoke interface -> statistical analysis
1、用户通过登陆到客户端（APP\WEB\DESKTOP）获取了TOKEN;
2、[user]token->[grpc-gateway]：
  - invoke app_id 是否和 target app_id 存在授权关系，存在则通过，不存在则抛出错误;
    - 验证方法，定义到[AuthService]中，可考虑使用[casbin]提升性能;
  - 检查当前用户的身份是否可以访问该接口;
    - 验证方法，定义到[AuthService]中，使用[casbin]作为权限验证;
  - 判断当前元数据[metadata]是否存在[TraceId], 不存在则初始化[TraceId];
  - 调用目标接口
  - 记录本次请求的数据[invoke app_id][target app_id][interface][trace-id][status]

[target_app]
  - 建立授权关系[source_app]
  - 确认授权接口[api]
[target_app_admin]
  - 创建/修改角色接口权限[api_permission]
  - [source_app]<auth>[target_app][api]