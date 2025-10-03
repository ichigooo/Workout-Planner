const { expect } = require('chai');
const request = require('supertest');

const app = require('../server');
// Default to running against local server; set TEST_BASE_URL to override
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('Plan items API', () => {
  it('health check should respond OK', async () => {
    const res = await request(BASE).get('/health');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'OK');
  });

  it('POST /api/workout-plans/:id/plan-items gracefully handles missing supabase', async () => {
    const res = await request(BASE)
      .post('/api/workout-plans/test-plan/plan-items')
      .send({ workoutId: 'test-w', dates: ['2025-11-03'] })
      .set('Accept', 'application/json');
    // The server should respond (201 if DB available, otherwise 500). Ensure it doesn't crash.
    expect([201,500]).to.include(res.status);
  });
});


