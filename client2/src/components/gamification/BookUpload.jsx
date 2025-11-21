// BookUpload.jsx - Fixed version with proper navigation after upload
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import API from '../../config/api';
import Card from '../Material3/Card';
import TextField from '../Material3/TextField';
import Button from '../Material3/Button';

const BookUpload = ({ onUploadComplete }) => { // Add onUploadComplete prop
  const navigate = useNavigate(); // Add navigation hook
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    format: 'pdf'
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Please select a PDF or EPUB file');
      setIsError(true);
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setMessage('File size must be less than 50MB');
      setIsError(true);
      return;
    }

    setSelectedFile(file);
    setMessage('');
    setIsError(false);

    // Auto-detect format
    if (file.type === 'application/epub+zip') {
      setFormData(prev => ({ ...prev, format: 'epub' }));
    } else {
      setFormData(prev => ({ ...prev, format: 'pdf' }));
    }

    // Try to extract title from filename
    const fileName = file.name.replace(/\.(pdf|epub)$/i, '');
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file');
      setIsError(true);
      return;
    }

    if (!formData.title.trim() || !formData.author.trim()) {
      setMessage('Please provide both title and author');
      setIsError(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage('');
    setIsError(false);

    try {
      const uploadData = new FormData();
      uploadData.append('book', selectedFile);       // note: key is 'book'
      uploadData.append('title', formData.title.trim());
      uploadData.append('author', formData.author.trim());
      uploadData.append('format', formData.format);
      if (formData.genre.trim()) uploadData.append('genre', formData.genre.trim());

      // call the correct endpoint
      const response = await API.post('/books/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      // Get the uploaded book from the response
      const uploadedBook = response.data;
      console.warn('📚 Book uploaded successfully:', uploadedBook);

      setMessage('Book uploaded successfully!');
      setIsError(false);
      
      // Reset form
      setSelectedFile(null);
      setFormData({
        title: '',
        author: '',
        genre: '',
        format: 'pdf'
      });
      
      // Reset file input
      const fileInput = document.getElementById('book-file-input');
      if (fileInput) fileInput.value = '';

      // IMPORTANT: Handle the uploaded book properly
      if (uploadedBook && uploadedBook.id) {
        // Call the parent callback if provided
        if (onUploadComplete) {
          onUploadComplete(uploadedBook);
        }

        // Show success message with option to read
        setMessage(`Book uploaded successfully! Book ID: ${uploadedBook.id}`);
        
        // Optional: Auto-navigate to read the book after a short delay
        setTimeout(() => {
          if (window.confirm('Would you like to read the uploaded book now?')) {
            navigate(`/read/${uploadedBook.id}`);
          }
        }, 1000);
      } else {
        console.error('❌ No book ID in upload response:', response.data);
        setMessage('Book uploaded but ID not received. Please refresh your library.');
        setIsError(true);
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      // More detailed error messages
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid upload data';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to upload books';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Maximum size is 50MB';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Simulate file input change
      const event = { target: { files: [file] } };
      handleFileSelect(event);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* File Upload Area */}
      <Card type="outlined" className="p-8">
        <h3 className="text-title-large text-on-surface mb-6 font-semibold">
          Select Book File
        </h3>
        
        <div
          className="border-2 border-dashed border-outline-variant rounded-large p-8 text-center transition-colors duration-medium2 hover:border-primary hover:bg-primary-container/5"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
            upload_file
          </span>
          
          <p className="text-body-large text-on-surface mb-2">
            Drag and drop your book file here, or click to browse
          </p>
          <p className="text-body-small text-on-surface-variant mb-4">
            Supported formats: PDF, EPUB (Max size: 50MB)
          </p>
          
          <input
            id="book-file-input"
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="outlined"
            onClick={() => document.getElementById('book-file-input').click()}
            className="mt-4"
          >
            Choose File
          </Button>
        </div>

        {selectedFile && (
          <div className="mt-4 p-4 bg-surface-container rounded-medium">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-primary text-2xl">
                {formData.format === 'epub' ? 'menu_book' : 'picture_as_pdf'}
              </span>
              <div className="flex-1">
                <p className="text-body-medium text-on-surface font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-body-small text-on-surface-variant">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  const fileInput = document.getElementById('book-file-input');
                  if (fileInput) fileInput.value = '';
                }}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Book Details Form */}
      {selectedFile && (
        <Card type="outlined" className="p-8 space-y-6">
          <h3 className="text-title-large text-on-surface font-semibold">
            Book Details
          </h3>
          
          <div className="space-y-4">
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              className="w-full"
            />
            
            <TextField
              label="Author"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              required
              className="w-full"
            />
            
            <TextField
              label="Genre"
              value={formData.genre}
              onChange={(e) => handleInputChange('genre', e.target.value)}
              className="w-full"
              helperText="Optional"
            />
          </div>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card type="elevated" className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-body-large text-on-surface">
                Uploading... {uploadProgress}%
              </span>
            </div>
            
            <div className="w-full bg-surface-container-high rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Success/Error Messages */}
      {message && (
        <Card 
          type="filled" 
          className={`p-4 ${isError ? 'bg-error-container' : 'bg-primary-container'}`}
        >
          <div className="flex items-center space-x-3">
            <span className={`material-symbols-outlined ${
              isError ? 'text-on-error-container' : 'text-on-primary-container'
            }`}>
              {isError ? 'error' : 'check_circle'}
            </span>
            <p className={`text-body-medium ${
              isError ? 'text-on-error-container' : 'text-on-primary-container'
            }`}>
              {message}
            </p>
          </div>
        </Card>
      )}

      {/* Upload Button */}
      <div className="text-center">
        <Button
          type="filled"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || !formData.title.trim() || !formData.author.trim()}
          className="px-8 py-4 text-lg"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined mr-2">upload</span>
              Upload Book
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BookUpload;