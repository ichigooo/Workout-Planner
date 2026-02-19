import { CurrentPR } from "../types";

/**
 * Epley's formula for estimating 1RM and projecting weights.
 *
 * 1RM = weight × (1 + reps / 30)
 * weight = 1RM / (1 + targetReps / 30)
 */

export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function estimateWeightForReps(
  oneRepMax: number,
  targetReps: number
): number {
  if (targetReps === 1) return oneRepMax;
  return oneRepMax / (1 + targetReps / 30);
}

export interface DisplayPR {
  reps: number;
  weight: number;
  dateAchieved?: string;
  entryId?: string;
  isEstimate: boolean;
}

/**
 * Merges actual PRs with Epley estimates for missing rep counts.
 *
 * - Actual records are preserved as-is (isEstimate: false)
 * - Missing rep counts filled with rounded estimates (isEstimate: true)
 * - Uses the highest derived 1RM across all actuals as the source
 * - Returns zero-weight entries if no actual PRs exist
 */
export function buildDisplayPRs(
  actualPRs: CurrentPR[],
  repCounts: number[]
): DisplayPR[] {
  if (actualPRs.length === 0) {
    return repCounts.map((reps) => ({
      reps,
      weight: 0,
      isEstimate: false,
    }));
  }

  const estimated1RM = Math.max(
    ...actualPRs.map((pr) => estimate1RM(pr.weight, pr.reps))
  );

  return repCounts.map((reps) => {
    const actual = actualPRs.find((pr) => pr.reps === reps);
    if (actual) {
      return {
        reps: actual.reps,
        weight: actual.weight,
        dateAchieved: actual.dateAchieved,
        entryId: actual.entryId,
        isEstimate: false,
      };
    }

    return {
      reps,
      weight: Math.round(estimateWeightForReps(estimated1RM, reps)),
      isEstimate: true,
    };
  });
}
