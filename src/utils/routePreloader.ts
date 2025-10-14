/**
 * Route Preloader Utility
 * 
 * This utility provides functions to preload route components when users
 * hover over navigation links, improving perceived performance.
 */

// Cache for preloaded modules
const preloadedModules = new Map<string, Promise<any>>();

/**
 * Preload a lazy-loaded route component
 * @param importFn - The lazy import function for the route
 * @param routeName - Optional name for debugging
 */
export function preloadRoute(importFn: () => Promise<any>, routeName?: string): void {
  const key = routeName || importFn.toString();
  
  // Skip if already preloading or preloaded
  if (preloadedModules.has(key)) {
    return;
  }

  // Start preloading
  const preloadPromise = importFn().catch((error) => {
    console.error(`Failed to preload route${routeName ? ` "${routeName}"` : ''}:`, error);
    // Remove from cache on error so it can be retried
    preloadedModules.delete(key);
  });

  preloadedModules.set(key, preloadPromise);
}

/**
 * Create preload handlers for navigation links
 * 
 * @example
 * ```tsx
 * const { onMouseEnter, onFocus } = createPreloadHandlers(
 *   () => import('./pages/Dashboard')
 * );
 * 
 * <Link to="/dashboard" onMouseEnter={onMouseEnter} onFocus={onFocus}>
 *   Dashboard
 * </Link>
 * ```
 */
export function createPreloadHandlers(
  importFn: () => Promise<any>,
  routeName?: string
) {
  const preload = () => preloadRoute(importFn, routeName);
  
  return {
    onMouseEnter: preload,
    onFocus: preload,
    onTouchStart: preload, // Mobile support
  };
}

/**
 * Preload multiple routes at once
 * Useful for preloading critical routes after initial page load
 */
export function preloadRoutes(routes: Array<{ importFn: () => Promise<any>; name?: string }>) {
  routes.forEach(({ importFn, name }) => {
    preloadRoute(importFn, name);
  });
}

/**
 * Clear the preload cache
 * Useful for testing or manual cache management
 */
export function clearPreloadCache(): void {
  preloadedModules.clear();
}

/**
 * Get the number of preloaded modules
 * Useful for debugging
 */
export function getPreloadedCount(): number {
  return preloadedModules.size;
}

