// src/utils/performanceTest.js
// Performance testing utilities

import { measureCustomMetric } from './webVitals';

// Test virtual scrolling performance
export const testVirtualScrolling = async (bookCount = 1000) => {
  console.group(`🧪 Testing Virtual Scrolling Performance (${bookCount} books)`);
  
  const startTime = performance.now();
  
  // Generate test data
  const { generateMockBooks } = await import('./mockBookGenerator');
  const books = generateMockBooks(bookCount);
  
  const dataGenTime = measureCustomMetric('Data Generation', startTime);
  
  console.log(`📚 Generated ${bookCount} books in ${Math.round(dataGenTime.duration)}ms`);
  console.log(`⚡ Generation Rate: ${Math.round(bookCount / (dataGenTime.duration / 1000))} books/second`);
  
  // Memory usage test
  const memBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  // Simulate rendering (in actual usage, this would be handled by VirtualizedBookGrid)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const memAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
  const memoryDiff = memAfter - memBefore;
  
  console.log(`🧠 Memory Usage: ${Math.round(memoryDiff / 1024)}KB for ${bookCount} books`);
  console.log(`📊 Memory per Book: ${Math.round(memoryDiff / bookCount)} bytes`);
  
  console.groupEnd();
  
  return {
    bookCount,
    generationTime: dataGenTime.duration,
    booksPerSecond: Math.round(bookCount / (dataGenTime.duration / 1000)),
    memoryUsage: memoryDiff,
    memoryPerBook: Math.round(memoryDiff / bookCount)
  };
};

// Test bundle loading performance
export const testBundleLoading = () => {
  console.group('📦 Bundle Loading Performance Test');
  
  const loadTimes = [];
  const startTime = performance.timeOrigin;
  
  // Get navigation timing
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation) {
    const metrics = {
      'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
      'Connection': navigation.connectEnd - navigation.connectStart,
      'Request Time': navigation.responseStart - navigation.requestStart,
      'Response Time': navigation.responseEnd - navigation.responseStart,
      'DOM Processing': navigation.domComplete - navigation.responseEnd,
      'Total Load': navigation.loadEventEnd - navigation.loadEventStart
    };
    
    console.table(metrics);
    
    const totalTime = navigation.loadEventEnd - navigation.fetchStart;
    console.log(`⏱️ Total Page Load: ${Math.round(totalTime)}ms`);
    
    loadTimes.push({
      metric: 'Total Page Load',
      time: totalTime,
      rating: totalTime < 2000 ? 'excellent' : totalTime < 3000 ? 'good' : 'poor'
    });
  }
  
  // Get resource timing for JavaScript bundles
  const resources = performance.getEntriesByType('resource');
  const jsResources = resources.filter(r => r.name.includes('.js'));
  
  console.log('📄 JavaScript Bundle Loading:');
  jsResources.forEach(resource => {
    const loadTime = resource.responseEnd - resource.requestStart;
    const fileName = resource.name.split('/').pop();
    console.log(`  ${fileName}: ${Math.round(loadTime)}ms (${Math.round(resource.transferSize / 1024)}KB)`);
    
    loadTimes.push({
      metric: fileName,
      time: loadTime,
      size: resource.transferSize
    });
  });
  
  console.groupEnd();
  
  return {
    navigationTiming: navigation,
    resourceTiming: jsResources,
    loadTimes,
    totalBundles: jsResources.length
  };
};

// Test lazy loading performance
export const testLazyLoading = async () => {
  console.group('🔄 Lazy Loading Performance Test');
  
  const tests = [];
  
  // Test Statistics Page lazy loading
  try {
    const startTime = performance.now();
    const StatisticsPage = await import('../pages/library/StatisticsPage');
    const loadTime = measureCustomMetric('StatisticsPage Lazy Load', startTime);
    
    tests.push({
      component: 'StatisticsPage',
      loadTime: loadTime.duration,
      success: true
    });
    
    console.log('✅ StatisticsPage lazy load:', Math.round(loadTime.duration), 'ms');
  } catch (error) {
    console.error('❌ StatisticsPage lazy load failed:', error);
    tests.push({
      component: 'StatisticsPage',
      error: error.message,
      success: false
    });
  }
  
  // Test Collections Page lazy loading
  try {
    const startTime = performance.now();
    const CollectionsPage = await import('../pages/subpages/EnhancedCollectionsPage');
    const loadTime = measureCustomMetric('CollectionsPage Lazy Load', startTime);
    
    tests.push({
      component: 'EnhancedCollectionsPage',
      loadTime: loadTime.duration,
      success: true
    });
    
    console.log('✅ EnhancedCollectionsPage lazy load:', Math.round(loadTime.duration), 'ms');
  } catch (error) {
    console.error('❌ EnhancedCollectionsPage lazy load failed:', error);
    tests.push({
      component: 'EnhancedCollectionsPage',
      error: error.message,
      success: false
    });
  }
  
  const successfulTests = tests.filter(t => t.success);
  const avgLoadTime = successfulTests.length > 0 
    ? successfulTests.reduce((sum, t) => sum + t.loadTime, 0) / successfulTests.length 
    : 0;
  
  console.log(`📊 Average Lazy Load Time: ${Math.round(avgLoadTime)}ms`);
  console.groupEnd();
  
  return {
    tests,
    averageLoadTime: avgLoadTime,
    successRate: (successfulTests.length / tests.length) * 100
  };
};

// Comprehensive performance benchmark
export const runPerformanceBenchmark = async () => {
  console.group('🏁 Comprehensive Performance Benchmark');
  console.log('🚀 Starting performance tests...');
  
  const results = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    tests: {}
  };
  
  // Test 1: Virtual Scrolling
  results.tests.virtualScrolling = await testVirtualScrolling(1000);
  
  // Test 2: Bundle Loading
  results.tests.bundleLoading = testBundleLoading();
  
  // Test 3: Lazy Loading
  results.tests.lazyLoading = await testLazyLoading();
  
  // Test 4: Memory Usage
  if (performance.memory) {
    results.tests.memory = {
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    };
    
    console.log('🧠 Current Memory Usage:', results.tests.memory.usedJSHeapSize, 'MB');
  }
  
  console.log('✅ Performance benchmark complete!');
  console.groupEnd();
  
  // Save results to localStorage for analysis
  localStorage.setItem('performance_benchmark_results', JSON.stringify(results, null, 2));
  console.log('💾 Results saved to localStorage as "performance_benchmark_results"');
  
  return results;
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.performanceTest = {
    virtualScrolling: testVirtualScrolling,
    bundleLoading: testBundleLoading,
    lazyLoading: testLazyLoading,
    runBenchmark: runPerformanceBenchmark
  };
  
  console.log('🛠️ Performance testing available via window.performanceTest');
}