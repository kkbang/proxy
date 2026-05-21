import { ExpandableCodeBlock } from "../../../components/ExpandableCodeBlock";
import { formatRiskLabel } from "../../../lib/risk";
import type { ReviewFinding } from "../types";
import { CandidateCard } from "./CandidateCard";

interface FindingCardProps {
  finding: ReviewFinding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const sourceFilePath = finding.source.file_path ?? "Unknown file path";
  const sourceCode = finding.source.raw_code ?? "No source code snippet returned.";
  const topPriorityLevel = finding.top_review_priority.level;
  const topPriorityScore = finding.top_review_priority.score ?? 0;

  return (
    <article className="finding-card">
      <header className="card-header">
        <div>
          <p className="eyebrow">Source chunk</p>
          <h3>{sourceFilePath}</h3>
          <p className="subtle">
            Symbol: {finding.source.symbol_name ?? "Unknown"} · Review candidates:{" "}
            {finding.review_candidate_count}
            {finding.additional_review_candidates
              ? ` + ${finding.additional_review_candidates} additional`
              : ""}
          </p>
        </div>
        <div className={`risk-badge risk-badge--${topPriorityLevel ?? "unknown"}`}>
          <span>{formatRiskLabel(topPriorityLevel)}</span>
          <strong>{topPriorityScore.toFixed(2)}</strong>
        </div>
      </header>

      <ExpandableCodeBlock
        code={sourceCode}
        label="Source code"
        previewLines={10}
        defaultExpanded
      />

      <div className="candidate-list">
        {finding.candidates.map((candidate) => (
          <CandidateCard
            key={`${candidate.repository.repo_url ?? "unknown-repo"}:${candidate.location.file_path ?? "unknown-file"}:${candidate.location.symbol_name ?? "unknown"}`}
            candidate={candidate}
          />
        ))}
      </div>
    </article>
  );
}
