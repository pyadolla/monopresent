declare module 'memoizee' {
    // Options for the memoization
    interface MemoizeOptions {
      max?: number;         // Max items in cache (default: Infinity)
      ttl?: number;         // Time-to-live for cache in ms (default: 0)
      maxAge?: number;      // Maximum age for cached entries (default: 0)
      normalizer?: (...args: any[]) => string; // Custom cache key generator (default: JSON.stringify)
    }
  
    // Memoized function type
    type MemoizedFunction<T extends (...args: any[]) => any> = {
      (...args: Parameters<T>): ReturnType<T>;
      clear: () => void;   // Method to clear the cache
      cache: Map<any, any>; // Cache storage
    };
  
    // Memoize function
    function memoize<T extends (...args: any[]) => any>(
      fn: T,
      options?: MemoizeOptions
    ): MemoizedFunction<T>;
  
    // Export default memoize function
    export default memoize;
  }
  