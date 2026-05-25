import { formatRiskLabel } from "../../../lib/risk";
import type { ReviewPriorityLevel, ReviewResponse } from "../types";

interface SummaryBandProps {
  response: ReviewResponse;
}

const SUMMARY_LEVELS: ReviewPriorityLevel[] = ["critical", "high", "medium"];

function formatSeconds(value: number) {
  return `${value.toFixed(2)}s`;
}

function hasSlowestChunkDetails(response: ReviewResponse) {
  return Object.keys(response.timings.retrieve_hybrid_candidates.slowest_chunk).length > 0;
}

export function SummaryBand({ response }: SummaryBandProps) {
  const slowestChunk = response.timings.retrieve_hybrid_candidates.slowest_chunk;

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

      <div className="timings-panel">
        <div className="timings-panel__header">
          <h3>Request timings</h3>
          <span>Total {formatSeconds(response.timings.total_seconds)}</span>
        </div>

        <div className="timings-grid">
          <article className="timing-card">
            <span className="timing-card__label">Prepare repo</span>
            <strong>{formatSeconds(response.timings.prepare_local_query_repo.total_seconds)}</strong>
          </article>
          <article className="timing-card">
            <span className="timing-card__label">Retrieve candidates</span>
            <strong>{formatSeconds(response.timings.retrieve_hybrid_candidates.total_seconds)}</strong>
          </article>
          <article className="timing-card">
            <span className="timing-card__label">Build payload</span>
            <strong>{formatSeconds(response.timings.build_user_facing_payload.total_seconds)}</strong>
          </article>
          <article className="timing-card">
            <span className="timing-card__label">Average chunk</span>
            <strong>{formatSeconds(response.timings.retrieve_hybrid_candidates.average_chunk_seconds)}</strong>
          </article>
        </div>

        <dl className="timing-detail-grid">
          <div>
            <dt>Snapshot download</dt>
            <dd>{formatSeconds(response.timings.prepare_local_query_repo.download_snapshot_seconds)}</dd>
          </div>
          <div>
            <dt>Chunk source chunks</dt>
            <dd>{formatSeconds(response.timings.prepare_local_query_repo.chunk_source_chunks_seconds)}</dd>
          </div>
          <div>
            <dt>Precompute embeddings</dt>
            <dd>{formatSeconds(response.timings.prepare_local_query_repo.precompute_embeddings_seconds)}</dd>
          </div>
          <div>
            <dt>Retrieved source chunks</dt>
            <dd>{response.timings.retrieve_hybrid_candidates.source_chunk_count}</dd>
          </div>
          <div>
            <dt>Aggregate chunk time</dt>
            <dd>{formatSeconds(response.timings.retrieve_hybrid_candidates.aggregate_chunk_seconds)}</dd>
          </div>
        </dl>

        {hasSlowestChunkDetails(response) ? (
          <div className="slowest-chunk-panel">
            <h4>Slowest chunk</h4>
            <dl className="timing-detail-grid">
              <div>
                <dt>File</dt>
                <dd>{slowestChunk.file_path ?? "Unknown file path"}</dd>
              </div>
              <div>
                <dt>Symbol</dt>
                <dd>{slowestChunk.symbol_name ?? "Unknown symbol"}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatSeconds(slowestChunk.total_seconds ?? 0)}</dd>
              </div>
              <div>
                <dt>Rule-based</dt>
                <dd>{formatSeconds(slowestChunk.rule_based_seconds ?? 0)}</dd>
              </div>
              <div>
                <dt>kNN</dt>
                <dd>{formatSeconds(slowestChunk.knn_seconds ?? 0)}</dd>
              </div>
              <div>
                <dt>Merge</dt>
                <dd>{formatSeconds(slowestChunk.merge_seconds ?? 0)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

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
