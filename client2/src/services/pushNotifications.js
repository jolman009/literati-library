// src/services/pushNotifications.js
// Web Push registration service (Phase 2)
import API from '../config/api';

/**
 * Fetch VAPID public key from the server.
 * Returns null if push is not configured server-side.
 */
async function getVapidKey() {
  try {
    const { data } = await API.get('/api/notifications/vapid-public-key');
    return data?.publicKey || null;
  } catch {
    return null;
  }
}

/**
 * Convert a base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

/**
 * Register for web push notifications.
 * Returns the PushSubscription or null if unavailable/denied.
 */
export async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const vapidKey = await getVapidKey();
  if (!vapidKey) return null;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  // Send subscription to server for storage
  await API.post('/api/notifications/push-subscription', { subscription: subscription.toJSON() });
  return subscription;
}

/**
 * Unregister from web push notifications.
 */
export async function unregisterWebPush() {
  if (!('serviceWorker' in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;

  // Notify server
  await API.delete('/api/notifications/push-subscription', {
    data: { subscription: subscription.toJSON() },
  });

  await subscription.unsubscribe();
}

/**
 * Check if the user is currently subscribed to web push.
 */
export async function isWebPushSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
