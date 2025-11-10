// src/components/BookCardWithOffline.jsx
// Example: Book card with offline download functionality
import React, { useState, useEffect } from 'react';
import { Download, Check, Trash2, Loader } from 'lucide-react';
import { useOfflineReading } from '../hooks/useOfflineReading';
import { useNavigate } from 'react-router-dom';

/**
 * Enhanced book card component with offline download capabilities
 *
 * Usage:
 * <BookCardWithOffline
 *   book={{
 *     id: '123',
 *     title: 'Book Title',
 *     author: 'Author Name',
 *     cover_url: 'https://...',
 *     file_url: 'https://...',
 *     file_type: 'application/pdf'
 *   }}
 * />
 */
const BookCardWithOffline = ({ book }) => {
  const navigate = useNavigate();
  const {
    isCached,
    isOnline,
    downloadBook,
    removeOfflineBook,
  } = useOfflineReading(book.id);

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  // Handle download for offline
  const handleDownload = async (e) => {
    e.stopPropagation(); // Prevent card click

    if (downloading) return;

    try {
      setDownloading(true);
      setDownloadProgress(0);

      // Simulate progress (in real scenario, track actual download)
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await downloadBook(book.file_url, {
        title: book.title,
        author: book.author,
        coverUrl: book.cover_url,
        fileType: book.file_type || 'application/pdf',
      });

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Show success state
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
        setShowMenu(false);
      }, 1000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloading(false);
      setDownloadProgress(0);
      alert('Failed to download book for offline reading');
    }
  };

  // Handle remove offline copy
  const handleRemove = async (e) => {
    e.stopPropagation();

    if (!confirm(`Remove "${book.title}" from offline storage?`)) {
      return;
    }

    try {
      await removeOfflineBook(book.id);
      setShowMenu(false);
    } catch (error) {
      console.error('Remove failed:', error);
      alert('Failed to remove offline book');
    }
  };

  // Handle open book
  const handleOpenBook = () => {
    navigate(`/read/${book.id}`);
  };

  return (
    <div
      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
      onClick={handleOpenBook}
      data-testid="book-card"
      data-book-id={book.id}
    >
      {/* Book Cover */}
      <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">📚</span>
          </div>
        )}

        {/* Offline badge */}
        {isCached && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-lg">
            <Check className="w-3 h-3" />
            Offline
          </div>
        )}

        {/* Download progress overlay */}
        {downloading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <Loader className="w-8 h-8 text-white animate-spin mb-2" />
            <span className="text-white text-sm font-medium">{downloadProgress}%</span>
            <div className="w-3/4 bg-white/30 rounded-full h-1.5 mt-2">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Offline menu button - shown on hover or when menu open */}
        {isOnline && (
          <div
            className={`absolute top-2 right-2 transition-opacity ${
              showMenu || 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
              title={isCached ? 'Offline options' : 'Download for offline'}
              data-testid="book-offline-menu-button"
            >
              {isCached ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-10">
                {!isCached ? (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                    data-testid="book-download-button"
                  >
                    <Download className="w-4 h-4" />
                    Download for offline
                  </button>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      Available offline
                    </div>
                    <button
                      onClick={handleRemove}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      data-testid="book-remove-offline-button"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove offline copy
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 dark:text-white mb-1">
          {book.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
          {book.author}
        </p>

        {/* Progress bar if reading */}
        {book.reading_progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{Math.round(book.reading_progress.percentage)}%</span>
              <span>
                {book.reading_progress.current_page} / {book.reading_progress.total_pages}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${book.reading_progress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default BookCardWithOffline;
