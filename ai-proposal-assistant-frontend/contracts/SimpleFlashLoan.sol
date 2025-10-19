// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleFlashLoan
 * @notice Aave V3 闪电贷接收合约 - 实现一借一还
 * @dev 实现IFlashLoanSimpleReceiver接口
 * 
 * 部署到Sepolia测试网：
 * 1. 在Remix中编译此合约
 * 2. 部署到Sepolia
 * 3. 向合约转入少量WBTC（用于支付0.05%手续费）
 * 4. 在前端页面输入合约地址并执行闪电贷
 * 
 * Aave文档: https://docs.aave.com/developers/guides/flash-loans
 */

/**
 * @dev 闪电贷简单接收器接口
 */
interface IFlashLoanSimpleReceiver {
    /**
     * @notice 在闪电贷执行过程中被Pool调用
     * @param asset 借入的资产地址
     * @param amount 借入的金额
     * @param premium 需要支付的手续费
     * @param initiator 发起闪电贷的地址
     * @param params 传递的自定义参数
     * @return 操作成功返回true
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

/**
 * @dev ERC20基础接口
 */
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @dev Aave Pool接口
 */
interface IPool {
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

contract SimpleFlashLoan is IFlashLoanSimpleReceiver {
    // Aave V3 Pool地址（Sepolia测试网）
    address public constant POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    
    // 合约所有者
    address public immutable owner;
    
    // 事件
    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 premium,
        address indexed initiator,
        uint256 timestamp
    );
    
    event FundsWithdrawn(
        address indexed token,
        uint256 amount,
        address indexed to
    );
    
    // 修饰器
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyPool() {
        require(msg.sender == POOL, "Only Pool can call");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice 执行闪电贷操作（核心函数）
     * @dev 这个函数在闪电贷过程中被Aave Pool调用
     * 
     * 执行流程：
     * 1. Pool将资产转到本合约（此时本合约已收到借款）
     * 2. Pool调用此函数
     * 3. 执行你的自定义逻辑（套利、清算等）
     * 4. 授权Pool提取本金+手续费
     * 5. 函数返回true
     * 6. Pool自动扣款
     * 
     * @param asset 借入的资产地址（WBTC）
     * @param amount 借入的金额
     * @param premium 手续费（0.05%）
     * @param initiator 发起闪电贷的地址
     * @param params 自定义参数（可选）
     * @return 始终返回true表示成功
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override onlyPool returns (bool) {
        // ===================================================================
        // 第1步：验证我们确实收到了借款
        // ===================================================================
        uint256 currentBalance = IERC20(asset).balanceOf(address(this));
        require(currentBalance >= amount, "Did not receive flashloan");
        
        // ===================================================================
        // 第2步：在这里执行你的自定义逻辑
        // ===================================================================
        // 在这个简单示例中，我们只是"借入然后立即还款"
        // 实际应用中，你可以在这里执行：
        // - 跨DEX套利
        // - 清算
        // - 抵押品互换
        // - 其他DeFi操作
        
        // 示例：解析自定义参数（如果有）
        if (params.length > 0) {
            // bytes memory data = abi.decode(params, (bytes));
            // 处理自定义逻辑...
        }
        
        // ===================================================================
        // 第3步：计算总还款金额并授权Pool扣款
        // ===================================================================
        uint256 totalDebt = amount + premium;
        
        // 确保合约有足够的资产来还款
        require(
            IERC20(asset).balanceOf(address(this)) >= totalDebt,
            "Not enough to repay flashloan"
        );
        
        // 授权Pool提取欠款（本金+手续费）
        // 这是关键步骤！Pool会自动从合约提取这笔钱
        IERC20(asset).approve(POOL, totalDebt);
        
        // ===================================================================
        // 第4步：记录日志
        // ===================================================================
        emit FlashLoanExecuted(
            asset,
            amount,
            premium,
            initiator,
            block.timestamp
        );
        
        // 返回true表示操作成功
        // Pool会检查这个返回值，如果是false交易会revert
        return true;
    }
    
    /**
     * @notice 从合约发起闪电贷（可选功能）
     * @dev 只有合约所有者可以调用
     * @param asset 要借入的资产地址
     * @param amount 借入数量
     */
    function requestFlashLoan(
        address asset,
        uint256 amount
    ) external onlyOwner {
        IPool(POOL).flashLoanSimple(
            address(this),  // 接收者是本合约
            asset,          // 借入资产
            amount,         // 借入数量
            "",            // 无自定义参数
            0              // 无推荐码
        );
    }
    
    /**
     * @notice 提取合约中的代币
     * @dev 只有所有者可以提取
     * @param token 代币地址
     * @param amount 提取数量
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        require(
            IERC20(token).transfer(owner, amount),
            "Transfer failed"
        );
        
        emit FundsWithdrawn(token, amount, owner);
    }
    
    /**
     * @notice 提取合约中的ETH
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "ETH transfer failed");
    }
    
    /**
     * @notice 查询合约中某个代币的余额
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @notice 接收ETH
     */
    receive() external payable {}
}

