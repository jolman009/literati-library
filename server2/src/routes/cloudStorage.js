// src/routes/cloudStorage.js - Cloud Storage Token Management
import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import axios from 'axios'; // Required for file download

/**
 * Cloud Storage Management Routes
 *
 * Handles OAuth token management and cloud storage connections
 * - View connected services
 * - Disconnect services
 * - Clear OAuth tokens
 * - NEW: Upload files from Drive to Supabase
 *
 * Security: 
 * - Admin routes: Checked by requireAdmin
 * - Upload routes: Checked by authenticateToken (available to all logged-in users)
 */

export function cloudStorageRouter(authenticateToken) {
  const router = express.Router();

  /**
   * Admin Check Middleware
   * Only allow access to admin user (jolman009@yahoo.com)
   */
  const requireAdmin = (req, res, next) => {
    // In a single-admin app, check if user is the admin
    const adminEmail = process.env.ADMIN_EMAIL || 'jolman009@yahoo.com';

    if (!req.user || req.user.email !== adminEmail) {
      return res.status(403).json({
        error: 'Forbidden: Admin access required'
      });
    }

    next();
  };

  /**
   * GET /api/cloud-storage/connections
   * List all connected cloud storage services
   */
  router.get('/connections', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.id;

      // Query cloud_storage_connections table (create if doesn't exist)
      const { data: connections, error } = await supabase
        .from('cloud_storage_connections')
        .select('*')
        .eq('user_id', userId)
        .order('connected_at', { ascending: false });

      if (error) {
        // Table might not exist yet - return empty array
        console.log('Cloud storage connections table not found, returning empty array');
        return res.json([]);
      }

      res.json(connections || []);

    } catch (error) {
      console.error('Failed to fetch cloud storage connections:', error);
      res.status(500).json({ error: 'Failed to fetch connections' });
    }
  });

  /**
   * POST /api/cloud-storage/disconnect
   * Disconnect a specific cloud storage provider
   */
  router.post('/disconnect', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { provider } = req.body;
      const userId = req.user.id;

      if (!provider) {
        return res.status(400).json({ error: 'Provider is required' });
      }

      // Validate provider
      const validProviders = ['googledrive', 'dropbox', 'onedrive'];
      if (!validProviders.includes(provider.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      console.log(`🔌 Disconnecting ${provider} for user ${userId}`);

      // Delete the connection record
      const { error } = await supabase
        .from('cloud_storage_connections')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider.toLowerCase());

      if (error) {
        console.error('Failed to disconnect provider:', error);
        return res.status(500).json({ error: 'Failed to disconnect provider' });
      }

      console.log(`✅ Successfully disconnected ${provider}`);
      res.json({ success: true, message: `${provider} disconnected successfully` });

    } catch (error) {
      console.error('Disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect provider' });
    }
  });

  /**
   * POST /api/cloud-storage/clear-all-tokens
   * Clear all OAuth tokens for the user (emergency function)
   */
  router.post('/clear-all-tokens', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = req.user.id;

      console.log(`🧹 Clearing all OAuth tokens for user ${userId}`);

      // Delete all connection records for this user
      const { error } = await supabase
        .from('cloud_storage_connections')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to clear tokens:', error);
        return res.status(500).json({ error: 'Failed to clear tokens' });
      }

      console.log(`✅ Successfully cleared all OAuth tokens`);
      res.json({
        success: true,
        message: 'All OAuth tokens cleared successfully'
      });

    } catch (error) {
      console.error('Clear tokens error:', error);
      res.status(500).json({ error: 'Failed to clear tokens' });
    }
  });

  /**
   * POST /api/cloud-storage/store-token (Optional)
   * Store an OAuth token for "Quick Import" feature
   * Only stores if user explicitly enables Quick Import
   */
  router.post('/store-token', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { provider, accessToken, refreshToken, expiresAt } = req.body;
      const userId = req.user.id;

      if (!provider || !accessToken) {
        return res.status(400).json({ error: 'Provider and accessToken are required' });
      }

      // Validate provider
      const validProviders = ['googledrive', 'dropbox', 'onedrive'];
      if (!validProviders.includes(provider.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      console.log(`🔐 Storing OAuth token for ${provider}`);

      // NOTE: In production, tokens should be encrypted before storage
      // For now, we'll store them securely using Supabase's encryption
      const connectionData = {
        user_id: userId,
        provider: provider.toLowerCase(),
        access_token: accessToken, // Should be encrypted in production
        refresh_token: refreshToken || null,
        expires_at: expiresAt || null,
        connected_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      };

      // Upsert the connection (update if exists, insert if new)
      const { data, error } = await supabase
        .from('cloud_storage_connections')
        .upsert(connectionData, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to store token:', error);
        return res.status(500).json({ error: 'Failed to store token' });
      }

      console.log(`✅ Successfully stored OAuth token for ${provider}`);
      res.json({
        success: true,
        message: 'Token stored successfully',
        connection: {
          provider: data.provider,
          connected_at: data.connected_at
        }
      });

    } catch (error) {
      console.error('Store token error:', error);
      res.status(500).json({ error: 'Failed to store token' });
    }
  });

  /**
   * POST /api/cloud-storage/drive/upload
   * NEW FEATURE: Download file from Google Drive and stream to Supabase
   * This route allows standard users (authenticateToken) to import books.
   */
  router.post('/drive/upload', authenticateToken, async (req, res) => {
    const { fileId, accessToken, fileName, mimeType } = req.body;
    const userId = req.user.id; // From authenticateToken middleware

    if (!fileId || !accessToken) {
      return res.status(400).json({ error: 'Missing fileId or accessToken' });
    }

    try {
      console.log(`Starting Drive download for file: ${fileName} (${fileId})`);

      // 1. Download file stream from Google Drive
      const driveResponse = await axios({
        method: 'GET',
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        responseType: 'arraybuffer' // Get raw data buffer
      });

      const buffer = driveResponse.data;
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Create a path compatible with Supabase storage conventions
      // Stores in: {userId}/{timestamp}_{filename}
      const storagePath = `${userId}/${Date.now()}_${cleanFileName}`;

      console.log(`Uploading to Supabase path: ${storagePath}`);

      // 2. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('books')
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      // 3. Return success with the path needed for the "Save Book" step
      res.json({
        success: true,
        path: data.path, 
        fullPath: data.fullPath,
        filename: cleanFileName,
        originalName: fileName,
        mimeType: mimeType
      });

    } catch (error) {
      console.error('Drive integration error:', error.response?.data || error.message);
      res.status(500).json({ 
        error: 'Failed to process Google Drive file',
        details: error.message 
      });
    }
  });

  return router;
}