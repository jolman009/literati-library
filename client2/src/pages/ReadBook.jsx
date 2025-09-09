// src/pages/ReadBook.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useReadingSession } from "../contexts/ReadingSessionContext";
import ReadestReader from "../components/ReadestReader";
import FloatingNotepad from "../components/FloatingNotepad";
import FloatingTimer from "../components/FloatingTimer";
import API from "../config/api";

const ReadBook = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();              // <-- for deep-link ?cfi=...
  const { user, token } = useAuth();
  const { activeSession, hasActiveSession } = useReadingSession();

  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);  // (PDF-only; iframe can't update)
  const [currentLocator, setCurrentLocator] = useState(null); // <-- EPUB location { cfi, percent? }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- fetch book (cancellable) ---
  const fetchBook = useCallback(async () => {
    if (!bookId) {
      setError("No book ID provided");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const res = await API.get(`/books/${bookId}`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });

      setBook(res.data || null);
      setError(null);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        setError(err?.response?.data?.error || "Failed to load book");
      }
    } finally {
      setLoading(false);
    }
  }, [bookId, token]);

  useEffect(() => {
    // auth gate
    if (!user || !token) {
      navigate("/login");
      return;
    }
    fetchBook();
  }, [user, token, navigate, fetchBook]);

  // Fallback: if PDF viewer (iframe) doesn’t emit page, default to 1 after book loads.
  useEffect(() => {
    if (book && currentPage == null) setCurrentPage(1);
  }, [book, currentPage]);

  const handleClose = () => navigate("/library");

  // Optional deep-linking to EPUB location: /read/:bookId?cfi=epubcfi(...)
  const initialLocation = searchParams.get("cfi") || null;

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading your book...</p>
            <p className="text-sm text-gray-400 mt-2">Book ID: {bookId}</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {!loading && error && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Error Loading Book</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Book ID: {bookId || "Not provided"}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book not found overlay */}
      {!loading && !error && !book && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Book Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The requested book could not be found in your library.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Book ID: {bookId}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/upload")}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Upload a Book
              </button>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File missing overlay */}
      {!loading && !error && book && !book.file_url && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">File Not Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              <strong>{book?.title}</strong>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">by {book?.author}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The book file is missing or was not uploaded properly.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/upload")}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload File for This Book
              </button>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success: show reader + floating components */}
      {!loading && !error && book?.file_url && (
        <>
          <ReadestReader
            book={book}
            token={token}
            onClose={handleClose}
            onLocationChange={(loc) => setCurrentLocator(loc)} // EPUB
            initialLocation={initialLocation}
            onPageChange={(p) => setCurrentPage(p)}            // ✅ PDF
          />
          <FloatingNotepad
            title={`Note — ${book.title}`}
            currentPage={currentPage}
            currentLocator={currentLocator}
          />
          <FloatingTimer />
        </>
      )}
    </>
  );
};

export default ReadBook;
