// src/utils/mockBookGenerator.js
// Mock data generator for testing virtual scrolling performance

export const generateMockBooks = (count = 100) => {
  const genres = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance',
    'Thriller', 'Biography', 'History', 'Science', 'Philosophy', 'Poetry',
    'Drama', 'Adventure', 'Horror', 'Young Adult', 'Children', 'Self-Help'
  ];

  const statuses = ['unread', 'reading', 'completed', 'paused', 'want_to_read'];
  
  const authors = [
    'Jane Austen', 'George Orwell', 'J.K. Rowling', 'Stephen King', 'Agatha Christie',
    'Isaac Asimov', 'Maya Angelou', 'Charles Dickens', 'Virginia Woolf', 'Mark Twain',
    'Toni Morrison', 'Ernest Hemingway', 'F. Scott Fitzgerald', 'Harper Lee',
    'J.R.R. Tolkien', 'Margaret Atwood', 'Ray Bradbury', 'Kurt Vonnegut'
  ];

  const titlePrefixes = [
    'The Art of', 'Journey to', 'Tales from', 'Secrets of', 'Beyond the',
    'The Last', 'Chronicles of', 'The Hidden', 'Mysteries of', 'The Great',
    'Adventures in', 'The Lost', 'Legends of', 'The Silent', 'Dreams of',
    'The Forgotten', 'Echoes of', 'The Shadow', 'Whispers from', 'The Golden'
  ];

  const titleSuffixes = [
    'Kingdom', 'Mountain', 'Ocean', 'Forest', 'City', 'Desert', 'Valley',
    'Island', 'River', 'Castle', 'Garden', 'Library', 'Tower', 'Bridge',
    'Harbor', 'Sanctuary', 'Temple', 'Palace', 'Academy', 'Laboratory'
  ];

  const books = [];

  for (let i = 0; i < count; i++) {
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomPrefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
    const randomSuffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
    
    const book = {
      id: `mock-book-${i + 1}`,
      title: `${randomPrefix} ${randomSuffix} ${i + 1}`,
      author: randomAuthor,
      genre: randomGenre,
      status: randomStatus,
      is_reading: randomStatus === 'reading',
      completed: randomStatus === 'completed',
      progress: randomStatus === 'reading' ? Math.floor(Math.random() * 100) : 0,
      pages: 200 + Math.floor(Math.random() * 400), // 200-600 pages
      rating: Math.floor(Math.random() * 5) + 1,
      cover_url: `https://picsum.photos/200/300?random=${i + 1}`, // Random cover images
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: `A fascinating ${randomGenre.toLowerCase()} book about ${randomSuffix.toLowerCase()}. This engaging story takes you on an incredible journey through ${randomSuffix.toLowerCase()} and beyond.`,
      isbn: `978${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`,
      publisher: ['Penguin Books', 'Random House', 'HarperCollins', 'Simon & Schuster', 'Macmillan'][Math.floor(Math.random() * 5)],
      publication_year: 1950 + Math.floor(Math.random() * 74), // 1950-2024
      language: 'English',
      favorite: Math.random() > 0.8, // 20% chance of being favorite
      tags: [randomGenre.toLowerCase(), 'mock-data', Math.random() > 0.5 ? 'bestseller' : 'classic'].filter(Boolean)
    };

    books.push(book);
  }

  return books;
};

// Performance testing utilities
export const performanceTest = {
  // Test virtual scrolling with different dataset sizes
  async testVirtualScrolling(sizes = [100, 500, 1000, 2000]) {
    const results = [];
    
    for (const size of sizes) {
      console.warn(`🧪 Testing virtual scrolling with ${size} books...`);
      
      const startTime = performance.now();
      const books = generateMockBooks(size);
      const generationTime = performance.now() - startTime;
      
      // Test memory usage
      const beforeMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Simulate rendering time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryDiff = afterMemory - beforeMemory;
      
      results.push({
        size,
        generationTime: Math.round(generationTime * 100) / 100,
        memoryUsage: Math.round(memoryDiff / 1024), // KB
        booksPerMs: Math.round(size / generationTime * 100) / 100
      });
      
      console.warn(`✅ ${size} books: ${Math.round(generationTime)}ms generation, ${Math.round(memoryDiff / 1024)}KB memory`);
    }
    
    return results;
  },

  // Memory leak detection
  startMemoryMonitoring() {
    if (!performance.memory) {
      console.warn('Performance memory API not available');
      return null;
    }
    
    const interval = setInterval(() => {
      const memory = performance.memory;
      console.warn(`📊 Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used, ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB total`);
    }, 5000);
    
    return () => clearInterval(interval);
  },

  // Scroll performance test
  measureScrollPerformance(element, duration = 5000) {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();
      
      const measure = () => {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(measure);
        } else {
          const fps = Math.round(frameCount / (duration / 1000));
          resolve({ fps, frameCount, duration });
        }
      };
      
      requestAnimationFrame(measure);
    });
  }
};

// Add to localStorage for easy testing
export const loadMockDataToStorage = (count = 100) => {
  const books = generateMockBooks(count);
  localStorage.setItem('mock_books_test_data', JSON.stringify(books));
  console.warn(`📚 Generated and saved ${count} mock books to localStorage`);
  return books;
};

// Load mock data from localStorage
export const loadMockDataFromStorage = () => {
  try {
    const data = localStorage.getItem('mock_books_test_data');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading mock data:', error);
    return [];
  }
};

// Quick test functions for console
if (typeof window !== 'undefined') {
  window.testVirtualScrolling = {
    generate: generateMockBooks,
    load: loadMockDataToStorage,
    test: performanceTest.testVirtualScrolling,
    monitor: performanceTest.startMemoryMonitoring
  };
}