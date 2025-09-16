/**
 * Intelligent route preloading strategy for improved performance
 * Implements predictive preloading based on user behavior patterns
 */

// Route preloading configuration
const PRELOAD_CONFIG = {
  // Time to wait before preloading on hover
  hoverDelay: 200,
  // Time to wait before preloading on visibility
  intersectionDelay: 500,
  // Maximum number of routes to preload simultaneously
  maxConcurrentPreloads: 3,
  // Preload routes based on user navigation patterns
  predictivePreloading: true
};

// Route dependencies and priorities
const ROUTE_DEPENDENCIES = {
  '/dashboard': {
    priority: 'high',
    preloadAfter: ['/login', '/'],
    dependencies: ['react-core', 'supabase', 'utils']
  },
  '/library': {
    priority: 'high',
    preloadAfter: ['/dashboard'],
    dependencies: ['performance', 'file-handling', 'utils']
  },
  '/upload': {
    priority: 'medium',
    preloadAfter: ['/library'],
    dependencies: ['file-handling', 'utils']
  },
  '/read/:bookId': {
    priority: 'high',
    preloadAfter: ['/library'],
    dependencies: ['pdf-processing', 'epub-processing']
  },
  '/notes': {
    priority: 'medium',
    preloadAfter: ['/read/:bookId'],
    dependencies: ['utils']
  },
  '/collections': {
    priority: 'low',
    preloadAfter: ['/library'],
    dependencies: ['utils']
  },
  '/gamification': {
    priority: 'low',
    preloadAfter: ['/dashboard'],
    dependencies: ['charts', 'animations']
  }
};

// Route import functions
const ROUTE_IMPORTS = {
  '/dashboard': () => import('../pages/DashboardPage'),
  '/library': () => import('../pages/LibraryPage'),
  '/upload': () => import('../components/wrappers/UploadPageWrapper'),
  '/read/:bookId': () => import('../components/wrappers/ReadBookWrapper'),
  '/notes': () => import('../components/wrappers/NotesPageWrapper'),
  '/collections': () => import('../components/wrappers/CollectionsPageWrapper'),
  '/gamification': () => import('../pages/GamificationRulesPage')
};

class RoutePreloader {
  constructor() {
    this.preloadedRoutes = new Set();
    this.currentlyPreloading = new Set();
    this.navigationHistory = [];
    this.preloadQueue = [];
    this.isIdle = false;

    this.initializeIdleDetection();
    this.setupNavigationTracking();
  }

  // Initialize idle detection for opportunistic preloading
  initializeIdleDetection() {
    if ('requestIdleCallback' in window) {
      const checkIdle = () => {
        window.requestIdleCallback((deadline) => {
          this.isIdle = deadline.timeRemaining() > 10;
          if (this.isIdle && this.preloadQueue.length > 0) {
            this.processPreloadQueue();
          }
          setTimeout(checkIdle, 1000);
        });
      };
      checkIdle();
    }
  }

  // Track navigation patterns for predictive preloading
  setupNavigationTracking() {
    // Listen to route changes
    const originalPushState = window.history.pushState;
    window.history.pushState = (...args) => {
      this.trackNavigation(args[2] || window.location.pathname);
      return originalPushState.apply(window.history, args);
    };

    window.addEventListener('popstate', () => {
      this.trackNavigation(window.location.pathname);
    });
  }

  trackNavigation(route) {
    this.navigationHistory.push({
      route,
      timestamp: Date.now()
    });

    // Keep only last 20 navigation entries
    if (this.navigationHistory.length > 20) {
      this.navigationHistory.shift();
    }

    // Trigger predictive preloading
    if (PRELOAD_CONFIG.predictivePreloading) {
      this.predictivePreload(route);
    }
  }

  // Predict and preload likely next routes
  predictivePreload(currentRoute) {
    const dependencies = ROUTE_DEPENDENCIES[currentRoute];
    if (!dependencies || !dependencies.preloadAfter) return;

    // Find routes that should be preloaded after current route
    const candidateRoutes = Object.keys(ROUTE_DEPENDENCIES).filter(route => {
      const routeDeps = ROUTE_DEPENDENCIES[route];
      return routeDeps.preloadAfter && routeDeps.preloadAfter.includes(currentRoute);
    });

    // Sort by priority
    candidateRoutes.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[ROUTE_DEPENDENCIES[b].priority] - priorityOrder[ROUTE_DEPENDENCIES[a].priority];
    });

    // Preload high-priority routes immediately, queue others
    candidateRoutes.forEach((route, index) => {
      if (ROUTE_DEPENDENCIES[route].priority === 'high' && index < 2) {
        this.preloadRoute(route);
      } else {
        this.queuePreload(route);
      }
    });
  }

  // Preload a route immediately
  async preloadRoute(route) {
    if (this.preloadedRoutes.has(route) || this.currentlyPreloading.has(route)) {
      return;
    }

    if (this.currentlyPreloading.size >= PRELOAD_CONFIG.maxConcurrentPreloads) {
      this.queuePreload(route);
      return;
    }

    this.currentlyPreloading.add(route);

    try {
      const importFunction = ROUTE_IMPORTS[route];
      if (importFunction) {
        console.log(`🚀 Preloading route: ${route}`);
        await importFunction();
        this.preloadedRoutes.add(route);
        console.log(`✅ Preloaded route: ${route}`);
      }
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    } finally {
      this.currentlyPreloading.delete(route);
      // Process queue if there's capacity
      if (this.currentlyPreloading.size < PRELOAD_CONFIG.maxConcurrentPreloads) {
        this.processPreloadQueue();
      }
    }
  }

  // Queue route for later preloading
  queuePreload(route) {
    if (!this.preloadQueue.includes(route) && !this.preloadedRoutes.has(route)) {
      this.preloadQueue.push(route);
    }
  }

  // Process the preload queue during idle time
  processPreloadQueue() {
    if (this.preloadQueue.length === 0 ||
        this.currentlyPreloading.size >= PRELOAD_CONFIG.maxConcurrentPreloads) {
      return;
    }

    const route = this.preloadQueue.shift();
    this.preloadRoute(route);
  }

  // Preload on hover with delay
  onHover(route) {
    return {
      onMouseEnter: () => {
        setTimeout(() => {
          this.preloadRoute(route);
        }, PRELOAD_CONFIG.hoverDelay);
      }
    };
  }

  // Preload when element becomes visible
  onIntersection(route) {
    return (isIntersecting) => {
      if (isIntersecting) {
        setTimeout(() => {
          this.preloadRoute(route);
        }, PRELOAD_CONFIG.intersectionDelay);
      }
    };
  }

  // Get preloading statistics
  getStats() {
    return {
      preloadedRoutes: Array.from(this.preloadedRoutes),
      currentlyPreloading: Array.from(this.currentlyPreloading),
      queueLength: this.preloadQueue.length,
      navigationHistory: this.navigationHistory.slice(-5)
    };
  }
}

// Create global instance
const routePreloader = new RoutePreloader();

// React hook for route preloading
export const useRoutePreloader = () => {
  return {
    preloadRoute: (route) => routePreloader.preloadRoute(route),
    onHover: (route) => routePreloader.onHover(route),
    onIntersection: (route) => routePreloader.onIntersection(route),
    getStats: () => routePreloader.getStats()
  };
};

// Higher-order component for preloading
export const withRoutePreloading = (Component, route) => {
  return (props) => {
    const preloader = useRoutePreloader();

    return (
      <div {...preloader.onHover(route)}>
        <Component {...props} />
      </div>
    );
  };
};

export default routePreloader;