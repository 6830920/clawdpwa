package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/gorilla/websocket"
)

//go:embed static/*
var staticFiles embed.FS

// WebSocket 升级器
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源
	},
}

// WebSocket 代理处理器
func handleWebSocketProxy(w http.ResponseWriter, r *http.Request, config Config) {
	// 1. 升级 HTTP 连接到 WebSocket
	clientConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WebSocket] Upgrade failed: %v", err)
		return
	}
	defer clientConn.Close()

	log.Printf("[WebSocket] Client connected from %s", r.RemoteAddr)

	// 2. 连接到 OpenClaw Gateway
	gatewayURL := config.Gateway.URL

	// 创建自定义 Dialer，设置 Origin 为空（避免 CORS 检查）
	dialer := websocket.DefaultDialer
	dialer.HandshakeTimeout = time.Second * 10

	headers := http.Header{}
	// 不设置 Origin 头，或者设置为 Gateway 允许的值
	// 如果 Gateway 绑定在 127.0.0.1，通常不检查 Origin
	headers.Set("Origin", "http://localhost")

	gatewayConn, _, err := dialer.Dial(gatewayURL, headers)
	if err != nil {
		log.Printf("[Gateway] Connection failed: %v", err)
		clientConn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf(`{"type":"error","message":"Failed to connect to gateway: %s"}`, err)))
		return
	}
	defer gatewayConn.Close()

	log.Printf("[Gateway] Connected to %s", gatewayURL)

	// 3. 启动双向消息转发
	// 使用 context 和 WaitGroup 来管理 goroutines
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup
	wg.Add(2)

	// 客户端 -> Gateway
	go func() {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				return
			default:
			}

			messageType, message, err := clientConn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("[WebSocket] Read error: %v", err)
				}
				cancel()
				return
			}

			log.Printf("[Proxy] Client -> Gateway: %d bytes", len(message))

			// 如果是 connect 消息，注入正确的 Token
			if strings.Contains(string(message), `"method":"connect"`) {
				// 替换或添加 auth.token
				messageStr := string(message)
				// 查找并替换 token 字段
				if strings.Contains(messageStr, `"auth":{`) {
					// 替换现有 token
					messageStr = strings.ReplaceAll(messageStr, `"token":"99a1282cff39ec6008916302302fe42dd769c6d1fdfc1"`, fmt.Sprintf(`"token":"%s"`, config.Gateway.Token))
					messageStr = strings.ReplaceAll(messageStr, `"token": "99a1282cff39ec6008916302302fe42dd769c6d1fdfc1"`, fmt.Sprintf(`"token": "%s"`, config.Gateway.Token))
					if !strings.Contains(messageStr, config.Gateway.Token[:8]) {
						// 如果上面没替换成功，使用正则替换
						messageStr = regexp.MustCompile(`"token"\s*:\s*"[^"]*"`).ReplaceAllString(messageStr, fmt.Sprintf(`"token":"%s"`, config.Gateway.Token))
					}
					message = []byte(messageStr)
					log.Printf("[Proxy] Injected token in connect message")
				}
			}

			if err := gatewayConn.WriteMessage(messageType, message); err != nil {
				log.Printf("[Gateway] Write error: %v", err)
				cancel()
				return
			}
		}
	}()

	// Gateway -> 客户端
	go func() {
		defer wg.Done()
		for {
			select {
			case <-ctx.Done():
				return
			default:
			}

			messageType, message, err := gatewayConn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("[Gateway] Read error: %v", err)
				}
				cancel()
				return
			}

			log.Printf("[Proxy] Gateway -> Client: %d bytes", len(message))

			if err := clientConn.WriteMessage(messageType, message); err != nil {
				log.Printf("[WebSocket] Write error: %v", err)
				cancel()
				return
			}
		}
	}()

	// 等待所有 goroutines 完成
	wg.Wait()
	log.Printf("[WebSocket] Connection closed")
}

// 配置结构
type Config struct {
	Server   ServerConfig
	Gateway  GatewayConfig
	Client   ClientConfig
	Chat     ChatConfig
	Security SecurityConfig
	Log      LogConfig
}

type ServerConfig struct {
	Port string
	Host string
}

type GatewayConfig struct {
	URL     string
	Token   string
	Timeout int
}

type ClientConfig struct {
	ID       string
	Version  string
	Platform string
	Mode     string
}

type ChatConfig struct {
	SessionKey string
	Thinking   string
	Deliver    bool
}

type SecurityConfig struct {
	CorsOrigins []string `toml:"corsOrigins"`
	EnableTLS   bool     `toml:"enableTLS"`
}

type LogConfig struct {
	Level string
	File  string
}

// 默认配置
var defaultConfig = Config{
	Server: ServerConfig{
		Port: "36006",
		Host: "",
	},
	Gateway: GatewayConfig{
		URL:     "ws://127.0.0.1:18789",
		Token:   "99a1282cff39ec6008916016302302fe42dd769c6d1fdfc1",
		Timeout: 30,
	},
	Client: ClientConfig{
		ID:       "webchat-ui",
		Version:  "1.0.0",
		Platform: "web",
		Mode:     "webchat",
	},
	Chat: ChatConfig{
		SessionKey: "global",
		Thinking:   "auto",
		Deliver:    true,
	},
}

// 命令行参数
var (
	configFile  string
	port        string
	gatewayURL  string
	token       string
	showVersion bool
)

// 版本信息
const version = "1.0.0"

func init() {
	flag.StringVar(&configFile, "config", "", "Configuration file path (TOML)")
	flag.StringVar(&configFile, "c", "", "Configuration file path (shorthand)")
	flag.StringVar(&port, "port", "", "HTTP server port (overrides config)")
	flag.StringVar(&port, "p", "", "HTTP server port (shorthand, overrides config)")
	flag.StringVar(&gatewayURL, "gateway", "", "Gateway WebSocket URL (overrides config)")
	flag.StringVar(&gatewayURL, "g", "", "Gateway WebSocket URL (shorthand, overrides config)")
	flag.StringVar(&token, "token", "", "Gateway auth token (overrides config)")
	flag.StringVar(&token, "t", "", "Gateway auth token (shorthand, overrides config)")
	flag.BoolVar(&showVersion, "version", false, "Show version information")
	flag.BoolVar(&showVersion, "v", false, "Show version information (shorthand)")
}

// loadConfig 加载配置文件
func loadConfig(configPath string) (Config, error) {
	config := defaultConfig

	// 如果没有指定配置文件，尝试默认位置
	if configPath == "" {
		// 尝试当前目录的 config.toml
		if _, err := os.Stat("config.toml"); err == nil {
			configPath = "config.toml"
		} else {
			// 尝试程序所在目录的 config.toml
			if exePath, err := os.Executable(); err == nil {
				exeDir := filepath.Dir(exePath)
				defaultConfigPath := filepath.Join(exeDir, "config.toml")
				if _, err := os.Stat(defaultConfigPath); err == nil {
					configPath = defaultConfigPath
				}
			}
		}
	}

	// 如果找到了配置文件，读取它
	if configPath != "" {
		log.Printf("[Config] Loading config from: %s", configPath)
		if _, err := toml.DecodeFile(configPath, &config); err != nil {
			return config, fmt.Errorf("failed to decode config file: %w", err)
		}
	} else {
		log.Println("[Config] Using default configuration")
	}

	return config, nil
}

// mergeConfig 合并命令行参数到配置
func mergeConfig(config Config, cmdPort, cmdGateway, cmdToken string) Config {
	if cmdPort != "" {
		config.Server.Port = cmdPort
	}
	if cmdGateway != "" {
		config.Gateway.URL = cmdGateway
	}
	if cmdToken != "" {
		config.Gateway.Token = cmdToken
	}
	return config
}

func main() {
	flag.Parse()

	// 显示版本信息
	if showVersion {
		fmt.Printf("ClawChat Go Server v%s\n", version)
		return
	}

	// 加载配置文件
	config, err := loadConfig(configFile)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 合并命令行参数（命令行参数优先级更高）
	config = mergeConfig(config, port, gatewayURL, token)

	// 读取原始 HTML 文件（保留原始内容，在请求时动态替换）
	htmlContent, err := staticFiles.ReadFile("static/index.html")
	if err != nil {
		log.Fatal("Failed to read embedded HTML:", err)
	}

	// 提取静态目录
	sub, _ := fs.Sub(staticFiles, "static")
	fileServer := http.FileServer(http.FS(sub))

	// WebSocket 代理端点
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocketProxy(w, r, config)
	})

	// 配置端点（供前端获取配置）
	http.HandleFunc("/api/config", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		// 返回代理 WebSocket URL
		wsURL := fmt.Sprintf("ws://%s/ws", r.Host)
		fmt.Fprintf(w, `{"gateway":"%s","version":"%s","client":"%s"}`, wsURL, version, config.Client.ID)
	})

	// 健康检查端点
	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		fmt.Fprintf(w, `{"status":"ok","timestamp":"%s","gateway":"%s","version":"%s"}`, time.Now().Format(time.RFC3339), config.Gateway.URL, version)
	})

	// 根路径返回注入配置后的 HTML
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.URL.Path == "/" {
			// 根据请求的 Host 动态调整 Gateway URL
			gatewayURL := config.Gateway.URL
			if strings.Contains(gatewayURL, "127.0.0.1") {
				// 如果配置使用 127.0.0.1，替换为请求的 host
				requestHost := r.Host
				// 移除端口部分
				hostOnly := strings.Split(requestHost, ":")[0]
				gatewayURL = strings.Replace(gatewayURL, "127.0.0.1", hostOnly, 1)
				log.Printf("[Request] Adjusted Gateway URL to: %s", gatewayURL)
			}

			// 动态替换配置到 HTML
			htmlWithConfig := string(htmlContent)
			htmlWithConfig = strings.Replace(htmlWithConfig, "ws://127.0.0.1:18789", gatewayURL, -1)
			htmlWithConfig = strings.Replace(htmlWithConfig, "99a1282cff39ec6008916302302fe42dd769c6d1fdfc1", config.Gateway.Token, -1)
			htmlWithConfig = strings.Replace(htmlWithConfig, `"sessionKey": "global"`, fmt.Sprintf(`"sessionKey": "%s"`, config.Chat.SessionKey), -1)
			htmlWithConfig = strings.Replace(htmlWithConfig, `"thinking": "auto"`, fmt.Sprintf(`"thinking": "%s"`, config.Chat.Thinking), -1)

			fmt.Fprint(w, htmlWithConfig)
			return
		}

		// 其他文件从嵌入的 FS 提供
		fileServer.ServeHTTP(w, r)
	})

	addr := ":" + config.Server.Port

	fmt.Printf("🚀 ClawChat Go Server v%s\n", version)
	fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
	fmt.Printf("📦 Serving files from embedded FS\n")
	if configFile != "" {
		fmt.Printf("⚙️  Config file: %s\n", configFile)
	} else {
		fmt.Printf("⚙️  Config: Using defaults/CLI params\n")
	}
	fmt.Printf("🌐 HTTP Server:  http://localhost%s\n", addr)
	fmt.Printf("🔌 Gateway URL: %s\n", config.Gateway.URL)
	fmt.Printf("🔑 Token: %s***\n", config.Gateway.Token[:8])
	fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
	fmt.Printf("Press Ctrl+C to stop\n\n")

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
