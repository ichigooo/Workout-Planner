# Testing Guidelines

> **IMPORTANT**: Tests MUST be written after implementing new features.

---

## Overview

Testing is a critical part of the development workflow. After implementing a feature:

1. Write unit tests for business logic
2. Write integration tests for API endpoints
3. Write component tests for critical UI

---

## Test Locations

```
mobile/
├── src/
│   ├── components/
│   │   └── plan/
│   │       └── __tests__/           # Component tests
│   └── services/
│       └── __tests__/               # Service tests

backend/
└── test/                            # API tests
    └── *.test.js
```

---

## Mobile Testing

### Test Setup

```typescript
// File: mobile/src/components/__tests__/WorkoutCard.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { WorkoutCard } from "../WorkoutCard";

const mockWorkout = {
    id: "1",
    title: "Test Workout",
    category: "Legs",
    description: "Test description",
    workoutType: "strength",
    sets: 3,
    reps: 10,
    intensity: "weight",
    isGlobal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
```

### Component Tests

```typescript
describe("WorkoutCard", () => {
    it("renders workout title", () => {
        const { getByText } = render(
            <WorkoutCard workout={mockWorkout} onPress={jest.fn()} />
        );

        expect(getByText("Test Workout")).toBeTruthy();
    });

    it("renders category badge", () => {
        const { getByText } = render(
            <WorkoutCard workout={mockWorkout} onPress={jest.fn()} />
        );

        expect(getByText("LEGS")).toBeTruthy();
    });

    it("calls onPress when tapped", () => {
        const mockOnPress = jest.fn();
        const { getByTestId } = render(
            <WorkoutCard
                workout={mockWorkout}
                onPress={mockOnPress}
                testID="workout-card"
            />
        );

        fireEvent.press(getByTestId("workout-card"));
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it("shows sets and reps for strength workouts", () => {
        const { getByText } = render(
            <WorkoutCard workout={mockWorkout} onPress={jest.fn()} />
        );

        expect(getByText("3 sets × 10 reps")).toBeTruthy();
    });

    it("shows duration for cardio workouts", () => {
        const cardioWorkout = {
            ...mockWorkout,
            workoutType: "cardio",
            duration: 30,
            sets: undefined,
            reps: undefined,
        };

        const { getByText } = render(
            <WorkoutCard workout={cardioWorkout} onPress={jest.fn()} />
        );

        expect(getByText("30 min")).toBeTruthy();
    });
});
```

### Service Tests

```typescript
// File: mobile/src/services/__tests__/planItemsCache.test.ts
import { planItemsCache } from "../planItemsCache";
import { apiService } from "../api";

jest.mock("../api");

describe("PlanItemsCache", () => {
    beforeEach(() => {
        planItemsCache.invalidate();
        jest.clearAllMocks();
    });

    it("fetches data on first call", async () => {
        const mockItems = [{ id: "1" }];
        (apiService.getPlanItemsSorted as jest.Mock).mockResolvedValue(mockItems);

        const result = await planItemsCache.getCachedItems();

        expect(apiService.getPlanItemsSorted).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockItems);
    });

    it("returns cached data on subsequent calls", async () => {
        const mockItems = [{ id: "1" }];
        (apiService.getPlanItemsSorted as jest.Mock).mockResolvedValue(mockItems);

        await planItemsCache.getCachedItems();
        await planItemsCache.getCachedItems();

        expect(apiService.getPlanItemsSorted).toHaveBeenCalledTimes(1);
    });

    it("refetches after invalidation", async () => {
        const mockItems = [{ id: "1" }];
        (apiService.getPlanItemsSorted as jest.Mock).mockResolvedValue(mockItems);

        await planItemsCache.getCachedItems();
        planItemsCache.invalidate();
        await planItemsCache.getCachedItems();

        expect(apiService.getPlanItemsSorted).toHaveBeenCalledTimes(2);
    });
});
```

### Running Mobile Tests

```bash
cd mobile
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- WorkoutCard     # Run specific test file
npm test -- --coverage      # Generate coverage report
```

---

## Backend Testing

### Test Setup (Mocha)

```javascript
// File: backend/test/workouts.test.js
const { expect } = require("chai");
const request = require("supertest");
const app = require("../server");

describe("Workouts API", () => {
    // Test data
    const testWorkout = {
        title: "Test Workout",
        category: "Legs",
        workoutType: "strength",
        intensity: "weight",
        sets: 3,
        reps: 10,
    };

    let createdWorkoutId;

    // Cleanup after tests
    after(async () => {
        if (createdWorkoutId) {
            await request(app).delete(`/api/workouts/${createdWorkoutId}`);
        }
    });
});
```

### API Tests

```javascript
describe("POST /api/workouts", () => {
    it("creates a new workout", async () => {
        const res = await request(app)
            .post("/api/workouts")
            .send(testWorkout)
            .expect(201);

        expect(res.body).to.have.property("id");
        expect(res.body.title).to.equal(testWorkout.title);
        expect(res.body.category).to.equal(testWorkout.category);

        createdWorkoutId = res.body.id;
    });

    it("returns 400 for missing required fields", async () => {
        const res = await request(app)
            .post("/api/workouts")
            .send({ title: "Missing category" })
            .expect(400);

        expect(res.body).to.have.property("error");
    });
});

describe("GET /api/workouts", () => {
    it("returns list of workouts", async () => {
        const res = await request(app)
            .get("/api/workouts")
            .expect(200);

        expect(res.body).to.be.an("array");
    });
});

describe("GET /api/workouts/:id", () => {
    it("returns a single workout", async () => {
        const res = await request(app)
            .get(`/api/workouts/${createdWorkoutId}`)
            .expect(200);

        expect(res.body.id).to.equal(createdWorkoutId);
    });

    it("returns 404 for non-existent workout", async () => {
        await request(app)
            .get("/api/workouts/non-existent-id")
            .expect(404);
    });
});

describe("PUT /api/workouts/:id", () => {
    it("updates a workout", async () => {
        const res = await request(app)
            .put(`/api/workouts/${createdWorkoutId}`)
            .send({ title: "Updated Title" })
            .expect(200);

        expect(res.body.title).to.equal("Updated Title");
    });
});

describe("DELETE /api/workouts/:id", () => {
    it("deletes a workout", async () => {
        await request(app)
            .delete(`/api/workouts/${createdWorkoutId}`)
            .expect(204);

        createdWorkoutId = null;
    });
});
```

### Running Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm test -- --grep "POST"   # Run tests matching pattern
```

---

## What to Test

### Must Test

| Area | Examples |
|------|----------|
| Business logic | Frequency expansion, date calculations |
| API endpoints | CRUD operations, error responses |
| Data validation | Required fields, format validation |
| Edge cases | Empty data, null values, boundaries |

### Should Test

| Area | Examples |
|------|----------|
| Component rendering | Key elements visible |
| User interactions | Button presses, form submissions |
| Error states | Error messages display |
| Loading states | Spinners show/hide |

### Nice to Test

| Area | Examples |
|------|----------|
| Animations | Transitions complete |
| Accessibility | Screen reader support |
| Performance | Render time, memory |

---

## Test Patterns

### Arrange-Act-Assert

```typescript
it("should add workout to plan", async () => {
    // Arrange
    const workout = createMockWorkout();
    const planId = "plan-123";

    // Act
    const result = await addWorkoutToPlan(planId, workout.id, ["2024-01-15"]);

    // Assert
    expect(result.success).toBe(true);
    expect(result.addedDates).toHaveLength(1);
});
```

### Mock External Dependencies

```typescript
// Mock API service
jest.mock("../services/api", () => ({
    apiService: {
        getWorkouts: jest.fn(),
        createWorkout: jest.fn(),
    },
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));
```

### Test Error Handling

```typescript
it("handles API errors gracefully", async () => {
    (apiService.getWorkouts as jest.Mock).mockRejectedValue(
        new Error("Network error")
    );

    const { getByText } = render(<WorkoutList />);

    await waitFor(() => {
        expect(getByText("Failed to load workouts")).toBeTruthy();
    });
});
```

---

## Test Checklist

After implementing a feature:

- [ ] Write unit tests for new business logic
- [ ] Write API tests for new endpoints
- [ ] Write component tests for new UI
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Run full test suite
- [ ] Check test coverage

---

## DO's and DON'Ts

### DO

```typescript
// DO: Test one thing per test
it("renders title", () => { ... });
it("renders category badge", () => { ... });

// DO: Use descriptive test names
it("should return 404 when workout not found", () => { ... });

// DO: Clean up after tests
afterEach(() => {
    jest.clearAllMocks();
});

// DO: Mock external dependencies
jest.mock("../services/api");
```

### DON'T

```typescript
// DON'T: Test implementation details
it("calls setState with correct value", () => { ... });  // Bad

// DON'T: Have tests depend on each other
it("test 1 creates data", () => { ... });
it("test 2 uses data from test 1", () => { ... });  // Bad

// DON'T: Skip error handling tests
it("handles success case", () => { ... });
// Missing: error case test
```

---

## Continuous Integration

Tests should run automatically on:
- Every pull request
- Before merging to main
- Before deployment

---

## Related Documentation

- [04-adding-server-request.md](./04-adding-server-request.md) - API to test
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Features to test
