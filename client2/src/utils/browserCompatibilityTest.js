// src/utils/browserCompatibilityTest.js
// Cross-browser compatibility validation

/**
 * Comprehensive browser compatibility test suite
 */
class BrowserCompatibilityTester {
  constructor() {
    this.results = {};
    this.browserInfo = this.detectBrowser();
  }

  /**
   * Detect current browser and version
   */
  detectBrowser() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';

    if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      browser = 'Chrome';
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
      version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Edge')) {
      browser = 'Edge';
      version = userAgent.match(/Edge?\/(\d+)/)?.[1] || 'Unknown';
    }

    return { browser, version, userAgent };
  }

  /**
   * Run full compatibility test suite
   */
  async runCompatibilityTests() {
    console.warn(`🌐 Running compatibility tests for ${this.browserInfo.browser} ${this.browserInfo.version}`);
    
    this.testModernJavaScript();
    this.testWebAPIs();
    this.testCSS();
    await this.testPerformanceAPIs();
    this.testLocalStorage();
    this.testServiceWorker();
    this.testVirtualScrolling();
    
    this.generateCompatibilityReport();
    return this.results;
  }

  /**
   * Test modern JavaScript features
   */
  testModernJavaScript() {
    console.warn('📝 Testing JavaScript compatibility...');
    
    const tests = {
      es6Modules: () => 'import' in window || typeof document !== 'undefined',
      asyncAwait: () => {
        try {
          eval('(async () => {})');
          return true;
        } catch (e) { return false; }
      },
      destructuring: () => {
        try {
          eval('const {a} = {a: 1}');
          return true;
        } catch (e) { return false; }
      },
      arrowFunctions: () => {
        try {
          eval('() => {}');
          return true;
        } catch (e) { return false; }
      },
      templateLiterals: () => {
        try {
          eval('`template`');
          return true;
        } catch (e) { return false; }
      },
      promises: () => typeof Promise !== 'undefined',
      fetch: () => typeof fetch !== 'undefined'
    };

    const jsResults = {};
    let passedTests = 0;

    Object.entries(tests).forEach(([testName, testFn]) => {
      try {
        const passed = testFn();
        jsResults[testName] = passed;
        if (passed) passedTests++;
      } catch (error) {
        jsResults[testName] = false;
      }
    });

    this.results.javascript = {
      tests: jsResults,
      score: `${passedTests}/${Object.keys(tests).length}`,
      status: passedTests === Object.keys(tests).length ? 'excellent' : 
              passedTests >= Object.keys(tests).length * 0.8 ? 'good' : 'partial'
    };

    console.warn(`✅ JavaScript: ${passedTests}/${Object.keys(tests).length} features supported`);
  }

  /**
   * Test Web APIs
   */
  testWebAPIs() {
    console.warn('🔗 Testing Web APIs...');
    
    const apiTests = {
      indexedDB: () => 'indexedDB' in window,
      localStorage: () => 'localStorage' in window,
      sessionStorage: () => 'sessionStorage' in window,
      webWorkers: () => 'Worker' in window,
      intersectionObserver: () => 'IntersectionObserver' in window,
      mutationObserver: () => 'MutationObserver' in window,
      requestAnimationFrame: () => 'requestAnimationFrame' in window,
      customElements: () => 'customElements' in window,
      webComponents: () => 'customElements' in window && 'ShadowRoot' in window
    };

    const apiResults = {};
    let passedAPIs = 0;

    Object.entries(apiTests).forEach(([apiName, testFn]) => {
      const supported = testFn();
      apiResults[apiName] = supported;
      if (supported) passedAPIs++;
    });

    this.results.webAPIs = {
      tests: apiResults,
      score: `${passedAPIs}/${Object.keys(apiTests).length}`,
      status: passedAPIs >= Object.keys(apiTests).length * 0.9 ? 'excellent' :
              passedAPIs >= Object.keys(apiTests).length * 0.7 ? 'good' : 'partial'
    };

    console.warn(`✅ Web APIs: ${passedAPIs}/${Object.keys(apiTests).length} APIs supported`);
  }

  /**
   * Test CSS features
   */
  testCSS() {
    console.warn('🎨 Testing CSS compatibility...');
    
    const cssTests = {
      flexbox: () => CSS.supports('display', 'flex'),
      grid: () => CSS.supports('display', 'grid'),
      customProperties: () => CSS.supports('--custom', 'value'),
      transforms: () => CSS.supports('transform', 'translateX(10px)'),
      transitions: () => CSS.supports('transition', 'all 0.3s'),
      animations: () => CSS.supports('animation', 'slide 1s'),
      calc: () => CSS.supports('width', 'calc(100% - 10px)'),
      viewportUnits: () => CSS.supports('width', '100vh'),
      mediaQueries: () => window.matchMedia !== undefined
    };

    const cssResults = {};
    let passedCSS = 0;

    Object.entries(cssTests).forEach(([testName, testFn]) => {
      try {
        const supported = testFn();
        cssResults[testName] = supported;
        if (supported) passedCSS++;
      } catch (error) {
        cssResults[testName] = false;
      }
    });

    this.results.css = {
      tests: cssResults,
      score: `${passedCSS}/${Object.keys(cssTests).length}`,
      status: passedCSS === Object.keys(cssTests).length ? 'excellent' :
              passedCSS >= Object.keys(cssTests).length * 0.8 ? 'good' : 'partial'
    };

    console.warn(`✅ CSS: ${passedCSS}/${Object.keys(cssTests).length} features supported`);
  }

  /**
   * Test Performance APIs
   */
  async testPerformanceAPIs() {
    console.warn('⚡ Testing Performance APIs...');
    
    const perfTests = {
      performanceAPI: () => 'performance' in window,
      performanceObserver: () => 'PerformanceObserver' in window,
      navigationTiming: () => 'navigation' in performance,
      resourceTiming: () => 'getEntriesByType' in performance,
      userTiming: () => 'mark' in performance && 'measure' in performance,
      highResTime: () => 'now' in performance
    };

    const perfResults = {};
    let passedPerf = 0;

    Object.entries(perfTests).forEach(([testName, testFn]) => {
      const supported = testFn();
      perfResults[testName] = supported;
      if (supported) passedPerf++;
    });

    // Test actual performance measurement
    if (perfResults.userTiming) {
      try {
        performance.mark('compatibility-test-start');
        await new Promise(resolve => setTimeout(resolve, 10));
        performance.mark('compatibility-test-end');
        performance.measure('compatibility-test', 'compatibility-test-start', 'compatibility-test-end');
        perfResults.performanceMeasurement = true;
        passedPerf++;
      } catch (error) {
        perfResults.performanceMeasurement = false;
      }
    }

    this.results.performance = {
      tests: perfResults,
      score: `${passedPerf}/${Object.keys(perfTests).length + 1}`,
      status: passedPerf >= Object.keys(perfTests).length ? 'excellent' : 
              passedPerf >= Object.keys(perfTests).length * 0.7 ? 'good' : 'partial'
    };

    console.warn(`✅ Performance: ${passedPerf}/${Object.keys(perfTests).length + 1} APIs supported`);
  }

  /**
   * Test Local Storage
   */
  testLocalStorage() {
    console.warn('💾 Testing storage capabilities...');
    
    const storageResults = {
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      quotaAPI: false
    };

    // Test localStorage
    try {
      localStorage.setItem('compat-test', 'test');
      storageResults.localStorage = localStorage.getItem('compat-test') === 'test';
      localStorage.removeItem('compat-test');
    } catch (error) {
      storageResults.localStorage = false;
    }

    // Test sessionStorage
    try {
      sessionStorage.setItem('compat-test', 'test');
      storageResults.sessionStorage = sessionStorage.getItem('compat-test') === 'test';
      sessionStorage.removeItem('compat-test');
    } catch (error) {
      storageResults.sessionStorage = false;
    }

    // Test IndexedDB
    storageResults.indexedDB = 'indexedDB' in window;

    // Test Storage Quota API
    storageResults.quotaAPI = 'storage' in navigator && 'estimate' in navigator.storage;

    const passedStorage = Object.values(storageResults).filter(Boolean).length;

    this.results.storage = {
      tests: storageResults,
      score: `${passedStorage}/${Object.keys(storageResults).length}`,
      status: passedStorage === Object.keys(storageResults).length ? 'excellent' :
              passedStorage >= Object.keys(storageResults).length * 0.75 ? 'good' : 'partial'
    };

    console.warn(`✅ Storage: ${passedStorage}/${Object.keys(storageResults).length} APIs supported`);
  }

  /**
   * Test Service Worker support
   */
  testServiceWorker() {
    console.warn('⚙️ Testing Service Worker support...');
    
    const serviceWorkerTests = {
      serviceWorkerAPI: 'serviceWorker' in navigator,
      serviceWorkerContainer: 'ServiceWorkerContainer' in window,
      serviceWorkerRegistration: 'ServiceWorkerRegistration' in window,
      cacheAPI: 'caches' in window,
      pushManager: 'PushManager' in window,
      notificationAPI: 'Notification' in window
    };
    const passedServiceWorker = Object.values(serviceWorkerTests).filter(Boolean).length;
    this.results.serviceWorker = {
      tests: serviceWorkerTests,
      score: `${passedServiceWorker}/${Object.keys(serviceWorkerTests).length}`,
      status: passedServiceWorker === Object.keys(serviceWorkerTests).length ? 'excellent' :
              passedServiceWorker >= Object.keys(serviceWorkerTests).length * 0.7 ? 'good' : 'partial'
    };
    console.warn(`✅ Service Worker: ${passedServiceWorker}/${Object.keys(serviceWorkerTests).length} APIs supported`);
  }
  /**
   * Test Virtual Scrolling capabilities
   */
  testVirtualScrolling() {
    console.warn('📜 Testing virtual scrolling support...');
    
    const scrollTests = {
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      requestAnimationFrame: 'requestAnimationFrame' in window,
      getBoundingClientRect: 'getBoundingClientRect' in Element.prototype,
      scrollIntoView: 'scrollIntoView' in Element.prototype
    };

    const passedScroll = Object.values(scrollTests).filter(Boolean).length;

    this.results.virtualScrolling = {
      tests: scrollTests,
      score: `${passedScroll}/${Object.keys(scrollTests).length}`,
      status: passedScroll === Object.keys(scrollTests).length ? 'excellent' :
              passedScroll >= Object.keys(scrollTests).length * 0.8 ? 'good' : 'partial'
    };

    console.warn(`✅ Virtual Scrolling: ${passedScroll}/${Object.keys(scrollTests).length} APIs supported`);
  }

  /**
   * Generate compatibility report
   */
  generateCompatibilityReport() {
    console.warn('\n🌐 Browser Compatibility Report\n');
    console.warn('='.repeat(50));
    console.warn(`🔍 Browser: ${this.browserInfo.browser} ${this.browserInfo.version}`);
    console.warn(`📱 Platform: ${navigator.platform}`);
    console.warn(`🌍 User Agent: ${navigator.userAgent.slice(0, 50)}...`);
    console.warn('='.repeat(50));

    // Calculate overall compatibility score
    const allTests = Object.values(this.results);
    const excellentTests = allTests.filter(test => test.status === 'excellent').length;
    const goodTests = allTests.filter(test => test.status === 'good').length;
    const partialTests = allTests.filter(test => test.status === 'partial').length;

    const overallGrade = this.calculateCompatibilityGrade(excellentTests, goodTests, partialTests);
    console.warn(`\n📊 Overall Compatibility: ${overallGrade}\n`);

    // Individual test results
    Object.entries(this.results).forEach(([category, result]) => {
      const statusIcon = {
        excellent: '🟢',
        good: '🟡',
        partial: '🟠',
        failed: '🔴'
      }[result.status] || '⚪';

      console.warn(`${statusIcon} ${category.toUpperCase()}: ${result.status} (${result.score})`);
      
      // Show failed tests
      const failedTests = Object.entries(result.tests || {})
        .filter(([_, passed]) => !passed)
        .map(([test, _]) => test);
      
      if (failedTests.length > 0) {
        console.warn(`   ❌ Not supported: ${failedTests.join(', ')}`);
      }
    });

    console.warn('\n' + '='.repeat(50));
    console.warn('✅ Browser compatibility validation complete!');
    
    // Store results globally
    window.compatibilityTestResults = {
      browser: this.browserInfo,
      results: this.results,
      overallGrade
    };

    return this.results;
  }

  calculateCompatibilityGrade(excellent, good, partial) {
    const total = excellent + good + partial;
    if (excellent === total) return 'A+ - Excellent compatibility';
    if (excellent >= total * 0.8) return 'A - Very good compatibility';
    if (excellent + good >= total * 0.8) return 'B+ - Good compatibility';
    if (excellent + good >= total * 0.6) return 'B - Acceptable compatibility';
    return 'C - Limited compatibility, some features may not work';
  }
}

// Auto-run compatibility test in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    const tester = new BrowserCompatibilityTester();
    window.runCompatibilityTest = () => tester.runCompatibilityTests();
    
    // Auto-run compatibility test after 5 seconds
    setTimeout(() => {
      console.warn('🌐 Auto-running Browser Compatibility Test...');
      tester.runCompatibilityTests();
    }, 5000);
  }, 2000);
}

export { BrowserCompatibilityTester };