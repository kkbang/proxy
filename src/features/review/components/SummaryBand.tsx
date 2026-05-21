import { formatRiskLabel } from "../../../lib/risk";
import type { ReviewPriorityLevel, ReviewResponse } from "../types";

interface SummaryBandProps {
  response: ReviewResponse;
}

const SUMMARY_LEVELS: ReviewPriorityLevel[] = ["critical", "high", "medium"];

export function SummaryBand({ response }: SummaryBandProps) {
  return (
    <section className="summary-band">
      <div className="summary-band__header">
        <div>
          <p className="eyebrow">Run summary</p>
          <h2>{response.repo_url ?? response.repo_id ?? "Repository review report"}</h2>
        </div>
        <div className="summary-meta">
          <span>{response.analyzed_source_count} source chunks analyzed</span>
          <span>Backend response</span>
        </div>
      </div>

      <p className="summary-note">{response.interpretation.disclaimer}</p>

      <div className="summary-grid">
        {SUMMARY_LEVELS.map((level) => (
          <article key={level} className={`summary-card summary-card--${level}`}>
            <span className="summary-card__label">{formatRiskLabel(level)}</span>
            <strong>{response.summary.review_priority_counts[level]}</strong>
          </article>
        ))}

        <article className="summary-card summary-card--neutral">
          <span className="summary-card__label">Sources with findings</span>
          <strong>{response.summary.sources_with_findings}</strong>
        </article>
      </div>

      <p className="summary-note">
        {response.summary.suppressed_low_priority} low-priority candidates suppressed from the main
        list.
      </p>

      {response.limitations?.length ? (
        <div className="limitations-list">
          <h3>Backend limitations</h3>
          <ul>
            {response.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
