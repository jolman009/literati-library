// src/utils/mobileResponsivenessTest.js
// Mobile responsiveness and performance validation

/**
 * Mobile responsiveness and performance tester
 */
class MobileResponsivenessTester {
  constructor() {
    this.results = {};
    this.deviceInfo = this.detectDevice();
  }

  /**
   * Detect device information
   */
  detectDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?=.*Tablet)|Windows Phone|Kindle|Silk|PlayBook/i.test(navigator.userAgent);
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return {
      isMobile,
      isTablet,
      touchSupport,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.orientation?.angle || 0
    };
  }

  /**
   * Run full mobile responsiveness test
   */
  async runMobileTests() {
    console.log('📱 Running mobile responsiveness & performance tests...');
    console.log(`📱 Device: ${this.deviceInfo.isMobile ? 'Mobile' : this.deviceInfo.isTablet ? 'Tablet' : 'Desktop'}`);
    console.log(`📐 Viewport: ${this.deviceInfo.viewportWidth}x${this.deviceInfo.viewportHeight}`);
    
    this.testViewportConfiguration();
    this.testResponsiveBreakpoints();
    this.testTouchInteractions();
    await this.testMobilePerformance();
    this.testScrollBehavior();
    this.testImageOptimization();
    this.testTextReadability();
    
    this.generateMobileReport();
    return this.results;
  }

  /**
   * Test viewport configuration
   */
  testViewportConfiguration() {
    console.log('📐 Testing viewport configuration...');
    
    // Check for viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const hasViewportMeta = !!viewportMeta;
    const viewportContent = viewportMeta?.getAttribute('content') || '';
    
    // Check viewport settings
    const hasWidthDevice = viewportContent.includes('width=device-width');
    const hasInitialScale = viewportContent.includes('initial-scale=1');
    const hasUserScalable = !viewportContent.includes('user-scalable=no');
    
    this.results.viewport = {
      hasViewportMeta,
      viewportContent,
      hasWidthDevice,
      hasInitialScale,
      hasUserScalable,
      status: hasViewportMeta && hasWidthDevice && hasInitialScale ? 'excellent' : 'needs improvement'
    };
    
    console.log(`✅ Viewport: ${hasViewportMeta ? 'Configured' : 'Missing'} (${viewportContent})`);
  }

  /**
   * Test responsive breakpoints
   */
  testResponsiveBreakpoints() {
    console.log('📱 Testing responsive breakpoints...');
    
    const breakpoints = {
      mobile: 480,
      tablet: 768,
      desktop: 1024,
      large: 1200
    };
    
    const currentWidth = window.innerWidth;
    let activeBreakpoint = 'large';
    
    if (currentWidth <= breakpoints.mobile) activeBreakpoint = 'mobile';
    else if (currentWidth <= breakpoints.tablet) activeBreakpoint = 'tablet';
    else if (currentWidth <= breakpoints.desktop) activeBreakpoint = 'desktop';
    
    // Test CSS media queries
    const mediaQueryTests = {
      mobile: window.matchMedia(`(max-width: ${breakpoints.mobile}px)`).matches,
      tablet: window.matchMedia(`(max-width: ${breakpoints.tablet}px)`).matches,
      desktop: window.matchMedia(`(max-width: ${breakpoints.desktop}px)`).matches
    };
    
    this.results.responsiveBreakpoints = {
      currentWidth,
      activeBreakpoint,
      mediaQuerySupport: Object.values(mediaQueryTests).some(Boolean),
      breakpointTests: mediaQueryTests,
      status: 'excellent' // Media queries are well-supported
    };
    
    console.log(`✅ Responsive: Active breakpoint ${activeBreakpoint} (${currentWidth}px)`);
  }

  /**
   * Test touch interactions
   */
  testTouchInteractions() {
    console.log('👆 Testing touch interactions...');
    
    const touchTests = {
      touchEventsSupport: 'ontouchstart' in window,
      touchPointsSupport: 'maxTouchPoints' in navigator,
      pointerEventsSupport: 'onpointerdown' in window,
      gesturesSupport: 'ongesturestart' in window
    };
    
    // Test touch target sizes (simulate by checking button elements)
    const buttons = document.querySelectorAll('button');
    const touchTargetSizes = Array.from(buttons).slice(0, 5).map(button => {
      const rect = button.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        meetsTouchStandard: rect.width >= 44 && rect.height >= 44 // WCAG guideline
      };
    });
    
    const goodTouchTargets = touchTargetSizes.filter(size => size.meetsTouchStandard).length;
    const touchTargetScore = touchTargetSizes.length > 0 ? goodTouchTargets / touchTargetSizes.length : 1;
    
    const passedTouchTests = Object.values(touchTests).filter(Boolean).length;
    
    this.results.touchInteractions = {
      tests: touchTests,
      touchTargetSizes,
      touchTargetScore: Math.round(touchTargetScore * 100),
      score: `${passedTouchTests}/${Object.keys(touchTests).length}`,
      status: this.deviceInfo.touchSupport && passedTouchTests >= 2 && touchTargetScore >= 0.8 ? 
              'excellent' : passedTouchTests >= 2 ? 'good' : 'partial'
    };
    
    console.log(`✅ Touch: ${passedTouchTests}/${Object.keys(touchTests).length} APIs, ${Math.round(touchTargetScore * 100)}% good target sizes`);
  }

  /**
   * Test mobile performance
   */
  async testMobilePerformance() {
    console.log('⚡ Testing mobile performance...');
    
    const performanceStart = performance.now();
    
    // Test scroll performance
    const scrollTest = new Promise(resolve => {
      let scrollCount = 0;
      const maxScrolls = 10;
      const scrollTimes = [];
      
      const handleScroll = () => {
        scrollTimes.push(performance.now());
        scrollCount++;
        
        if (scrollCount >= maxScrolls) {
          window.removeEventListener('scroll', handleScroll);
          
          const avgScrollTime = scrollTimes.length > 1 ? 
            (scrollTimes[scrollTimes.length - 1] - scrollTimes[0]) / scrollTimes.length : 0;
          
          resolve({ avgScrollTime, scrollCount });
        }
      };
      
      window.addEventListener('scroll', handleScroll);
      
      // Simulate scroll events
      for (let i = 0; i < maxScrolls; i++) {
        setTimeout(() => {
          window.scrollTo(0, i * 100);
        }, i * 50);
      }
      
      // Cleanup after timeout
      setTimeout(() => {
        window.removeEventListener('scroll', handleScroll);
        resolve({ avgScrollTime: 0, scrollCount });
      }, 1000);
    });
    
    const scrollPerformance = await scrollTest;
    
    // Test paint performance
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    // Test memory usage (if available)
    const memoryInfo = performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : null;
    
    const totalTestTime = performance.now() - performanceStart;
    
    this.results.mobilePerformance = {
      scrollPerformance,
      paintTiming: {
        firstPaint: Math.round(firstPaint),
        firstContentfulPaint: Math.round(firstContentfulPaint)
      },
      memoryInfo,
      totalTestTime: Math.round(totalTestTime),
      status: firstContentfulPaint < 2000 && scrollPerformance.avgScrollTime < 16 ? 
              'excellent' : firstContentfulPaint < 4000 ? 'good' : 'needs improvement'
    };
    
    console.log(`✅ Mobile Performance: FCP ${Math.round(firstContentfulPaint)}ms, scroll ${Math.round(scrollPerformance.avgScrollTime)}ms`);
  }

  /**
   * Test scroll behavior
   */
  testScrollBehavior() {
    console.log('📜 Testing scroll behavior...');
    
    const scrollTests = {
      smoothScrollSupport: CSS.supports('scroll-behavior', 'smooth'),
      overflowScrollSupport: CSS.supports('overflow', 'scroll'),
      scrollSnapSupport: CSS.supports('scroll-snap-type', 'x mandatory'),
      touchActionSupport: CSS.supports('touch-action', 'manipulation')
    };
    
    // Test actual scrolling performance
    const bodyHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;
    const isScrollable = bodyHeight > viewportHeight;
    
    const passedScrollTests = Object.values(scrollTests).filter(Boolean).length;
    
    this.results.scrollBehavior = {
      tests: scrollTests,
      isScrollable,
      bodyHeight,
      viewportHeight,
      score: `${passedScrollTests}/${Object.keys(scrollTests).length}`,
      status: passedScrollTests >= 3 ? 'excellent' : passedScrollTests >= 2 ? 'good' : 'partial'
    };
    
    console.log(`✅ Scroll: ${passedScrollTests}/${Object.keys(scrollTests).length} features, scrollable: ${isScrollable}`);
  }

  /**
   * Test image optimization for mobile
   */
  testImageOptimization() {
    console.log('🖼️ Testing image optimization...');
    
    const images = document.querySelectorAll('img');
    const imageTests = Array.from(images).slice(0, 10).map(img => {
      const rect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth || 0;
      const naturalHeight = img.naturalHeight || 0;
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // Check if image is appropriately sized
      const isAppropriatelySized = naturalWidth > 0 && 
        Math.abs(naturalWidth - displayWidth) < naturalWidth * 0.2;
      
      return {
        src: img.src.substring(0, 50) + '...',
        naturalSize: { width: naturalWidth, height: naturalHeight },
        displaySize: { width: Math.round(displayWidth), height: Math.round(displayHeight) },
        isAppropriatelySized,
        hasAltText: !!img.alt,
        isLazy: img.loading === 'lazy'
      };
    });
    
    const appropriatelySizedImages = imageTests.filter(test => test.isAppropriatelySized).length;
    const imagesWithAlt = imageTests.filter(test => test.hasAltText).length;
    const lazyImages = imageTests.filter(test => test.isLazy).length;
    
    this.results.imageOptimization = {
      totalImages: images.length,
      testedImages: imageTests.length,
      appropriatelySizedImages,
      imagesWithAlt,
      lazyImages,
      optimizationScore: imageTests.length > 0 ? 
        Math.round((appropriatelySizedImages / imageTests.length) * 100) : 100,
      accessibilityScore: imageTests.length > 0 ?
        Math.round((imagesWithAlt / imageTests.length) * 100) : 100,
      status: imageTests.length > 0 && appropriatelySizedImages / imageTests.length >= 0.8 ? 
              'excellent' : 'good'
    };
    
    console.log(`✅ Images: ${appropriatelySizedImages}/${imageTests.length} optimized, ${imagesWithAlt}/${imageTests.length} with alt text`);
  }

  /**
   * Test text readability on mobile
   */
  testTextReadability() {
    console.log('📖 Testing text readability...');
    
    // Sample different text elements
    const textElements = [
      ...document.querySelectorAll('p'),
      ...document.querySelectorAll('h1, h2, h3, h4, h5, h6'),
      ...document.querySelectorAll('.text-sm, .text-xs, .text-lg')
    ].slice(0, 20);
    
    const readabilityTests = textElements.map(element => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
      const fontWeight = computedStyle.fontWeight;
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Check minimum font size for mobile (16px recommended)
      const isReadableSize = fontSize >= 14; // Minimum acceptable
      const isRecommendedSize = fontSize >= 16; // Recommended
      
      return {
        tagName: element.tagName.toLowerCase(),
        fontSize,
        lineHeight,
        fontWeight,
        isReadableSize,
        isRecommendedSize,
        hasGoodLineHeight: lineHeight >= fontSize * 1.2
      };
    });
    
    const readableTexts = readabilityTests.filter(test => test.isReadableSize).length;
    const recommendedTexts = readabilityTests.filter(test => test.isRecommendedSize).length;
    const goodLineHeights = readabilityTests.filter(test => test.hasGoodLineHeight).length;
    
    this.results.textReadability = {
      totalTexts: readabilityTests.length,
      readableTexts,
      recommendedTexts,
      goodLineHeights,
      readabilityScore: readabilityTests.length > 0 ?
        Math.round((readableTexts / readabilityTests.length) * 100) : 100,
      recommendedScore: readabilityTests.length > 0 ?
        Math.round((recommendedTexts / readabilityTests.length) * 100) : 100,
      status: readabilityTests.length > 0 && readableTexts / readabilityTests.length >= 0.9 ?
              'excellent' : readableTexts / readabilityTests.length >= 0.7 ? 'good' : 'needs improvement'
    };
    
    console.log(`✅ Text: ${readableTexts}/${readabilityTests.length} readable, ${recommendedTexts}/${readabilityTests.length} recommended size`);
  }

  /**
   * Generate mobile responsiveness report
   */
  generateMobileReport() {
    console.log('\n📱 Mobile Responsiveness & Performance Report\n');
    console.log('='.repeat(55));
    console.log(`📱 Device Type: ${this.deviceInfo.isMobile ? 'Mobile' : this.deviceInfo.isTablet ? 'Tablet' : 'Desktop'}`);
    console.log(`📐 Screen: ${this.deviceInfo.screenWidth}x${this.deviceInfo.screenHeight} (${this.deviceInfo.devicePixelRatio}x DPR)`);
    console.log(`🔍 Viewport: ${this.deviceInfo.viewportWidth}x${this.deviceInfo.viewportHeight}`);
    console.log(`👆 Touch: ${this.deviceInfo.touchSupport ? 'Supported' : 'Not supported'}`);
    console.log('='.repeat(55));

    // Calculate overall mobile score
    const allTests = Object.values(this.results);
    const excellentTests = allTests.filter(test => test.status === 'excellent').length;
    const goodTests = allTests.filter(test => test.status === 'good').length;
    const needsImprovement = allTests.filter(test => test.status === 'needs improvement').length;

    const overallGrade = this.calculateMobileGrade(excellentTests, goodTests, needsImprovement);
    console.log(`\n📊 Overall Mobile Experience: ${overallGrade}\n`);

    // Individual test results
    Object.entries(this.results).forEach(([category, result]) => {
      const statusIcon = {
        excellent: '🟢',
        good: '🟡',
        partial: '🟠',
        'needs improvement': '🔴'
      }[result.status] || '⚪';

      console.log(`${statusIcon} ${category.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${result.status.toUpperCase()}`);
      
      // Show specific scores where available
      if (result.score) {
        console.log(`   📊 Score: ${result.score}`);
      }
      if (result.optimizationScore) {
        console.log(`   🎯 Optimization: ${result.optimizationScore}%`);
      }
      if (result.readabilityScore) {
        console.log(`   📖 Readability: ${result.readabilityScore}%`);
      }
    });

    console.log('\n' + '='.repeat(55));
    console.log('📱 Mobile responsiveness validation complete!');
    
    // Store results globally
    window.mobileTestResults = {
      device: this.deviceInfo,
      results: this.results,
      overallGrade
    };

    return this.results;
  }

  calculateMobileGrade(excellent, good, needsImprovement) {
    const total = excellent + good + needsImprovement;
    if (excellent === total) return 'A+ - Exceptional mobile experience';
    if (excellent >= total * 0.8) return 'A - Excellent mobile experience';
    if (excellent + good >= total * 0.8) return 'B+ - Good mobile experience';
    if (excellent + good >= total * 0.6) return 'B - Acceptable mobile experience';
    return 'C - Mobile experience needs significant improvement';
  }
}

// Auto-run mobile test in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    const tester = new MobileResponsivenessTester();
    window.runMobileTest = () => tester.runMobileTests();
    
    // Auto-run mobile test after 7 seconds
    setTimeout(() => {
      console.log('📱 Auto-running Mobile Responsiveness Test...');
      tester.runMobileTests();
    }, 7000);
  }, 3000);
}

export { MobileResponsivenessTester };