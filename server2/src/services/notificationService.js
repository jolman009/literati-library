// src/services/notificationService.js
// Central notification dispatch: in-app inbox + web push delivery
import { createHash } from 'crypto';
import { supabase } from '../config/supabaseClient.js';

// Lazy-loaded web-push (only when VAPID keys are configured)
let webPush = null;
const getWebPush = async () => {
  if (webPush) return webPush;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return null;
  try {
    const mod = await import('web-push');
    webPush = mod.default || mod;
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:info@shelfquest.org',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    return webPush;
  } catch {
    return null;
  }
};

// Map notification types to user preference columns
const PREFERENCE_MAP = {
  achievement_unlocked: { table: 'user_settings', column: 'achievement_notifications' },
  level_up:             { table: 'user_settings', column: 'achievement_notifications' },
  streak_milestone:     { table: 'user_settings', column: 'streak_notifications' },
  streak_shield:        { table: 'user_settings', column: 'streak_notifications' },
  streak_warning:       { table: 'user_settings', column: 'streak_notifications' },
  challenge_completed:  { table: 'user_settings', column: 'challenge_notifications' },
  goal_completed:       { table: 'user_preferences', column: 'goal_reminders' },
  new_follower:         null, // always enabled
};

/**
 * Check if a notification type is enabled for a user.
 */
export const isNotificationEnabled = async (userId, type) => {
  const pref = PREFERENCE_MAP[type];
  if (pref === undefined) return true; // unknown type → allow
  if (pref === null) return true;      // always enabled

  try {
    const { data } = await supabase
      .from(pref.table)
      .select(pref.column)
      .eq('user_id', userId)
      .single();

    // If no settings row exists, default to enabled
    if (!data) return true;
    return data[pref.column] !== false;
  } catch {
    return true; // on error, default to enabled
  }
};

/**
 * Compute a SHA-256 hash of a push subscription's endpoint for deduplication.
 */
export const computeEndpointHash = (subscription) => {
  const endpoint = typeof subscription === 'string'
    ? subscription
    : subscription?.endpoint || JSON.stringify(subscription);
  return createHash('sha256').update(endpoint).digest('hex');
};

/**
 * Generate a deep-link URL for a notification click.
 */
export const getNotificationUrl = (type, data = {}) => {
  switch (type) {
    case 'achievement_unlocked':
      return '/achievements';
    case 'level_up':
      return '/dashboard';
    case 'streak_milestone':
    case 'streak_shield':
    case 'streak_warning':
      return '/dashboard';
    case 'challenge_completed':
      return '/dashboard';
    case 'goal_completed':
      return '/progress';
    case 'new_follower':
      return '/leaderboard';
    default:
      return '/dashboard';
  }
};

/**
 * Send web push notifications to all active subscriptions for a user.
 */
export const sendPushToUser = async (userId, payload) => {
  const wp = await getWebPush();
  if (!wp) return; // VAPID not configured

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', userId)
    .eq('active', true);

  if (!subscriptions?.length) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/literatiLOGO.png',
    badge: '/favicon-96x96.png',
    data: {
      url: getNotificationUrl(payload.type, payload.data),
      ...payload.data,
    },
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await wp.sendNotification(sub.subscription, pushPayload);
      } catch (err) {
        // 410 Gone or 404 means the subscription has expired
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', sub.id);
        }
      }
    })
  );
};

/**
 * Main entry point: send an in-app notification and (optionally) a push.
 *
 * @param {string} userId
 * @param {object} opts - { type, title, body, icon, data }
 */
export const sendNotification = async (userId, { type, title, body, icon, data = {} }) => {
  // 1. Check user preference
  const enabled = await isNotificationEnabled(userId, type);
  if (!enabled) return null;

  // 2. Insert in-app notification
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      icon: icon || null,
      data,
    })
    .select()
    .single();

  if (error) {
    console.warn('Failed to insert notification:', error.message);
    return null;
  }

  // 3. Fire-and-forget web push
  sendPushToUser(userId, { type, title, body, data }).catch((err) =>
    console.warn('Push delivery error:', err.message)
  );

  return notification;
};
