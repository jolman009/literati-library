// src/middleware/validation.js
import { body, param, query, validationResult } from 'express-validator';

// =====================================================
// Validation Error Handler
// =====================================================

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
      requestId: req.requestId
    });
  }

  next();
};

// =====================================================
// Common Validation Rules
// =====================================================

// UUID validation
export const validateUUID = (field) => param(field)
  .isUUID(4)
  .withMessage(`${field} must be a valid UUID`);

// Email validation
export const validateEmail = (field = 'email') => body(field)
  .isEmail()
  .normalizeEmail()
  .withMessage('Must be a valid email address');

// Password validation
export const validatePassword = (field = 'password') => body(field)
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be 8-128 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

// Text sanitization
export const sanitizeText = (field, maxLength = 1000) => body(field)
  .trim()
  .escape()
  .isLength({ max: maxLength })
  .withMessage(`${field} must not exceed ${maxLength} characters`);

// Number validation
export const validateNumber = (field, min = 0, max = Number.MAX_SAFE_INTEGER) => body(field)
  .isInt({ min, max })
  .withMessage(`${field} must be a number between ${min} and ${max}`);

// =====================================================
// Authentication Validation
// =====================================================

export const validateSignup = [
  validateEmail(),
  validatePassword(),
  body('name')
    .trim()
    .escape()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be 1-100 characters'),
  handleValidationErrors
];

export const validateLogin = [
  validateEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const validatePasswordReset = [
  validateEmail(),
  handleValidationErrors
];

// =====================================================
// Book Management Validation
// =====================================================

export const validateBookUpload = [
  body('title')
    .trim()
    .escape()
    .isLength({ min: 1, max: 200 })
    .withMessage('Book title is required and must be 1-200 characters'),
  body('author')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Author name must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('genre')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 50 })
    .withMessage('Genre must not exceed 50 characters'),
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/)
    .withMessage('ISBN must be valid (10 or 13 digits)'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be valid'),
  body('pageCount')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('Page count must be between 1 and 50,000'),
  handleValidationErrors
];

export const validateBookUpdate = [
  validateUUID('id'),
  body('title')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 1, max: 200 })
    .withMessage('Book title must be 1-200 characters'),
  body('author')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Author name must not exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['to-read', 'reading', 'completed', 'paused'])
    .withMessage('Status must be one of: to-read, reading, completed, paused'),
  body('currentPage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current page must be a non-negative number'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  handleValidationErrors
];

// =====================================================
// Notes Validation
// =====================================================

export const validateNoteCreation = [
  body('bookId')
    .isUUID(4)
    .withMessage('Book ID must be a valid UUID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Note content is required and must be 1-10,000 characters'),
  body('type')
    .isIn(['note', 'highlight', 'bookmark'])
    .withMessage('Note type must be one of: note, highlight, bookmark'),
  body('pageNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page number must be a positive integer'),
  body('location')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  handleValidationErrors
];

export const validateNoteUpdate = [
  validateUUID('id'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Note content must be 1-10,000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be 1-30 characters'),
  handleValidationErrors
];

// =====================================================
// Reading Session Validation
// =====================================================

export const validateReadingSession = [
  body('bookId')
    .isUUID(4)
    .withMessage('Book ID must be a valid UUID'),
  body('startPage')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Start page must be a positive integer'),
  body('endPage')
    .optional()
    .isInt({ min: 1 })
    .withMessage('End page must be a positive integer'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 86400 }) // Max 24 hours in seconds
    .withMessage('Duration must be between 1 second and 24 hours'),
  body('sessionDate')
    .optional()
    .isISO8601()
    .withMessage('Session date must be a valid ISO 8601 date'),
  // Custom validation: endPage should be >= startPage
  body('endPage').custom((endPage, { req }) => {
    if (endPage && req.body.startPage && endPage < req.body.startPage) {
      throw new Error('End page must be greater than or equal to start page');
    }
    return true;
  }),
  handleValidationErrors
];

// =====================================================
// Gamification Validation
// =====================================================

export const validateGamificationAction = [
  body('action')
    .isIn([
      'book_uploaded', 'book_completed', 'page_read', 'pages_read',
      'note_created', 'highlight_created', 'reading_session_started',
      'reading_session_completed', 'reading_time', 'daily_login',
      'daily_checkin'
    ])
    .withMessage('Invalid action type'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  body('data.pages')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Pages must be between 1 and 10,000'),
  body('data.minutes')
    .optional()
    .isInt({ min: 1, max: 1440 }) // Max 24 hours
    .withMessage('Minutes must be between 1 and 1,440'),
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date'),
  handleValidationErrors
];

export const validateGoalCreation = [
  body('title')
    .trim()
    .escape()
    .isLength({ min: 1, max: 200 })
    .withMessage('Goal title is required and must be 1-200 characters'),
  body('description')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1,000 characters'),
  body('type')
    .isIn(['books_completed', 'reading_time', 'reading_streak', 'pages_read', 'notes_created'])
    .withMessage('Invalid goal type'),
  body('target')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Target must be between 1 and 10,000'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date'),
  body('points')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Points must be between 0 and 10,000'),
  handleValidationErrors
];

// =====================================================
// Query Parameter Validation
// =====================================================

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1,000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'title', 'author', 'rating'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  handleValidationErrors
];

export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters'),
  query('type')
    .optional()
    .isIn(['books', 'notes', 'achievements'])
    .withMessage('Search type must be books, notes, or achievements'),
  handleValidationErrors
];

// =====================================================
// File Upload Validation
// =====================================================

export const validateFileUpload = (req, res, next) => {
  // Validate file presence
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'No file uploaded',
      accepted: ['pdf', 'epub', 'txt']
    });
  }

  const file = req.file || (req.files && req.files[0]);

  if (!file) {
    return res.status(400).json({
      error: 'Invalid file data'
    });
  }

  // Validate file size (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return res.status(413).json({
      error: 'File too large',
      maxSize: '50MB',
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'application/epub+zip', 'text/plain'];
  const allowedExtensions = ['.pdf', '.epub', '.txt'];

  const isValidType = allowedTypes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.some(ext =>
    file.originalname.toLowerCase().endsWith(ext)
  );

  if (!isValidType || !isValidExtension) {
    return res.status(400).json({
      error: 'Invalid file type',
      accepted: allowedTypes,
      received: file.mimetype
    });
  }

  // Sanitize filename
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  file.sanitizedName = sanitizedName;

  next();
};

// =====================================================
// Export validation suites
// =====================================================

export const validationSuite = {
  auth: {
    signup: validateSignup,
    login: validateLogin,
    passwordReset: validatePasswordReset
  },
  books: {
    upload: validateBookUpload,
    update: validateBookUpdate
  },
  notes: {
    create: validateNoteCreation,
    update: validateNoteUpdate
  },
  reading: {
    session: validateReadingSession
  },
  gamification: {
    action: validateGamificationAction,
    goal: validateGoalCreation
  },
  query: {
    pagination: validatePagination,
    search: validateSearch
  },
  files: {
    upload: validateFileUpload
  },
  common: {
    uuid: validateUUID,
    email: validateEmail,
    password: validatePassword,
    text: sanitizeText,
    number: validateNumber
  }
};