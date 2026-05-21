import type { ReviewCandidate, ReviewFinding, ReviewPriorityLevel } from "../features/review/types";

const RISK_PRIORITY: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
};

export function getRiskPriority(level?: ReviewPriorityLevel) {
  return level ? (RISK_PRIORITY[level] ?? 0) : 0;
}

export function sortFindingsByRisk(findings: ReviewFinding[]) {
  return [...findings].sort((left, right) => {
    const levelDelta =
      getRiskPriority(right.top_review_priority.level) -
      getRiskPriority(left.top_review_priority.level);

    if (levelDelta !== 0) {
      return levelDelta;
    }

    return (right.top_review_priority.score ?? 0) - (left.top_review_priority.score ?? 0);
  });
}

export function sortCandidatesByRisk(candidates: ReviewCandidate[]) {
  return [...candidates].sort((left, right) => {
    const levelDelta =
      getRiskPriority(right.review_priority.level) - getRiskPriority(left.review_priority.level);

    if (levelDelta !== 0) {
      return levelDelta;
    }

    return (right.review_priority.score ?? 0) - (left.review_priority.score ?? 0);
  });
}

export function formatRiskLabel(level?: ReviewPriorityLevel) {
  return level ? String(level).replace(/_/g, " ") : "unknown";
}
