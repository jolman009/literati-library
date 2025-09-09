// src/components/ReadestReader.jsx
import React from "react";
import EpubReader from "./EpubReader";
import PdfReader from "./PdfReader";

/**
 * Props:
 * - book: { format, file_url, title, author, ... }
 * - token: string (optional; passed to PdfReader for auth headers)
 * - onClose: () => void
 * - onLocationChange: ({ cfi, percent? }) => void    // EPUB only
 * - initialLocation: string | null                    // EPUB deep-link: epubcfi(...)
 * - onPageChange: (page: number) => void              // PDF only
 * - initialPage: number                               // PDF deep-link: ?page=#
 */
const ReadestReader = ({
  book,
  token,
  onClose,
  onLocationChange,
  initialLocation,
  onPageChange,
  initialPage,
}) => {
  const format = (book?.format || "").toLowerCase();

  if (format === "epub") {
    return (
      <EpubReader
        book={book}
        onClose={onClose}
        onLocationChange={onLocationChange}
        initialLocation={initialLocation}
      />
    );
  }

  // Default to PDF
  return (
    <PdfReader
      book={book}
      token={token}
      onClose={onClose}
      onPageChange={onPageChange}
      initialPage={initialPage}
    />
  );
};

export default ReadestReader;
