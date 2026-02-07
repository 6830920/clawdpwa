package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
)

//go:embed static/*
var staticFiles embed.FS

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
		Port: "3006",
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

	// 读取原始 HTML 文件
	htmlContent, err := staticFiles.ReadFile("static/index.html")
	if err != nil {
		log.Fatal("Failed to read embedded HTML:", err)
	}

	// 动态替换配置到 HTML
	htmlWithConfig := string(htmlContent)
	htmlWithConfig = strings.Replace(htmlWithConfig, "ws://127.0.0.1:18789", config.Gateway.URL, -1)
	htmlWithConfig = strings.Replace(htmlWithConfig, "99a1282cff39ec6008916016302302fe42dd769c6d1fdfc1", config.Gateway.Token, -1)
	htmlWithConfig = strings.Replace(htmlWithConfig, `"sessionKey": "global"`, fmt.Sprintf(`"sessionKey": "%s"`, config.Chat.SessionKey), -1)
	htmlWithConfig = strings.Replace(htmlWithConfig, `"thinking": "auto"`, fmt.Sprintf(`"thinking": "%s"`, config.Chat.Thinking), -1)

	// 提取静态目录
	sub, _ := fs.Sub(staticFiles, "static")
	fileServer := http.FileServer(http.FS(sub))

	// 配置端点（供前端获取配置）
	http.HandleFunc("/api/config", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		fmt.Fprintf(w, `{"gateway":"%s","version":"%s","client":"%s"}`, config.Gateway.URL, version, config.Client.ID)
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
