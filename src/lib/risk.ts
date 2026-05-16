import type { ReviewCandidate, ReviewFinding, RiskLevel } from "../features/review/types";

const RISK_PRIORITY: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function getRiskPriority(level: RiskLevel) {
  return RISK_PRIORITY[level] ?? 0;
}

export function sortFindingsByRisk(findings: ReviewFinding[]) {
  return [...findings].sort((left, right) => {
    const levelDelta =
      getRiskPriority(right.top_risk.level) - getRiskPriority(left.top_risk.level);

    if (levelDelta !== 0) {
      return levelDelta;
    }

    return right.top_risk.score - left.top_risk.score;
  });
}

export function sortCandidatesByRisk(candidates: ReviewCandidate[]) {
  return [...candidates].sort((left, right) => {
    const levelDelta =
      getRiskPriority(right.risk.level) - getRiskPriority(left.risk.level);

    if (levelDelta !== 0) {
      return levelDelta;
    }

    return right.risk.score - left.risk.score;
  });
}

export function formatRiskLabel(level: RiskLevel) {
  return String(level).replace(/_/g, " ");
}
