# 🚀 ClawChat Go Server - 快速参考

## ✅ 已完成的功能

- [x] 命令行参数配置
- [x] 动态 Gateway URL 替换
- [x] 可配置 HTTP 端口
- [x] 版本信息显示
- [x] 健康检查 API
- [x] 配置查询 API
- [x] 静态文件嵌入到 exe
- [x] 单文件部署

## 📦 文件清单

```
pwa-versions/go-version/
├── clawchat.exe          # 编译后的可执行文件（8.0 MB）
├── main.go               # 源代码
├── go.mod                # Go 模块配置
├── static/
│   └── index.html        # 前端界面（已嵌入 exe）
├── README.md             # 完整使用文档
├── start-local.bat       # 本地开发启动脚本
├── start-remote.bat      # 远程 Gateway 启动脚本
├── start-prod.bat        # 生产环境启动脚本
└── test-standalone.bat   # 独立运行测试脚本
```

## ⚡ 快速开始

### 1. 直接运行（默认配置）

```bash
./clawchat.exe
```

访问: http://localhost:3006/

### 2. 自定义端口

```bash
# 方式一：完整参数
./clawchat.exe -port 8080

# 方式二：简写
./clawchat.exe -p 8080
```

### 3. 连接远程 Gateway

```bash
# 完整参数
./clawchat.exe -gateway ws://192.168.1.100:18789

# 简写
./clawchat.exe -g ws://192.168.1.100:18789
```

### 4. 组合使用

```bash
./clawchat.exe -p 8080 -g ws://192.168.1.100:18789
```

## 🎯 常用命令

| 命令 | 说明 |
|------|------|
| `./clawchat.exe` | 使用默认配置启动 |
| `./clawchat.exe -p 3006` | 指定端口 |
| `./clawchat.exe -g ws://IP:18789` | 指定 Gateway |
| `./clawchat.exe -v` | 查看版本 |
| `./clawchat.exe -h` | 查看帮助 |

## 🔌 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 聊天界面 |
| `/api/config` | GET | 获取配置 |
| `/api/health` | GET | 健康检查 |

**示例:**

```bash
# 查看当前配置
curl http://localhost:3006/api/config

# 健康检查
curl http://localhost:3006/api/health
```

**返回示例:**

```json
// /api/config
{
  "gateway": "ws://127.0.0.1:18789",
  "version": "1.0.0"
}

// /api/health
{
  "status": "ok",
  "timestamp": "2026-02-07T20:36:31+08:00",
  "gateway": "ws://127.0.0.1:18789"
}
```

## 🚀 启动脚本

双击运行对应的 `.bat` 文件：

- `start-local.bat` - 本地开发（端口 3006）
- `start-remote.bat` - 远程 Gateway（端口 8080）
- `start-prod.bat` - 生产环境（端口 80）

## 📝 编译

```bash
# 查看源代码
cat main.go

# 重新编译
go build -o clawchat.exe main.go

# 交叉编译（Windows 编译 Linux 版）
SET GOOS=linux
SET GOARCH=amd64
go build -o clawchat-linux main.go
```

## 🎉 特性

1. **单文件部署** - 所有资源嵌入 exe，复制即用
2. **命令行配置** - 无需修改代码即可配置
3. **动态 Gateway** - 运行时指定 Gateway 地址
4. **健康检查** - 提供监控端点
5. **零依赖运行** - 目标机器无需安装 Go

## 💡 使用场景

### 场景 1: 本地开发

```bash
./clawchat.exe -p 3006 -g ws://127.0.0.1:18789
```

### 场景 2: 远程 Gateway

```bash
./clawchat.exe -p 80 -g ws://gateway.example.com:18789
```

### 场景 3: 内网部署

```bash
./clawchat.exe -p 8080 -g ws://192.168.1.100:18789
```

## 🔧 故障排查

**问题：端口被占用**
```bash
# 更换端口
./clawchat.exe -p 3007
```

**问题：无法连接 Gateway**
```bash
# 1. 检查 Gateway 地址是否正确
# 2. 确保 Gateway 正在运行
# 3. 检查防火墙设置
```

## 📊 当前状态

✅ **已测试并验证**
- 默认配置启动：正常
- 自定义端口：正常（端口 3008）
- 自定义 Gateway：正常
- API 端点：正常
- 嵌入静态文件：正常（8.0 MB exe）

---

**版本**: v1.0.0
**更新时间**: 2026-02-07
