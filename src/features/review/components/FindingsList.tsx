import { useEffect, useMemo, useState } from "react";
import { formatRiskLabel } from "../../../lib/risk";
import type { ReviewFinding } from "../types";
import { FindingCard } from "./FindingCard";

interface FindingsListProps {
  findings: ReviewFinding[];
}

function getFindingKey(finding: ReviewFinding) {
  return `${finding.source.file_path ?? "unknown-file"}:${finding.source.symbol_name ?? "unknown"}`;
}

export function FindingsList({ findings }: FindingsListProps) {
  const [selectedKey, setSelectedKey] = useState(() => getFindingKey(findings[0]));

  useEffect(() => {
    const hasSelectedFinding = findings.some((finding) => getFindingKey(finding) === selectedKey);

    if (!hasSelectedFinding && findings.length > 0) {
      setSelectedKey(getFindingKey(findings[0]));
    }
  }, [findings, selectedKey]);

  const selectedFinding = useMemo(
    () => findings.find((finding) => getFindingKey(finding) === selectedKey) ?? findings[0],
    [findings, selectedKey],
  );

  const selectedIndex = selectedFinding
    ? findings.findIndex((finding) => getFindingKey(finding) === getFindingKey(selectedFinding))
    : -1;

  return (
    <section className="findings-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Findings</p>
          <h2>Review candidates grouped by source chunk</h2>
        </div>
        <span>{findings.length} source chunks flagged</span>
      </div>

      <div className="findings-workspace">
        <aside className="findings-nav-panel">
          <div className="findings-nav-panel__header">
            <h3>Chunk navigator</h3>
            <p>Select one chunk to inspect full code and candidate matches.</p>
          </div>

          <div className="findings-nav" role="list" aria-label="Flagged source chunks">
            {findings.map((finding, index) => {
              const findingKey = getFindingKey(finding);
              const isActive = findingKey === getFindingKey(selectedFinding);

              return (
                <button
                  key={findingKey}
                  type="button"
                  className={`finding-nav-item${isActive ? " finding-nav-item--active" : ""}`}
                  aria-pressed={isActive}
                  onClick={() => setSelectedKey(findingKey)}
                >
                  <div className="finding-nav-item__row">
                    <span className="finding-nav-item__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`risk-chip risk-chip--${finding.top_review_priority.level ?? "unknown"}`}>
                      {formatRiskLabel(finding.top_review_priority.level)}
                    </span>
                  </div>
                  <strong className="finding-nav-item__path">
                    {finding.source.file_path ?? "Unknown file path"}
                  </strong>
                  <p className="finding-nav-item__meta">
                    {finding.source.symbol_name ?? "Unknown symbol"} ·{" "}
                    {finding.review_candidate_count} candidate
                    {finding.review_candidate_count === 1 ? "" : "s"}
                  </p>
                  <span className="finding-nav-item__score">
                    Score {(finding.top_review_priority.score ?? 0).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="finding-detail-panel">
          {selectedFinding ? (
            <>
              <div className="finding-detail-panel__header">
                <p className="eyebrow">Selected chunk</p>
                <span>
                  {selectedIndex + 1} / {findings.length}
                </span>
              </div>
              <div className="finding-detail-scroll">
                <FindingCard finding={selectedFinding} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
