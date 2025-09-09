// src/pages/UploadPage.jsx - Fixed with REAL API integration
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../config/api';

const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStep, setUploadStep] = useState('select'); // select, details, uploading, complete
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    description: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [animationState, setAnimationState] = useState('enter');
  

  // Animation effects
  useEffect(() => {
    setAnimationState('active');
  }, []);

  // Navigation simulation
  const handleNavigation = (path) => {
    navigate(path); // ✅ USE REAL NAVIGATION instead of console.log
  };

  // Enhanced file handling with visual feedback
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type with enhanced feedback
    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Please select a PDF or EPUB file for the best reading experience');
      setIsError(true);
      return;
    }

    // Validate file size with user-friendly messaging
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setMessage('File size should be under 50MB for optimal performance');
      setIsError(true);
      return;
    }

    setSelectedFile(file);
    setMessage('');
    setIsError(false);
    setUploadStep('details');

    // Auto-extract metadata from filename
    const fileName = file.name.replace(/\.(pdf|epub)$/i, '');
    const titleGuess = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    setFormData(prev => ({ ...prev, title: titleGuess }));
  };

  // Enhanced drag and drop with visual feedback
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // REAL upload with actual API integration
  const handleUpload = async () => {
    if (!selectedFile || !formData.title || !formData.author) {
      setMessage('Please fill in the required fields');
      setIsError(true);
      return;
    }

    setIsUploading(true);
    setUploadStep('uploading');
    setUploadProgress(0);
    setMessage('');
    setIsError(false);

    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('book', selectedFile);
      uploadData.append('title', formData.title.trim());
      uploadData.append('author', formData.author.trim());
      uploadData.append('genre', formData.genre.trim());
      if (formData.description.trim()) {
        uploadData.append('description', formData.description.trim());
      }

      // Make REAL API call to backend
      const response = await API.post('/books/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      // Get the uploaded book from response
      const uploadedBook = response.data;
      console.log('📚 Book uploaded successfully:', uploadedBook);

      setIsUploading(false);
      setUploadStep('complete');
      setMessage(`"${uploadedBook.title}" uploaded successfully!`);

      // Give user options for what to do next
      setTimeout(() => {
        const userChoice = window.confirm(
          `Would you like to start reading "${uploadedBook.title}" now?\n\n` +
          `Click OK to open the reader, or Cancel to go to your library.`
        );

        if (userChoice && uploadedBook.id) {
          // Navigate to the reader with the book ID
          navigate(`/read/${uploadedBook.id}`);
        } else {
          // Navigate to the library
          navigate('/library');
        }
      }, 1000);

    } catch (error) {
      console.error('Upload error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        error: error
      });
      setIsUploading(false);
      setUploadStep('select');
      setIsError(true);
      
      // Better error messages
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid upload data';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to upload books';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please choose a smaller file.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = `Upload error: ${error.message}`;
      }
      
      setMessage(errorMessage);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStep('select');
    setUploadProgress(0);
    setIsUploading(false);
    setFormData({ title: '', author: '', genre: '', description: '' });
    setMessage('');
    setIsError(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#f7f2fa] to-[#fff8e1] transition-all duration-1000 ${animationState === 'active' ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Upload Your Book
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Add a new book to your digital library. We support PDF and EPUB formats.
          </p>
        </div>

        {/* Upload Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['select', 'details', 'uploading', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  uploadStep === step 
                    ? 'bg-purple-600 text-white scale-110 shadow-lg' 
                    : index < ['select', 'details', 'uploading', 'complete'].indexOf(uploadStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-1 transition-all duration-300 ${
                    index < ['select', 'details', 'uploading', 'complete'].indexOf(uploadStep)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: File Selection */}
        {uploadStep === 'select' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-500">
            <div
              className={`relative group border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer ${
                dragActive 
                  ? 'border-purple-600 bg-purple-50 scale-105' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-blue-200 to-green-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-1000 delay-200"></div>
              </div>

              <div className="relative z-10 text-center space-y-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500 ${
                  dragActive 
                    ? 'bg-purple-600 shadow-lg scale-110' 
                    : 'bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-purple-200 group-hover:to-blue-200'
                }`}>
                  <span className={`text-4xl transition-colors duration-500 ${
                    dragActive ? 'text-white animate-bounce' : 'text-purple-600'
                  }`}>
                    📖
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {dragActive ? 'Drop your book here!' : 'Choose or drag your book file'}
                  </h3>
                  <p className="text-gray-600">
                    Supports PDF and EPUB formats up to 50MB
                  </p>
                </div>

                <button className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                  dragActive 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg transform scale-110'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                }`}>
                  Browse Files
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.epub"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
            
            {message && (
              <div className={`mt-4 p-4 rounded-lg ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Book Details */}
        {uploadStep === 'details' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-500">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Book Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="Enter book title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="Enter author name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                >
                  <option value="">Select genre</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Christian">Christian</option>
                  <option value="Biography">Biography</option>
                  <option value="History">History</option>
                  <option value="Self-Help">Self-Help</option>
                  <option value="Business">Business</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File
                </label>
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">📄</span>
                  <span className="text-sm text-gray-600">{selectedFile?.name}</span>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="Brief description of the book"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <button
                onClick={resetUpload}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleUpload}
                disabled={!formData.title || !formData.author}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                  !formData.title || !formData.author
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                Upload Book
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Uploading */}
        {uploadStep === 'uploading' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all duration-500">
            <div className="text-6xl mb-6">⏳</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Uploading Your Book</h3>
            <p className="text-gray-600 mb-6">Please wait while we upload and process your book...</p>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {uploadStep === 'complete' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all duration-500">
            <div className="text-6xl mb-6">🎉</div>
            <h3 className="text-2xl font-bold text-green-600 mb-4">Upload Complete!</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/library')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
              >
                Go to Library
              </button>
              <button
                onClick={resetUpload}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;