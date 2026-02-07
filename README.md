# ClawChat - Go Web 版本

🥚 基于 OpenClaw Gateway 的 AI 聊天助手 - Go 语言实现

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- 🚀 **单文件部署** - 所有资源嵌入到可执行文件中
- ⚙️ **灵活配置** - 支持 TOML 配置文件和命令行参数
- 💬 **历史消息** - 自动加载和显示聊天历史
- 🎨 **Markdown 渲染** - 完美支持 Markdown 格式
- 🔒 **安全可靠** - Token 配置化管理
- 📱 **响应式设计** - 美观的聊天界面
- 🔄 **自动重连** - 断线自动重连机制

## 🎯 快速开始

### 1. 编译程序

```bash
go build -o clawchat.exe main.go
```

### 2. 配置

复制并编辑配置文件：

```bash
cp config.example.toml config.toml
```

编辑 `config.toml`，填入你的 Gateway 地址和 Token。

### 3. 运行

```bash
# Windows
clawchat.exe

# Linux/macOS
./clawchat
```

访问：http://localhost:3006/

## 📋 配置方式

### 方式 1: 配置文件（推荐）

创建 `config.toml`:

```toml
[server]
port = "3006"

[gateway]
url = "ws://127.0.0.1:18789"
token = "YOUR-TOKEN-HERE"
timeout = 30

[chat]
sessionKey = "global"
thinking = "auto"
deliver = true
```

然后直接运行：
```bash
./clawchat.exe
```

### 方式 2: 命令行参数

```bash
./clawchat.exe -p 3006 -g ws://127.0.0.1:18789 -t YOUR-TOKEN
```

### 方式 3: 混合使用

```bash
# 使用配置文件，但临时覆盖端口
./clawchat.exe -p 8080
```

## 🔧 命令行参数

| 参数 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `-config` | `-c` | 指定配置文件 | `-c config.dev.toml` |
| `-port` | `-p` | HTTP 端口（覆盖配置） | `-p 8080` |
| `-gateway` | `-g` | Gateway URL（覆盖配置） | `-g ws://...` |
| `-token` | `-t` | 认证 Token（覆盖配置） | `-t TOKEN` |
| `-version` | `-v` | 显示版本 | `-v` |

## 🎨 界面预览

- 🎨 **现代设计** - 渐变背景，圆角卡片
- 💬 **聊天气泡** - 用户消息右侧，助手消息左侧
- 📜 **历史记录** - 自动加载最近 50 条消息
- 🎯 **Markdown 支持** - 代码块、列表、表格等

## 📦 项目结构

```
clawchat/
├── main.go                 # 主程序
├── static/                 # 前端资源（嵌入到 exe）
│   └── index.html          # 聊天界面
├── config.toml             # 配置文件
├── config.example.toml     # 配置示例
├── go.mod                  # Go 模块
├── go.sum                  # 依赖锁定
└── README.md               # 项目说明
```

## 🔌 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 聊天界面 |
| `/api/config` | GET | 获取配置信息 |
| `/api/health` | GET | 健康检查 |

## 🚀 部署

### Windows

```bash
# 编译
go build -o clawchat.exe main.go

# 运行
clawchat.exe

# 或使用配置文件
clawchat.exe -c config.prod.toml
```

### Linux

```bash
# 编译
GOOS=linux GOARCH=amd64 go build -o clawchat main.go

# 运行
./clawchat
```

### macOS

```bash
# 编译
GOOS=darwin GOARCH=amd64 go build -o clawchat-mac main.go

# 运行
./clawchat-mac
```

## 📚 文档

- [配置指南](CONFIG.md) - 详细配置说明
- [快速参考](QUICKSTART.md) - 快速上手
- [安全说明](TOKEN_SECURITY.md) - Token 使用建议
- [架构说明](ARCHITECTURE_COMPARISON.md) - 架构对比
- [代理模式](PROXY_ARCHITECTURE.md) - WebSocket 代理实现

## 🛠️ 开发

### 启动开发模式

```bash
# 使用 go run（热重载）
go run main.go

# 指定端口
go run main.go -p 3006

# 使用配置文件
go run main.go -c config.dev.toml
```

### 修改前端

编辑 `static/index.html`，刷新浏览器即可看到效果（开发模式下直接读取文件）。

### 重新编译

```bash
go build -o clawchat.exe main.go
```

## 🔐 安全建议

1. **不要提交包含真实 token 的配置文件到 Git**
2. **使用环境变量或配置文件管理敏感信息**
3. **生产环境建议使用代理模式隐藏 token**
4. **定期更新 token**

## 🐛 故障排查

### 端口被占用

```bash
# 更换端口
./clawchat.exe -p 3007
```

### 无法连接 Gateway

1. 检查 Gateway 是否运行
2. 检查 Gateway 地址是否正确
3. 检查 Token 是否有效
4. 查看浏览器控制台错误信息

### 配置文件未生效

```bash
# 检查配置文件路径
./clawchat.exe -c /path/to/config.toml

# 查看加载的配置
curl http://localhost:3006/api/config
```

## 📝 更新日志

### v1.0.0 (2026-02-07)

- ✅ 初始版本
- ✅ 支持 WebSocket 连接 OpenClaw Gateway
- ✅ 历史消息加载和显示
- ✅ Markdown 渲染支持
- ✅ TOML 配置文件支持
- ✅ 命令行参数覆盖
- ✅ 响应式界面设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [OpenClaw Gateway](https://github.com/openclaw/gateway) - 强大的 AI 网关
- [Marked.js](https://marked.js.org/) - Markdown 解析器
- [BurntSushi/toml](https://github.com/BurntSushi/toml) - TOML 解析器

---

**Made with ❤️ by OpenClaw Community**

🥚 Happy Chatting!
