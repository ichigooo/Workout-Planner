import { estimate1RM, estimateWeightForReps, buildDisplayPRs } from "../epley";

describe("estimate1RM", () => {
  it("returns weight directly for 1 rep", () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it("calculates correctly for 5 reps at 80 lbs", () => {
    // 80 * (1 + 5/30) = 80 * 1.1667 ≈ 93.33
    expect(estimate1RM(80, 5)).toBeCloseTo(93.33, 1);
  });

  it("calculates correctly for 3 reps at 88 lbs", () => {
    // 88 * (1 + 3/30) = 88 * 1.1 = 96.8
    expect(estimate1RM(88, 3)).toBeCloseTo(96.8, 1);
  });
});

describe("estimateWeightForReps", () => {
  it("returns 1RM directly for 1 rep", () => {
    expect(estimateWeightForReps(100, 1)).toBe(100);
  });

  it("estimates 5RM from 95 lb 1RM", () => {
    // 95 / (1 + 5/30) = 95 / 1.1667 ≈ 81.43
    expect(estimateWeightForReps(95, 5)).toBeCloseTo(81.43, 0);
  });

  it("estimates 8RM from 95 lb 1RM", () => {
    // 95 / (1 + 8/30) = 95 / 1.2667 ≈ 75.0
    expect(estimateWeightForReps(95, 8)).toBeCloseTo(75.0, 0);
  });
});

describe("buildDisplayPRs", () => {
  it("returns zero-weight non-estimate entries when no actual PRs exist", () => {
    const result = buildDisplayPRs([], [1, 5, 8]);
    expect(result).toHaveLength(3);
    result.forEach((r) => {
      expect(r.weight).toBe(0);
      expect(r.isEstimate).toBe(false);
    });
  });

  it("preserves actual PRs and fills estimates for missing rep counts", () => {
    const actual = [
      { reps: 5, weight: 80, dateAchieved: "2026-01-01", entryId: "abc" },
    ];
    const result = buildDisplayPRs(actual, [1, 5, 8]);

    // 5RM should be actual
    const fiveRM = result.find((r) => r.reps === 5)!;
    expect(fiveRM.isEstimate).toBe(false);
    expect(fiveRM.weight).toBe(80);
    expect(fiveRM.dateAchieved).toBe("2026-01-01");
    expect(fiveRM.entryId).toBe("abc");

    // 1RM should be estimate: 80 * (1 + 5/30) ≈ 93.33 → 93
    const oneRM = result.find((r) => r.reps === 1)!;
    expect(oneRM.isEstimate).toBe(true);
    expect(oneRM.weight).toBe(93);
    expect(oneRM.dateAchieved).toBeUndefined();

    // 8RM should be estimate: 93.33 / (1 + 8/30) ≈ 73.68 → 74
    const eightRM = result.find((r) => r.reps === 8)!;
    expect(eightRM.isEstimate).toBe(true);
    expect(eightRM.weight).toBe(74);
  });

  it("uses highest derived 1RM when multiple actuals exist", () => {
    const actuals = [
      { reps: 5, weight: 80, dateAchieved: "2026-01-01", entryId: "a" },
      { reps: 3, weight: 88, dateAchieved: "2026-01-10", entryId: "b" },
    ];
    // 5RM: 80*(1+5/30) = 93.33
    // 3RM: 88*(1+3/30) = 96.8
    // Max = 96.8
    const result = buildDisplayPRs(actuals, [1, 3, 5, 8]);

    const oneRM = result.find((r) => r.reps === 1)!;
    expect(oneRM.isEstimate).toBe(true);
    expect(oneRM.weight).toBe(97); // Math.round(96.8)

    // Actuals should be preserved
    expect(result.find((r) => r.reps === 3)!.isEstimate).toBe(false);
    expect(result.find((r) => r.reps === 5)!.isEstimate).toBe(false);
  });

  it("returns all actuals with no estimates when all rep counts are covered", () => {
    const actuals = [
      { reps: 1, weight: 100, dateAchieved: "2026-01-01", entryId: "a" },
      { reps: 5, weight: 85, dateAchieved: "2026-01-05", entryId: "b" },
    ];
    const result = buildDisplayPRs(actuals, [1, 5]);
    result.forEach((r) => expect(r.isEstimate).toBe(false));
  });
});
