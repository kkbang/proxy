import { ExpandableCodeBlock } from "../../../components/ExpandableCodeBlock";
import { formatRiskLabel } from "../../../lib/risk";
import { validateGitHubRepoUrl } from "../repoUrl";
import type { ReviewCandidate } from "../types";

interface CandidateCardProps {
  candidate: ReviewCandidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const candidateRepoUrlValidation = validateGitHubRepoUrl(candidate.repository.repo_url);

  return (
    <article className="candidate-card">
      <header className="card-header">
        <div>
          <p className="eyebrow">Candidate match</p>
          <h4>
            {candidateRepoUrlValidation.isValid ? (
              <a
                href={candidateRepoUrlValidation.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {candidateRepoUrlValidation.normalizedUrl}
              </a>
            ) : (
              <span className="unsafe-link-text">{candidate.repository.repo_url}</span>
            )}
          </h4>
          {!candidateRepoUrlValidation.isValid ? (
            <p className="unsafe-link-note">
              Link disabled because the backend returned an unverified repository URL.
            </p>
          ) : null}
        </div>
        <div className={`risk-badge risk-badge--${candidate.risk.level}`}>
          <span>{formatRiskLabel(candidate.risk.level)}</span>
          <strong>{candidate.risk.score.toFixed(2)}</strong>
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
          <dd>{candidate.location.file_path}</dd>
        </div>
        <div>
          <dt>Symbol</dt>
          <dd>{candidate.location.symbol_name ?? "Unknown symbol"}</dd>
        </div>
        <div>
          <dt>Strongest evidence</dt>
          <dd>{candidate.match_signal ?? "Unspecified"}</dd>
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
        code={candidate.matched_chunk.raw_code}
        label="Matched code snippet"
        previewLines={8}
      />

      {candidate.why?.length ? (
        <div className="reason-list">
          <h5>Why this was flagged</h5>
          <ul>
            {candidate.why.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
