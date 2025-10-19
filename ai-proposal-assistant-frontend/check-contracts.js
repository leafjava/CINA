// 合约地址验证脚本
const { ethers } = require('ethers');

async function checkContracts() {
  // 你当前环境的 RPC
  const currentRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
  const provider = new ethers.JsonRpcProvider(currentRpcUrl);
  
  try {
    const network = await provider.getNetwork();
    console.log('\n📡 当前网络信息:');
    console.log(`  Chain ID: ${network.chainId}`);
    console.log(`  RPC URL: ${currentRpcUrl}`);
    
    // 前端配置的地址
    const addresses = {
      'PoolManager (前端配置)': '0xbb644076500ea106d9029b382c4d49f56225cb82',
      'AaveFundingPool (前端配置)': '0xAb20B978021333091CA307BB09E022Cec26E8608',
      'PoolManager (部署文档)': '0x66713e76897CdC363dF358C853df5eE5831c3E5a',
      'WRMB': '0x795751385c9ab8f832fda7f69a83e3804ee1d7f3'
    };
    
    console.log('\n🔍 检查合约部署状态:\n');
    
    for (const [name, address] of Object.entries(addresses)) {
      const code = await provider.getCode(address);
      const exists = code && code !== '0x';
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${name}`);
      console.log(`   地址: ${address}`);
      console.log(`   状态: ${exists ? '已部署' : '未部署或地址错误'}`);
      if (exists) {
        console.log(`   代码长度: ${code.length - 2} bytes`);
      }
      console.log('');
    }
    
    // 尝试调用 nextPositionId
    console.log('📋 尝试调用 nextPositionId() 函数:\n');
    
    const poolManagerAbi = ['function nextPositionId() external view returns (uint256)'];
    
    for (const addr of ['0xbb644076500ea106d9029b382c4d49f56225cb82', '0x66713e76897CdC363dF358C853df5eE5831c3E5a']) {
      try {
        const contract = new ethers.Contract(addr, poolManagerAbi, provider);
        const nextId = await contract.nextPositionId();
        console.log(`✅ ${addr}`);
        console.log(`   nextPositionId() = ${nextId.toString()}\n`);
      } catch (error) {
        console.log(`❌ ${addr}`);
        console.log(`   错误: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkContracts().catch(console.error);

