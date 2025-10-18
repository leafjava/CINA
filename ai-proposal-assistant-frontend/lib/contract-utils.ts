// 合约验证工具函数使用示例

import { verifyContractAddress, verifyContractFunction } from './position';
import { parseAbi } from 'viem';

// 使用示例1：验证任何合约地址
export async function checkAnyContract(contractAddress: `0x${string}`) {
  const result = await verifyContractAddress(contractAddress);
  console.log('合约验证结果:', result);
  return result;
}

// 使用示例2：验证合约是否包含特定函数
export async function checkContractFunction(
  contractAddress: `0x${string}`, 
  functionName: string
) {
  // 定义要检查的ABI
  const abi = parseAbi([
    'function balanceOf(address owner) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
  ]);

  const result = await verifyContractFunction(contractAddress, abi, functionName);
  console.log(`函数 ${functionName} 验证结果:`, result);
  return result;
}

// 使用示例3：批量验证多个合约
export async function batchVerifyContracts(contractAddresses: `0x${string}`[]) {
  const results = await Promise.all(
    contractAddresses.map(async (address) => {
      const result = await verifyContractAddress(address);
      return { address, ...result };
    })
  );
  
  console.log('批量验证结果:', results);
  return results;
}

// 使用示例4：验证ERC20代币合约
export async function verifyERC20Token(tokenAddress: `0x${string}`) {
  const erc20Abi = parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)'
  ]);

  const requiredFunctions = ['name', 'symbol', 'decimals', 'totalSupply', 'balanceOf'];
  const results = [];

  for (const funcName of requiredFunctions) {
    const result = await verifyContractFunction(tokenAddress, erc20Abi, funcName);
    results.push({ function: funcName, ...result });
  }

  const allValid = results.every(r => r.isValid);
  console.log('ERC20代币验证结果:', { tokenAddress, allValid, results });
  
  return { tokenAddress, allValid, results };
}

// 使用示例5：验证Diamond合约的Facets
export async function verifyDiamondFacets(diamondAddress: `0x${string}`) {
  const diamondAbi = parseAbi([
    'function facets() view returns ((address,bytes4[])[])',
    'function facetFunctionSelectors(address facet) view returns (bytes4[])',
    'function facetAddresses() view returns (address[])',
    'function facetAddress(bytes4 functionSelector) view returns (address)'
  ]);

  const facetsResult = await verifyContractFunction(diamondAddress, diamondAbi, 'facets');
  console.log('Diamond Facets验证结果:', facetsResult);
  
  return facetsResult;
}
