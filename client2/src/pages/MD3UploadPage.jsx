// src/pages/MD3UploadPage.jsx - Material Design 3 Upload Page
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../config/api';
import { useGamification } from '../contexts/GamificationContext';
import {
  MD3Card,
  MD3Button,
  MD3TextField,
  MD3Chip,
  MD3Progress,
  MD3Surface,
  useSnackbar
} from '../components/Material3';
import './MD3UploadPage.css';

const MD3UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { showSnackbar } = useSnackbar();
  const { trackAction } = useGamification();
  
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

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    if (!allowedTypes.includes(file.type)) {
      showSnackbar({
        message: 'Please select a PDF or EPUB file',
        variant: 'error'
      });
      return;
    }

    // Validate file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showSnackbar({
        message: 'File size should be under 50MB',
        variant: 'error'
      });
      return;
    }

    setSelectedFile(file);
    setUploadStep('details');

    // Auto-extract metadata from filename
    const fileName = file.name.replace(/\.(pdf|epub)$/i, '');
    const titleGuess = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    setFormData(prev => ({ ...prev, title: titleGuess }));
  };

  // Handle drag and drop
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

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !formData.title || !formData.author) {
      showSnackbar({
        message: 'Please fill in the required fields',
        variant: 'error'
      });
      return;
    }

    setIsUploading(true);
    setUploadStep('uploading');
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('book', selectedFile);
      uploadData.append('title', formData.title.trim());
      uploadData.append('author', formData.author.trim());
      uploadData.append('genre', formData.genre.trim());
      if (formData.description.trim()) {
        uploadData.append('description', formData.description.trim());
      }

      const response = await API.post('/books/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      const uploadedBook = response.data;
      setIsUploading(false);
      setUploadStep('complete');

      // Track book upload action for gamification
      try {
        await trackAction('book_uploaded', {
          bookId: uploadedBook.id,
          bookTitle: uploadedBook.title,
          bookAuthor: uploadedBook.author,
          fileType: selectedFile.type,
          fileSize: selectedFile.size
        });
        console.log('✅ Book upload tracked successfully - 25 points awarded');
      } catch (trackError) {
        console.error('Failed to track book upload:', trackError);
        // Don't fail the upload if tracking fails
      }

      showSnackbar({
        message: `"${uploadedBook.title}" uploaded successfully! +25 points earned!`,
        variant: 'success'
      });

      // Navigate after a short delay
      setTimeout(() => {
        navigate('/library');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      console.error('Upload error response:', error.response);
      console.error('Upload error data:', error.response?.data);
      console.error('Upload error status:', error.response?.status);
      
      setIsUploading(false);
      setUploadStep('select');
      
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.details || 
                           error.message || 
                           'Upload failed. Please try again.';
      
      showSnackbar({
        message: `Upload failed: ${errorMessage}`,
        variant: 'error'
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStep('select');
    setUploadProgress(0);
    setIsUploading(false);
    setFormData({ title: '', author: '', genre: '', description: '' });
  };

  return (
    <div className="md3-upload-page">
      <div className="md3-upload-container">
        
        {/* Header */}
        <div className="md3-upload-header">
          <h1 className="md-display-small">Upload Book</h1>
          <p className="md-body-large on-surface-variant">
            Add a new book to your digital library
          </p>
        </div>

        {/* Progress Steps */}
        <div className="md3-upload-steps">
          {['Select File', 'Book Details', 'Uploading', 'Complete'].map((label, index) => {
            const steps = ['select', 'details', 'uploading', 'complete'];
            const currentIndex = steps.indexOf(uploadStep);
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;
            
            return (
              <div key={label} className="md3-step">
                <div className={`md3-step-indicator ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                  {isComplete ? '✓' : index + 1}
                </div>
                <span className={`md3-step-label md-label-small ${isActive ? 'active' : ''}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <MD3Card className="md3-upload-content">
          
          {/* Step 1: File Selection */}
          {uploadStep === 'select' && (
            <div className="md3-upload-select">
              <div
                className={`md3-dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="md3-dropzone-content">
                  <span className="md3-dropzone-icon">📚</span>
                  <h3 className="md-title-large">
                    {dragActive ? 'Drop your book here' : 'Click or drag to upload'}
                  </h3>
                  <p className="md-body-medium on-surface-variant">
                    Supports PDF and EPUB formats up to 50MB
                  </p>
                  <MD3Button variant="filled" className="md3-upload-button">
                    Choose File
                  </MD3Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.epub"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Book Details */}
          {uploadStep === 'details' && (
            <div className="md3-upload-details">
              <div className="md3-file-preview">
                <MD3Surface className="md3-file-info">
                  <span className="file-icon">📄</span>
                  <div>
                    <p className="md-label-large">{selectedFile?.name}</p>
                    <p className="md-label-small on-surface-variant">
                      {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </MD3Surface>
              </div>

              <div className="md3-form-grid">
                <MD3TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  onInput={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  fullWidth
                />

                <MD3TextField
                  label="Author"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  onInput={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  required
                  fullWidth
                />
                
                <div className="md3-select-field">
                  <label className="md3-select-label">Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                    className="md3-select"
                  >
                    <option value="">Select genre</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="Science Fiction">Science Fiction</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Romance">Romance</option>
                    <option value="Horror">Horror</option>
                    <option value="Biography">Biography</option>
                    <option value="History">History</option>
                    <option value="Self-Help">Self-Help</option>
                    <option value="Business">Business</option>
                    <option value="Children">Children</option>
                    <option value="Young Adult">Young Adult</option>
                    <option value="Poetry">Poetry</option>
                    <option value="Drama">Drama</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Religion">Religion</option>
                    <option value="Christian">Christian</option>
                    <option value="Science">Science</option>
                    <option value="Technology">Technology</option>
                    <option value="Travel">Travel</option>
                    <option value="Cooking">Cooking</option>
                    <option value="Art">Art</option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <MD3TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
              </div>

              <div className="md3-upload-actions">
                <MD3Button variant="text" onClick={resetUpload}>
                  Back
                </MD3Button>
                <MD3Button
                  variant="filled"
                  onClick={handleUpload}
                  disabled={!formData.title?.trim() || !formData.author?.trim()}
                  style={{
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  Upload Book
                </MD3Button>
              </div>
            </div>
          )}

          {/* Step 3: Uploading */}
          {uploadStep === 'uploading' && (
            <div className="md3-upload-progress">
              <div className="md3-progress-icon">⏳</div>
              <h3 className="md-title-large">Uploading Your Book</h3>
              <p className="md-body-medium on-surface-variant">
                Please wait while we process your book...
              </p>
              <MD3Progress value={uploadProgress} />
              <p className="md-label-medium">{uploadProgress}% complete</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {uploadStep === 'complete' && (
            <div className="md3-upload-complete">
              <div className="md3-success-icon">✅</div>
              <h3 className="md-title-large">Upload Complete!</h3>
              <p className="md-body-medium on-surface-variant">
                Your book has been added to your library
              </p>
              <div className="md3-upload-actions">
                <MD3Button variant="text" onClick={resetUpload}>
                  Upload Another
                </MD3Button>
                <MD3Button variant="filled" onClick={() => navigate('/library')}>
                  Go to Library
                </MD3Button>
              </div>
            </div>
          )}
        </MD3Card>
      </div>
    </div>
  );
};

export default MD3UploadPage;