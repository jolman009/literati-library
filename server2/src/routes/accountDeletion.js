// server2/src/routes/accountDeletion.js - GDPR Account Deletion (Article 17)
import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient.js';
import { advancedSecuritySuite } from '../middlewares/advancedSecurity.js';
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS
} from '../middlewares/enhancedAuth.js';

export default function accountDeletionRouter(authenticateToken) {
  const router = express.Router();

  /**
   * DELETE /api/account
   * Permanently delete the authenticated user's account and all associated data.
   * Requires password confirmation. All 27 dependent tables cascade-delete automatically.
   */
  router.delete('/',
    authenticateToken,
    advancedSecuritySuite.rateLimit.sensitive,
    async (req, res) => {
      const userId = req.user.id;
      const { password, confirmation } = req.body;

      // Require explicit confirmation string
      if (confirmation !== 'DELETE MY ACCOUNT') {
        return res.status(400).json({
          error: 'Please confirm deletion by sending confirmation: "DELETE MY ACCOUNT"',
          code: 'CONFIRMATION_REQUIRED'
        });
      }

      // Require password
      if (!password) {
        return res.status(400).json({
          error: 'Password is required to delete your account',
          code: 'PASSWORD_REQUIRED'
        });
      }

      try {
        // 1. Fetch user to verify password
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id, email, password, name')
          .eq('id', userId)
          .single();

        if (fetchError || !user) {
          return res.status(404).json({
            error: 'Account not found',
            code: 'USER_NOT_FOUND'
          });
        }

        // 2. Verify password
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
          return res.status(403).json({
            error: 'Incorrect password',
            code: 'INVALID_PASSWORD'
          });
        }

        // 3. Log deletion event BEFORE deleting (for compliance audit trail)
        await supabase
          .from('security_audit_log')
          .insert({
            user_id: userId,
            action: 'account_deleted',
            details: {
              email: user.email,
              name: user.name,
              deleted_at: new Date().toISOString(),
              ip_address: req.ip,
              user_agent: req.get('User-Agent'),
            },
            ip_address: req.ip,
          })
          .then(({ error }) => {
            if (error) console.warn('Failed to log account deletion audit:', error.message);
          });

        // 4. Delete user — all 27 dependent tables cascade-delete automatically
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (deleteError) {
          console.error('Account deletion failed:', deleteError);
          return res.status(500).json({
            error: 'Failed to delete account. Please try again or contact support.',
            code: 'DELETION_FAILED'
          });
        }

        console.log(`Account deleted: user=${userId}, email=${user.email}`);

        // 5. Clear auth cookies
        res.clearCookie('accessToken', ACCESS_COOKIE_OPTIONS);
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
        res.clearCookie('accessToken', { ...ACCESS_COOKIE_OPTIONS, path: '/' });
        res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, path: '/' });

        // 6. Success response
        res.json({
          message: 'Your account and all associated data have been permanently deleted.',
          deleted: true
        });
      } catch (err) {
        console.error('Account deletion error:', err);
        res.status(500).json({
          error: 'An unexpected error occurred. Please try again.',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  );

  return router;
}
