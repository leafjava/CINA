// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// 模拟Diamond合约
contract MockDiamond is Ownable {
    event PositionOpened(uint256 indexed tokenId, address indexed owner, address collateralToken, uint256 collateralAmount);
    event PositionClosed(uint256 indexed tokenId, address indexed owner);
    
    uint256 private nextPositionId = 1;
    
    constructor() Ownable(msg.sender) {}
    mapping(uint256 => address) public positionOwners;
    mapping(uint256 => address) public positionCollateralTokens;
    mapping(uint256 => uint256) public positionCollateralAmounts;
    mapping(uint256 => uint256) public positionDebtAmounts;
    
    // 模拟开仓函数
    function openOrAddPositionFlashLoanV2(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 minAmountOut,
        address swapTarget,
        bytes calldata swapData
    ) external payable {
        // 模拟开仓逻辑
        uint256 positionId = nextPositionId++;
        positionOwners[positionId] = msg.sender;
        positionCollateralTokens[positionId] = tokenIn;
        positionCollateralAmounts[positionId] = amountIn;
        positionDebtAmounts[positionId] = amountIn * 2; // 模拟2倍杠杆
        
        emit PositionOpened(positionId, msg.sender, tokenIn, amountIn);
    }
    
    // 模拟平仓函数
    function closeOrRemovePositionFlashLoanV2(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 minAmountOut,
        address swapTarget,
        bytes calldata swapData
    ) external {
        // 模拟平仓逻辑
        emit PositionClosed(1, msg.sender);
    }
    
    // 获取仓位信息
    function getPosition(uint256 tokenId) external view returns (uint256 collateralAmount, uint256 debtAmount) {
        return (positionCollateralAmounts[tokenId], positionDebtAmounts[tokenId]);
    }
    
    // 获取仓位债务比例
    function getPositionDebtRatio(uint256 tokenId) external view returns (uint256) {
        if (positionCollateralAmounts[tokenId] == 0) return 0;
        return (positionDebtAmounts[tokenId] * 10000) / positionCollateralAmounts[tokenId];
    }
    
    // 获取下一个仓位ID
    function getNextPositionId() external view returns (uint32) {
        return uint32(nextPositionId);
    }
}

// 模拟代币合约
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18); // 铸造100万个代币
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
