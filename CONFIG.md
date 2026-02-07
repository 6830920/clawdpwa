# ⚙️ ClawChat 配置指南

## 📋 配置优先级

配置优先级从高到低：

1. **命令行参数** - 最高优先级，适合临时覆盖
2. **配置文件** - 推荐方式，持久化配置
3. **默认值** - 代码中硬编码的默认值

## 🚀 快速开始

### 方式 1: 使用配置文件（推荐）

```bash
# 1. 复制示例配置
cp config.example.toml config.toml

# 2. 编辑配置文件，填入你的 token
notepad config.toml  # Windows
# 或
nano config.toml     # Linux/macOS

# 3. 直接运行（自动加载 config.toml）
./clawchat.exe
```

### 方式 2: 使用命令行参数

```bash
# 完整参数
./clawchat.exe -port 3006 -gateway ws://127.0.0.1:18789 -token YOUR-TOKEN

# 简写
./clawchat.exe -p 3006 -g ws://127.0.0.1:18789 -t YOUR-TOKEN
```

### 方式 3: 混合使用（推荐用于测试）

```bash
# 使用配置文件，但临时覆盖端口
./clawchat.exe -p 8080

# 使用配置文件，但临时覆盖 token
./clawchat.exe -t TEST-TOKEN-FOR-DEBUG
```

## 📁 配置文件详解

### 完整配置示例

```toml
[server]
port = "3006"              # HTTP 服务端口
# host = "localhost"       # 监听地址（可选）

[gateway]
url = "ws://127.0.0.1:18789"           # Gateway WebSocket 地址
token = "YOUR-TOKEN-HERE"              # 认证 Token（必填）
timeout = 30                           # 连接超时（秒）

[client]
id = "webchat-ui"          # 客户端 ID
version = "1.0.0"          # 版本号
platform = "web"           # 平台
mode = "webchat"           # 模式

[chat]
sessionKey = "global"      # 默认会话 Key
thinking = "auto"          # 思考模式: auto/always/never
deliver = true             # 实时投递

[security]
# corsOrigins = ["*"]      # CORS 允许的源
# enableTLS = false         # 启用 HTTPS

[log]
level = "info"             # 日志级别: debug/info/warn/error
# file = "clawchat.log"    # 日志文件路径
```

## 🎯 多环境配置

### 开发环境

创建 `config.dev.toml`:
```toml
[server]
port = "3006"

[gateway]
url = "ws://127.0.0.1:18789"
token = "dev-token-here"
timeout = 30

[log]
level = "debug"
```

启动:
```bash
./clawchat.exe -c config.dev.toml
```

### 生产环境

创建 `config.prod.toml`:
```toml
[server]
port = "80"

[gateway]
url = "ws://prod-gateway-server:18789"
token = "prod-token-here"
timeout = 30

[log]
level = "info"
file = "/var/log/clawchat.log"
```

启动:
```bash
./clawchat.exe -c config.prod.toml
```

## 🔐 Token 管理

### 获取 Token

从你的 OpenClaw Gateway 配置文件中找到 `auth.token` 字段。

### 安全建议

1. **不要将包含真实 token 的配置文件提交到 Git**
   - 使用 `.gitignore` 排除 `config.toml`
   - 只提交 `config.example.toml`（不含敏感信息）

2. **多环境使用不同 token**
   - 开发环境使用测试 token
   - 生产环境使用正式 token

3. **Token 过期处理**
   - Token 过期后，更新配置文件中的 `token` 字段
   - 重启服务器

## 📝 命令行参数参考

| 参数 | 简写 | 说明 | 覆盖配置字段 |
|------|------|------|-------------|
| `-config` | `-c` | 指定配置文件路径 | - |
| `-port` | `-p` | HTTP 服务器端口 | `server.port` |
| `-gateway` | `-g` | Gateway WebSocket URL | `gateway.url` |
| `-token` | `-t` | Gateway 认证 Token | `gateway.token` |
| `-version` | `-v` | 显示版本信息 | - |
| `-help` | `-h` | 显示帮助信息 | - |

## 💡 使用场景

### 场景 1: 本地开发

```bash
# 使用配置文件
./clawchat.exe

# 或直接指定所有参数
./clawchat.exe -p 3006 -g ws://127.0.0.1:18789 -t YOUR-TOKEN
```

### 场景 2: 快速测试不同 Gateway

```bash
# 测试 Gateway A
./clawchat.exe -g ws://gateway-a:18789

# 测试 Gateway B（无需修改配置文件）
./clawchat.exe -g ws://gateway-b:18789
```

### 场景 3: 测试不同 Token

```bash
# 使用配置文件中的 Gateway，但临时更换 token
./clawchat.exe -t new-test-token-12345
```

### 场景 4: 生产部署

```bash
# 使用专用配置文件
./clawchat.exe -c /etc/clawchat/production.toml
```

### 场景 5: Docker 部署

```bash
# 使用环境变量（需要修改代码支持）
docker run -e GATEWAY_TOKEN=xxx -e GATEWAY_URL=ws://... clawchat
```

## 🔍 配置验证

### 查看当前配置

```bash
# 访问配置 API
curl http://localhost:3006/api/config
```

返回示例:
```json
{
  "gateway": "ws://127.0.0.1:18789",
  "version": "1.0.0",
  "client": "webchat-ui"
}
```

### 健康检查

```bash
curl http://localhost:3006/api/health
```

返回示例:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T20:58:10+08:00",
  "gateway": "ws://127.0.0.1:18789",
  "version": "1.0.0"
}
```

## 🛠️ 故障排查

### 问题 1: 配置文件未加载

**症状**: 启动时显示 "Using defaults/CLI params"，但明明有 `config.toml`

**解决**:
```bash
# 1. 确认文件存在
ls -l config.toml

# 2. 检查文件权限
chmod 644 config.toml

# 3. 显式指定配置文件
./clawchat.exe -c config.toml
```

### 问题 2: Token 无效

**症状**: 连接 Gateway 后立即断开或报错

**解决**:
1. 检查 token 是否正确（从 Gateway 配置中复制）
2. 检查 token 是否过期
3. 尝试临时指定 token 测试:
   ```bash
   ./clawchat.exe -t YOUR-TOKEN
   ```

### 问题 3: 配置文件格式错误

**症状**: 启动失败，显示 "failed to decode config file"

**解决**:
1. 检查 TOML 语法（使用在线验证器）
2. 确保字符串用引号包裹
3. 确保布尔值是 `true` 或 `false`
4. 检查是否有语法错误（如缺少方括号）

## 📊 配置迁移

从旧版本迁移：

### 之前（纯命令行）
```bash
./clawchat.exe -p 3006 -g ws://127.0.0.1:18789 -t YOUR-TOKEN
```

### 现在（配置文件）
```bash
# 1. 创建 config.toml
cat > config.toml << EOF
[server]
port = "3006"

[gateway]
url = "ws://127.0.0.1:18789"
token = "YOUR-TOKEN"
EOF

# 2. 直接运行
./clawchat.exe
```

## 🎉 最佳实践

1. **使用配置文件管理长期配置**
   - Token、Gateway URL 等不常变的配置放入配置文件

2. **使用命令行参数处理临时变更**
   - 测试时临时更换端口、token

3. **多环境分离**
   - `config.dev.toml` - 开发环境
   - `config.prod.toml` - 生产环境
   - `config.test.toml` - 测试环境

4. **版本控制**
   - 提交 `config.example.toml`（不含敏感信息）
   - 忽略 `config.toml`（含真实 token）

5. **文档化配置**
   - 在配置文件中添加注释
   - 说明每个配置的用途

---

**总结**: 推荐使用 **配置文件** 作为主要配置方式，**命令行参数** 用于临时覆盖。这样既方便管理又灵活！
