import { jest } from '@jest/globals';

// Mock web-push so the service doesn't need real VAPID keys
jest.mock('web-push', () => ({
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn().mockResolvedValue({}),
  },
}));

describe('notificationService', () => {
  let sendNotification, isNotificationEnabled, computeEndpointHash, getNotificationUrl;
  let supabase;

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    const supa = await import('../../config/supabaseClient.js');
    supabase = supa.supabase;

    const svc = await import('../notificationService.js');
    sendNotification = svc.sendNotification;
    isNotificationEnabled = svc.isNotificationEnabled;
    computeEndpointHash = svc.computeEndpointHash;
    getNotificationUrl = svc.getNotificationUrl;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computeEndpointHash', () => {
    it('produces a 64-char hex hash from a subscription object', () => {
      const hash = computeEndpointHash({ endpoint: 'https://push.example.com/abc' });
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it('produces the same hash for the same endpoint', () => {
      const a = computeEndpointHash({ endpoint: 'https://push.example.com/abc' });
      const b = computeEndpointHash({ endpoint: 'https://push.example.com/abc' });
      expect(a).toBe(b);
    });

    it('produces different hashes for different endpoints', () => {
      const a = computeEndpointHash({ endpoint: 'https://push.example.com/abc' });
      const b = computeEndpointHash({ endpoint: 'https://push.example.com/xyz' });
      expect(a).not.toBe(b);
    });
  });

  describe('getNotificationUrl', () => {
    it('returns /achievements for achievement_unlocked', () => {
      expect(getNotificationUrl('achievement_unlocked')).toBe('/achievements');
    });

    it('returns /dashboard for level_up', () => {
      expect(getNotificationUrl('level_up')).toBe('/dashboard');
    });

    it('returns /dashboard for streak types', () => {
      expect(getNotificationUrl('streak_milestone')).toBe('/dashboard');
      expect(getNotificationUrl('streak_shield')).toBe('/dashboard');
      expect(getNotificationUrl('streak_warning')).toBe('/dashboard');
    });

    it('returns /leaderboard for new_follower', () => {
      expect(getNotificationUrl('new_follower')).toBe('/leaderboard');
    });

    it('returns /progress for goal_completed', () => {
      expect(getNotificationUrl('goal_completed')).toBe('/progress');
    });

    it('returns /dashboard for unknown types', () => {
      expect(getNotificationUrl('unknown_type')).toBe('/dashboard');
    });
  });

  describe('isNotificationEnabled', () => {
    it('returns true for new_follower (always enabled)', async () => {
      const result = await isNotificationEnabled('user-1', 'new_follower');
      expect(result).toBe(true);
    });

    it('returns true for unknown notification types', async () => {
      const result = await isNotificationEnabled('user-1', 'some_unknown_type');
      expect(result).toBe(true);
    });

    it('returns true when no settings row exists (defaults enabled)', async () => {
      // supabase mock returns null by default for .single()
      const result = await isNotificationEnabled('user-1', 'achievement_unlocked');
      expect(result).toBe(true);
    });
  });

  describe('sendNotification', () => {
    it('inserts a notification into the database', async () => {
      await sendNotification('user-1', {
        type: 'achievement_unlocked',
        title: 'First Steps',
        body: 'You uploaded your first book!',
        icon: 'emoji_events',
        data: { achievement_id: 'first_book' },
      });

      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('queries user preferences before inserting', async () => {
      await sendNotification('user-1', {
        type: 'challenge_completed',
        title: 'Challenge Done',
        body: 'You completed a challenge!',
      });

      // from() called for user_settings (preference check) + notifications (insert)
      const calls = supabase.from.mock.calls.map(c => c[0]);
      expect(calls).toContain('user_settings');
      expect(calls).toContain('notifications');
    });
  });
});
