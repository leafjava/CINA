const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署固定地址合约...");
  
  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  
  // 固定地址配置
  const FIXED_ADDRESSES = {
    diamond: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    wrmb: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    wbtc: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    fxusd: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    usdc: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  };
  
  console.log("\n📋 使用固定地址部署:");
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
    return;
  }
  
  console.log("\n⚠️  部分合约不存在，开始部署...");
  
  // 部署缺失的合约
  const MockDiamond = await hre.ethers.getContractFactory("MockDiamond");
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  
  // 部署Diamond合约（如果不存在）
  if (!diamondExists) {
    console.log("\n📦 部署MockDiamond合约...");
    const mockDiamond = await MockDiamond.deploy();
    await mockDiamond.waitForDeployment();
    const actualAddress = await mockDiamond.getAddress();
    console.log(`✅ MockDiamond部署成功: ${actualAddress}`);
    console.log(`   目标地址: ${FIXED_ADDRESSES.diamond}`);
    console.log(`   地址匹配: ${actualAddress.toLowerCase() === FIXED_ADDRESSES.diamond.toLowerCase()}`);
  }
  
  // 部署代币合约（如果不存在）
  const tokens = [
    { name: "WRMB", symbol: "WRMB", address: FIXED_ADDRESSES.wrmb },
    { name: "WBTC", symbol: "WBTC", address: FIXED_ADDRESSES.wbtc },
    { name: "FXUSD", symbol: "FXUSD", address: FIXED_ADDRESSES.fxusd },
    { name: "USDC", symbol: "USDC", address: FIXED_ADDRESSES.usdc }
  ];
  
  for (const token of tokens) {
    const exists = await checkContract(token.address, token.name);
    if (!exists) {
      console.log(`\n🪙 部署${token.name}代币...`);
      const tokenContract = await MockToken.deploy(`${token.name} Token`, token.symbol);
      await tokenContract.waitForDeployment();
      const actualAddress = await tokenContract.getAddress();
      console.log(`✅ ${token.name}代币部署成功: ${actualAddress}`);
      console.log(`   目标地址: ${token.address}`);
      console.log(`   地址匹配: ${actualAddress.toLowerCase() === token.address.toLowerCase()}`);
      
      // 铸造代币给部署者
      const mintAmount = hre.ethers.parseEther("10000");
      await tokenContract.mint(deployer.address, mintAmount);
      console.log(`💰 ${token.name}代币铸造完成`);
    }
  }
  
  console.log("\n✨ 部署完成！");
  console.log("\n📋 最终配置:");
  console.log("==================");
  console.log("RPC URL: http://127.0.0.1:8545");
  console.log("Chain ID: 1337");
  console.log("Diamond合约:", FIXED_ADDRESSES.diamond);
  console.log("WRMB代币:", FIXED_ADDRESSES.wrmb);
  console.log("WBTC代币:", FIXED_ADDRESSES.wbtc);
  console.log("FXUSD代币:", FIXED_ADDRESSES.fxusd);
  console.log("USDC代币:", FIXED_ADDRESSES.usdc);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
