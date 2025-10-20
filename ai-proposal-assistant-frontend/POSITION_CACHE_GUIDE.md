# 仓位缓存功能说明

## 概述

由于当前仓位数据还不能实际获取，我们实现了一个本地缓存系统来存储和展示仓位信息。当开仓成功后，系统会将仓位信息缓存在本地存储中，刷新获取仓位时会优先展示缓存的数据。

## 功能特性

### 1. 自动缓存
- 开仓成功后自动将仓位信息保存到本地存储
- 包含仓位ID、抵押物代币、抵押物数量、债务数量、健康因子、杠杆倍数等信息
- 缓存数据24小时后自动过期

### 2. 优先读取缓存
- `getPositions()` 函数优先从缓存获取数据
- 如果缓存为空，则尝试从链上获取数据
- 从链上获取到数据后会自动更新缓存

### 3. 缓存管理
- 支持手动清除缓存
- 支持强制刷新（清除缓存后重新获取）
- 提供缓存统计信息（数量、最后更新时间等）

## 文件结构

```
lib/
├── position-cache.ts     # 缓存工具函数
└── position.ts          # 修改后的仓位相关函数

components/
├── PositionList.tsx     # 修改后的仓位列表组件
├── OpenPositionButton.tsx # 修改后的开仓按钮组件
└── PositionCacheTest.tsx  # 缓存测试工具组件
```

## 核心函数

### 缓存工具函数 (`lib/position-cache.ts`)

```typescript
// 获取缓存的仓位数据
getCachedPositions(userAddress: string): Position[]

// 保存仓位数据到缓存
setCachedPositions(userAddress: string, positions: Position[]): void

// 添加新仓位到缓存
addCachedPosition(userAddress: string, newPosition: Position): void

// 从缓存中移除仓位
removeCachedPosition(userAddress: string, positionId: bigint): void

// 清除用户的所有缓存
clearCachedPositions(userAddress: string): void

// 获取缓存统计信息
getCacheStats(userAddress: string): CacheStats
```

### 仓位管理函数 (`lib/position.ts`)

```typescript
// 修改后的获取仓位函数（优先使用缓存）
getPositions(owner: `0x${string}`): Promise<Position[]>

// 开仓成功后更新缓存
updatePositionCacheAfterOpen(
  userAddress: `0x${string}`,
  positionId: bigint,
  collateralToken: `0x${string}`,
  collateralAmount: bigint,
  debtAmount: bigint = 0n,
  healthFactor: bigint = 0n
): void

// 平仓成功后更新缓存
updatePositionCacheAfterClose(
  userAddress: `0x${string}`,
  positionId: bigint
): void
```

## 使用方法

### 1. 在开仓成功后自动缓存

开仓成功后，系统会自动调用 `updatePositionCacheAfterOpen()` 函数将仓位信息保存到缓存中。

### 2. 在仓位列表中显示缓存数据

`PositionList` 组件会自动从缓存获取数据并显示，同时提供：
- 缓存状态显示（数量、最后更新时间）
- 普通刷新按钮（使用缓存）
- 强制刷新按钮（清除缓存后重新获取）

### 3. 手动管理缓存

可以使用测试工具组件 `PositionCacheTest` 来：
- 添加测试仓位
- 移除指定仓位
- 清除所有缓存
- 查看缓存内容

## 数据结构

### Position 类型
```typescript
export type Position = {
  id: bigint;                    // 仓位ID
  collateralToken: `0x${string}`; // 抵押物代币地址
  collateralAmount: bigint;       // 抵押物数量
  debtAmount: bigint;            // 债务数量
  healthFactor: bigint;          // 健康因子
};
```

### CachedPosition 类型
```typescript
export interface CachedPosition extends Position {
  timestamp: number;    // 缓存时间戳
  userAddress: string;  // 用户地址
}
```

## 注意事项

1. **仓位ID获取**: 当前使用时间戳作为模拟仓位ID，实际使用时需要从交易收据中解析真实的仓位ID。

2. **数据完整性**: 缓存的数据可能不是最新的，建议定期使用强制刷新功能。

3. **存储限制**: 使用浏览器的 localStorage，有存储大小限制（通常5-10MB）。

4. **隐私安全**: 缓存数据存储在用户本地，不会上传到服务器。

## 测试

可以使用 `PositionCacheTest` 组件来测试缓存功能：

1. 连接钱包
2. 输入测试数据
3. 点击"添加测试仓位"按钮
4. 在仓位列表中查看缓存的仓位
5. 使用"强制刷新"清除缓存并重新获取

## 未来改进

1. 从交易收据中解析真实的仓位ID
2. 添加数据同步机制，定期从链上更新缓存
3. 支持多链缓存
4. 添加缓存数据的加密存储
5. 实现缓存数据的导入/导出功能
