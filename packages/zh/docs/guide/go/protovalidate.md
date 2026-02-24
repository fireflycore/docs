# Protovalidate 速查

参考：`buf.validate`（protovalidate）
- https://buf.build/bufbuild/protovalidate/docs/main:buf.validate

说明：
- 字段约束不是必须的；用户未要求时，由 AI 根据场景决定是否添加
- 需要做入口校验时，统一在 Service 入口使用 `protovalidate.Validate(req)`（避免手写重复校验）

## 常用约束

### 必填

```protobuf
string id = 1 [(buf.validate.field).required = true];
```

### 字符串

```protobuf
string name = 1 [(buf.validate.field).string.min_len = 1];
string email = 2 [(buf.validate.field).string.email = true];
string uuid = 3 [(buf.validate.field).string.uuid = true];
string key = 4 [(buf.validate.field).string.pattern = "^[a-zA-Z0-9_]+$"];
```

### 数字

```protobuf
uint32 age = 1 [(buf.validate.field).uint32.gt = 0];
int64 total = 2 [(buf.validate.field).int64.gte = 0];
```

### 枚举与取值范围

```protobuf
MyEnum status = 1 [(buf.validate.field).enum.defined_only = true];
uint32 type = 2 [(buf.validate.field).uint32 = { in: [0, 1, 2] }];
```

### Repeated

```protobuf
repeated string ids = 1 [(buf.validate.field).repeated.min_items = 1];
repeated string unique_ids = 2 [(buf.validate.field).repeated.unique = true];
```

