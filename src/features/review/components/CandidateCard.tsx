import { ExpandableCodeBlock } from "../../../components/ExpandableCodeBlock";
import { formatRiskLabel } from "../../../lib/risk";
import { validateGitHubRepoUrl } from "../repoUrl";
import type { ReviewCandidate } from "../types";

interface CandidateCardProps {
  candidate: ReviewCandidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const candidateRepoUrl = candidate.repository.repo_url;
  const candidateRepoUrlValidation = candidateRepoUrl
    ? validateGitHubRepoUrl(candidateRepoUrl)
    : null;
  const priorityLevel = candidate.review_priority.level;
  const priorityScore = candidate.review_priority.score ?? 0;
  const matchedCode = candidate.matched_chunk.raw_code ?? "No matched code snippet returned.";

  return (
    <article className="candidate-card">
      <header className="card-header">
        <div>
          <p className="eyebrow">Candidate match</p>
          <h4>
            {candidateRepoUrlValidation?.isValid ? (
              <a
                href={candidateRepoUrlValidation.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {candidateRepoUrlValidation.normalizedUrl}
              </a>
            ) : candidate.repository.repo_url ? (
              <span className="unsafe-link-text">{candidate.repository.repo_url}</span>
            ) : (
              <span className="unsafe-link-text">Unknown repository URL</span>
            )}
          </h4>
          {candidate.repository.repo_url && !candidateRepoUrlValidation?.isValid ? (
            <p className="unsafe-link-note">
              Link disabled because the backend returned an unverified repository URL.
            </p>
          ) : null}
        </div>
        <div className={`risk-badge risk-badge--${priorityLevel ?? "unknown"}`}>
          <span>{formatRiskLabel(priorityLevel)}</span>
          <strong>{priorityScore.toFixed(2)}</strong>
        </div>
      </header>

      <dl className="detail-grid">
        <div>
          <dt>License</dt>
          <dd>
            {candidate.repository.license_spdx ?? "Unknown SPDX"}
            {candidate.repository.license_name ? ` · ${candidate.repository.license_name}` : ""}
          </dd>
        </div>
        <div>
          <dt>File</dt>
          <dd>{candidate.location.file_path ?? "Unknown file path"}</dd>
        </div>
        <div>
          <dt>Symbol</dt>
          <dd>{candidate.location.symbol_name ?? "Unknown symbol"}</dd>
        </div>
        <div>
          <dt>Strongest evidence</dt>
          <dd>{candidate.primary_match_signal ?? "Unspecified"}</dd>
        </div>
      </dl>

      {candidate.matched_by?.length ? (
        <div className="pill-row">
          {candidate.matched_by.map((signal) => (
            <span key={signal} className="pill">
              {signal}
            </span>
          ))}
        </div>
      ) : null}

      <ExpandableCodeBlock
        code={matchedCode}
        label="Matched code snippet"
        previewLines={8}
        defaultExpanded
        toggleMode="show-hide"
      />

      {candidate.review_reasons.length ? (
        <div className="reason-list">
          <h5>Why this was flagged</h5>
          <ul>
            {candidate.review_reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
