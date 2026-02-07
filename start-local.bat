@echo off
echo ========================================
echo  ClawChat Go Server - 本地开发
echo ========================================
echo.
echo 配置:
echo   HTTP 端口: 3006
echo   Gateway:   ws://127.0.0.1:18789
echo.
echo 启动中...
echo.

clawchat.exe -p 3006 -g ws://127.0.0.1:18789
