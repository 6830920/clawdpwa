@echo off
echo ========================================
echo  ClawChat Go Server - 远程 Gateway
echo ========================================
echo.
echo 配置:
echo   HTTP 端口: 8080
echo   Gateway:   ws://192.168.1.100:18789
echo   (请修改为你的 Gateway 服务器地址)
echo.
echo 启动中...
echo.

clawchat.exe -p 8080 -g ws://192.168.1.100:18789
