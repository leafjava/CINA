const hre = require("hardhat");

async function main() {
  console.log("🪙 给钱包地址添加WRMB代币...");
  
  // 目标钱包地址
  const targetAddress = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
  
  // WRMB代币地址（从最新部署获取）
  const wrmbAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  try {
    // 获取WRMB合约实例
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const wrmb = MockToken.attach(wrmbAddress);
    
    // 检查当前余额
    const currentBalance = await wrmb.balanceOf(targetAddress);
    console.log("当前WRMB余额:", hre.ethers.formatEther(currentBalance));
    
    // 铸造10000个WRMB代币
    const mintAmount = hre.ethers.parseEther("10000");
    console.log("铸造10000个WRMB代币到地址:", targetAddress);
    
    await wrmb.mint(targetAddress, mintAmount);
    console.log("✅ WRMB代币铸造成功！");
    
    // 验证余额
    const newBalance = await wrmb.balanceOf(targetAddress);
    console.log("新的WRMB余额:", hre.ethers.formatEther(newBalance));
    
    // 同时给其他代币也添加一些
    const otherTokens = [
      { name: "WBTC", address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" },
      { name: "FXUSD", address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" },
      { name: "USDC", address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" }
    ];
    
    console.log("\n🪙 添加其他代币...");
    for (const token of otherTokens) {
      try {
        const tokenContract = MockToken.attach(token.address);
        await tokenContract.mint(targetAddress, mintAmount);
        console.log(`✅ ${token.name}代币铸造成功！`);
      } catch (error) {
        console.log(`❌ ${token.name}代币铸造失败:`, error.message);
      }
    }
    
    console.log("\n🎉 所有代币添加完成！");
    console.log("现在可以测试一步到位杠杆开仓了！");
    
  } catch (error) {
    console.error("❌ 添加代币失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  });
