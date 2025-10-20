import { Position } from './position';

// 本地存储的仓位缓存接口
export interface CachedPosition extends Position {
  timestamp: number; // 缓存时间戳
  userAddress: string; // 用户地址
}

// 实际写入localStorage的原始类型（将bigint转为string）
type RawCachedPosition = Omit<CachedPosition, 'id' | 'collateralAmount' | 'debtAmount' | 'healthFactor'> & {
  id: string;
  collateralAmount: string;
  debtAmount: string;
  healthFactor: string;
};

// 缓存键前缀
const CACHE_PREFIX = 'cina_position_cache_';

// 获取用户特定的缓存键
function getCacheKey(userAddress: string): string {
  return `${CACHE_PREFIX}${userAddress.toLowerCase()}`;
}

// 从本地存储获取缓存的仓位数据
export function getCachedPositions(userAddress: string): Position[] {
  try {
    if (typeof window === 'undefined') {
      return [];
    }

    const cacheKey = getCacheKey(userAddress);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return [];
    }

    const parsed: RawCachedPosition[] = JSON.parse(cachedData);
    
    // 过滤掉过期数据（24小时过期）
    const now = Date.now();
    const validPositions = parsed.filter(pos => {
      const age = now - pos.timestamp;
      return age < 24 * 60 * 60 * 1000; // 24小时
    });

    // 转换回Position格式（移除timestamp和userAddress）
    const positionsFromRaw: Position[] = validPositions.map(({ timestamp, userAddress, ...position }) => ({
      ...position,
      id: BigInt(position.id),
      collateralAmount: BigInt(position.collateralAmount),
      debtAmount: BigInt(position.debtAmount),
      healthFactor: BigInt(position.healthFactor),
      leverage: typeof (position as any).leverage === 'number' ? (position as any).leverage : 1.0
    }));

    // 如果有过期数据，更新缓存（以标准Position格式重新写入）
    if (validPositions.length !== parsed.length) {
      setCachedPositions(userAddress, positionsFromRaw);
    }

    return positionsFromRaw;
  } catch (error) {
    console.error('获取缓存仓位失败:', error);
    return [];
  }
}

// 将仓位数据保存到本地存储
export function setCachedPositions(userAddress: string, positions: Position[]): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    const cacheKey = getCacheKey(userAddress);
    const cachedPositions: RawCachedPosition[] = positions.map(pos => ({
      ...pos,
      id: pos.id.toString(),
      collateralAmount: pos.collateralAmount.toString(),
      debtAmount: pos.debtAmount.toString(),
      healthFactor: pos.healthFactor.toString(),
      leverage: pos.leverage,
      timestamp: Date.now(),
      userAddress: userAddress.toLowerCase()
    }));

    localStorage.setItem(cacheKey, JSON.stringify(cachedPositions));
    console.log(`已缓存 ${positions.length} 个仓位到本地存储`);
  } catch (error) {
    console.error('保存缓存仓位失败:', error);
  }
}

// 添加新仓位到缓存
export function addCachedPosition(userAddress: string, newPosition: Position): void {
  try {
    const existingPositions = getCachedPositions(userAddress);
    
    // 检查是否已存在相同ID的仓位
    const existingIndex = existingPositions.findIndex(pos => pos.id === newPosition.id);
    
    if (existingIndex >= 0) {
      // 更新现有仓位
      existingPositions[existingIndex] = newPosition;
    } else {
      // 添加新仓位
      existingPositions.push(newPosition);
    }
    
    setCachedPositions(userAddress, existingPositions);
    console.log(`已添加/更新仓位 ${newPosition.id.toString()} 到缓存`);
  } catch (error) {
    console.error('添加缓存仓位失败:', error);
  }
}

// 从缓存中移除仓位
export function removeCachedPosition(userAddress: string, positionId: bigint): void {
  try {
    const existingPositions = getCachedPositions(userAddress);
    const filteredPositions = existingPositions.filter(pos => pos.id !== positionId);
    
    setCachedPositions(userAddress, filteredPositions);
    console.log(`已从缓存中移除仓位 ${positionId.toString()}`);
  } catch (error) {
    console.error('移除缓存仓位失败:', error);
  }
}

// 清除用户的所有缓存仓位
export function clearCachedPositions(userAddress: string): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    const cacheKey = getCacheKey(userAddress);
    localStorage.removeItem(cacheKey);
    console.log(`已清除用户 ${userAddress} 的所有缓存仓位`);
  } catch (error) {
    console.error('清除缓存仓位失败:', error);
  }
}

// 获取缓存统计信息
export function getCacheStats(userAddress: string): {
  count: number;
  lastUpdated: number | null;
  hasCache: boolean;
} {
  try {
    if (typeof window === 'undefined') {
      return { count: 0, lastUpdated: null, hasCache: false };
    }

    const cacheKey = getCacheKey(userAddress);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return { count: 0, lastUpdated: null, hasCache: false };
    }

    const parsed: CachedPosition[] = JSON.parse(cachedData);
    const lastUpdated = parsed.length > 0 ? Math.max(...parsed.map(p => p.timestamp)) : null;
    
    return {
      count: parsed.length,
      lastUpdated,
      hasCache: true
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return { count: 0, lastUpdated: null, hasCache: false };
  }
}
