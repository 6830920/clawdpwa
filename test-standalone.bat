@echo off
echo ========================================
echo 测试独立 exe 运行
echo ========================================
echo.
echo 创建临时目录...
mkdir test-standalone 2>nul
cd test-standalone

echo.
echo 复制 exe 到临时目录...
copy ..\clawchat.exe . >nul

echo.
echo 当前目录内容（应该只有 exe）:
dir /b

echo.
echo 启动服务器（端口 3007）...
start /B clawchat.exe

echo.
echo 等待 3 秒...
timeout /t 3 /nobreak >nul

echo.
echo 测试访问嵌入的 HTML:
curl -s http://localhost:3007/ | findstr "ClawChat" && echo ✅ 成功！HTML 已嵌入到 exe 中
curl -s http://localhost:3007/api/health && echo.

echo.
echo 停止服务器...
taskkill /F /IM clawchat.exe >nul 2>&1

echo.
echo 清理临时目录...
cd ..
rmdir /s /q test-standalone

echo.
echo ========================================
echo 测试完成！
echo ========================================
pause
