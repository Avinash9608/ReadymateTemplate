// Utility to clear old cached user data that uses 'id' instead of 'uid'

export const clearOldUserCache = () => {
  console.log('🧹 Clearing old user cache data...');
  
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Find all furnishverse user cache keys
    const userCacheKeys = keys.filter(key => key.startsWith('furnishverse-user-'));
    
    let clearedCount = 0;
    
    userCacheKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          // If the cached data uses 'id' instead of 'uid', remove it
          if (parsed.id && !parsed.uid) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log(`🗑️ Removed old cache: ${key}`);
          }
        }
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ Removed corrupted cache: ${key}`);
      }
    });
    
    console.log(`✅ Cleared ${clearedCount} old cache entries`);
    return clearedCount;
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return 0;
  }
};

export const clearAllUserCache = () => {
  console.log('🧹 Clearing ALL user cache data...');
  
  try {
    const keys = Object.keys(localStorage);
    const userCacheKeys = keys.filter(key => key.startsWith('furnishverse-user-'));
    
    userCacheKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`✅ Cleared ${userCacheKeys.length} cache entries`);
    return userCacheKeys.length;
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return 0;
  }
};

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).clearCache = {
    clearOldUserCache,
    clearAllUserCache
  };
}
