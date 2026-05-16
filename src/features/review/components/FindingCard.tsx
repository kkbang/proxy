import { ExpandableCodeBlock } from "../../../components/ExpandableCodeBlock";
import { formatRiskLabel } from "../../../lib/risk";
import type { ReviewFinding } from "../types";
import { CandidateCard } from "./CandidateCard";

interface FindingCardProps {
  finding: ReviewFinding;
}

export function FindingCard({ finding }: FindingCardProps) {
  return (
    <article className="finding-card">
      <header className="card-header">
        <div>
          <p className="eyebrow">Source chunk</p>
          <h3>{finding.source.file_path}</h3>
          <p className="subtle">
            Symbol: {finding.source.symbol_name ?? "Unknown"} · Review candidates:{" "}
            {finding.review_candidate_count ?? finding.candidates.length}
            {finding.additional_review_candidates
              ? ` + ${finding.additional_review_candidates} additional`
              : ""}
          </p>
        </div>
        <div className={`risk-badge risk-badge--${finding.top_risk.level}`}>
          <span>{formatRiskLabel(finding.top_risk.level)}</span>
          <strong>{finding.top_risk.score.toFixed(2)}</strong>
        </div>
      </header>

      <ExpandableCodeBlock
        code={finding.source.raw_code}
        label="Source code"
        previewLines={10}
        defaultExpanded
      />

      <div className="candidate-list">
        {finding.candidates.map((candidate) => (
          <CandidateCard
            key={`${candidate.repository.repo_url}:${candidate.location.file_path}:${candidate.location.symbol_name ?? "unknown"}`}
            candidate={candidate}
          />
        ))}
      </div>
    </article>
  );
}
