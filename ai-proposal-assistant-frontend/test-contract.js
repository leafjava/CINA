// 简单的合约测试脚本
const { createPublicClient, createWalletClient, custom, parseAbi } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

// 创建客户端
const publicClient = createPublicClient({ 
  chain: arbitrumSepolia, 
  transport: custom(typeof window !== 'undefined' ? window.ethereum : undefined) 
});

// Diamond合约地址
const DIAMOND_ADDRESS = '0x2F1Cdbad93806040c353Cc87a5a48142348B6AfD';

// 测试函数
async function testContract() {
  try {
    console.log('开始测试合约...');
    console.log('合约地址:', DIAMOND_ADDRESS);
    
    // 1. 检查合约代码
    const code = await publicClient.getBytecode({ address: DIAMOND_ADDRESS });
    console.log('合约代码长度:', code ? code.length : 0);
    
    if (!code || code === '0x') {
      throw new Error('合约地址无效或未部署合约');
    }
    
    // 2. 测试facets函数
    const facets = await publicClient.readContract({
      address: DIAMOND_ADDRESS,
      abi: parseAbi(['function facets() view returns ((address,bytes4[])[])']),
      functionName: 'facets'
    });
    
    console.log('Facets数量:', facets.length);
    console.log('Facets:', facets);
    
    // 3. 测试owner函数
    const owner = await publicClient.readContract({
      address: DIAMOND_ADDRESS,
      abi: parseAbi(['function owner() view returns (address)']),
      functionName: 'owner'
    });
    
    console.log('合约所有者:', owner);
    
    console.log('✅ 合约测试成功！');
    
  } catch (error) {
    console.error('❌ 合约测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
  window.testContract = testContract;
  console.log('测试函数已加载，请在浏览器控制台运行: testContract()');
}

module.exports = { testContract };
