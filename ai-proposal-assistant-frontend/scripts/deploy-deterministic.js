const hre = require("hardhat");

async function main() {
  console.log("🚀 开始确定性部署本地测试合约...");
  
  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  
  // 固定地址配置（这些地址在每次重置后都会相同）
  const FIXED_ADDRESSES = {
    diamond: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    wrmb: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    wbtc: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    fxusd: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    usdc: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  };
  
  console.log("\n📋 目标固定地址:");
  console.log("Diamond合约:", FIXED_ADDRESSES.diamond);
  console.log("WRMB代币:", FIXED_ADDRESSES.wrmb);
  console.log("WBTC代币:", FIXED_ADDRESSES.wbtc);
  console.log("FXUSD代币:", FIXED_ADDRESSES.fxusd);
  console.log("USDC代币:", FIXED_ADDRESSES.usdc);
  
  // 检查合约是否已存在
  const checkContract = async (address, name) => {
    const code = await hre.ethers.provider.getCode(address);
    if (code !== "0x") {
      console.log(`✅ ${name} 合约已存在: ${address}`);
      return true;
    }
    return false;
  };
  
  // 检查所有合约
  const diamondExists = await checkContract(FIXED_ADDRESSES.diamond, "MockDiamond");
  const wrmbExists = await checkContract(FIXED_ADDRESSES.wrmb, "WRMB");
  const wbtcExists = await checkContract(FIXED_ADDRESSES.wbtc, "WBTC");
  const fxusdExists = await checkContract(FIXED_ADDRESSES.fxusd, "FXUSD");
  const usdcExists = await checkContract(FIXED_ADDRESSES.usdc, "USDC");
  
  if (diamondExists && wrmbExists && wbtcExists && fxusdExists && usdcExists) {
    console.log("\n🎉 所有合约都已存在，无需重新部署！");
    console.log("\n📋 当前配置:");
    console.log("==================");
    console.log("RPC URL: http://127.0.0.1:8545");
    console.log("Chain ID: 1337");
    console.log("Diamond合约:", FIXED_ADDRESSES.diamond);
    console.log("WRMB代币:", FIXED_ADDRESSES.wrmb);
    console.log("WBTC代币:", FIXED_ADDRESSES.wbtc);
    console.log("FXUSD代币:", FIXED_ADDRESSES.fxusd);
    console.log("USDC代币:", FIXED_ADDRESSES.usdc);
    
    // 更新前端配置文件
    await updateFrontendConfig(FIXED_ADDRESSES);
    return;
  }
  
  console.log("\n⚠️  部分合约不存在，需要重新部署...");
  console.log("注意：要使用固定地址，需要先清空本地网络状态");
  console.log("请运行以下命令:");
  console.log("1. 停止当前hardhat node进程");
  console.log("2. npx hardhat node --reset");
  console.log("3. npx hardhat run scripts/deploy-deterministic.js --network localhost");
}

// 更新前端配置文件
async function updateFrontendConfig(addresses) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const configPath = path.join(__dirname, '..', 'lib', 'position.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // 更新地址配置
    const updatedContent = configContent.replace(
      /diamond: isLocalDev[\s\S]*?as `0x\${string}`/,
      `diamond: isLocalDev 
    ? '${addresses.diamond}' as \`0x\${string}\` // 本地部署的Diamond合约地址
    : '0x2F1Cdbad93806040c353Cc87a5a48142348B6AfD' as \`0x\${string}\``
    );
    
    fs.writeFileSync(configPath, updatedContent);
    console.log("✅ 前端配置文件已更新");
  } catch (error) {
    console.warn("⚠️  更新前端配置文件失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
