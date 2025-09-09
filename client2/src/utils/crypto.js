// crypto.js - Client-side encryption utilities for secure storage
// Note: This provides basic obfuscation. For production, consider server-side key management.

/**
 * Simple encryption for API keys (client-side obfuscation)
 * Note: This is not cryptographically secure - real apps should use server-side storage
 */
export function encrypt(text) {
  try {
    // Simple base64 encoding with rotation cipher
    const rotated = text.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) + 7)
    ).join('');
    
    return btoa(rotated);
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback to plain text
  }
}

/**
 * Simple decryption for API keys
 */
export function decrypt(encryptedText) {
  try {
    const decoded = atob(encryptedText);
    const original = decoded.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) - 7)
    ).join('');
    
    return original;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Fallback to encrypted text
  }
}

/**
 * Generate a simple hash for verification
 */
export function generateHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate hash matches text
 */
export function validateHash(text, hash) {
  return generateHash(text) === hash;
}