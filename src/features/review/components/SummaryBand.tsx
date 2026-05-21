import { formatRiskLabel } from "../../../lib/risk";
import type { ReviewResponse, RiskLevel } from "../types";

interface SummaryBandProps {
  response: ReviewResponse;
}

const SUMMARY_LEVELS: RiskLevel[] = ["critical", "high", "medium"];

export function SummaryBand({ response }: SummaryBandProps) {
  return (
    <section className="summary-band">
      <div className="summary-band__header">
        <div>
          <p className="eyebrow">Run summary</p>
          <h2>{response.repo_url}</h2>
        </div>
        <div className="summary-meta">
          <span>{response.analyzed_source_count} source chunks analyzed</span>
          <span>Backend response</span>
        </div>
      </div>

      <div className="summary-grid">
        {SUMMARY_LEVELS.map((level) => (
          <article key={level} className={`summary-card summary-card--${level}`}>
            <span className="summary-card__label">{formatRiskLabel(level)}</span>
            <strong>{response.summary[level] as number}</strong>
          </article>
        ))}

        <article className="summary-card summary-card--neutral">
          <span className="summary-card__label">Sources with findings</span>
          <strong>{response.summary.sources_with_findings}</strong>
        </article>
      </div>

      {typeof response.summary.suppressed_low_risk === "number" ? (
        <p className="summary-note">
          {response.summary.suppressed_low_risk} low-risk candidates suppressed from the main list.
        </p>
      ) : null}

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
