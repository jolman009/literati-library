// src/components/LibraryRoute.jsx - FIXED VERSION
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBookLibrary } from '../hooks/useBookLibrary';
import EnhancedBookLibraryApp from '../pages/EnhancedBookLibraryApp';

const LibraryRoute = () => {
  const { user } = useAuth();
  const {
    books,
    loading,
    error,
    uploadBook,        // ✅ This exists and works
    updateBook,
    deleteBook,
    refreshBooks,
    stats
  } = useBookLibrary();

  // ✅ FIXED: Handle book operations with proper upload handling
  const handleBookUpdate = async (action, book) => {
    try {
      switch (action) {
        case 'read':
          console.log('📖 Reading book:', book.title);
          break;
          
        case 'edit':
          console.log('✏️ Editing book:', book.title);
          break;
          
        case 'delete':
          await deleteBook(book.id);
          break;
          
        case 'uploadFile':
          if (book?.file) {
            console.log(`📤 Uploading dropped file: ${book.file.name}`);
            await uploadBook(book.file, {
              title: book.file.name.replace(/\.[^/.]+$/, ""),
              format: book.file.name.split('.').pop().toUpperCase()
            });
          }
          break;

        // ✅ FIX: Actually handle upload actions
        case 'upload':
        case 'add':
        case 'import':
          console.log('⬆️ Triggering file upload dialog');
          // Create a file input element and trigger it
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.pdf,.epub,.mobi,.txt,.doc,.docx';
          fileInput.multiple = true;
          
          fileInput.onchange = async (event) => {
            const files = Array.from(event.target.files);
            if (files.length === 0) return;
            
            try {
              // Upload each file
              for (const file of files) {
                console.log(`📤 Uploading: ${file.name}`);
                await uploadBook(file, {
                  title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                  format: file.name.split('.').pop().toUpperCase()
                });
              }
              console.log('✅ All files uploaded successfully');
            } catch (error) {
              console.error('❌ Upload failed:', error);
            }
          };
          
          // Trigger the file dialog
          fileInput.click();
          break;
          
        case 'updateCover':
          await updateBook(book.id, {
            cover_url: book.cover_url,
            cover_small_url: book.cover_small_url,
            cover_medium_url: book.cover_medium_url,
            cover_large_url: book.cover_large_url,
            api_source: book.api_source,
            enhanced_metadata: book.enhanced_metadata
          });
          break;
          
        default:
          console.log('Unknown book action:', action);
      }
    } catch (error) {
      console.error('Book update error:', error);
    }
  };
  
// ✅ ADD this function to fix the error:
const onDirectUpload = async (files) => {
  console.log(`📁 Uploading ${files.length} dropped files`);
  
  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('book', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      formData.append('format', file.name.split('.').pop().toUpperCase());
      
      await API.post('/books/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log(`✅ Uploaded: ${file.name}`);
    } catch (error) {
      console.error(`❌ Upload failed: ${file.name}`, error);
    }
  }
  
  // Refresh books after upload
  await checkServerAndFetchBooks();
};

  // ✅ NEW: Direct upload function for drag & drop or other upload triggers
  const handleDirectUpload = async (files, metadata = {}) => {
    try {
      const fileArray = Array.isArray(files) ? files : [files];
      
      for (const file of fileArray) {
        console.log(`📤 Direct upload: ${file.name}`);
        await uploadBook(file, {
          title: file.name.replace(/\.[^/.]+$/, ""),
          format: file.name.split('.').pop().toUpperCase(),
          ...metadata
        });
      }
      
      console.log('✅ Direct upload completed');
    } catch (error) {
      console.error('❌ Direct upload failed:', error);
    }
  };

  // ✅ NEW: Batch operations handler
  const handleBatchOperation = async (operation, selectedBooks) => {
    try {
      switch (operation) {
        case 'delete':
          for (const book of selectedBooks) {
            await deleteBook(book.id);
          }
          break;
        case 'updateCovers':
          console.log('Batch updating covers for', selectedBooks.length, 'books');
          break;
        default:
          console.log('Unknown batch operation:', operation);
      }
    } catch (error) {
      console.error('Batch operation error:', error);
    }
  };

  // Prepare analytics data
  const analytics = {
    totalBooks: stats.totalBooks || 0,
    booksReading: stats.currentlyReading || 0,
    booksCompleted: stats.completedBooks || 0,
    readingProgress: stats.readingProgress || 0,
    level: 1,
    currentStreak: 0,
    totalPoints: stats.totalBooks * 10 || 0,
    ...stats
  };

  // Show loading state
  if (loading && books.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgb(var(--md-sys-color-outline, #e0e0e0))',
          borderTop: '3px solid rgb(var(--md-sys-color-primary, #24A8E0))',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading your library...</p>
      </div>
    );
  }

  // Show error state
  if (error && books.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '24px'
      }}>
        <h3 style={{ color: 'rgb(var(--md-sys-color-error, #ba1a1a))' }}>
          Library Error
        </h3>
        <p style={{ color: 'rgb(var(--md-sys-color-on-surface-variant, #666))' }}>
          {error}
        </p>
        <button
          onClick={refreshBooks}
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgb(var(--md-sys-color-primary, #24A8E0))',
            color: 'rgb(var(--md-sys-color-on-primary, white))',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ✅ RENDER: Enhanced library app with all required props and handlers
  return (
    <EnhancedBookLibraryApp
      books={books}                           // ✅ Current books list
      onBookUpdate={handleBookUpdate}         // ✅ Fixed handler with upload logic
      onDirectUpload={handleDirectUpload}     // ✅ NEW: Direct upload function
      onBatchOperation={handleBatchOperation} // ✅ Batch operations
      onRefresh={refreshBooks}                // ✅ Refresh function
      user={user}
      analytics={analytics}
      serverStatus={error ? 'error' : 'online'}
      className="library-route"
    />
  );
};

export default LibraryRoute;
