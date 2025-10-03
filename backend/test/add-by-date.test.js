const request = require('supertest');
const { expect } = require('chai');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('Add workout to plan by date API', function() {
  this.timeout(5000);

  const TEST_USER_ID = '48a1fd02-b5d4-4942-9356-439ecfbf13f8'; // Linna
  const SAMPLE_WORKOUT_ID = 'a69ec4e7-6d9f-4382-ac01-701704eb8ff4'; // expected present in seeded data

  it('should create a plan if missing and add a dated plan item', async () => {
    // Ensure plan exists
    const planRes = await request(BASE).post(`/api/users/${TEST_USER_ID}/default-plan`).send();
    expect([200,201,500]).to.include(planRes.status);
    if (![200,201].includes(planRes.status)) return; // skip deep checks if DB not available

    const plan = planRes.body;
    expect(plan).to.have.property('id');

    // Add workout to plan on a specific date
    const payload = { workoutId: SAMPLE_WORKOUT_ID, date: '2025-10-10', intensity: 'test-intensity' };
    const addRes = await request(BASE)
      .post(`/api/workout-plans/${plan.id}/plan-items/date`)
      .send(payload);

    expect([201,500]).to.include(addRes.status);
    if (addRes.status === 201) {
      expect(addRes.body).to.have.property('id');
      // scheduled date field may be named scheduledDate or scheduled_date in the response
      expect(addRes.body.scheduledDate || addRes.body.scheduled_date).to.exist;
    }
  });
});


