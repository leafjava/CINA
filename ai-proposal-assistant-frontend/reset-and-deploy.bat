@echo off
echo 🚀 重置并部署固定地址合约...
echo.

echo 📋 步骤1: 停止现有的hardhat node进程
taskkill /f /im node.exe 2>nul
echo ✅ 已停止现有进程

echo.
echo 📋 步骤2: 启动hardhat node (重置状态)
start "Hardhat Node" cmd /k "npx hardhat node --reset"
echo ✅ Hardhat node已启动

echo.
echo 📋 步骤3: 等待节点启动...
timeout /t 3 /nobreak >nul

echo.
echo 📋 步骤4: 部署合约
npx hardhat run scripts/deploy.js --network localhost

echo.
echo ✅ 部署完成！
echo 💡 提示: 如果地址仍然变化，请使用 deploy-deterministic.js 脚本
pause
