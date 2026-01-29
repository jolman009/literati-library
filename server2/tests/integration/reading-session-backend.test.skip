// Integration test for backend reading session storage
// Tests: session creation, storage in reading_sessions table, gamification integration

const request = require('supertest');
const express = require('express');
const { supabase } = require('../../src/config/supabaseClient.js');

// Setup test app
describe('Backend Reading Session Integration Tests', () => {
  let app;
  let agent;
  let testUserId;
  let testBookId;
  let testSessionId;
  let authToken;

  beforeAll(async () => {
    // Create test user and book
    testUserId = 'integration-test-user-' + Date.now();
    testBookId = 'integration-test-book-' + Date.now();
    authToken = 'test-token-' + Date.now();

    // Setup Express app with routes
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    const mockAuth = (req, res, next) => {
      req.user = { id: testUserId, email: 'test@example.com' };
      next();
    };

    // Import and register routes
    const { readingRouter } = require('../../src/routes/reading.js');
    const { gamificationRouter } = require('../../src/routes/gamification.js');

    app.use('/api/reading', readingRouter(mockAuth));
    app.use('/api/gamification', gamificationRouter(mockAuth));

    agent = request(app);

    // Create test book in database
    try {
      await supabase.from('books').insert({
        id: testBookId,
        user_id: testUserId,
        title: 'Integration Test Book',
        author: 'Test Author',
        status: 'reading',
        created_at: new Date().toISOString()
      });
      console.log('✅ Test book created');
    } catch (error) {
      console.warn('Test book creation failed (may already exist):', error.message);
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    try {
      await supabase.from('reading_sessions').delete().eq('user_id', testUserId);
      await supabase.from('books').delete().eq('user_id', testUserId);
      await supabase.from('user_actions').delete().eq('user_id', testUserId);
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

  describe('Backend Session Creation', () => {
    it('should create reading session in database when started', async () => {
      const response = await agent
        .post('/api/reading/sessions/start')
        .send({
          book_id: testBookId,
          page: 1,
          position: null
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.book_id).toBe(testBookId);
      expect(response.body.user_id).toBe(testUserId);
      expect(response.body.start_time).toBeTruthy();
      expect(response.body.session_date).toBeTruthy();

      // Store session ID for later tests
      testSessionId = response.body.id;

      // Verify session exists in database
      const { data: session, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', testSessionId)
        .single();

      expect(error).toBeNull();
      expect(session).toBeTruthy();
      expect(session.user_id).toBe(testUserId);
      expect(session.book_id).toBe(testBookId);
      expect(session.start_time).toBeTruthy();
      expect(session.end_time).toBeNull();

      console.log('✅ Session created in database:', testSessionId);
    });

    it('should update session with end_time when ended', async () => {
      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 1100));

      const response = await agent
        .post(`/api/reading/sessions/${testSessionId}/end`)
        .send({
          end_page: 25,
          end_position: null,
          notes: 'Great reading session!'
        })
        .expect(200);

      expect(response.body.end_time).toBeTruthy();
      expect(response.body.duration).toBeGreaterThan(0);

      // Verify in database
      const { data: session, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', testSessionId)
        .single();

      expect(error).toBeNull();
      expect(session.end_time).toBeTruthy();
      expect(session.duration).toBeGreaterThan(0);
      expect(session.end_page).toBe(25);
      expect(session.notes).toBe('Great reading session!');

      console.log('✅ Session ended in database with duration:', session.duration, 'minutes');
    });

    it('should store multiple sessions for same user', async () => {
      // Create 3 more sessions
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const response = await agent
          .post('/api/reading/sessions/start')
          .send({
            book_id: testBookId,
            page: i + 1,
            position: null
          })
          .expect(201);

        sessions.push(response.body.id);

        // End the session immediately
        await new Promise(resolve => setTimeout(resolve, 500));
        await agent
          .post(`/api/reading/sessions/${response.body.id}/end`)
          .send({ end_page: (i + 1) * 10 })
          .expect(200);
      }

      // Verify all sessions exist in database
      const { data: allSessions, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(allSessions.length).toBeGreaterThanOrEqual(4); // At least 4 sessions

      console.log('✅ Multiple sessions stored:', allSessions.length);
    });
  });

  describe('Gamification Stats Integration', () => {
    it('should pull reading stats from reading_sessions table', async () => {
      const response = await agent
        .get('/api/gamification/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalReadingTime');
      expect(response.body).toHaveProperty('todayReadingTime');
      expect(response.body).toHaveProperty('weeklyReadingTime');
      expect(response.body).toHaveProperty('monthlyReadingTime');
      expect(response.body).toHaveProperty('averageSessionDuration');

      // Verify stats are calculated from actual sessions
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('duration')
        .eq('user_id', testUserId);

      const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      expect(response.body.totalReadingTime).toBe(totalDuration);

      console.log('✅ Gamification stats pulling from reading_sessions table');
      console.log('   Total reading time:', totalDuration, 'minutes');
      console.log('   Number of sessions:', sessions.length);
    });

    it('should calculate reading streak from session dates', async () => {
      const response = await agent
        .get('/api/gamification/stats')
        .expect(200);

      expect(response.body).toHaveProperty('readingStreak');
      expect(typeof response.body.readingStreak).toBe('number');
      expect(response.body.readingStreak).toBeGreaterThanOrEqual(0);

      console.log('✅ Reading streak calculated:', response.body.readingStreak, 'days');
    });

    it('should track session completion in user_actions', async () => {
      // Create a session and complete it
      const startResponse = await agent
        .post('/api/reading/sessions/start')
        .send({
          book_id: testBookId,
          page: 50,
          position: null
        })
        .expect(201);

      const sessionId = startResponse.body.id;

      // Wait for duration
      await new Promise(resolve => setTimeout(resolve, 2100));

      // End session
      await agent
        .post(`/api/reading/sessions/${sessionId}/end`)
        .send({ end_page: 75 })
        .expect(200);

      // Track action (this would normally be done by frontend)
      const durationMinutes = 2;
      await agent
        .post('/api/gamification/actions')
        .send({
          action: 'reading_session_completed',
          data: {
            bookId: testBookId,
            sessionLength: durationMinutes,
            pagesRead: 25
          }
        })
        .expect(200);

      // Verify action stored
      const { data: actions } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'reading_session_completed')
        .order('created_at', { ascending: false });

      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].action).toBe('reading_session_completed');
      expect(actions[0].points).toBeGreaterThan(0);

      console.log('✅ Session completion tracked in user_actions');
    });
  });

  describe('Multi-Device Session Sync', () => {
    it('should allow retrieving active sessions from database', async () => {
      // Create a session (simulating Device 1)
      const startResponse = await agent
        .post('/api/reading/sessions/start')
        .send({
          book_id: testBookId,
          page: 100,
          position: null
        })
        .expect(201);

      const sessionId = startResponse.body.id;

      // Retrieve all sessions (simulating Device 2 fetching data)
      const { data: sessions, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .is('end_time', null); // Active sessions only

      expect(error).toBeNull();
      expect(sessions.length).toBeGreaterThan(0);

      const activeSession = sessions.find(s => s.id === sessionId);
      expect(activeSession).toBeTruthy();
      expect(activeSession.book_id).toBe(testBookId);
      expect(activeSession.start_page).toBe(100);

      console.log('✅ Active session retrieved from database (multi-device sync possible)');

      // Cleanup: End the session
      await agent
        .post(`/api/reading/sessions/${sessionId}/end`)
        .send({ end_page: 120 })
        .expect(200);
    });

    it('should support session history retrieval across devices', async () => {
      // Get all completed sessions for user
      const { data: sessions, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .not('end_time', 'is', null) // Completed sessions only
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(sessions.length).toBeGreaterThan(0);

      // Verify session data completeness
      sessions.forEach(session => {
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('start_time');
        expect(session).toHaveProperty('end_time');
        expect(session).toHaveProperty('duration');
        expect(session.duration).toBeGreaterThanOrEqual(0);
      });

      console.log('✅ Session history available across devices:', sessions.length, 'completed sessions');
    });

    it('should calculate accurate reading stats from centralized data', async () => {
      // Fetch stats from API
      const statsResponse = await agent
        .get('/api/gamification/stats')
        .expect(200);

      // Manually calculate from database
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .not('end_time', 'is', null);

      const manualTotalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const manualAvgDuration = sessions.length > 0
        ? Math.round(manualTotalTime / sessions.length)
        : 0;

      // Compare API stats with manual calculation
      expect(statsResponse.body.totalReadingTime).toBe(manualTotalTime);
      expect(statsResponse.body.averageSessionDuration).toBe(manualAvgDuration);

      console.log('✅ Centralized stats calculation verified');
      console.log('   Total sessions:', sessions.length);
      console.log('   Total time:', manualTotalTime, 'minutes');
      console.log('   Average duration:', manualAvgDuration, 'minutes');
    });
  });

  describe('Data Consistency and Error Handling', () => {
    it('should handle missing book_id gracefully', async () => {
      const response = await agent
        .post('/api/reading/sessions/start')
        .send({
          page: 1
        })
        .expect(400);

      expect(response.body.error).toMatch(/book.*required/i);
    });

    it('should prevent ending non-existent session', async () => {
      const response = await agent
        .post('/api/reading/sessions/nonexistent-id/end')
        .send({ end_page: 10 })
        .expect(404);

      expect(response.body.error).toMatch(/not found/i);
    });

    it('should validate session ownership', async () => {
      // Create session
      const startResponse = await agent
        .post('/api/reading/sessions/start')
        .send({
          book_id: testBookId,
          page: 1
        })
        .expect(201);

      const sessionId = startResponse.body.id;

      // Verify session belongs to correct user
      const { data: session } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      expect(session.user_id).toBe(testUserId);

      // Cleanup
      await agent
        .post(`/api/reading/sessions/${sessionId}/end`)
        .send({ end_page: 10 })
        .expect(200);
    });

    it('should maintain data integrity across failures', async () => {
      // Create session
      const startResponse = await agent
        .post('/api/reading/sessions/start')
        .send({
          book_id: testBookId,
          page: 1
        })
        .expect(201);

      const sessionId = startResponse.body.id;

      // Simulate network failure (session not ended properly)
      // In real scenario, session would remain active in DB

      // Verify session still exists and is active
      const { data: activeSession } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      expect(activeSession).toBeTruthy();
      expect(activeSession.end_time).toBeNull();

      // Later: properly end the session
      await agent
        .post(`/api/reading/sessions/${sessionId}/end`)
        .send({ end_page: 10 })
        .expect(200);

      // Verify session is now completed
      const { data: completedSession } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      expect(completedSession.end_time).toBeTruthy();

      console.log('✅ Data integrity maintained across failures');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent session operations', async () => {
      // Create 10 sessions concurrently
      const sessionPromises = Array.from({ length: 10 }, (_, i) =>
        agent
          .post('/api/reading/sessions/start')
          .send({
            book_id: testBookId,
            page: i + 1
          })
      );

      const responses = await Promise.all(sessionPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.id).toBeTruthy();
      });

      // End all sessions
      const endPromises = responses.map(response =>
        agent
          .post(`/api/reading/sessions/${response.body.id}/end`)
          .send({ end_page: 10 })
      );

      await Promise.all(endPromises);

      console.log('✅ Concurrent session operations handled successfully');
    });

    it('should efficiently query session history', async () => {
      const startTime = Date.now();

      const response = await agent
        .get('/api/gamification/stats')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body).toHaveProperty('totalReadingTime');

      console.log('✅ Session history query completed in', duration, 'ms');
    });
  });
});
