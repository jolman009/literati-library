// src/routes/notifications.js
// REST API for notification management + web push subscription
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';
import { computeEndpointHash } from '../services/notificationService.js';

export const notificationsRouter = (authenticateToken) => {
  const router = Router();
  router.use(authenticateToken);

  // GET /api/notifications — paginated inbox
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = parseInt(req.query.offset) || 0;
      const unreadOnly = req.query.unread === 'true';

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }

      res.json({ notifications: data || [], limit, offset });
    } catch (err) {
      console.error('Notification fetch error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/notifications/unread-count — badge count
  router.get('/unread-count', async (req, res) => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error counting unread:', error);
        return res.json({ count: 0 });
      }

      // Supabase returns count in the response when head: true
      // Fallback to data length if count isn't available
      const count = typeof data === 'number' ? data : (Array.isArray(data) ? data.length : 0);
      res.json({ count });
    } catch (err) {
      console.error('Unread count error:', err);
      res.json({ count: 0 });
    }
  });

  // PATCH /api/notifications/:id/read — mark single as read
  router.patch('/:id/read', async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking read:', error);
        return res.status(500).json({ error: 'Failed to mark as read' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Mark read error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notifications/mark-all-read — mark all as read
  router.post('/mark-all-read', async (req, res) => {
    try {
      const userId = req.user.id;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all read:', error);
        return res.status(500).json({ error: 'Failed to mark all as read' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Mark all read error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notifications/push-subscription — register web push subscription
  router.post('/push-subscription', async (req, res) => {
    try {
      const userId = req.user.id;
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid push subscription' });
      }

      const endpointHash = computeEndpointHash(subscription);

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          platform: 'web',
          subscription,
          endpoint_hash: endpointHash,
          active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint_hash',
        });

      if (error) {
        console.error('Error saving push subscription:', error);
        return res.status(500).json({ error: 'Failed to save subscription' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Push subscription error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/notifications/push-subscription — unregister
  router.delete('/push-subscription', async (req, res) => {
    try {
      const userId = req.user.id;
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid push subscription' });
      }

      const endpointHash = computeEndpointHash(subscription);

      const { error } = await supabase
        .from('push_subscriptions')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('endpoint_hash', endpointHash);

      if (error) {
        console.error('Error removing push subscription:', error);
        return res.status(500).json({ error: 'Failed to remove subscription' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/notifications/vapid-public-key — return VAPID public key for client
  router.get('/vapid-public-key', (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY || null;
    if (!key) {
      return res.status(404).json({ error: 'Push notifications not configured' });
    }
    res.json({ publicKey: key });
  });

  return router;
};
