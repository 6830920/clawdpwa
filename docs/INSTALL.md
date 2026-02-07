# ClawPWA 安装指南

## 前置要求

- Node.js >= 22.0.0
- npm 或 pnpm
- OpenClaw Gateway 已安装并运行

## 安装步骤

### 1. 安装 Gateway 插件

```bash
cd gateway-plugin
npm install
npm run build
```

### 2. 注册插件到 OpenClaw

有两种方式注册插件：

#### 方式一：复制到 skills 目录（推荐）

```bash
cp -r dist ~/.openclaw/workspace/skills/pwa-channel
```

#### 方式二：通过 npm 链接（开发模式）

```bash
cd gateway-plugin
npm link
cd ~/.openclaw/workspace/skills
npm link @clawpwa/gateway-plugin
```

### 3. 配置 OpenClaw

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "channels": {
    "pwa": {
      "enabled": true,
      "path": "/pwa"
    }
  },
  "gateway": {
    "bind": "loopback",
    "port": 18789
  }
}
```

### 4. 重启 OpenClaw Gateway

```bash
openclaw gateway restart
```

### 5. 安装 PWA 客户端

```bash
cd pwa-client
npm install
```

### 6. 配置环境变量（可选）

创建 `pwa-client/.env`：

```bash
VITE_GATEWAY_URL=ws://localhost:18789/pwa
```

### 7. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 生产部署

### 构建 PWA

```bash
cd pwa-client
npm run build
```

构建产物在 `dist/` 目录。

### 部署到静态服务器

可以将 `dist/` 目录部署到任何静态文件服务器：
- Nginx
- Apache
- Vercel
- Netlify
- GitHub Pages

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name pwa.example.com;
    root /var/www/clawpwa/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket 代理
    location /gateway {
        proxy_pass http://localhost:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 配置 HTTPS

对于生产环境，建议使用 HTTPS：

1. 使用 Let's Encrypt 获取免费证书
2. 配置 Nginx 使用 HTTPS
3. 更新 PWA manifest 的 `scope` 和 `start_url`

## Docker 部署

### Dockerfile

```dockerfile
# pwa-client/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  pwa-client:
    build: ./pwa-client
    ports:
      - "80:80"
    depends_on:
      - openclaw-gateway

  openclaw-gateway:
    image: openclaw/gateway:latest
    ports:
      - "18789:18789"
    volumes:
      - ~/.openclaw:/root/.openclaw
```

## 验证安装

### 检查 Gateway 插件

```bash
openclaw doctor
```

应该看到 PWA 通道已加载。

### 检查 PWA 客户端

1. 打开浏览器开发者工具
2. 访问 http://localhost:3000
3. 查看 Console，应该看到：
   ```
   [WebSocket] Connected
   ```
4. 查看 Application > Service Workers，应该看到已注册的 SW
5. 查看 Application > Manifest，应该看到 PWA 信息

### 测试连接

1. 在 PWA 界面输入消息
2. 检查是否收到响应
3. 查看 Network > WS，确认 WebSocket 消息收发

## 故障排除

### 问题：无法连接到 Gateway

**解决方案：**
1. 检查 OpenClaw Gateway 是否运行：
   ```bash
   openclaw gateway status
   ```
2. 检查端口 18789 是否被占用
3. 检查防火墙设置
4. 查看日志：
   ```bash
   openclaw gateway logs
   ```

### 问题：PWA 无法安装

**解决方案：**
1. 确保使用 HTTPS（或 localhost）
2. 检查 manifest.json 语法
3. 确保有合适的图标（192x192 和 512x512）
4. 在 Chrome DevTools > Application > Manifest 中检查错误

### 问题：Service Worker 不工作

**解决方案：**
1. 清除缓存并刷新
2. 检查 vite-plugin-pwa 配置
3. 查看 Service Worker 注册代码
4. 检查浏览器兼容性

### 问题：消息发送失败

**解决方案：**
1. 检查 WebSocket 连接状态
2. 查看 Console 错误信息
3. 验证消息格式
4. 检查 Gateway 日志

## 更新

### 更新 Gateway 插件

```bash
cd gateway-plugin
git pull
npm install
npm run build
cp -r dist ~/.openclaw/workspace/skills/pwa-channel
openclaw gateway restart
```

### 更新 PWA 客户端

```bash
cd pwa-client
git pull
npm install
npm run build
```

重新部署 `dist/` 目录。
